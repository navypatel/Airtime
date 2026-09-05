import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CanvasVideo from "./CanvasVideo";
import { CATEGORY_CHAT, CHAT_PERSONAS, GENERIC_CHAT, formatCount, hashHue, streamClock, type Channel } from "../data/seed";
import { useCountUp, useNow } from "../lib/hooks";
import { useStore } from "../store";
import { Avatar } from "./chrome";
import { IconChat, IconFullscreen, IconPlay, IconSend, IconSignal, IconTheater, IconUsers, IconVolume, IconX } from "./icons";

const QUALITIES = ["1080p60", "720p", "480p"] as const;
type Quality = (typeof QUALITIES)[number];

/* ————————————— Player ————————————— */
export function Player({ channel, theater, onTheater }: { channel: Channel; theater: boolean; onTheater: () => void }) {
  const [quality, setQuality] = useState<Quality>("1080p60");
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [qOpen, setQOpen] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const now = useNow(1000);
  const viewers = useCountUp(channel.viewers, 900);

  useEffect(() => {
    setBuffering(true);
    const id = setTimeout(() => setBuffering(false), 900);
    return () => clearTimeout(id);
  }, [channel.id]);
  void now;

  const fullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div
      ref={wrapRef}
      className={`group/player relative overflow-hidden rounded-xl border border-ink-700/80 bg-ink-950 shadow-lift ${theater ? "aspect-[21/9]" : "aspect-video"}`}
    >
      <CanvasVideo category={channel.category} seed={channel.id.charCodeAt(1) * 3 + channel.id.length} playing={playing && !buffering} quality={quality} className="absolute inset-0" />

      {/* top overlay */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-ink-950/80 to-transparent p-3.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-pulse-500 px-2.5 py-1 text-[11px] font-extrabold tracking-widest text-white shadow-glow-pulse">
            <span className="relative flex h-1.5 w-1.5"><span className="live-ping absolute h-full w-full rounded-full bg-white" /><span className="relative h-1.5 w-1.5 rounded-full bg-white" /></span>
            LIVE
          </span>
          <span className="rounded-md bg-ink-950/70 px-2 py-1 font-mono text-[11px] text-ink-100 backdrop-blur-sm tabular">{streamClock(channel.startedAt)}</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-md bg-ink-950/70 px-2.5 py-1 font-mono text-[11px] font-semibold text-ink-50 backdrop-blur-sm tabular">
          <IconUsers size={13} className="text-pulse-400" /> {viewers.toLocaleString()} watching
        </span>
      </div>

      {/* buffering */}
      <AnimatePresence>
        {buffering && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ink-950/90">
            <div className="flex h-4 items-end gap-1">
              {[...Array(5)].map((_, i) => <span key={i} className="eq-bar w-1.5 rounded-sm bg-signal-400" style={{ height: "40%" }} />)}
            </div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-ink-200">ROUTING VIA NEAREST EDGE · LL-HLS</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* paused state */}
      {!playing && !buffering && (
        <button onClick={() => setPlaying(true)} aria-label="Resume playback"
          className="absolute inset-0 z-10 flex items-center justify-center bg-ink-950/70 backdrop-blur-[2px]">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-50/10 ring-1 ring-white/25 transition hover:scale-105">
            <IconPlay size={34} className="translate-x-1 text-white" />
          </span>
        </button>
      )}

      {/* control bar */}
      <div className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink-950/95 via-ink-950/60 to-transparent px-3.5 pb-2.5 pt-8 transition-opacity duration-300 ${playing ? "opacity-0 group-hover/player:opacity-100 group-focus-within/player:opacity-100" : "opacity-100"}`}>
        {/* seek-like progress = stream uptime bar */}
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-ink-600/70">
          <div className="h-full rounded-full bg-gradient-to-r from-pulse-500 to-ember-400" style={{ width: `${Math.min(100, ((Date.now() - channel.startedAt) / (6 * 3600e3)) * 100)}%` }} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"} className="text-ink-100 transition hover:text-white active:scale-90">
            {playing
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              : <IconPlay size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => { setMuted(!muted); }} aria-label={muted ? "Unmute" : "Mute"} aria-pressed={muted} className="text-ink-100 transition hover:text-white active:scale-90">
              <IconVolume size={18} className={muted ? "opacity-40" : ""} />
            </button>
            <input
              type="range" min={0} max={100} value={muted ? 0 : volume}
              onChange={(e) => { setVolume(+e.target.value); setMuted(false); }}
              aria-label="Volume" className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-ink-500 accent-[#2be8c4] sm:w-24"
            />
          </div>
          <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-signal-400 md:flex">
            <IconSignal size={12} /> edge: fra-1 · {quality} · 212ms
          </span>
          <div className="ml-auto flex items-center gap-2">
            {/* quality menu */}
            <div className="relative">
              <button onClick={() => setQOpen(!qOpen)} aria-label="Playback quality" aria-expanded={qOpen}
                className="flex items-center gap-1.5 rounded-md bg-ink-50/10 px-2 py-1 font-mono text-[11px] font-bold text-ink-50 ring-1 ring-white/15 transition hover:bg-ink-50/20">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 12h.01M10.5 12h.01M14 12h.01M17.5 12h.01" /></svg>
                {quality}
              </button>
              <AnimatePresence>
                {qOpen && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="absolute bottom-full right-0 mb-2 w-36 overflow-hidden rounded-lg border border-ink-600 bg-ink-800/95 py-1 shadow-lift backdrop-blur-xl">
                    <p className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-300">ABR renditions</p>
                    {QUALITIES.map((q) => (
                      <button key={q} onClick={() => { setQuality(q); setQOpen(false); }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs font-semibold transition hover:bg-ink-700 ${quality === q ? "text-signal-300" : "text-ink-100"}`}>
                        {q} {quality === q && <span className="h-1.5 w-1.5 rounded-full bg-signal-400" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={onTheater} aria-label="Toggle theater mode" aria-pressed={theater}
              className={`rounded-md p-1.5 ring-1 transition active:scale-90 ${theater ? "bg-signal-400/20 text-signal-300 ring-signal-400/50" : "bg-ink-50/10 text-ink-100 ring-white/15 hover:bg-ink-50/20"}`}>
              <IconTheater size={15} />
            </button>
            <button onClick={fullscreen} aria-label="Toggle fullscreen" className="rounded-md bg-ink-50/10 p-1.5 text-ink-100 ring-1 ring-white/15 transition hover:bg-ink-50/20 active:scale-90">
              <IconFullscreen size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ————————————— Chat ————————————— */
type Msg = { id: number; author: string; hue: number; text: string; system?: boolean; mod?: boolean; self?: boolean };

let msgId = 0;
function genMsg(category: string): Msg {
  const author = CHAT_PERSONAS[Math.floor(Math.random() * CHAT_PERSONAS.length)];
  const pool = [...GENERIC_CHAT, ...(CATEGORY_CHAT[category] ?? [])];
  return {
    id: ++msgId,
    author,
    hue: hashHue(author),
    text: pool[Math.floor(Math.random() * pool.length)],
    mod: author === "chat moderator",
  };
}

export function ChatPanel({ channel }: { channel: Channel }) {
  const { user, setAuthOpen } = useStore();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const cooldownTimer = useRef<number>(0);

  // seed history + live firehose (stands in for socket.io room events)
  useEffect(() => {
    setMessages(Array.from({ length: 9 }, () => genMsg(channel.category)));
    const iv = setInterval(() => {
      setMessages((m) => [...m.slice(-60), genMsg(channel.category)]);
      if (Math.random() < 0.06) {
        const p = CHAT_PERSONAS[Math.floor(Math.random() * CHAT_PERSONAS.length)];
        setMessages((m) => [...m.slice(-60), { id: ++msgId, author: "system", hue: 0, text: `${p} followed the channel`, system: true }]);
      }
    }, 2400 + Math.random() * 900);
    return () => clearInterval(iv);
  }, [channel.id, channel.category]);

  useEffect(() => {
    const el = listRef.current;
    if (el && atBottom) el.scrollTop = el.scrollHeight;
  }, [messages, atBottom]);

  const send = () => {
    if (!user) { setAuthOpen(true); return; }
    const text = draft.trim();
    if (!text || cooldown > Date.now()) return;
    setMessages((m) => [...m.slice(-60), { id: ++msgId, author: user.handle, hue: user.avatarHue, text, self: true }]);
    setDraft("");
    setCooldown(Date.now() + 2000); // rate limit: 1 msg / 2s, mirrors Redis sliding window
    window.clearTimeout(cooldownTimer.current);
    cooldownTimer.current = window.setTimeout(() => setCooldown(0), 2050);
  };
  useEffect(() => () => window.clearTimeout(cooldownTimer.current), []);

  const cooling = cooldown > Date.now();
  const coolPct = cooling ? Math.max(0, ((cooldown - Date.now()) / 2000) * 100) : 0;

  return (
    <aside className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-ink-700/80 bg-ink-850/80 ${collapsed ? "h-12" : "h-[420px] lg:h-auto"}`} aria-label="Stream chat">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-ink-700/80 px-4">
        <p className="flex items-center gap-2 font-display text-sm font-extrabold"><IconChat size={16} className="text-signal-400" /> Stream chat</p>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-ink-300 sm:block">slow mode · 2s</span>
          <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand chat" : "Collapse chat"} aria-expanded={!collapsed}
            className="rounded-md p-1 text-ink-300 transition hover:bg-ink-700 hover:text-ink-50">
            <IconX size={15} className={collapsed ? "rotate-45" : ""} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="relative min-h-0 flex-1">
            <div
              ref={listRef} role="log" aria-live="polite" aria-label="Chat messages"
              onScroll={(e) => {
                const el = e.currentTarget;
                setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
              }}
              className="absolute inset-0 space-y-1 overflow-y-auto px-3 py-3"
            >
              {messages.map((m) =>
                m.system ? (
                  <motion.p key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="rounded-md bg-ink-750/80 px-2.5 py-1.5 text-center text-[11px] font-semibold text-signal-300">
                    ♥ {m.text}
                  </motion.p>
                ) : (
                  <motion.p key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
                    className={`break-words rounded-md px-2.5 py-1 text-[13px] leading-snug transition hover:bg-ink-750/70 ${m.self ? "bg-signal-500/[0.07] ring-1 ring-signal-500/20" : ""}`}>
                    {m.mod && <span className="mr-1 inline-block rounded bg-ember-400/20 px-1 py-px align-middle text-[9px] font-extrabold uppercase tracking-wider text-ember-400">MOD</span>}
                    <span className="font-bold" style={{ color: `hsl(${m.hue}, 78%, 66%)` }}>{m.author}</span>
                    <span className="text-ink-300">: </span>
                    <span className="text-ink-100">{m.text}</span>
                  </motion.p>
                )
              )}
            </div>
            <AnimatePresence>
              {!atBottom && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  onClick={() => { setAtBottom(true); const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-ink-500 bg-ink-800/95 px-3.5 py-1.5 text-xs font-bold text-signal-300 shadow-lift backdrop-blur transition hover:bg-ink-750"
                >
                  ↓ More messages
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="shrink-0 border-t border-ink-700/80 p-3">
            {user ? (
              <div>
                <div className="flex items-center gap-2">
                  <Avatar hue={user.avatarHue} label={user.displayName} size={28} />
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, 240))}
                    onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                    placeholder={cooling ? "Slow mode — hold on…" : "Send a message"}
                    aria-label="Chat message"
                    disabled={cooling}
                    className="min-w-0 flex-1 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-400 transition focus:border-signal-500/60 focus:outline-none disabled:opacity-60"
                  />
                  <button onClick={send} disabled={cooling || !draft.trim()} aria-label="Send message"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-signal-500 to-signal-400 text-ink-950 shadow-glow-signal transition hover:brightness-110 active:scale-90 disabled:opacity-40 disabled:shadow-none">
                    <IconSend size={16} />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-ink-700">
                    <div className="h-full rounded-full bg-signal-400 transition-[width] duration-100 ease-linear" style={{ width: `${100 - coolPct}%` }} />
                  </div>
                  <span className="font-mono text-[10px] text-ink-300 tabular">{240 - draft.length}</span>
                </div>
              </div>
            ) : (
              <button onClick={() => setAuthOpen(true)}
                className="w-full rounded-lg border border-dashed border-ink-500 bg-ink-800/60 px-4 py-3 text-center text-sm font-semibold text-ink-200 transition hover:border-signal-500/50 hover:text-signal-300">
                Sign in to join the conversation
                <span className="mt-0.5 block text-[11px] font-normal text-ink-300">Viewing chat is public — posting requires an account</span>
              </button>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
