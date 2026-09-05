import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CanvasVideo from "../components/CanvasVideo";
import { Avatar } from "../components/chrome";
import { EmptyState, SectionHead, categoryHue } from "../components/cards";
import { CATEGORIES, formatCount, streamClock, timeAgo } from "../data/seed";
import { copyText, navigate, useNow } from "../lib/hooks";
import { useStore } from "../store";
import {
  IconBroadcast, IconChat, IconCheck, IconCopy, IconEye, IconHeart, IconKey, IconRefresh,
  IconServer, IconSignal, IconStop, IconTrend, IconZap,
} from "../components/icons";

/* ————— tiny SVG charts (no deps, crisp at any size) ————— */
function Spark({ data, color = "var(--color-signal-400)", w = 96, h = 28, fill = false }: { data: number[]; color?: string; w?: number; h?: number; fill?: boolean }) {
  if (data.length < 2) data = [...data, ...data, 1, 1];
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 3 - ((v - min) / (max - min || 1)) * (h - 6)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden="true">
      {fill && <polygon points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity="0.12" />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(" ").pop()?.split(",")[0]} cy={pts.split(" ").pop()?.split(",")[1]} r="2.4" fill={color} />
    </svg>
  );
}

function AreaChart({ data, label }: { data: number[]; label: string }) {
  const w = 640, h = 180;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [ (i / (data.length - 1)) * w, h - 12 - (v / max) * (h - 34) ] as const);
  const line = pts.map((p) => p.join(",")).join(" ");
  const peak = Math.max(...data);
  const peakI = data.indexOf(peak);
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={label}>
        <defs>
          <linearGradient id="area-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-signal-400)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-signal-400)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={w} y1={h - 12 - f * (h - 34)} y2={h - 12 - f * (h - 34)} stroke="var(--color-ink-700)" strokeDasharray="3 5" />
        ))}
        <polygon points={`0,${h - 12} ${line} ${w},${h - 12}`} fill="url(#area-g)" />
        <polyline points={line} fill="none" stroke="var(--color-signal-400)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pts[peakI][0]} cy={pts[peakI][1]} r="4.5" fill="var(--color-pulse-500)" stroke="var(--color-ink-900)" strokeWidth="2" />
        <text x={Math.min(Math.max(pts[peakI][0] - 34, 4), w - 76)} y={pts[peakI][1] - 12} fill="var(--color-pulse-300)" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700">
          peak {formatCount(peak)}
        </text>
      </svg>
    </div>
  );
}

/* ————— stream key + ingest panel ————— */
function IngestPanel() {
  const { streamKey, regenerateKey, toast } = useStore();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState("");
  const copy = async (label: string, text: string) => {
    await copyText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1600);
  };
  const row = (label: string, value: string, secret = false) => (
    <div className="flex items-center gap-2 rounded-lg border border-ink-600/70 bg-ink-900 px-3 py-2.5">
      <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-widest text-ink-300">{label}</span>
      <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-100">
        {secret && !revealed ? value.slice(0, 8) + "•".repeat(22) : value}
      </code>
      <button onClick={() => copy(label, value)} aria-label={`Copy ${label}`}
        className="rounded-md p-1.5 text-ink-300 transition hover:bg-ink-700 hover:text-signal-300 active:scale-90">
        {copied === label ? <IconCheck size={14} className="text-signal-400" /> : <IconCopy size={14} />}
      </button>
    </div>
  );
  return (
    <div className="space-y-2.5 rounded-xl border border-ink-700/80 bg-ink-850/80 p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-display text-sm font-extrabold"><IconKey size={15} className="text-ember-400" /> Ingest & stream key</p>
        <button onClick={() => setRevealed(!revealed)} className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-300 transition hover:text-signal-300">
          {revealed ? "hide" : "reveal"}
        </button>
      </div>
      {row("WebRTC", "wss://sfu.airtime.tv:4443")}
      {row("RTMP", "rtmp://ingest.airtime.tv/live")}
      {row("HLS out", "https://cdn.airtime.tv/{channel}/index.m3u8")}
      {row("key", streamKey, true)}
      <div className="flex items-center justify-between pt-1">
        <p className="font-mono text-[10px] leading-relaxed text-ink-300">Key auth is checked at the edge; rotation propagates<br />via Redis pub/sub in &lt;30s across all ingest PoPs.</p>
        <button onClick={regenerateKey}
          className="flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-xs font-bold text-ink-100 transition hover:border-ember-400/60 hover:text-ember-300 active:scale-95">
          <IconRefresh size={13} /> Rotate key
        </button>
      </div>
      <button onClick={() => toast({ kind: "info", title: "OBS profile exported", body: "Preset targets 6 Mbps CBR, 1080p60, keyframes every 1s for LL-HLS." })}
        className="w-full rounded-lg border border-dashed border-ink-500 py-2 text-xs font-bold text-ink-300 transition hover:border-signal-500/60 hover:text-signal-300">
        Download OBS / ffmpeg preset
      </button>
    </div>
  );
}

