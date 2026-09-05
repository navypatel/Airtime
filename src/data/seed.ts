// ————————————————————————————————————————————————————————————————
// Airtime seed data — the same dataset backend/seed.js writes to MongoDB.
// The frontend boots from this so the whole product is demo-able without
// a real ingest pipeline. Every "live" channel renders procedural video.
// ————————————————————————————————————————————————————————————————

export type Category = {
  id: string;
  name: string;
  hue: number;        // drives thumbnail art
  hue2: number;
  viewers: number;    // aggregated, ticks live
};

export const CATEGORIES: Category[] = [
  { id: "gaming", name: "Gaming",  hue: 348, hue2: 24,  viewers: 31200 },
  { id: "irl",    name: "IRL",     hue: 202, hue2: 258, viewers: 19800 },
  { id: "music",  name: "Music",   hue: 268, hue2: 320, viewers: 11400 },
  { id: "code",   name: "Code",    hue: 158, hue2: 196, viewers: 7300 },
  { id: "art",    name: "Art",     hue: 28,  hue2: 340, viewers: 5100 },
  { id: "sports", name: "Sports",  hue: 88,  hue2: 150, viewers: 9900 },
];

export type Channel = {
  id: string;
  slug: string;
  handle: string;
  displayName: string;
  avatarHue: number;
  title: string;
  category: string;
  tags: string[];
  viewers: number;
  followers: number;
  startedAt: number;      // epoch ms
  live: boolean;
  verified: boolean;
  mature?: boolean;
  trend: number;          // 0..100 trending score
  desc: string;
};

const now = Date.now();
const min = 60_000;

