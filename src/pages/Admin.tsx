import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "../components/chrome";
import { SectionHead } from "../components/cards";
import { formatCount, hashHue, timeAgo } from "../data/seed";
import { useStore } from "../store";
import { IconBan, IconCheck, IconClock, IconFlag, IconShield, IconTrash, IconUsers, IconZap } from "../components/icons";

type Report = { id: number; user: string; channel: string; snippet: string; reason: string; severity: "low" | "medium" | "high"; at: number };
type Row = { id: number; handle: string; role: "user" | "mod"; followers: number; status: "active" | "timed-out" | "banned"; streams: number };

const SEED_REPORTS: Report[] = [
  { id: 1, user: "saltmine", channel: "nova", snippet: "you're washed, uninstall now 💀💀", reason: "Harassment", severity: "high", at: Date.now() - 4 * 60e3 },
  { id: 2, user: "clipgoblin", channel: "miradotirl", snippet: "buy followers cheap at sketchy-link.tv", reason: "Spam / scam link", severity: "high", at: Date.now() - 11 * 60e3 },
  { id: 3, user: "turbo_snail", channel: "kernelpanic", snippet: "imagine not using Go LMAAAO", reason: "Toxicity (automod 0.82)", severity: "medium", at: Date.now() - 19 * 60e3 },
  { id: 4, user: "y2kenny", channel: "courtside", snippet: "ref is blind, someone find his address", reason: "Doxxing risk", severity: "high", at: Date.now() - 26 * 60e3 },
  { id: 5, user: "brisket", channel: "djcascade", snippet: "spamming emotes x40 in a row", reason: "Chat flood (backpressure triggered)", severity: "low", at: Date.now() - 38 * 60e3 },
];

const SEED_USERS: Row[] = [
  { id: 1, handle: "nova", role: "user", followers: 284300, status: "active", streams: 412 },
  { id: 2, handle: "saltmine", role: "user", followers: 82, status: "active", streams: 2 },
  { id: 3, handle: "chat moderator", role: "mod", followers: 1204, status: "active", streams: 0 },
  { id: 4, handle: "clipgoblin", role: "user", followers: 310, status: "timed-out", streams: 7 },
  { id: 5, handle: "kernelpanic", role: "user", followers: 39800, status: "active", streams: 96 },
];

const sevStyle = {
  high: "border-pulse-500/50 bg-pulse-500/10 text-pulse-300",
  medium: "border-ember-400/50 bg-ember-400/10 text-ember-300",
  low: "border-ink-500 bg-ink-700/50 text-ink-200",
};

