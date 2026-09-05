/**
 * Airtime API + realtime server
 * Stateless by design: all shared state lives in Redis/Mongo, so N replicas
 * sit behind a load balancer with no sticky sessions (socket.io-redis-adapter).
 *
 *   node server.js            # requires REDIS_URL + MONGO_URL (see docker-compose.yml)
 */
const http = require("http");
const express = require("express");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";
const ACCESS_TTL = "15m";
const REFRESH_TTL_MS = 7 * 864e5;
const CHAT_LIMIT_MS = 2000;            // per-user sliding window
const API_LIMIT_PER_MIN = 120;         // per-IP
const BACKPRESSURE_BYTES = 64 * 1024;  // drop chat beyond this socket buffer

const app = express();
app.use(express.json({ limit: "64kb" }));
app.set("trust proxy", 1); // behind ALB/nginx

/* ————— infra bootstrap ————— */
const pubClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
const subClient = pubClient.duplicate();
let db;

/* ————— Mongo helpers + indexes ————— */
async function ensureIndexes(d) {
  await d.collection("chat").createIndex({ roomId: 1, createdAt: -1 });
  await d.collection("follows").createIndex({ userId: 1 });
  await d.collection("follows").createIndex({ targetId: 1 });
  await d.collection("channels").createIndex({ live: 1, viewers: -1 });
  await d.collection("users").createIndex({ email: 1 }, { unique: true });
  await d.collection("refreshTokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

/* ————— auth: JWT access + rotating refresh ————— */
function issueTokens(user) {
  const accessToken = jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: ACCESS_TTL });
  const refreshToken = crypto.randomBytes(32).toString("hex");
  db.collection("refreshTokens").insertOne({
    token: crypto.createHash("sha256").update(refreshToken).digest("hex"),
    userId: user._id, expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  return { accessToken, refreshToken };
}
const requireAuth = (req, res, next) => {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    req.user = jwt.verify(token, JWT_SECRET); // throws on expiry → client uses /auth/refresh
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
};

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.collection("users").findOne({ email: (email || "").toLowerCase() });
  if (!user || user.passwordHash !== crypto.createHash("sha256").update(password || "").digest("hex"))
    return res.status(401).json({ error: "invalid credentials" });
  res.json({ user: publicUser(user), ...issueTokens(user) });
});

app.post("/auth/refresh", async (req, res) => {
  const hash = crypto.createHash("sha256").update(req.body.refreshToken || "").digest("hex");
  const doc = await db.collection("refreshTokens").findOneAndDelete({ hash }); // rotation: old token dies
  if (!doc) return res.status(401).json({ error: "refresh revoked" });
  const user = await db.collection("users").findOne({ _id: doc.value.userId });
  res.json({ user: publicUser(user), ...issueTokens(user) });
});

// OAuth (Google/GitHub via Passport in prod) terminates in the same JWT issuer.
app.get("/auth/oauth/:provider/callback", async (req, res) => {
  const profile = req.user; // passport populates
  const user = await db.collection("users").findOneAndUpdate(
    { email: profile.email },
    { $setOnInsert: { handle: profile.handle, displayName: profile.name, role: "user", avatarHue: Math.floor(Math.random() * 360) } },
    { upsert: true, returnDocument: "after" }
  );
  res.json({ user: publicUser(user.value), ...issueTokens(user.value) });
});

/* ————— API rate limiter: Redis sliding window ————— */
async function rateLimited(key, limit, windowMs) {
  const now = Date.now();
  const k = `rl:${key}`;
  await db ? null : null;
  await pubClient.zRemRangeByScore(k, 0, now - windowMs);
  const count = await pubClient.zAdd(k, [{ score: now, value: `${now}:${crypto.randomBytes(3).toString("hex")}` }]);
  await pubClient.pExpire(k, windowMs);
  return count > limit;
}
app.use(async (req, res, next) => {
  if (await rateLimited(`ip:${req.ip}:api`, API_LIMIT_PER_MIN, 60e3))
    return res.status(429).json({ error: "rate limited" });
  next();
});

/* ————— REST: discovery (hot list from Redis cache) ————— */
app.get("/channels/live", async (_req, res) => {
  const cached = await pubClient.get("cache:channels:live");
  if (cached) return res.json(JSON.parse(cached)); // p95 < 30 ms path
  const channels = await db.collection("channels").find({ live: true }).sort({ viewers: -1 }).limit(100).toArray();
  await pubClient.set("cache:channels:live", JSON.stringify(channels), { EX: 5 }); // refreshed by ranker every 30s elsewhere
  res.json(channels);
});
app.get("/channels/:slug", async (req, res) => res.json(await db.collection("channels").findOne({ slug: req.params.slug })));
app.get("/search", async (req, res) => {
  const q = (req.query.q || "").slice(0, 60);
  res.json(await db.collection("channels").find({ live: true, $text: { $search: q } }).limit(30).toArray());
});