/* ————— live monitor ————— */
function LiveMonitor() {
  const { own, stopOwnStream, user } = useStore();
  const now = useNow(1000);
  void now;
  const latest = own.health[own.health.length - 1] ?? { bitrate: 0, fps: 0, dropped: 0, rtt: 0, buffer: 0 };
  const bitrateSeries = own.health.map((h) => h.bitrate);
  const health = latest.dropped > 2 || latest.buffer < 90 ? "degraded" : latest.bitrate < 4500 ? "fair" : "excellent";
  const healthStyle = { excellent: "text-signal-300 border-signal-500/50 bg-signal-500/10", fair: "text-ember-300 border-ember-400/50 bg-ember-400/10", degraded: "text-pulse-300 border-pulse-500/50 bg-pulse-500/10" }[health];

  const metrics = [
    { label: "Bitrate", value: `${(latest.bitrate / 1000).toFixed(2)} Mbps`, spark: bitrateSeries, color: "var(--color-signal-400)" },
    { label: "Frame rate", value: `${latest.fps} fps`, spark: own.health.map((h) => h.fps), color: "var(--color-ember-400)" },
    { label: "Dropped frames", value: String(latest.dropped), spark: own.health.map((h) => h.dropped), color: "var(--color-pulse-400)" },
    { label: "RTT to SFU", value: `${latest.rtt} ms`, spark: own.health.map((h) => h.rtt), color: "var(--color-signal-300)" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="relative overflow-hidden rounded-xl border border-pulse-500/40 shadow-glow-pulse">
          <div className="relative aspect-video">
            <CanvasVideo category={own.category} seed={77} className="absolute inset-0" />
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md bg-pulse-500 px-2 py-1 text-[10px] font-extrabold tracking-widest text-white"><span className="relative flex h-1.5 w-1.5"><span className="live-ping absolute h-full w-full rounded-full bg-white" /><span className="relative h-1.5 w-1.5 rounded-full bg-white" /></span>LIVE</span>
              <span className="rounded-md bg-ink-950/70 px-2 py-1 font-mono text-[11px] text-ink-100 backdrop-blur-sm tabular">{streamClock(own.startedAt)}</span>
            </div>
            <span className={`absolute right-3 top-3 rounded-md border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest ${healthStyle}`}>signal {health}</span>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink-950/90 to-transparent p-3">
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-100 tabular"><IconEye size={13} className="text-pulse-400" />{own.viewers.toLocaleString()} concurrent</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-100 tabular"><IconChat size={13} className="text-signal-400" />{own.chatMessages} messages</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-ink-700/80 bg-ink-850/80 p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink-300">Concurrent viewers</p>
            <p className="mt-1 font-display text-4xl font-extrabold text-ink-50 tabular">{own.viewers.toLocaleString()}</p>
            <div className="mt-2"><Spark data={own.viewersSeries} w={280} h={44} fill /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-ink-700/80 bg-ink-850/80 p-3.5">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ink-300">{m.label}</p>
                <p className="mt-1 font-display text-lg font-extrabold text-ink-50 tabular">{m.value}</p>
                <Spark data={m.spark.slice(-24)} w={110} h={26} color={m.color} />
              </div>
            ))}
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => navigate(`#/channel/${user?.handle}`)}
              className="flex-1 rounded-lg border border-ink-600 bg-ink-800 py-2.5 text-sm font-bold text-ink-100 transition hover:border-signal-500/50 hover:text-signal-300 active:scale-95">
              Open your channel
            </button>
            <button onClick={stopOwnStream}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pulse-500 py-2.5 text-sm font-bold text-white shadow-glow-pulse transition hover:bg-pulse-600 active:scale-95">
              <IconStop size={15} /> End stream
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ————— go-live setup ————— */
function GoLiveSetup() {
  const { startOwnStream, user } = useStore();
  const [title, setTitle] = useState("Building in public — come hang out");
  const [category, setCategory] = useState("code");
  const [tags, setTags] = useState("build-in-public, webdev");
  const [err, setErr] = useState("");
  const go = () => {
    if (title.trim().length < 4) return setErr("Give your stream a title (4+ characters).");
    startOwnStream(title.trim(), category, tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5));
  };
  const { hue } = categoryHue(category);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-xl border border-ink-700/80 bg-ink-850/80 p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-display text-base font-extrabold"><IconBroadcast size={17} className="text-signal-400" /> Set up your broadcast</p>
          <span className="rounded-md border border-ink-600 bg-ink-800 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-300">standby</span>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="stream-title" className="mb-1.5 block text-xs font-bold text-ink-200">Stream title</label>
            <input id="stream-title" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 90))}
              className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-ink-50 transition focus:border-signal-500/60 focus:outline-none focus:ring-2 focus:ring-signal-500/20" />
            <p className="mt-1 text-right font-mono text-[10px] text-ink-400 tabular">{90 - title.length}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="stream-cat" className="mb-1.5 block text-xs font-bold text-ink-200">Category</label>
              <select id="stream-cat" value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-ink-50 transition focus:border-signal-500/60 focus:outline-none">
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="stream-tags" className="mb-1.5 block text-xs font-bold text-ink-200">Tags <span className="font-normal text-ink-400">(comma separated)</span></label>
              <input id="stream-tags" value={tags} onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-ink-50 transition focus:border-signal-500/60 focus:outline-none" />
            </div>
          </div>
          <div className="rounded-lg border border-ink-600/60 bg-ink-900 p-3.5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-300">Preview card</p>
            <div className="mt-2.5 flex items-center gap-3">
              <span className="h-16 w-28 shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg, hsl(${hue},80%,52%), hsl(${(hue + 70) % 360},75%,30%))` }} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-ink-50">{title || "Untitled stream"}</span>
                <span className="block text-xs text-ink-300">{user?.displayName} · {CATEGORIES.find((c) => c.id === category)?.name}</span>
                <span className="mt-1 flex gap-1.5">{tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3).map((t) => <span key={t} className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] text-ink-200">{t}</span>)}</span>
              </span>
            </div>
          </div>
          {err && <p role="alert" className="rounded-lg border border-pulse-500/40 bg-pulse-500/10 px-3 py-2 text-xs font-semibold text-pulse-300">{err}</p>}
          <button onClick={go}
            className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-pulse-500 to-ember-500 py-3.5 font-display text-base font-extrabold text-white shadow-glow-pulse transition hover:brightness-110 active:scale-[0.98]">
            <span className="relative flex h-2.5 w-2.5"><span className="live-ping absolute h-full w-full rounded-full bg-white" /><span className="relative h-2.5 w-2.5 rounded-full bg-white" /></span>
            GO LIVE
            <span className="font-mono text-[10px] font-medium uppercase tracking-widest opacity-80 transition group-hover:translate-x-1">WebRTC → SFU</span>
          </button>
          <p className="text-center font-mono text-[10px] leading-relaxed text-ink-300">
            Going live notifies your {useStore.getState().follows.length ? "" : ""}followers over WebSocket instantly — email digest optional per user setting.
          </p>
        </div>
      </div>
      <div className="space-y-5">
        <IngestPanel />
        <div className="rounded-xl border border-ink-700/80 bg-ink-850/80 p-5">
          <p className="font-display text-sm font-extrabold">Pre-flight checklist</p>
          <ul className="mt-3 space-y-2.5 text-[13px] text-ink-200">
            {[["Camera + mic granted", true], ["Uplink ≥ 10 Mbps measured", true], ["Keyframes set to 1s (LL-HLS)", true], ["Title & category set", title.trim().length >= 4]].map(([label, ok]) => (
              <li key={label as string} className="flex items-center gap-2.5">
                <span className={`flex h-4.5 w-4.5 h-[18px] w-[18px] items-center justify-center rounded-full ${ok ? "bg-signal-500/20 text-signal-400" : "bg-ink-700 text-ink-400"}`}>
                  {ok ? <IconCheck size={11} /> : <span className="h-1 w-1 rounded-full bg-current" />}
                </span>
                {label as string}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

/* ————— analytics ————— */
function Analytics() {
  const { pastBroadcasts } = useStore();
  const totals = useMemo(() => ({
    streams: pastBroadcasts.length,
    watchMin: pastBroadcasts.reduce((a, b) => a + b.durationMin * b.avgViewers, 0),
    peak: Math.max(...pastBroadcasts.map((b) => b.peakViewers), 0),
    follows: pastBroadcasts.reduce((a, b) => a + b.followsGained, 0),
    chat: pastBroadcasts.reduce((a, b) => a + b.chatMessages, 0),
  }), [pastBroadcasts]);
  const latest = pastBroadcasts[0];
  return (
    <section aria-label="Analytics">
      <SectionHead kicker="// your analytics" title="Broadcast history" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Streams", value: String(totals.streams), icon: IconBroadcast },
          { label: "Viewer-minutes", value: formatCount(totals.watchMin), icon: IconEye },
          { label: "Peak concurrent", value: formatCount(totals.peak), icon: IconTrend },
          { label: "Follows gained", value: `+${totals.follows}`, icon: IconHeart },
          { label: "Chat messages", value: formatCount(totals.chat), icon: IconChat },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-ink-700/80 bg-ink-850/80 p-4">
            <s.icon size={16} className="text-signal-400" />
            <p className="mt-2 font-display text-2xl font-extrabold text-ink-50 tabular">{s.value}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-300">{s.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-ink-700/80 bg-ink-850/80 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-sm font-extrabold">{latest ? latest.title : "No broadcasts yet"}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-300">{latest ? timeAgo(latest.date) : ""} · viewers over time</p>
          </div>
          <div className="mt-3">{latest ? <AreaChart data={latest.series} label={`Viewer curve for ${latest.title}`} /> : <p className="py-10 text-center text-sm text-ink-300">Go live once and your curves land here.</p>}</div>
        </div>
        <div className="overflow-hidden rounded-xl border border-ink-700/80 bg-ink-850/80">
          <p className="border-b border-ink-700/80 px-4 py-3 font-display text-sm font-extrabold">Past broadcasts</p>
          <ul className="divide-y divide-ink-750">
            {pastBroadcasts.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-ink-750/60">
                <Spark data={b.series} w={70} h={24} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink-50">{b.title}</span>
                  <span className="block font-mono text-[10px] text-ink-300 tabular">{timeAgo(b.date)} · {b.durationMin}m · peak {formatCount(b.peakViewers)} · +{b.followsGained} follows</span>
                </span>
                <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-bold text-ink-200">{CATEGORIES.find((c) => c.id === b.category)?.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ————— page ————— */
export default function Dashboard() {
  const { user, own } = useStore();
  const now = useNow(1000);
  void now;
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <EmptyState title="The studio needs a pilot"
          body="Every Airtime account ships with full broadcaster capability — same dashboard, same tools, no roles to unlock. Sign in to manage your stream key, go live, and read your analytics."
          ctaLabel="Sign in to open the studio" onCta={() => useStore.getState().setAuthOpen(true)} />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[1600px] space-y-10 px-4 pt-8 lg:px-8">
      <header className="flex flex-wrap items-center gap-4">
        <Avatar hue={user.avatarHue} label={user.displayName} size={52} ring />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-signal-400">broadcast studio</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-50">{user.displayName}'s control room</h1>
        </div>
        <span className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-widest ${own.live ? "border-pulse-500/50 bg-pulse-500/10 text-pulse-300" : "border-ink-600 bg-ink-800 text-ink-300"}`}>
          <span className={`h-2 w-2 rounded-full ${own.live ? "bg-pulse-500" : "bg-ink-400"}`} />
          {own.live ? `on air · ${streamClock(own.startedAt)}` : "standby"}
        </span>
      </header>

      <AnimatePresence mode="wait">
        {own.live ? <LiveMonitor key="live" /> : <GoLiveSetup key="setup" />}
      </AnimatePresence>

      <Analytics />
    </div>
  );
}