export const SEED_CHANNELS: Channel[] = [
  { id: "c1",  slug: "nova",        handle: "nova",          displayName: "NOVA",           avatarHue: 340, title: "Radiant ranked grind → Immortal or bust", category: "gaming", tags: ["VALORANT", "ranked", "competitive"], viewers: 12480, followers: 284300, startedAt: now - 142 * min, live: true, verified: true,  trend: 97, desc: "Ex-pro grinding the ladder live every night. Coaching viewers between queues." },
  { id: "c2",  slug: "wanderinglens", handle: "wanderinglens", displayName: "Wandering Lens", avatarHue: 200, title: "Chasing the aurora from Tromsø, Norway", category: "irl", tags: ["travel", "aurora", "4K"], viewers: 8320, followers: 152400, startedAt: now - 67 * min,  live: true, verified: true,  trend: 91, desc: "Slow TV from the Arctic Circle. Tripod, thermal layers, and patience." },
  { id: "c3",  slug: "miradotirl",  handle: "mira.irl",      displayName: "Mira IRL",       avatarHue: 32,  title: "Night market street-food tour — Taipei", category: "irl", tags: ["food", "taipei", "nightlife"], viewers: 9210, followers: 198000, startedAt: now - 95 * min, live: true, verified: true, trend: 88, desc: "Eating my way through Shilin. Say hi — I will absolutely try anything you suggest." },
  { id: "c4",  slug: "pixelpete",   handle: "pixel_pete",    displayName: "Pixel Pete",     avatarHue: 260, title: "No-hit Elden Ring — attempt #47 (it's happening)", category: "gaming", tags: ["Elden Ring", "no-hit", "challenge"], viewers: 7815, followers: 96400, startedAt: now - 210 * min, live: true, verified: false, trend: 84, desc: "46 failures. One dream. Chat picks the build after every death-free hour." },
  { id: "c5",  slug: "hexline",     handle: "hexline",       displayName: "HEXLINE",        avatarHue: 180, title: "Hollow Knight any% — PB attempts all day", category: "gaming", tags: ["speedrun", "Hollow Knight"], viewers: 6930, followers: 71200, startedAt: now - 48 * min, live: true, verified: false, trend: 79, desc: "Current PB 33:12. Frame-perfect pogo practice until it's muscle memory." },
  { id: "c6",  slug: "courtside",   handle: "courtside",     displayName: "Courtside",      avatarHue: 100, title: "Streetball finals — Harlem outdoor court", category: "sports", tags: ["basketball", "streetball", "NYC"], viewers: 5540, followers: 88900, startedAt: now - 33 * min, live: true, verified: true, trend: 76, desc: "Two-hand coverage, live scoreboard, and the loudest crowd in the borough." },
  { id: "c7",  slug: "djcascade",   handle: "dj_cascade",    displayName: "DJ Cascade",     avatarHue: 285, title: "Sunset deep-house session — live mix", category: "music", tags: ["deep house", "DJ", "sunset"], viewers: 4470, followers: 64100, startedAt: now - 78 * min, live: true, verified: false, trend: 68, desc: "Vinyl only. Requests in chat if you can name the BPM within 5." },
  { id: "c8",  slug: "pitchreport", handle: "pitchreport",   displayName: "Pitch Report",   avatarHue: 120, title: "Sunday tactical review — live chalkboard", category: "sports", tags: ["football", "tactics"], viewers: 3890, followers: 45300, startedAt: now - 55 * min, live: true, verified: false, trend: 61, desc: "Breaking down the weekend's games with a digital chalkboard and zero hot takes. Mostly." },
  { id: "c9",  slug: "kernelpanic", handle: "kernelpanic",   displayName: "kernelpanic",    avatarHue: 160, title: "Building a Redis clone in Rust — day 3", category: "code", tags: ["rust", "databases", "build-in-public"], viewers: 3120, followers: 39800, startedAt: now - 165 * min, live: true, verified: true, trend: 57, desc: "RESP protocol, skip lists, and the borrow checker winning most arguments." },
  { id: "c10", slug: "synthsam",    handle: "synthwave.sam", displayName: "Synthwave Sam",  avatarHue: 310, title: "Producing a full track from scratch in 60 min", category: "music", tags: ["production", "synthwave", "ableton"], viewers: 2240, followers: 27600, startedAt: now - 22 * min, live: true, verified: false, trend: 52, desc: "Timer on screen. If I miss the deadline, the track releases unfinished. Forever." },
  { id: "c11", slug: "sofidraws",   handle: "sofi.draws",    displayName: "Sofi Draws",     avatarHue: 20,  title: "Creature design Q&A — inktober day 14", category: "art", tags: ["illustration", "inktober", "q&a"], viewers: 1860, followers: 33900, startedAt: now - 120 * min, live: true, verified: false, trend: 47, desc: "Answering every design question while the ink dries. Commissions open Friday." },
  { id: "c12", slug: "galleryghost", handle: "galleryghost", displayName: "Gallery Ghost",  avatarHue: 40,  title: "Restoring a 1920s oil painting — part 2", category: "art", tags: ["restoration", "oil painting", "asmr"], viewers: 1420, followers: 19200, startedAt: now - 200 * min, live: true, verified: false, trend: 41, desc: "Solvent tests, cotton swabs, and one very suspicious signature in the corner." },
  { id: "c13", slug: "devnull",     handle: "dev_null",      displayName: "dev/null",       avatarHue: 190, title: "LeetCode hard marathon — come heckle me", category: "code", tags: ["leetcode", "interviews", "algorithms"], viewers: 940, followers: 15700, startedAt: now - 15 * min, live: true, verified: false, trend: 35, desc: "One hard problem per viewer suggestion. Streak: 6. Ego: fragile." },
  { id: "c14", slug: "bytebeat",    handle: "bytebeat",      displayName: "Bytebeat",       avatarHue: 230, title: "Generative music engine — patching live", category: "music", tags: ["generative", "livecoding"], viewers: 610, followers: 9800, startedAt: now - 8 * min, live: true, verified: false, trend: 29, desc: "Sound from pure math. Every patch ships to the repo at the end of the stream." },
];

export const OFFLINE_CHANNELS: Channel[] = [
  { id: "o1", slug: "clutchqueen", handle: "clutchqueen", displayName: "Clutch Queen", avatarHue: 350, title: "Was: Ace or AFK — viewer lobbies", category: "gaming", tags: ["CS2"], viewers: 0, followers: 121000, startedAt: now - 26 * 60 * min, live: false, verified: true, trend: 0, desc: "Offline now — usually live weekdays 18:00 CET." },
  { id: "o2", slug: "trailmix",    handle: "trailmix",    displayName: "Trailmix",     avatarHue: 140, title: "Was: Dawn hike above the clouds", category: "irl", tags: ["hiking"], viewers: 0, followers: 44000, startedAt: now - 31 * 60 * min, live: false, verified: false, trend: 0, desc: "Offline now — next stream Saturday sunrise." },
  { id: "o3", slug: "lowkeylofi",  handle: "lowkey.lofi", displayName: "Lowkey Lofi",  avatarHue: 250, title: "Was: Beats to merge PRs to", category: "music", tags: ["lofi"], viewers: 0, followers: 78000, startedAt: now - 49 * 60 * min, live: false, verified: false, trend: 0, desc: "Offline now — the archive has 400+ hours." },
];

