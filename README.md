# Airtime — live streaming platform (10k+ concurrent viewers)

A production-shaped live streaming platform: **every authenticated user can go live, and everyone
(including anonymous visitors) can browse, watch and read chat.** Chat posting, streaming and
following require login; discovery and playback are fully public.

> **This repository** contains the complete frontend (this Vite + React app, which is fully
> interactive and demo-able with a simulated realtime layer), plus the backend, media service,
> seed data, load tests and Docker Compose setup described below. The frontend boots from
> `src/data/seed.ts` — the same dataset `backend/seed.js` writes to MongoDB — so the whole
> product can be evaluated without standing up the ingest pipeline.

---

## 1. Feature map

| Capability | Who | Notes |
|---|---|---|
| Browse / search / trending grid, category filters | **public** | hot list cached in Redis, re-ranked every 30 s |
| Watch any live channel (ABR HLS) | **public** | served from CDN — never from the SFU |
| Read chat + presence counts | **public** | socket.io rooms are readable anonymously |
| Sign in (email/password JWT + refresh, Google/GitHub OAuth) | users | access 15 min, refresh 7 d with rotation |
| Go live (WebRTC ingest) / stop stream | users | no separate broadcaster role exists |
| Post chat (rate-limited, slow-mode aware) | users | sliding-window limit in Redis, backpressure via `bufferedAmount` |
| Follow / unfollow + go-live notifications | users | WebSocket push + optional email digest |
| Stream key management, live health, analytics | users | key rotation propagates via Redis pub/sub |
| Moderation (reports, timeouts, bans, audit log) | **admin only** | separate elevated role, never in the user flow |

## 2. Architecture

```
                        ┌──────────────────────────  VIEWERS (10,000+) ──────────────────────────┐
                        │  hls.js / native HLS players — adaptive bitrate, seek, DVR             │
                        └───────────────────────────────┬────────────────────────────────────────┘
                                                        │ HTTPS (LL-HLS segments)
                                              ┌─────────▼──────────┐
                                              │  CDN (CloudFront)  │  38+ PoPs · viewer traffic
                                              │  S3 origin (HLS)   │  NEVER touches the SFU
                                              └─────────▲──────────┘
                                                        │ segment push (1 s parts)
 BROADCASTER ── WebRTC (DTLS/SRTP) ──► ┌────────────────┴───────────────────┐
  (one conn                            │        MEDIA TIER (mediasoup)       │
   per stream)                         │  worker-per-CPU-core (N routers)    │
                                       │  least-loaded router allocation     │
  BROADCASTER ── socket.io ──────────► │  (Redis ZSET scores)                │
                                       │  router ── PlainTransport/RTP ──►   │
                                       │  ffmpeg/gstreamer LL-HLS packager   │
                                       └─────────────────────────────────────┘

  ┌───────────────────── APP TIER (stateless, LB'd, autoscaled) ─────────────────────┐
  │  Express REST: auth (JWT+refresh), channels, follows, analytics, admin           │
  │  socket.io: per-channel rooms, presence, chat, notifications                     │
  │     └─ @socket.io/redis-adapter → any node can serve any room (sticky-free)      │
  │  Rate limiting: Redis sliding window (chat 1 msg/2 s, API 120 req/min/IP)        │
  │  Backpressure: drop/queue chat when socket.conn.bufferedAmount > 64 KB           │
  └───────────────┬──────────────────────────────┬───────────────────────────────────┘
                  │                              │
        ┌─────────▼─────────┐          ┌─────────▼──────────┐
        │  Redis (cluster)  │          │     MongoDB        │
        │  sessions, pubsub,│          │  users, channels,  │
        │  viewer counts,   │          │  follows, chat     │
        │  hot channel list │          │  (indexed)         │
        └───────────────────┘          └────────────────────┘
```

### How a new broadcast is load-balanced across mediasoup workers

1. On `POST /streams` (go-live), the API asks the **media orchestrator** for a router.
2. Each mediasoup worker registers `router:<id>` capacity in a Redis **ZSET** (`workers:load`,
   score = active routers / cores). Allocation = `ZPOPMIN` + `ZINCRBY` — i.e. always the
   least-loaded worker. A 12-core box runs 12 workers; routers never share cores.
3. The broadcaster's WebRTC transport is created **on that router only**. Viewer count is
   irrelevant to this decision, because…
4. The router forwards RTP over a `PlainTransport` to a local **LL-HLS packager**
   (ffmpeg `-hls_segment_type mpegts -hls_flags independent_segments`, 1 s parts,
   3 renditions: 1080p60/720p/480p).
5. Segments are written to **S3** and invalidated through **CloudFront**. Players pull from
   the nearest PoP. **The SFU scales with the number of *broadcasters*, not viewers** —
   10k viewers on one stream cost the SFU exactly one router.

### How chat scales past 10k concurrent

- Rooms are named `stream:<channelId>`; joining is an O(1) `SADD` in the adapter.
- `@socket.io/redis-adapter` fan-outs messages across every app node, so connections spread
  evenly behind the LB with no sticky sessions.
- Per-user sliding-window rate limit (Redis `INCR` + `PEXPIRE`) + per-room token bucket;
  when a room exceeds ~2k msgs/s, messages are batched (100 ms windows) before fan-out.
