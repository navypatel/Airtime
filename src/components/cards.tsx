import { motion } from "framer-motion";
import { CATEGORIES, formatCount, streamClock, type Channel } from "../data/seed";
import { useCountUp } from "../lib/hooks";
import { useStore } from "../store";
import { IconHeart, IconPlay, IconTrend } from "./icons";
import { Avatar, ViewerCount } from "./chrome";

/* ————— category glyph watermark ————— */
function CategoryGlyph({ cat, className = "" }: { cat: string; className?: string }) {
  const s = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (cat) {
    case "gaming": return <svg {...s}><rect x="3" y="7" width="18" height="11" rx="5" /><path d="M7.5 10.5v4M5.5 12.5h4M15 11h.01M17.5 13.5h.01" /></svg>;
    case "irl": return <svg {...s}><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c-4.5 4.5-4.5 11.5 0 16 4.5-4.5 4.5-11.5 0-16Z" /></svg>;
    case "music": return <svg {...s}><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></svg>;
    case "code": return <svg {...s}><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14" /></svg>;
    case "art": return <svg {...s}><path d="m14.5 4.5 5 5L8 21H3v-5ZM12 7l5 5" /></svg>;
    case "sports": return <svg {...s}><circle cx="12" cy="12" r="8" /><path d="M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16M4.5 9h15M4.5 15h15" /></svg>;
    default: return <svg {...s}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

export function categoryHue(cat: string) {
  const c = CATEGORIES.find((x) => x.id === cat);
  return c ? { hue: c.hue, hue2: c.hue2 } : { hue: 200, hue2: 260 };
}

/* ————— procedural thumbnail art (pure CSS/SVG, zero network) ————— */
export function CardArt({ channel, className = "" }: { channel: Channel; className?: string }) {
  const { hue, hue2 } = categoryHue(channel.category);
  const seedShift = (channel.id.charCodeAt(1) || 3) * 13;
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(120% 90% at ${18 + seedShift % 30}% ${10 + seedShift % 20}%, hsla(${hue},85%,58%,0.55), transparent 55%),
          radial-gradient(120% 100% at ${80 - seedShift % 25}% ${90 - seedShift % 15}%, hsla(${hue2},80%,52%,0.5), transparent 60%),
          linear-gradient(160deg, hsl(${hue},40%,12%), hsl(${hue2},45%,7%))`,
      }} />
      <div className="absolute inset-0 opacity-[0.16]" style={{
        backgroundImage: "repeating-linear-gradient(115deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 9px)",
      }} />
      <div className="absolute inset-0 scanlines" />
      <CategoryGlyph cat={channel.category} className="absolute -bottom-4 -right-4 h-28 w-28 text-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:text-white/[0.16]" />
      {/* signal sweep on hover */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
    </div>
  );
}

/* ————— Channel card ————— */
export function ChannelCard({ channel, index = 0 }: { channel: Channel; index?: number }) {
  const { user, follows, toggleFollow, setAuthOpen } = useStore();
  const followed = follows.includes(channel.id);
  const viewers = useCountUp(channel.viewers);
  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <a href={`#/channel/${channel.slug}`} className="block overflow-hidden rounded-xl border border-ink-700/70 bg-ink-800/70 transition-all duration-300 hover:-translate-y-1.5 hover:border-ink-500 hover:shadow-lift hover:shadow-black/50">
        <div className="relative aspect-video">
          <CardArt channel={channel} className="absolute inset-0" />
          <div className="absolute left-2.5 top-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-pulse-500 px-2 py-1 text-[10px] font-extrabold tracking-widest text-white shadow-glow-pulse">
              <span className="relative flex h-1.5 w-1.5"><span className="live-ping absolute h-full w-full rounded-full bg-white" /><span className="relative h-1.5 w-1.5 rounded-full bg-white" /></span>
              LIVE
            </span>
            {channel.id === "me" && <span className="rounded-md bg-signal-400 px-2 py-1 text-[10px] font-extrabold tracking-widest text-ink-950">YOU</span>}
          </div>
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
            <ViewerCount value={viewers} />
            <span className="rounded-md bg-ink-950/70 px-2 py-1 font-mono text-[11px] text-ink-100 backdrop-blur-sm tabular">{streamClock(channel.startedAt)}</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-950/60 text-white backdrop-blur-sm ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-100 scale-75">
              <IconPlay size={26} className="translate-x-0.5" />
            </span>
          </div>
        </div>
        <div className="flex gap-3 p-3.5">
          <Avatar hue={channel.avatarHue} label={channel.displayName} size={38} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-ink-50 transition-colors group-hover:text-signal-300">{channel.title}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-200">
              {channel.displayName}
              {channel.verified && <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-signal-400)" aria-label="Verified"><path d="M12 2l2.4 2.1 3.2-.3 1 3 3 1-.3 3.2L23.5 13l-2.2 2.4.3 3.2-3 1-1 3-3.2-.3L12 24l-2.4-2.1-3.2.3-1-3-3-1 .3-3.2L.5 13l2.2-2.4-.3-3.2 3-1 1-3 3.2.3Z" transform="scale(0.92) translate(1,0)"/><path d="m8.5 12.5 2.5 2.5 5-5.5" stroke="#05070c" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-300">
              <span className="font-semibold text-ink-200">{CATEGORIES.find((c) => c.id === channel.category)?.name ?? channel.category}</span>
              {channel.tags.slice(0, 2).map((t) => <span key={t} className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px]">{t}</span>)}
            </p>
          </div>
        </div>
      </a>
      <button
        onClick={(e) => { e.preventDefault(); user ? toggleFollow(channel.id) : setAuthOpen(true); }}
        aria-label={followed ? `Unfollow ${channel.displayName}` : `Follow ${channel.displayName}`}
        aria-pressed={followed}
        className={`absolute -right-1.5 -top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-lift transition-all active:scale-90 ${
          followed
            ? "border-pulse-400/60 bg-pulse-500 text-white"
            : "border-ink-500 bg-ink-800 text-ink-200 opacity-0 hover:border-pulse-400/60 hover:text-pulse-300 focus-visible:opacity-100 group-hover:opacity-100"
        }`}
      >
        <IconHeart size={14} filled={followed} />
      </button>
    </motion.article>
  );
}

/* ————— Skeleton loader ————— */
export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-700/70 bg-ink-800/70">
      <div className="skeleton aspect-video" />
      <div className="flex gap-3 p-3.5">
        <div className="skeleton h-[38px] w-[38px] rounded-full" />
        <div className="flex-1 space-y-2 py-1">
          <div className="skeleton h-3.5 w-4/5 rounded" />
          <div className="skeleton h-3 w-2/5 rounded" />
          <div className="skeleton h-3 w-3/5 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ————— Section header ————— */
export function SectionHead({ kicker, title, action }: { kicker: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-signal-400">{kicker}</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink-50 sm:text-[28px]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* ————— Category rail ————— */
export function CategoryRail({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  const channels = useStore((s) => s.channels);
  return (
    <div className="scrollbar-none -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0" role="tablist" aria-label="Categories">
      <button role="tab" aria-selected={active === "all"} onClick={() => onSelect("all")}
        className={`shrink-0 rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${active === "all" ? "border-signal-400/70 bg-signal-500/15 text-signal-300" : "border-ink-600 bg-ink-800/70 text-ink-200 hover:border-ink-500 hover:text-ink-50"}`}>
        All <span className="ml-1 font-mono text-[11px] opacity-70 tabular">{channels.length}</span>
      </button>
      {CATEGORIES.map((c) => {
        const count = channels.filter((ch) => ch.category === c.id).length;
        const on = active === c.id;
        return (
          <button key={c.id} role="tab" aria-selected={on} onClick={() => onSelect(on ? "all" : c.id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${on ? "text-ink-50" : "border-ink-600 bg-ink-800/70 text-ink-200 hover:border-ink-500 hover:text-ink-50"}`}
            style={on ? { borderColor: `hsla(${c.hue},80%,60%,0.7)`, background: `hsla(${c.hue},80%,55%,0.13)` } : undefined}>
            <span className="h-2 w-2 rounded-sm" style={{ background: `linear-gradient(135deg, hsl(${c.hue},80%,58%), hsl(${c.hue2},75%,50%))` }} />
            {c.name} <span className="font-mono text-[11px] opacity-70 tabular">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ————— Trend pill ————— */
export function TrendPill({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-ember-400/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ember-400 tabular" title={`Trending score ${score}/100`}>
      <IconTrend size={11} /> {score}
    </span>
  );
}

/* ————— Empty / idle state ————— */
export function EmptyState({ title, body, ctaLabel, onCta }: { title: string; body: string; ctaLabel?: string; onCta?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-600 bg-ink-800/40 px-6 py-14 text-center">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-400)" strokeWidth="1.4" strokeLinecap="round" className="animate-floaty" aria-hidden="true">
        <circle cx="12" cy="12" r="2.2" fill="var(--color-pulse-500)" stroke="none" />
        <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" />
      </svg>
      <h3 className="mt-4 font-display text-lg font-extrabold text-ink-50">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-200">{body}</p>
      {ctaLabel && onCta && (
        <button onClick={onCta} className="mt-5 rounded-lg bg-gradient-to-r from-signal-500 to-signal-400 px-5 py-2.5 text-sm font-bold text-ink-950 shadow-glow-signal transition hover:brightness-110 active:scale-95">
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
