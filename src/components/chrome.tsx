import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEMO_ACCOUNTS, useStore, type User } from "../store";
import { formatCount, timeAgo } from "../data/seed";
import { navigate, useRoute } from "../lib/hooks";
import {
  IconArrowRight, IconBell, IconBroadcast, IconCheck, IconChevron, IconEye, IconGitHub,
  IconGoogle, IconLogo, IconLogout, IconMenu, IconSearch, IconShield, IconX, IconZap,
} from "./icons";

/* ————— shared bits ————— */
export function Avatar({ hue, label, size = 36, ring = false }: { hue: number; label: string; size?: number; ring?: boolean }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold uppercase ${ring ? "ring-2 ring-signal-400/60 ring-offset-2 ring-offset-ink-900" : ""}`}
      style={{
        width: size, height: size, fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue},72%,52%), hsl(${(hue + 60) % 360},70%,38%))`,
        color: "rgba(5,8,12,0.85)",
      }}
      aria-hidden="true"
    >
      {label.slice(0, 2)}
    </span>
  );
}

export function LiveBadge({ viewers, small = false }: { viewers?: number; small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md bg-pulse-500 font-display font-bold tracking-wide text-white shadow-glow-pulse ${small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-white" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      LIVE{viewers !== undefined && <span className="font-mono font-medium opacity-90 tabular">{formatCount(viewers)}</span>}
    </span>
  );
}

export function ViewerCount({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-ink-950/70 px-2 py-1 font-mono text-[11px] font-medium text-ink-100 backdrop-blur-sm tabular">
      <IconEye size={13} className="text-pulse-400" />
      {formatCount(value)}
    </span>
  );
}

/* ————— Top navigation ————— */
function SearchBox() {
  const { channels, query, setQuery } = useStore();
  const [focus, setFocus] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setFocus(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const hits = query.trim()
    ? channels.filter((c) => (c.title + c.handle + c.category + c.tags.join(" ")).toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];
  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocus(true)}
        onKeyDown={(e) => { if (e.key === "Enter") { navigate("#/"); setFocus(false); } }}
        placeholder="Search live channels, games, people…"
        aria-label="Search live channels"
        className="w-full rounded-lg border border-ink-600/70 bg-ink-800/80 py-2 pl-9 pr-16 text-sm text-ink-50 placeholder:text-ink-300 transition focus:border-signal-500/60 focus:bg-ink-800 focus:shadow-glow-signal focus:outline-none"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-ink-600 bg-ink-750 px-1.5 py-0.5 font-mono text-[10px] text-ink-300 md:block">↵</kbd>
      <AnimatePresence>
        {focus && hits.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-ink-600 bg-ink-800/95 shadow-lift backdrop-blur-xl"
            role="listbox" aria-label="Search results"
          >
            {hits.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => { navigate(`#/channel/${c.slug}`); setFocus(false); }}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-ink-700"
                >
                  <Avatar hue={c.avatarHue} label={c.displayName} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{c.displayName}</span>
                    <span className="block truncate text-xs text-ink-200">{c.title}</span>
                  </span>
                  <span className="font-mono text-[11px] text-pulse-300 tabular">{formatCount(c.viewers)} watching</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function BellMenu() {
  const { notifications, markNotificationsRead, user } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) markNotificationsRead(); }}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className={`relative rounded-lg border border-transparent p-2 text-ink-200 transition hover:border-ink-600 hover:bg-ink-750 hover:text-ink-50 ${open ? "border-ink-600 bg-ink-750 text-ink-50" : ""}`}
      >
        <IconBell size={19} />
        {unread > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pulse-500 px-1 font-mono text-[9px] font-bold text-white">
            {unread}
          </motion.span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-ink-600 bg-ink-800/95 shadow-lift backdrop-blur-xl"
            role="menu" aria-label="Notifications"
          >
            <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
              <p className="font-display text-sm font-bold">Notifications</p>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-signal-400"><IconZap size={11} /> socket.io · realtime</span>
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-200">All quiet. Follow someone to get go-live alerts.</li>}
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => { if (n.to) navigate(n.to); setOpen(false); }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-ink-700/70"
                  >
                    <span className="mt-1 flex h-2 w-2 shrink-0">
                      <span className="live-ping absolute h-2 w-2 rounded-full bg-pulse-500" />
                      <span className="h-2 w-2 rounded-full bg-pulse-500" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink-50">{n.title}</span>
                      <span className="block truncate text-xs text-ink-200">{n.body}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-ink-300">{timeAgo(n.at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {!user && <p className="border-t border-ink-700 px-4 py-2.5 text-[11px] text-ink-300">Sign in to receive alerts when people you follow go live.</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserMenu({ user }: { user: User }) {
  const { logout, own } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-label="Account menu" aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-transparent p-1 pr-2 transition hover:border-ink-600 hover:bg-ink-750">
        <Avatar hue={user.avatarHue} label={user.displayName} size={30} />
        <IconChevron size={14} className={`text-ink-300 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-ink-600 bg-ink-800/95 shadow-lift backdrop-blur-xl" role="menu">
            <div className="border-b border-ink-700 px-4 py-3">
              <p className="truncate font-display text-sm font-bold">{user.displayName}</p>
              <p className="truncate font-mono text-[11px] text-ink-300">@{user.handle} · {user.role}</p>
              <p className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-signal-400"><IconCheck size={11} /> JWT valid · refresh on 401</p>
            </div>
            <div className="p-1.5">
              <button onClick={() => { navigate("#/dashboard"); setOpen(false); }} role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-100 transition hover:bg-ink-700">
                <IconBroadcast size={16} className="text-signal-400" /> Broadcast studio
                {own.live && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-pulse-500" />}
              </button>
              {user.role === "admin" && (
                <button onClick={() => { navigate("#/admin"); setOpen(false); }} role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-100 transition hover:bg-ink-700">
                  <IconShield size={16} className="text-ember-400" /> Admin console
                </button>
              )}
              <button onClick={() => { logout(); setOpen(false); }} role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-100 transition hover:bg-ink-700">
                <IconLogout size={16} className="text-pulse-400" /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Nav() {
  const { user, setAuthOpen, own } = useStore();
  const route = useRoute();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { to: "#/", label: "Browse", active: route === "#/" || route.startsWith("#/channel") },
    { to: "#/dashboard", label: "Studio", active: route.startsWith("#/dashboard") },
    ...(user?.role === "admin" ? [{ to: "#/admin", label: "Admin", active: route.startsWith("#/admin") }] : []),
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-900/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 lg:px-8">
        <a href="#/" className="group flex items-center gap-2.5" aria-label="Airtime home">
          <IconLogo size={30} className="text-ink-100 transition-transform group-hover:rotate-6" />
          <span className="font-display text-lg font-extrabold tracking-[0.14em] text-ink-50">AIRTIME</span>
          <span className="mt-1 hidden rounded border border-signal-500/40 bg-signal-500/10 px-1 py-px font-mono text-[9px] font-bold uppercase tracking-widest text-signal-400 sm:block">beta</span>
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((l) => (
            <a key={l.to} href={l.to}
              className={`relative rounded-lg px-3.5 py-2 text-sm font-semibold transition ${l.active ? "text-ink-50" : "text-ink-200 hover:bg-ink-750 hover:text-ink-50"}`}>
              {l.label}
              {l.active && <motion.span layoutId="nav-pill" className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-signal-400" />}
              {l.label === "Studio" && own.live && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-pulse-500" />}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden flex-1 justify-center md:flex"><SearchBox /></div>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <BellMenu />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <button onClick={() => setAuthOpen(true)}
              className="rounded-lg bg-gradient-to-r from-pulse-500 to-ember-500 px-4 py-2 text-sm font-bold text-white shadow-glow-pulse transition hover:brightness-110 active:scale-95">
              Sign in
            </button>
          )}
          <button className="rounded-lg p-2 text-ink-200 transition hover:bg-ink-750 md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
            <IconMenu size={20} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-ink-700/60 md:hidden">
            <div className="space-y-2 px-4 py-3">
              <SearchBox />
              {links.map((l) => (
                <a key={l.to} href={l.to} onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm font-semibold ${l.active ? "bg-ink-750 text-ink-50" : "text-ink-200"}`}>
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ————— LIVE ticker marquee ————— */
export function Ticker() {
  const channels = useStore((s) => s.channels);
  const items = [...channels].sort((a, b) => b.viewers - a.viewers).slice(0, 10);
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key === "b"}>
      {items.map((c) => (
        <a key={key + c.id} href={`#/channel/${c.slug}`}
          className="group mx-5 flex items-center gap-2 whitespace-nowrap font-mono text-[12px] text-ink-200 transition hover:text-ink-50">
          <span className="h-1.5 w-1.5 rounded-full bg-pulse-500 shadow-[0_0_8px_rgba(255,51,82,0.9)]" />
          <span className="font-bold text-ink-100 group-hover:text-signal-300">{c.displayName}</span>
          <span className="truncate">{c.title.slice(0, 42)}{c.title.length > 42 ? "…" : ""}</span>
          <span className="text-signal-400 tabular">{formatCount(c.viewers)}</span>
          <span className="ml-4 text-ink-600">◆</span>
        </a>
      ))}
    </div>
  );
  return (
    <div className="marquee-hover relative overflow-hidden border-b border-ink-700/60 bg-ink-850/70" role="marquee" aria-label="Currently live channels">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink-900 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink-900 to-transparent" />
      <div className="flex items-center">
        <span className="z-20 flex shrink-0 items-center gap-2 border-r border-ink-700/60 bg-ink-850 px-4 py-2 font-display text-[11px] font-extrabold tracking-[0.2em] text-pulse-400">
          <span className="relative flex h-1.5 w-1.5"><span className="live-ping absolute h-full w-full rounded-full bg-pulse-400" /><span className="relative h-1.5 w-1.5 rounded-full bg-pulse-400" /></span>
          ON AIR
        </span>
        <div className="animate-marquee flex py-2">{row("a")}{row("b")}</div>
      </div>
    </div>
  );
}