export type PastBroadcast = {
  id: string; title: string; category: string; date: number;
  durationMin: number; peakViewers: number; avgViewers: number;
  chatMessages: number; followsGained: number; series: number[]; // viewers over time
};

export const PAST_BROADCASTS: PastBroadcast[] = [
  { id: "p1", title: "First public stream — setup & hello", category: "code", date: now - 6 * 864e5, durationMin: 74, peakViewers: 41, avgViewers: 17, chatMessages: 122, followsGained: 9, series: [3,6,9,14,17,22,19,28,34,41,38,30,17] },
  { id: "p2", title: "Building this platform's chat in Socket.IO", category: "code", date: now - 4 * 864e5, durationMin: 121, peakViewers: 88, avgViewers: 46, chatMessages: 431, followsGained: 23, series: [8,12,25,31,44,52,61,58,72,88,81,74,60] },
  { id: "p3", title: "Viewer Q&A + roadmap AMA", category: "irl", date: now - 2 * 864e5, durationMin: 66, peakViewers: 132, avgViewers: 79, chatMessages: 690, followsGained: 41, series: [20,35,48,66,79,92,104,132,121,110,96,84,70] },
];

// ————— Chat simulation —————
export const CHAT_PERSONAS = [
  "quixote","m00nchild","tarkov_tina","gg_watson","lurker_prime","pixelmonk","saltmine","vhs_ghost",
  "kaffee.klatsch","r0ute66","silentw0lf","beppu","drift_kid","nullkat","marzipan","clipgoblin",
  "overclocked_owl","y2kenny","static.bloom","ferrofluid","chat moderator","turbo_snail","xanadu","brisket",
];

export const GENERIC_CHAT = [
  "LETSGOOO","gg","W stream","this is insane","clip it NOW","how is this live","first time here, love it",
  "sound is perfect today","the bitrate on this is crisp","chat moving so fast","can we get a cam zoom",
  "dropped my snack watching this","720p on mobile still looks great","who else watching from work","hi from Brazil",
  "hi from Germany","the transitions are so smooth","lowkey the best stream on the platform","mods asleep post cats",
  "this chat is so wholesome","take my follow","been here since 500 viewers","peak content","no way that just happened",
  "replay that last part","the latency is basically zero","how many viewers are we at","this category is popping tonight",
];

export const CATEGORY_CHAT: Record<string, string[]> = {
  gaming: ["ONE MORE GAME","the clutch potential here","aim is cracked","that peek was insane","rotate rotate rotate","gg go next","ranked anxiety is real","VOD review when"],
  irl: ["the night lighting is gorgeous","say hi to the vendor!","what was that dish?","GPS says you're near the temple","watch your step there","this city never sleeps","the audio is so clear with the wind"],
  music: ["this transition though","ID??","the low end on these monitors","key change incoming I can feel it","this would slap in a film score","BPM check","vinyl crackle is the best texture"],
  code: ["ah yes, the classic off-by-one","have you tried println debugging","the borrow checker is watching","ship it","that's a race condition waiting to happen","tests or it didn't happen","O(n log n) enjoyer"],
  art: ["the line weight is so confident","what brush is that?","the color theory here","I could never","time-lapse when done?","that shadow pass changed everything","the paper texture is lovely"],
  sports: ["DEFENSE","he's got ice in his veins","call the foul","the footwork!!","what a read","crowd is electric","that's game, folks","stat sheet stuffer"],
};

// ————— Trending algorithm (mirrors backend/services/trending.js) —————
// score = 0.55·log(viewers) + 0.25·recency + 0.20·follower-velocity, normalized 0..100.
export function trendScore(viewers: number, startedAt: number, followers: number): number {
  const v = Math.log10(viewers + 1) / 5;
  const r = Math.max(0, 1 - (Date.now() - startedAt) / (10 * 3600e3));
  const f = Math.log10(followers + 1) / 6;
  return Math.round((0.55 * v + 0.25 * r + 0.2 * f) * 100);
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  if (n >= 1000) return (n / 1000).toFixed(2).replace(/0$/, "").replace(/\.0$/, "") + "K";
  return String(Math.round(n));
}

export function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ago`;
}

export function streamClock(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}