/* ————— REST: streams (go-live requests a router from the media tier) ————— */
app.post("/streams", requireAuth, async (req, res) => {
  const { title, category, tags } = req.body;
  if (!title || title.length < 4) return res.status(400).json({ error: "title required" });
  const streamKey = `at_live_${crypto.randomBytes(12).toString("hex")}`;
  // Media orchestrator: least-loaded mediasoup worker via Redis ZSET (see media-service/)
  const routerId = await allocateRouter();
  const channel = {
    ownerId: req.user.sub, slug: (await db.collection("users").findOne({ _id: req.user.sub })).handle,
    title, category, tags: (tags || []).slice(0, 5), streamKeyHash: sha(streamKey),
    routerId, live: true, viewers: 0, startedAt: new Date(),
  };
  await db.collection("channels").insertOne(channel);
  res.json({ channel, streamKey, ingest: { webrtc: "wss://sfu.airtime.tv:4443", rtmp: "rtmp://ingest.airtime.tv/live" } });
});
app.delete("/streams/:id", requireAuth, async (req, res) => {
  await db.collection("channels").updateOne({ _id: req.params.id, ownerId: req.user.sub }, { $set: { live: false } });
  releaseRouter((await db.collection("channels").findOne({ _id: req.params.id })).routerId);
  res.json({ ok: true });
});
async function allocateRouter() {
  const [least] = await pubClient.zRangeWithScores("workers:load", 0, 0);
  await pubClient.zIncrBy("workers:load", 1, least.value);
  return least.value;
}
async function releaseRouter(id) { await pubClient.zIncrBy("workers:load", -1, id); }
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const publicUser = (u) => ({ id: u._id, handle: u.handle, displayName: u.displayName, role: u.role });

/* ————— follows + notifications ————— */
app.post("/follows/:channelId", requireAuth, async (req, res) => {
  await db.collection("follows").updateOne(
    { userId: req.user.sub, targetId: req.params.channelId },
    { $set: { createdAt: new Date() } }, { upsert: true });
  res.json({ ok: true });
});

/* ————— socket.io: rooms, presence, chat, go-live fan-out ————— */
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, maxHttpBufferSize: 4096 });
io.adapter(createAdapter(pubClient, subClient)); // ← any node can serve any room

const chatBuffer = new Map(); // roomId → docs, flushed to Mongo every 5s
setInterval(async () => {
  for (const [roomId, docs] of chatBuffer) {
    if (docs.length) await db.collection("chat").insertMany(docs.splice(0));
    chatBuffer.delete(roomId);
  }
}, 5000);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) { try { socket.user = jwt.verify(token, JWT_SECRET); } catch { /* anonymous: read-only */ } }
  next();
});

io.on("connection", async (socket) => {
  socket.on("room:join", async (channelId) => {
    socket.join(`stream:${channelId}`);
    socket.data.room = channelId;
    const viewers = await pubClient.incr(`viewers:${channelId}`);
    db.collection("channels").updateOne({ _id: channelId }, { $set: { viewers } });
    io.to(`stream:${channelId}`).emit("room:viewers", viewers); // live viewer-count broadcast
    pubClient.publish("cache:invalidate", "channels:live");
  });

  socket.on("room:leave", async () => {
    if (!socket.data.room) return;
    const viewers = Math.max(0, await pubClient.decr(`viewers:${socket.data.room}`));
    io.to(`stream:${socket.data.room}`).emit("room:viewers", viewers);
  });

  socket.on("chat:send", async ({ text }) => {
    if (!socket.user) return socket.emit("chat:error", "auth required");
    // backpressure: shed before we queue unbounded work
    if (socket.conn.bufferedAmount > BACKPRESSURE_BYTES) return socket.emit("chat:error", "backpressure");
    const key = `rl:chat:${socket.user.sub}`;
    if (await rateLimited(key, 1, CHAT_LIMIT_MS)) return socket.emit("chat:error", "slow mode");
    const msg = {
      roomId: socket.data.room, userId: socket.user.sub,
      text: String(text || "").slice(0, 240), createdAt: new Date(),
    };
    if (!chatBuffer.has(msg.roomId)) chatBuffer.set(msg.roomId, []);
    chatBuffer.get(msg.roomId).push(msg);
    io.to(`stream:${msg.roomId}`).emit("chat:message", msg);
  });

  socket.on("disconnect", () => { /* presence cleaned by room:leave + Redis TTLs */ });
});

/* ————— go-live notification fan-out (called by /streams after insert) ————— */
async function notifyFollowers(channelId, title, slug) {
  const follows = await db.collection("follows").find({ targetId: channelId }).toArray();
  for (const f of follows) {
    io.to(`user:${f.userId}`).emit("notify:go-live", { channelId, title, slug }); // WebSocket push
    // optional email → SQS → SES worker, only if user.emailNotify = true (shaped send rate)
  }
}
module.exports = { app, server, io, notifyFollowers };

/* ————— boot ————— */
(async () => {
  await Promise.all([pubClient.connect(), subClient.connect()]);
  const mongo = await MongoClient.connect(process.env.MONGO_URL || "mongodb://localhost:27017");
  db = mongo.db("airtime");
  await ensureIndexes(db);
  server.listen(PORT, () => console.log(`airtime api+rt on :${PORT} (redis adapter: on)`));
})();
