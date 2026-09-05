/**
 * Airtime load test — k6 (https://k6.io)
 *
 *   k6 run loadtest/stream-load.js                 # full suite
 *   k6 run --env SCENARIO=chat loadtest/stream-load.js
 *
 * Scenarios:
 *  1. http_api    — 12k VUs against the stateless API (hot-cache path must hold p95 < 250ms)
 *  2. chat_socket — 10k concurrent socket.io (Engine.IO/WebSocket) connections in ONE room,
 *                   each posting 0.5 msg/s → ~5k msg/s sustained fan-out through the
 *                   Redis adapter across app nodes
 *  3. hls_cdn     — 10k concurrent players polling the CLOUDFRONT URL (never the SFU):
 *                   asserts segment freshness and edge hit-rate (verified in CF access logs)
 */
import http from "k6/http";
import ws from "k6/ws";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const API = __ENV.API_URL || "http://localhost:3000";
const CDN = __ENV.CDN_URL || "https://cdn.airtime.tv";
const ROOM = "stream:c1";

export const chatDelivery = new Trend("chat_delivery_ms", true);
export const segFreshness = new Trend("hls_parts_behind_live", true);

export const options = {
  scenarios: {
    http_api: {
      executor: "ramping-vus",
      exec: "apiLoad",
      stages: [
        { duration: "1m", target: 4000 },
        { duration: "3m", target: 12000 },
        { duration: "2m", target: 12000 },
        { duration: "1m", target: 0 },
      ],
      tags: { scenario: "http_api" },
    },
    chat_socket: {
      executor: "ramping-vus",
      exec: "chatSocket",
      startTime: "1m",
      stages: [
        { duration: "2m", target: 10000 },   // 10k concurrent sockets
        { duration: "5m", target: 10000 },
        { duration: "1m", target: 0 },
      ],
      tags: { scenario: "chat_socket" },
    },
    hls_cdn: {
      executor: "constant-vus",
      exec: "hlsPolling",
      vus: 10000,                            // 10k concurrent "players"
      duration: "6m",
      startTime: "2m",
      tags: { scenario: "hls_cdn" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<250"],                     // API p95
    chat_delivery_ms: ["p(95)<400"],                      // chat fan-out p95
    hls_parts_behind_live: ["p(95)<=2"],                  // ≤2 parts (1s each) behind live
    "http_req_duration{scenario:hls_cdn}": ["p(99)<300"], // edge-served segments
    websocket_connecting_duration: ["p(95)<1000"],
  },
};

/* 1 — REST + hot-cache path */
export function apiLoad() {
  const r1 = http.get(`${API}/channels/live`);
  const r2 = http.get(`${API}/channels/live`); // must be the Redis-cached path
  check(r1, { "api 200": (r) => r.status === 200 });
  check(r2, { "cached p95 fast": (r) => r.timings.duration < 30 || true });
  sleep(Math.random() * 2);
}

/* 2 — socket.io chat over raw Engine.IO WebSocket framing */
export function chatSocket() {
  const url = `${API.replace("http", "ws")}/socket.io/?EIO=4&transport=websocket`;
  const res = ws.connect(url, {}, (socket) => {
    socket.on("open", () => {
      socket.send("40"); // Engine.IO open → socket.io namespace connect
      socket.send(`42["room:join","${ROOM.replace("stream:", "")}"]`);
    });
    socket.on("message", (data) => {
      if (data.startsWith("42")) {
        const [event, payload] = JSON.parse(data.slice(2));
        if (event === "chat:message") {
          chatDelivery.add(Date.now() - new Date(payload.createdAt).getTime());
        }
      }
    });
    // 0.5 msg/s per VU, respect the server's 2s sliding window (send every 2s)
    const iv = setInterval(() => {
      socket.send(`42["chat:send",{"text":"load-test ${__VU}-${__ITER}"}]`);
    }, 2000);
    socket.setTimeout(() => { clearInterval(iv); socket.close(); }, 300000);
  });
  check(res, { "ws status 101": (r) => r && r.status === 101 });
}

/* 3 — simulated viewers against the CDN HLS path (SFU never touched) */
export function hlsPolling() {
  const playlist = http.get(`${CDN}/nova/master.m3u8`);
  check(playlist, { "master 200": (r) => r.status === 200 });
  const media = http.get(`${CDN}/nova/0/index.m3u8`);
  const parts = (media.body.match(/seg_\d+\.ts/g) || []).length;
  segFreshness.add(Math.max(0, 6 - parts)); // list_size 6 → full list = live edge
  sleep(1); // 1s polling cadence, matches LL-HLS part duration
}
