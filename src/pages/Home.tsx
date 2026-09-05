import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import CanvasVideo from "../components/CanvasVideo";
import { Avatar, LiveBadge, Ticker, ViewerCount } from "../components/chrome";
import { CardArt, CategoryRail, ChannelCard, EmptyState, SectionHead, SkeletonCard, TrendPill } from "../components/cards";
import { CATEGORIES, formatCount, streamClock } from "../data/seed";
import { navigate, useCountUp } from "../lib/hooks";
import { useStore } from "../store";
import { IconArrowRight, IconBroadcast, IconGlobe, IconHeart, IconServer, IconZap } from "../components/icons";

function Featured() {
  const channels = useStore((s) => s.channels);
  const featured = useMemo(() => [...channels].sort((a, b) => b.trend - a.trend)[0], [channels]);
  const rail = useMemo(() => [...channels].filter((c) => c.id !== featured?.id).sort((a, b) => b.viewers - a.viewers).slice(0, 5), [channels, featured]);
  const viewers = useCountUp(featured?.viewers ?? 0);
  const totalViewers = useCountUp(channels.reduce((a, c) => a + c.viewers, 0), 1200);
  if (!featured) return null;

  return (
    <section className="grid gap-5 lg:grid-cols-[1.65fr_1fr]" aria-label="Featured broadcast">
      {/* flagship stream */}
      <motion.a
        href={`#/channel/${featured.slug}`}
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="group relative block overflow-hidden rounded-2xl border border-ink-700/80 shadow-lift"
      >
        <div className="relative aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[430px]">
          <CanvasVideo category={featured.category} seed={featured.id.charCodeAt(1) * 3 + 5} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/25 to-transparent" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <LiveBadge viewers={viewers} />
            <span className="rounded-md bg-ink-950/70 px-2 py-1 font-mono text-[11px] text-ink-100 backdrop-blur-sm tabular">{streamClock(featured.startedAt)}</span>
          </div>
          <span className="absolute right-4 top-4 rounded-md bg-ember-400/15 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ember-300 backdrop-blur-sm">▲ Trending #1</span>
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-200">
              <span className="text-signal-300">{CATEGORIES.find((c) => c.id === featured.category)?.name}</span>
              {featured.tags.map((t) => <span key={t} className="rounded bg-ink-50/10 px-1.5 py-0.5 text-[10px] text-ink-100 ring-1 ring-white/10">{t}</span>)}
            </div>
            <h1 className="mt-2 max-w-2xl font-display text-2xl font-extrabold leading-tight tracking-tight text-ink-50 sm:text-4xl">
              {featured.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Avatar hue={featured.avatarHue} label={featured.displayName} size={36} ring />
              <span className="text-sm font-bold text-ink-50">{featured.displayName}</span>
              <span className="text-xs text-ink-200">{formatCount(featured.followers)} followers</span>
              <span className="ml-auto flex items-center gap-2 rounded-lg bg-signal-400 px-4 py-2 text-sm font-bold text-ink-950 shadow-glow-signal transition group-hover:brightness-110">
                Watch live <IconArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </motion.a>

      {/* right rail */}
      <div className="flex min-h-0 flex-col gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
          className="overflow-hidden rounded-xl border border-ink-700/80 bg-ink-850/80">
          <p className="flex items-center justify-between border-b border-ink-700/80 px-4 py-2.5 font-display text-[13px] font-extrabold">
            Most watched <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-ink-300">realtime</span>
          </p>
          <ul>
            {rail.map((c, i) => (
              <li key={c.id}>
                <a href={`#/channel/${c.slug}`} className="group flex items-center gap-3 border-b border-ink-750/80 px-4 py-2.5 transition last:border-0 hover:bg-ink-750/70">
                  <span className="w-4 font-mono text-xs font-bold text-ink-400 tabular">{i + 2}</span>
                  <span className="relative shrink-0">
                    <Avatar hue={c.avatarHue} label={c.displayName} size={34} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-850 bg-pulse-500" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink-50 group-hover:text-signal-300">{c.title}</span>
                    <span className="block text-[11px] text-ink-300">{c.displayName} · {CATEGORIES.find((x) => x.id === c.category)?.name}</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-pulse-300 tabular">{formatCount(c.viewers)}</span>
                </a>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="relative overflow-hidden rounded-xl border border-ink-700/80 bg-ink-850/80 p-4">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-signal-500/10 blur-2xl" />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-signal-400">Platform pulse</p>
          <p className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink-50 tabular">{totalViewers.toLocaleString()}</p>
          <p className="text-xs text-ink-200">concurrent viewers · served from CDN edge, SFU untouched</p>
          <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px] text-ink-300">
            <span className="rounded-md bg-ink-750 px-2 py-1.5 text-center"><b className="block text-[13px] text-signal-300 tabular">{channels.length}</b>live</span>
            <span className="rounded-md bg-ink-750 px-2 py-1.5 text-center"><b className="block text-[13px] text-signal-300 tabular">12</b>SFU workers</span>
            <span className="rounded-md bg-ink-750 px-2 py-1.5 text-center"><b className="block text-[13px] text-signal-300 tabular">212ms</b>seg p99</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FollowingStrip() {
  const { user, channels, offline, follows } = useStore();
  if (!user) return null;
  const followedLive = channels.filter((c) => follows.includes(c.id));
  const followedOff = offline.filter((c) => follows.includes(c.id));
  if (followedLive.length === 0 && followedOff.length === 0) return null;
  return (
    <section aria-label="Channels you follow">
      <SectionHead kicker="// your feed" title="People you follow"
        action={<span className="font-mono text-[11px] text-ink-300">notifications armed · websocket + optional email</span>} />
      <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {[...followedLive, ...followedOff].map((c) => (
          <a key={c.id} href={c.live ? `#/channel/${c.slug}` : undefined}
            className={`group flex w-64 shrink-0 items-center gap-3 rounded-xl border border-ink-700/80 bg-ink-800/70 p-3 transition hover:-translate-y-0.5 hover:border-ink-500 ${c.live ? "" : "opacity-60 hover:opacity-90"}`}>
            <span className="relative shrink-0">
              <Avatar hue={c.avatarHue} label={c.displayName} size={44} />
              {c.live && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-800 bg-pulse-500" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink-50 group-hover:text-signal-300">{c.displayName}</span>
              {c.live
                ? <span className="block truncate text-[11px] text-ink-200">{c.title}</span>
                : <span className="block text-[11px] text-ink-300">Offline — alert armed</span>}
            </span>
            {c.live ? <ViewerCount value={c.viewers} /> : <IconHeart size={14} filled className="text-pulse-400" />}
          </a>
        ))}
      </div>
    </section>
  );
}

function InfraStrip() {
  const [ops, setOps] = useState(48210);
  const [segs, setSegs] = useState(1204);
  useEffect(() => {
    const iv = setInterval(() => {
      setOps((v) => v + Math.round((Math.random() - 0.45) * 400));
      setSegs((v) => Math.max(900, v + Math.round((Math.random() - 0.48) * 60)));
    }, 2000);
    return () => clearInterval(iv);
  }, []);
  void segs;
  const items = [
    { icon: IconBroadcast, label: "Ingest", value: "WebRTC → SFU", note: "broadcaster-only path" },
    { icon: IconServer, label: "Packaging", value: "LL-HLS · 1s parts", note: "per-router transcode" },
    { icon: IconGlobe, label: "Delivery", value: "CDN · 38 PoPs", note: "viewers never hit SFU" },
    { icon: IconZap, label: "Chat fanout", value: `${formatCount(ops)} msg/s`, note: "Redis pub/sub rooms" },
  ];
  return (
    <section aria-label="Infrastructure" className="relative overflow-hidden rounded-2xl border border-ink-700/80 bg-ink-850/70">
      <div className="absolute inset-0 bg-[radial-gradient(700px_260px_at_15%_0%,rgba(43,232,196,0.08),transparent),radial-gradient(600px_240px_at_90%_100%,rgba(255,51,82,0.07),transparent)]" />
      <div className="relative grid gap-px overflow-hidden rounded-2xl md:grid-cols-4">
        {items.map((it, i) => (
          <motion.div key={it.label} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.45 }}
            className="group border-b border-ink-700/60 px-5 py-5 transition hover:bg-ink-800/80 md:border-b-0 md:border-r md:last:border-r-0">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink-300">
              <it.icon size={13} className="text-signal-400" /> {it.label}
            </div>
            <p className="mt-2 font-display text-xl font-extrabold text-ink-50 tabular">{it.value}</p>
            <p className="mt-0.5 text-[11px] text-ink-300">{it.note}</p>
          </motion.div>
        ))}
      </div>
      <p className="relative border-t border-ink-700/60 px-5 py-3 font-mono text-[10px] tracking-wider text-ink-300">
        PIPELINE: publisher ─ WebRTC ─▶ mediasoup router (least-loaded worker) ─ plain transport ─▶ HLS packager ─▶ S3 ─▶ CloudFront ─▶ 10,000+ players
      </p>
    </section>
  );
}

export default function Home() {
  const { channels, booted, query, setQuery } = useStore();
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<"trend" | "viewers" | "newest">("trend");

  const visible = useMemo(() => {
    let list = [...channels];
    if (cat !== "all") list = list.filter((c) => c.category === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((c) => (c.title + c.handle + c.displayName + c.category + c.tags.join(" ")).toLowerCase().includes(q));
    }
    if (sort === "trend") list.sort((a, b) => b.trend - a.trend);
    if (sort === "viewers") list.sort((a, b) => b.viewers - a.viewers);
    if (sort === "newest") list.sort((a, b) => b.startedAt - a.startedAt);
    return list;
  }, [channels, cat, query, sort]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-12 px-4 pt-0 lg:px-8">
      <Ticker />
      <div className="space-y-12 pt-8">
        {!booted ? (
          <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr]">
            <div className="skeleton aspect-[16/9] rounded-2xl lg:aspect-auto lg:h-[430px]" />
            <div className="space-y-4">
              <div className="skeleton h-64 rounded-xl" />
              <div className="skeleton h-40 rounded-xl" />
            </div>
          </div>
        ) : (
          <Featured />
        )}

        <FollowingStrip />

        <section aria-label="Live channels">
          <SectionHead kicker="// live right now" title="Every channel on air"
            action={
              <div className="flex items-center gap-1 rounded-lg border border-ink-600 bg-ink-850 p-1 text-xs font-bold" role="tablist" aria-label="Sort channels">
                {([["trend", "Trending"], ["viewers", "Most watched"], ["newest", "Recently live"]] as const).map(([k, label]) => (
                  <button key={k} role="tab" aria-selected={sort === k} onClick={() => setSort(k)}
                    className={`rounded-md px-3 py-1.5 transition ${sort === k ? "bg-ink-600 text-ink-50" : "text-ink-300 hover:text-ink-50"}`}>
                    {label}
                  </button>
                ))}
              </div>
            } />
          <div className="mb-5"><CategoryRail active={cat} onSelect={setCat} /></div>
          {query.trim() && (
            <p className="mb-4 flex items-center gap-2 text-sm text-ink-200">
              {visible.length} result{visible.length === 1 ? "" : "s"} for <b className="text-signal-300">“{query}”</b>
              <button onClick={() => setQuery("")} className="rounded border border-ink-600 px-2 py-0.5 text-[11px] font-semibold text-ink-300 transition hover:border-pulse-400/60 hover:text-pulse-300">clear</button>
            </p>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {!booted
              ? [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
              : visible.map((c, i) => <ChannelCard key={c.id} channel={c} index={i} />)}
          </div>
          {booted && visible.length === 0 && (
            <EmptyState title="Nothing matches that signal"
              body="No live channels fit this search or category right now. Try another filter — or be the one who fills the gap: anyone on Airtime can go live."
              ctaLabel="Open broadcast studio" onCta={() => navigate("#/dashboard")} />
          )}
        </section>

        <InfraStrip />
      </div>
    </div>
  );
}