/* ————— Toasts ————— */
export function Toasts() {
  const { toasts, dismissToast } = useStore();
  const styles = {
    success: { border: "border-signal-500/50", dot: "bg-signal-400" },
    error: { border: "border-pulse-500/60", dot: "bg-pulse-500" },
    live: { border: "border-pulse-500/60", dot: "bg-pulse-500" },
    info: { border: "border-ink-500", dot: "bg-ink-300" },
  } as const;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(94vw,380px)] flex-col gap-2.5" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={() => { if (t.to) navigate(t.to); dismissToast(t.id); }}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${styles[t.kind].border} bg-ink-800/95 p-3.5 text-left shadow-lift backdrop-blur-xl transition hover:bg-ink-750`}
          >
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${styles[t.kind].dot} ${t.kind === "live" ? "live-ping-slow" : ""}`} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-display text-sm font-bold text-ink-50">
                {t.title}
                {t.kind === "live" && <span className="rounded bg-pulse-500 px-1.5 py-px text-[9px] font-extrabold tracking-widest text-white">LIVE</span>}
              </span>
              {t.body && <span className="mt-0.5 block truncate text-xs text-ink-200">{t.body}</span>}
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-signal-400">open <IconArrowRight size={11} /></span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ————— Auth modal ————— */
export function AuthModal() {
  const { authOpen, setAuthOpen, login } = useStore();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<"" | "email" | "google" | "github">("");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAuthOpen(false); };
    if (authOpen) { document.addEventListener("keydown", onKey); setErr(""); }
    return () => document.removeEventListener("keydown", onKey);
  }, [authOpen, setAuthOpen]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("Enter a valid email address.");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    setBusy("email");
    setTimeout(() => login(email), 700);
  };
  const oauth = (p: "google" | "github") => {
    setBusy(p);
    setTimeout(() => login(p === "google" ? "streamer@airtime.tv" : "viewer@airtime.tv", p), 900);
  };
  return (
    <AnimatePresence>
      {authOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm"
          onClick={() => setAuthOpen(false)} role="dialog" aria-modal="true" aria-label="Sign in to Airtime">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 shadow-lift"
          >
            <div className="relative border-b border-ink-700 px-6 pb-5 pt-6">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-signal-400 via-pulse-500 to-ember-400" />
              <button onClick={() => setAuthOpen(false)} aria-label="Close" className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-300 transition hover:bg-ink-700 hover:text-ink-50"><IconX size={16} /></button>
              <h2 className="font-display text-2xl font-extrabold">{mode === "signin" ? "Welcome back" : "Join Airtime"}</h2>
              <p className="mt-1 text-sm text-ink-200">Watching is public. Sign in to chat, follow, and go live.</p>
            </div>
            <div className="p-6">
              <div className="mb-5 grid grid-cols-2 rounded-lg border border-ink-600 bg-ink-850 p-1 text-sm font-semibold" role="tablist">
                {(["signin", "signup"] as const).map((m) => (
                  <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErr(""); }}
                    className={`rounded-md py-1.5 transition ${mode === m ? "bg-ink-600 text-ink-50 shadow" : "text-ink-200 hover:text-ink-50"}`}>
                    {m === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2.5">
                <button onClick={() => oauth("google")} disabled={!!busy}
                  className="flex items-center justify-center gap-2 rounded-lg border border-ink-600 bg-ink-750 py-2.5 text-sm font-semibold text-ink-100 transition hover:border-ink-500 hover:bg-ink-700 active:scale-95 disabled:opacity-50">
                  {busy === "google" ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-signal-400" /> : <IconGoogle />} Google
                </button>
                <button onClick={() => oauth("github")} disabled={!!busy}
                  className="flex items-center justify-center gap-2 rounded-lg border border-ink-600 bg-ink-750 py-2.5 text-sm font-semibold text-ink-100 transition hover:border-ink-500 hover:bg-ink-700 active:scale-95 disabled:opacity-50">
                  {busy === "github" ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-signal-400" /> : <IconGitHub />} GitHub
                </button>
              </div>
              <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-300"><span className="rule-fade flex-1" />or email<span className="rule-fade flex-1" /></div>
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label htmlFor="auth-email" className="mb-1 block text-xs font-semibold text-ink-200">Email</label>
                  <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
                    placeholder="you@anywhere.tv"
                    className="w-full rounded-lg border border-ink-600 bg-ink-850 px-3.5 py-2.5 text-sm text-ink-50 placeholder:text-ink-400 transition focus:border-signal-500/60 focus:outline-none focus:ring-2 focus:ring-signal-500/20" />
                </div>
                <div>
                  <label htmlFor="auth-pass" className="mb-1 block text-xs font-semibold text-ink-200">Password</label>
                  <input id="auth-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-ink-600 bg-ink-850 px-3.5 py-2.5 text-sm text-ink-50 placeholder:text-ink-400 transition focus:border-signal-500/60 focus:outline-none focus:ring-2 focus:ring-signal-500/20" />
                </div>
                {err && <p className="rounded-lg border border-pulse-500/40 bg-pulse-500/10 px-3 py-2 text-xs font-semibold text-pulse-300" role="alert">{err}</p>}
                <button type="submit" disabled={!!busy}
                  className="w-full rounded-lg bg-gradient-to-r from-signal-500 to-signal-400 py-2.5 text-sm font-bold text-ink-950 shadow-glow-signal transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                  {busy === "email" ? "Verifying credentials…" : mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>
              <div className="mt-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-300">Demo accounts — one click</p>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_ACCOUNTS.map((d) => (
                    <button key={d.id} onClick={() => login(d.email)}
                      className="rounded-lg border border-ink-600 bg-ink-850 px-2 py-2 text-center transition hover:border-signal-500/50 hover:bg-ink-750 active:scale-95">
                      <Avatar hue={d.avatarHue} label={d.displayName} size={28} />
                      <span className="mt-1 block truncate text-[11px] font-semibold text-ink-100">{d.role === "admin" ? "Admin" : d.role === "user" && d.handle === "signalkid" ? "Streamer" : "Viewer"}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-center font-mono text-[10px] leading-relaxed text-ink-300">
                JWT access (15 min) + rotating refresh token (7 d) · OAuth via Passport strategies
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ————— Footer ————— */
export function Footer() {
  const channels = useStore((s) => s.channels);
  const total = channels.reduce((a, c) => a + c.viewers, 0);
  return (
    <footer className="mt-20 border-t border-ink-700/60 bg-ink-850/60">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-12 md:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <IconLogo size={28} className="text-ink-100" />
            <span className="font-display text-base font-extrabold tracking-[0.14em]">AIRTIME</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-200">
            A live streaming platform where every viewer is one click from being the broadcast.
            WebRTC ingest → mediasoup SFU → LL-HLS on the CDN edge. Built to carry 10,000+ concurrent viewers per event.
          </p>
          <p className="mt-4 flex items-center gap-2 font-mono text-[11px] text-signal-400 tabular">
            <span className="relative flex h-1.5 w-1.5"><span className="live-ping absolute h-full w-full rounded-full bg-signal-400" /><span className="relative h-1.5 w-1.5 rounded-full bg-signal-400" /></span>
            {formatCount(total)} concurrent viewers across {channels.length} live channels right now
          </p>
        </div>
        <div>
          <p className="font-display text-xs font-extrabold uppercase tracking-[0.2em] text-ink-300">Platform</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-200">
            <li><a className="transition hover:text-signal-300" href="#/">Browse live</a></li>
            <li><a className="transition hover:text-signal-300" href="#/dashboard">Broadcast studio</a></li>
            <li><a className="transition hover:text-signal-300" href="#/channel/nova">Watch a channel</a></li>
            <li><a className="transition hover:text-signal-300" href="#/admin">Admin console</a></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-xs font-extrabold uppercase tracking-[0.2em] text-ink-300">Infrastructure</p>
          <ul className="mt-3 space-y-2.5 font-mono text-[11px] text-ink-200">
            <li className="flex items-center justify-between"><span>SFU workers</span><span className="text-signal-400">12 / 12 healthy</span></li>
            <li className="flex items-center justify-between"><span>Redis socket.io adapter</span><span className="text-signal-400">connected</span></li>
            <li className="flex items-center justify-between"><span>CDN edge PoPs</span><span className="text-signal-400">38 regions</span></li>
            <li className="flex items-center justify-between"><span>HLS segment p99</span><span className="text-signal-400">212 ms</span></li>
            <li className="flex items-center justify-between"><span>Mongo replica set</span><span className="text-signal-400">3 nodes · indexed</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-700/60 py-4 text-center font-mono text-[10px] tracking-wider text-ink-300">
        AIRTIME © 2026 — demo build · architecture notes in README.md
      </div>
    </footer>
  );
}
