/**
 * Airtime seed — mock users, channels, follows and chat history so the
 * platform is demo-able end-to-end without a live ingest pipeline.
 * The frontend (src/data/seed.ts) mirrors this exact dataset.
 *
 *   node backend/seed.js
 */
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");

const users = [
  { handle: "viewer", displayName: "Viewer Demo", email: "viewer@airtime.tv", role: "user", avatarHue: 174 },
  { handle: "signalkid", displayName: "Signal Kid", email: "streamer@airtime.tv", role: "user", avatarHue: 348 },
  { handle: "watchtower", displayName: "Watchtower", email: "admin@airtime.tv", role: "admin", avatarHue: 44 },
  { handle: "nova", displayName: "NOVA", email: "nova@airtime.tv", role: "user", avatarHue: 340 },
  { handle: "mira.irl", displayName: "Mira IRL", email: "mira@airtime.tv", role: "user", avatarHue: 32 },
  { handle: "kernelpanic", displayName: "kernelpanic", email: "kp@airtime.tv", role: "user", avatarHue: 160 },
  { handle: "dj_cascade", displayName: "DJ Cascade", email: "dj@airtime.tv", role: "user", avatarHue: 285 },
];

const now = Date.now();
const min = 60e3;
const channels = [
  { slug: "nova", title: "Radiant ranked grind → Immortal or bust", category: "gaming", tags: ["VALORANT", "ranked"], viewers: 12480, followers: 284300, startedAt: new Date(now - 142 * min), live: true, routerId: "worker-3" },
  { slug: "miradotirl", title: "Night market street-food tour — Taipei", category: "irl", tags: ["food", "taipei"], viewers: 9210, followers: 198000, startedAt: new Date(now - 95 * min), live: true, routerId: "worker-7" },
  { slug: "kernelpanic", title: "Building a Redis clone in Rust — day 3", category: "code", tags: ["rust", "databases"], viewers: 3120, followers: 39800, startedAt: new Date(now - 165 * min), live: true, routerId: "worker-1" },
  { slug: "djcascade", title: "Sunset deep-house session — live mix", category: "music", tags: ["deep house", "DJ"], viewers: 4470, followers: 64100, startedAt: new Date(now - 78 * min), live: true, routerId: "worker-9" },
];

const personas = ["quixote", "m00nchild", "gg_watson", "lurker_prime", "pixelmonk", "saltmine", "vhs_ghost", "clipgoblin"];
const lines = ["LETSGOOO", "gg", "W stream", "clip it NOW", "the bitrate on this is crisp", "hi from Brazil", "lowkey the best stream on the platform"];

(async () => {
  const client = await MongoClient.connect(MONGO_URL);
  const db = client.db("airtime");
  await db.dropDatabase();

  await db.collection("users").insertMany(users.map((u) => ({ ...u, passwordHash: hash("airtime-demo"), createdAt: new Date() })));
  const userIds = await db.collection("users").find({}, { projection: { handle: 1 } }).toArray();
  const byHandle = Object.fromEntries(userIds.map((u) => [u.handle, u._id]));

  await db.collection("channels").insertMany(channels.map((c) => ({
    ...c, ownerId: byHandle[c.slug.replace("dotirl", ".irl")] ?? byHandle.viewer,
    streamKeyHash: hash(`at_live_seed_${c.slug}`),
  })));

  // follows: demo viewer follows nova + dj_cascade → receives go-live notifications
  await db.collection("follows").insertMany([
    { userId: byHandle.viewer, targetId: "nova", createdAt: new Date() },
    { userId: byHandle.viewer, targetId: "djcascade", createdAt: new Date() },
  ]);

  // 200 chat messages per live room, capped collection keeps hot rooms bounded
  for (const c of channels) {
    const docs = Array.from({ length: 200 }, (_, i) => ({
      roomId: c.slug,
      userId: personas[i % personas.length],
      text: lines[Math.floor(Math.random() * lines.length)],
      createdAt: new Date(now - (200 - i) * 45e3),
    }));
    await db.collection("chat").insertMany(docs);
  }

  // worker load ZSET so /streams allocation has something to pick from
  const { createClient } = require("redis");
  const redis = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
  await redis.connect();
  for (let i = 1; i <= 12; i++) await redis.zAdd("workers:load", [{ score: 0, value: `worker-${i}` }]);
  await redis.quit();

  console.log(`seeded: ${users.length} users · ${channels.length} live channels · 800 chat docs · 12 workers registered`);
  await client.close();
})();