- Chat history is batch-inserted into Mongo every 5 s (bulkWrite), capped collections for
  hot rooms; indexes: `chat(roomId, createdAt)`, `follows(userId)`, `channels(live, viewers)`.

## 3. Local development

```bash
docker compose up            # app:3000 · redis:6379 · mongo:27017 · media:4443
node backend/seed.js         # mock users, channels, follows, chat history
npm run dev                  # frontend (this Vite app) on :5173
```

Production-shaped AWS deployment (what changes from Compose):

| Local | AWS production |
|---|---|
| `app` container | **ECS/Fargate** (or EKS) service, ALB, target-tracking autoscale on CPU + socket count |
| `redis` | **ElastiCache Redis** (cluster mode) for adapter, limits, hot cache |
| `mongo` | **DocumentDB / Atlas** replica set, PITR backups |
| HLS on disk | **S3** origin + **CloudFront** (LL-HLS tuned: short TTLs on `.m3u8`, long on segments) |
| media service | Dedicated **c5/c6i bare-ish instances** (workers = vCPU) in an ASG; one ASG per AZ |
| direct WebRTC | **TURN/STUN** fleet (coturn) on EC2 ASG + Global Accelerator for ingest anycast |
| email notify | **SES** behind an SQS queue (go-live digests, throttled per user setting) |

## 4. Load-testing approach (`loadtest/stream-load.js`, k6)

- **`http_api` scenario** — 12k VUs hammer `/channels/live` + auth refresh; asserts p95 < 250 ms
  and verifies the Redis hot-cache hit path (second request must be < 30 ms).
- **`chat_socket` scenario** — 10k VUs open socket.io connections (Engine.IO over WebSocket),
  join `stream:c1`, and post at 0.5 msg/s each → ~5k msg/s sustained into one room;
  asserts fan-out delivery latency p95 < 400 ms and 0 dropped messages below the shed threshold.
- **HLS/CDN path** — viewers never hit the app, so this is tested separately: a k6 HTTP
  scenario requests `index.m3u8` + segments from the **CloudFront URL** at 10k concurrent
  polling cadence (1 s), asserting segment freshness ≤ 2 parts behind live and ≥ 99 % edge
  cache hits (verified via CloudFront access logs, not the origin).

## 5. Testing

- **Jest + React Testing Library** — units for the trending scorer, rate limiter, token
  refresh interceptor, chat batching; component tests for auth gating (chat input locked
  while signed out) and follow toggles.
- **Playwright** — critical flows: ① sign in (email + OAuth stub), ② go live (key reveal,
  start, appears in browse grid), ③ watch (player buffers, quality switch), ④ chat (send,
  slow-mode cooldown, message renders for a second session), ⑤ follow → receive go-live toast.

## 6. Trade-offs & what changes at 100k+ concurrent

**Choices made here, and why:**

- **LL-HLS for playback instead of raw SFU fan-out.** ~1.5–3 s glass-to-glass latency vs
  ~200 ms for WebRTC viewers — acceptable for Twitch-style content, and it decouples viewer
  scale from media compute entirely. Interactive (< 500 ms) rooms would stay on the SFU via
  `consumer` transports and rejoin the CDN path only above ~50 viewers.
- **Single Redis for adapter + cache + limits.** Simple and fast enough to ~20k sockets per
  shard; it's the first thing to cluster (and it's behind interfaces, so it's a swap, not a rewrite).
- **Mongo for chat history.** Fine with capped collections and time-series indexes; at higher
  volumes chat becomes fire-and-forget into **Kafka** with cold storage in S3, and Mongo keeps
  only the last 200 messages per room for late joiners.
- **Email fan-out inline.** Works until a huge streamer goes live; at scale this moves to an
  SQS/SNS worker fleet with per-user digest settings and send-rate shaping.

**At 100k+ concurrent I would add:** multi-region active-active (nearest-Region ingest,
follow-the-viewer CDN routing), QUIC/HTTP/3 for segment fetch, Kafka-partitioned chat keyed by
roomId, Redis Cluster with read replicas for presence, a dedicated connection-manager tier
(socket.io nodes behind an NLB with per-AZ affinity), MoQ/CMS evaluation for sub-second CDN
latency, and pre-warmed edge transcode for top-100 channels so rendition switches never miss.

## 7. Repository layout

```
src/                     # Frontend — React + Vite + TS + Tailwind v4 + Framer Motion + Zustand
  data/seed.ts           #   mock dataset (mirrors backend/seed.js)
  store.ts               #   Zustand: auth/JWT, streams, follows, notifications, go-live state
  components/            #   design system: canvas "video", cards, chrome, player+chat
  pages/                 #   Home · Channel · Studio (dashboard) · Admin
backend/
  server.js              #   Express + socket.io + redis-adapter, JWT/refresh, OAuth, rate limits
  seed.js                #   Mongo seed script
media-service/
  mediasoup-server.js    #   worker-per-core pool, least-loaded router allocation, HLS → S3/CDN
loadtest/
  stream-load.js         #   k6: HTTP API + 10k socket.io chat connections + CDN HLS polling
docker-compose.yml       #   app + redis + mongo + media-service for local dev
```

**Scope assumptions:** payment/monetization, VOD transcoding queues, mobile apps and the
admin audit-export pipeline are out of scope; OAuth providers are stubbed to the same JWT
issuer; the browser demo simulates socket.io/HLS traffic client-side so it runs anywhere.
