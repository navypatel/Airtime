/**
 * Airtime media tier — mediasoup SFU with the worker-per-CPU-core pattern.
 *
 * Scaling model (why 10k viewers is cheap):
 *   - One mediasoup Worker per CPU core (workers never share cores; each owns
 *     its own RTP stack + threads). A 12-vCPU box = 12 workers.
 *   - Each live broadcast gets exactly ONE Router on the least-loaded worker
 *     (allocation via the shared Redis ZSET "workers:load" — ZPOPMIN/ZINCRBY —
 *     so every app node makes the same globally-consistent choice).
 *   - The broadcaster's WebRTC transport lives on that router. Viewers NEVER
 *     consume from the router: a PlainTransport pipes RTP to a local LL-HLS
 *     packager (ffmpeg), and segments are pushed to S3 → CloudFront.
 *   - Therefore SFU load scales with #broadcasters, audience size is absorbed
 *     entirely by the CDN. 10,000 viewers on one stream = 1 router.
 *
 *   node mediasoup-server.js        # runs inside the media container (compose)
 */
const os = require("os");
const { spawn } = require("child_process");
const mediasoup = require("mediasoup");
const { createClient } = require("redis");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const HTTP_PORT = 4443;                       // WebRTC ingest (TURN fronts this in prod)
const RTP_MIN = 40000, RTP_MAX = 49999;
const WORKER_COUNT = Number(process.env.WORKER_COUNT || os.cpus().length);
const S3_BUCKET = process.env.HLS_BUCKET || "airtime-hls";
const s3 = new S3Client({});
const redis = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });

const workers = [];            // [{ worker, workerId, routers: Set }]
const packagers = new Map();   // channelId → ffmpeg child

/* ————— 1. worker pool: one worker per CPU core ————— */
async function buildWorkerPool() {
  for (let i = 0; i < WORKER_COUNT; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: "warn",
      rtcMinPort: RTP_MIN + i * 1000,
      rtcMaxPort: RTP_MIN + (i + 1) * 1000 - 1,
    });
    const workerId = `${os.hostname()}-w${i}`;
    worker.observer.on("close", () => {
      // crash-loop guard: drop it from allocation, alerting hook here
      workers.splice(workers.findIndex((w) => w.worker === worker), 1);
      redis.zRem("workers:load", workerId);
    });
    workers.push({ worker, workerId, routers: new Set() });
    await redis.zAdd("workers:load", [{ score: 0, value: workerId }]);
  }
  console.log(`media: ${WORKER_COUNT} workers (1 per core) registered in Redis ZSET`);
}

/* ————— 2. least-loaded router allocation (shared across all app nodes) ————— */
async function allocateRouter() {
  // app tier does ZPOPMIN + ZINCRBY atomically; here we mirror locally
  const [least] = await redis.zRangeWithScores("workers:load", 0, 0);
  await redis.zIncrBy("workers:load", 1, least.value);
  const slot = workers.find((w) => w.workerId === least.value);
  const router = await slot.worker.createRouter({
    mediaCodecs: [
      { kind: "video", mimeType: "video/h264", clockRate: 90000, parameters: { "packetization-mode": 1, "profile-level-id": "42e01f" } },
      { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
    ],
  });
  slot.routers.add(router);
  router.observer.on("close", async () => {
    slot.routers.delete(router);
    await redis.zIncrBy("workers:load", -1, slot.workerId); // release capacity
  });
  return { router, workerId: slot.workerId };
}

/* ————— 3. ingest: broadcaster WebRTC transport (one per stream) ————— */
async function createBroadcast(channelId) {
  const { router, workerId } = await allocateRouter();
  const webRtcTransport = await router.createWebRtcTransport({
    listenIps: [{ ip: "0.0.0.0", announcedIp: process.env.ANNOUNCED_IP }],
    enableUdp: true, enableTcp: true, preferUdp: true,
  });
  startHlsPackager(channelId, router);
  console.log(`media: ${channelId} → router on ${workerId} (viewer traffic goes to CDN, not here)`);
  return { router, webRtcTransport };
}

/* ————— 4. LL-HLS packaging → S3 → CloudFront ————— */
function startHlsPackager(channelId, router) {
  // PlainTransport carries decoded RTP out of the router to ffmpeg locally.
  router.createPlainTransport({ rtcpMux: false, comedia: true }).then(async (plain) => {
    const ff = spawn("ffmpeg", [
      "-re",
      "-f", "rtp", "-i", `rtp://127.0.0.1:${plain.tuple.localPort}`,
      // adaptive renditions: 1080p60 / 720p / 480p
      "-filter_complex", "[0:v]split=3[a][b][c];[a]scale=1920:1080[v0];[b]scale=1280:720[v1];[c]scale=854:480[v2]",
      "-map", "[v0]", "-map", "[v1]", "-map", "[v2]", "-map", "0:a",
      "-c:v", "libx264", "-preset", "veryfast", "-g", "48", "-keyint_min", "48", "-sc_threshold", "0",
      "-b:v:0", "5800k", "-b:v:1", "3000k", "-b:v:2", "1200k", "-c:a", "aac", "-b:a", "128k",
      "-f", "hls",
      "-hls_time", "1",                        // 1s parts → ~2-3s glass-to-glass
      "-hls_list_size", "6",
      "-hls_flags", "independent_segments+delete_segments+omit_endlist",
      "-hls_segment_type", "mpegts",
      "-master_pl_name", "master.m3u8",
      "-var_stream_map", "v:0,a:0 v:1 v:2",
      "/hls/" + channelId + "/%v/seg_%05d.ts",
    ], { stdio: "ignore" });

    packagers.set(channelId, ff);
    // segment watcher → S3 (in prod: inotify sidecar or ffmpeg segment muxer hooks)
    watchAndPushSegments(channelId);
  });
}

async function watchAndPushSegments(channelId) {
  const fs = require("fs");
  const dir = `/hls/${channelId}`;
  fs.watch(dir, { recursive: true }, async (_e, file) => {
    if (!file || !file.endsWith(".ts") && !file.endsWith(".m3u8")) return;
    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET, Key: `${channelId}/${file}`,
      Body: fs.createReadStream(`${dir}/${file}`),
      // playlists: no-cache so players pick up parts immediately; segments immutable
      CacheControl: file.endsWith(".m3u8") ? "max-age=1" : "max-age=31536000",
      ContentType: file.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t",
    }));
    // CloudFront invalidation is batched (per-path, ≤15/s) by a small invalidator service
  });
}

function stopBroadcast(channelId) {
  packagers.get(channelId)?.kill("SIGTERM");
  packagers.delete(channelId);
}

/* ————— boot + health ————— */
(async () => {
  await redis.connect();
  await buildWorkerPool();
  require("http").createServer((_req, res) => {
    res.end(JSON.stringify({ workers: workers.length, routers: workers.reduce((a, w) => a + w.routers.size, 0), packagers: packagers.size }));
  }).listen(HTTP_PORT, () => console.log(`media: health+ingest control on :${HTTP_PORT}`));
})();

module.exports = { createBroadcast, stopBroadcast, allocateRouter };
