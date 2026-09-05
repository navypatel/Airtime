import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar } from "../components/chrome";
import { ChannelCard, EmptyState, SectionHead, TrendPill } from "../components/cards";
import { ChatPanel, Player } from "../components/player";
import { CATEGORIES, formatCount, timeAgo } from "../data/seed";
import { copyText, navigate } from "../lib/hooks";
import { useStore } from "../store";
import { IconHeart, IconShare, IconUsers } from "../components/icons";

export default function ChannelPage({ slug }: { slug: string }) {
  const { channels, user, follows, toggleFollow, setAuthOpen, toast } = useStore();
  const [theater, setTheater] = useState(false);
  const [tab, setTab] = useState<"about" | "schedule">("about");
  const channel = channels.find((c) => c.slug === slug);

  if (!channel) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <EmptyState title="This channel is dark"
          body="The stream you're looking for is offline or the address is wrong. Live channels appear here the moment their broadcaster starts ingesting WebRTC into the SFU."
          ctaLabel="Back to browse" onCta={() => navigate("#/")} />
      </div>
    );
  }

  const followed = follows.includes(channel.id);
  const followerCount = channel.followers + (followed ? 1 : 0);
  const related = channels.filter((c) => c.category === channel.category && c.id !== channel.id).slice(0, 4);
  const catName = CATEGORIES.find((c) => c.id === channel.category)?.name ?? channel.category;

  const share = async () => {
    await copyText(window.location.href);
    toast({ kind: "success", title: "Link copied", body: "Share the room — viewers land straight on the HLS stream." });
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-6 lg:px-8">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 font-mono text-[11px] text-ink-300">
        <a href="#/" className="transition hover:text-signal-300">browse</a>
        <span>/</span>
        <span className="transition hover:text-signal-300">{catName.toLowerCase()}</span>
        <span>/</span>
        <span className="text-ink-100">@{channel.handle}</span>
        <span className="ml-3 hidden items-center gap-1.5 text-signal-400 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-400" /> room: stream:{channel.id} · socket.io
        </span>
      </nav>

      <div className={`grid gap-5 ${theater ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]"}`}>
        <div className="min-w-0 space-y-5">
          <Player channel={channel} theater={theater} onTheater={() => setTheater(!theater)} />

          {/* streamer bar */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-ink-700/80 bg-ink-850/80 p-4">
            <Avatar hue={channel.avatarHue} label={channel.displayName} size={52} ring />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-lg font-extrabold text-ink-50">{channel.displayName}</h1>
                <TrendPill score={channel.trend} />
                <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-bold text-ink-200">{catName}</span>
              </div>
              <p className="mt-0.5 truncate text-sm text-ink-200">{channel.title}</p>
              <p className="mt-1 flex items-center gap-3 font-mono text-[11px] text-ink-300 tabular">
                <span className="flex items-center gap-1"><IconUsers size={12} className="text-signal-400" />{formatCount(followerCount)} followers</span>
                <span>started {timeAgo(channel.startedAt)}</span>
                <span className="hidden sm:inline">{channel.tags.map((t) => `#${t}`).join("  ")}</span>
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => (user ? toggleFollow(channel.id) : setAuthOpen(true))}
                aria-pressed={followed}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition active:scale-95 ${
                  followed
                    ? "bg-pulse-500/15 text-pulse-300 ring-1 ring-pulse-400/50 hover:bg-pulse-500/25"
                    : "bg-gradient-to-r from-pulse-500 to-ember-500 text-white shadow-glow-pulse hover:brightness-110"
                }`}>
                <IconHeart size={15} filled={followed} />
                {followed ? "Following" : "Follow"}
              </button>
              <button onClick={share} aria-label="Copy stream link"
                className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3.5 py-2.5 text-sm font-bold text-ink-100 transition hover:border-signal-500/50 hover:text-signal-300 active:scale-95">
                <IconShare size={15} /> Share
              </button>
            </div>
          </motion.div>

          {/* about tabs */}
          <div className="overflow-hidden rounded-xl border border-ink-700/80 bg-ink-850/80">
            <div className="flex border-b border-ink-700/80" role="tablist" aria-label="Channel information">
              {([["about", "About"], ["schedule", "Signal path"]] as const).map(([k, label]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                  className={`px-5 py-3 text-sm font-bold transition ${tab === k ? "border-b-2 border-signal-400 text-ink-50" : "text-ink-300 hover:text-ink-50"}`}>
                  {label}
                </button>
              ))}
            </div>
            {tab === "about" ? (
              <div className="p-5 text-sm leading-relaxed text-ink-100">
                <p>{channel.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {channel.tags.map((t) => <span key={t} className="rounded-md bg-ink-750 px-2.5 py-1 text-xs font-semibold text-ink-200 ring-1 ring-ink-600">#{t}</span>)}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 p-5 font-mono text-[12px] leading-relaxed text-ink-200">
                <p><span className="text-signal-400">ingest</span> ─ WebRTC (DTLS/SRTP) → mediasoup router on worker #{(channel.id.charCodeAt(1) % 12) + 1}</p>
                <p><span className="text-signal-400">package</span> ─ plain RTP transport → ffmpeg → LL-HLS (1s parts, 3 renditions)</p>
                <p><span className="text-signal-400">deliver</span> ─ S3 origin → CloudFront · you are watching from edge <b className="text-ink-50">fra-1</b></p>
                <p><span className="text-signal-400">chat</span> ─ socket.io room <b className="text-ink-50">stream:{channel.id}</b> via Redis pub/sub adapter</p>
              </div>
            )}
          </div>
        </div>

        {/* chat column */}
        <div className={`${theater ? "" : "xl:sticky xl:top-24 xl:h-[calc(100vh-8rem)]"} min-h-0`}>
          <ChatPanel channel={channel} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14" aria-label="More live channels in the same category">
          <SectionHead kicker={`// more ${catName.toLowerCase()}`} title={`More live in ${catName}`} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((c, i) => <ChannelCard key={c.id} channel={c} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