export default function Admin() {
  const { user, setAuthOpen, login, toast } = useStore();
  const [reports, setReports] = useState(SEED_REPORTS);
  const [users, setUsers] = useState(SEED_USERS);
  const [log, setLog] = useState<string[]>(["automod flagged 14 messages in the last hour", "rate limiter shed 3.2% of chat traffic on room stream:c1"]);

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-ember-400/30 bg-ink-850/80 text-center shadow-lift">
          <div className="border-b border-ink-700 bg-ember-400/[0.06] px-6 py-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-ember-400/40 bg-ember-400/10 text-ember-300"><IconShield size={30} /></span>
            <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-ember-300">403 · elevated role required</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-50">Admin console</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-200">
              Moderation is a separate role — it never touches the regular user flow. Admins resolve reports, time out or ban users,
              and review automod decisions. Every action is written to the audit log.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 px-6 py-8 sm:flex-row sm:justify-center">
            <button onClick={() => login("admin@airtime.tv")}
              className="rounded-lg bg-gradient-to-r from-ember-500 to-pulse-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow-pulse transition hover:brightness-110 active:scale-95">
              One-click demo: sign in as admin
            </button>
            {!user && (
              <button onClick={() => setAuthOpen(true)} className="rounded-lg border border-ink-600 px-5 py-2.5 text-sm font-bold text-ink-100 transition hover:border-ink-500 active:scale-95">
                Sign in with another account
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const act = (msg: string) => {
    setLog((l) => [`${user.handle}: ${msg}`, ...l].slice(0, 8));
    toast({ kind: "success", title: "Moderation action recorded", body: msg });
  };
  const resolve = (id: number, action: string) => {
    const r = reports.find((x) => x.id === id);
    setReports((rs) => rs.filter((x) => x.id !== id));
    if (r) act(`${action} @${r.user} in #${r.channel} (${r.reason})`);
  };
  const timeoutUser = (handle: string) => {
    setUsers((us) => us.map((u) => (u.handle === handle ? { ...u, status: u.status === "timed-out" ? "active" : "timed-out" } : u)));
    act(`toggled 10m timeout for @${handle}`);
  };
  const banUser = (handle: string) => {
    setUsers((us) => us.map((u) => (u.handle === handle ? { ...u, status: u.status === "banned" ? "active" : "banned" } : u)));
    act(`toggled ban for @${handle}`);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-10 px-4 pt-8 lg:px-8">
      <header className="flex flex-wrap items-center gap-4">
        <span className="flex h-13 w-13 h-[52px] w-[52px] items-center justify-center rounded-xl border border-ember-400/40 bg-ember-400/10 text-ember-300"><IconShield size={26} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-ember-300">admin console</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-50">Trust & safety</h1>
        </div>
        <span className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3.5 py-2 font-mono text-[11px] text-ink-200">
          <IconZap size={13} className="text-signal-400" /> automod v3 · 94.1% precision
        </span>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Open reports", value: String(reports.length), icon: IconFlag, tone: "text-pulse-300" },
          { label: "Users online", value: "9,847", icon: IconUsers, tone: "text-signal-300" },
          { label: "Actions · 24h", value: "38", icon: IconClock, tone: "text-ember-300" },
          { label: "Chat msgs shed (backpressure)", value: "3.2%", icon: IconZap, tone: "text-ink-100" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-ink-700/80 bg-ink-850/80 p-4">
            <s.icon size={16} className={s.tone} />
            <p className={`mt-2 font-display text-2xl font-extrabold tabular ${s.tone}`}>{s.value}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-300">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <section aria-label="Moderation queue">
        <SectionHead kicker="// moderation queue" title="Flagged chat messages" />
        <div className="space-y-3">
          <AnimatePresence>
            {reports.length === 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dashed border-ink-600 bg-ink-800/40 px-6 py-10 text-center text-sm text-ink-200">
                Queue clear. Automod keeps watch over every room via the Redis pub/sub firehose.
              </motion.p>
            )}
            {reports.map((r) => (
              <motion.div key={r.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                className="flex flex-col gap-3 rounded-xl border border-ink-700/80 bg-ink-850/80 p-4 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar hue={hashHue(r.user)} label={r.user} size={38} />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <b className="text-ink-50">@{r.user}</b>
                      <span className="font-mono text-[10px] text-ink-300">in #{r.channel} · {timeAgo(r.at)}</span>
                      <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${sevStyle[r.severity]}`}>{r.severity}</span>
                    </p>
                    <p className="mt-1 truncate rounded-md bg-ink-900 px-2.5 py-1.5 font-mono text-[12px] text-ink-100">“{r.snippet}”</p>
                    <p className="mt-1 text-[11px] font-semibold text-ink-300">Reported for: <span className="text-ink-100">{r.reason}</span></p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button onClick={() => resolve(r.id, "dismissed report against")} aria-label="Dismiss report"
                    className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-xs font-bold text-ink-200 transition hover:border-signal-500/50 hover:text-signal-300 active:scale-95">
                    <IconCheck size={13} /> Dismiss
                  </button>
                  <button onClick={() => resolve(r.id, "removed message from")} aria-label="Remove message"
                    className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-xs font-bold text-ink-200 transition hover:border-ember-400/60 hover:text-ember-300 active:scale-95">
                    <IconTrash size={13} /> Remove
                  </button>
                  <button onClick={() => { timeoutUser(r.user); resolve(r.id, "timed out"); }} aria-label="Timeout user 10 minutes"
                    className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-xs font-bold text-ink-200 transition hover:border-ember-400/60 hover:text-ember-300 active:scale-95">
                    <IconClock size={13} /> 10m timeout
                  </button>
                  <button onClick={() => { banUser(r.user); resolve(r.id, "banned"); }} aria-label="Ban user"
                    className="flex items-center gap-1.5 rounded-lg border border-pulse-500/50 bg-pulse-500/10 px-3 py-2 text-xs font-bold text-pulse-300 transition hover:bg-pulse-500/20 active:scale-95">
                    <IconBan size={13} /> Ban
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section aria-label="Users">
          <SectionHead kicker="// users" title="Accounts" />
          <div className="overflow-hidden rounded-xl border border-ink-700/80 bg-ink-850/80">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-700 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-300">
                  <th className="px-4 py-3 font-bold">User</th>
                  <th className="hidden px-4 py-3 font-bold sm:table-cell">Followers</th>
                  <th className="hidden px-4 py-3 font-bold md:table-cell">Streams</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-750">
                {users.map((u) => (
                  <tr key={u.id} className="transition hover:bg-ink-750/50">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar hue={hashHue(u.handle)} label={u.handle} size={30} />
                        <span>
                          <span className="block font-bold text-ink-50">@{u.handle}</span>
                          <span className="font-mono text-[10px] uppercase text-ink-300">{u.role}</span>
                        </span>
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-[12px] text-ink-200 tabular sm:table-cell">{formatCount(u.followers)}</td>
                    <td className="hidden px-4 py-3 font-mono text-[12px] text-ink-200 tabular md:table-cell">{u.streams}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
                        u.status === "active" ? "border-signal-500/50 bg-signal-500/10 text-signal-300"
                        : u.status === "timed-out" ? "border-ember-400/50 bg-ember-400/10 text-ember-300"
                        : "border-pulse-500/50 bg-pulse-500/10 text-pulse-300"}`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex justify-end gap-1.5">
                        <button onClick={() => timeoutUser(u.handle)} aria-label={`Timeout ${u.handle}`} className="rounded-md border border-ink-600 p-1.5 text-ink-300 transition hover:border-ember-400/60 hover:text-ember-300 active:scale-90"><IconClock size={13} /></button>
                        <button onClick={() => banUser(u.handle)} aria-label={`Ban ${u.handle}`} className="rounded-md border border-ink-600 p-1.5 text-ink-300 transition hover:border-pulse-500/60 hover:text-pulse-300 active:scale-90"><IconBan size={13} /></button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-label="Audit log">
          <SectionHead kicker="// audit" title="Action log" />
          <div className="rounded-xl border border-ink-700/80 bg-ink-850/80 p-4">
            <ul className="space-y-2 font-mono text-[11px] leading-relaxed text-ink-200">
              <AnimatePresence initial={false}>
                {log.map((l, i) => (
                  <motion.li key={l + i} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 border-b border-ink-750/70 pb-2 last:border-0">
                    <span className="text-signal-400">▸</span> {l}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
