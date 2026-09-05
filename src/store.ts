import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  SEED_CHANNELS, OFFLINE_CHANNELS, PAST_BROADCASTS, trendScore,
  type Channel, type PastBroadcast,
} from "./data/seed";

// ————————————————————————————————————————————————
// Auth — mirrors backend JWT flow: short-lived access token (15m)
// + rotating refresh token (7d). Here minted client-side for the demo.
// ————————————————————————————————————————————————
export type User = {
  id: string; handle: string; displayName: string; email: string;
  role: "user" | "admin" | "mod"; avatarHue: number;
  accessToken: string; refreshToken: string; tokenExpiresAt: number;
};

const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=/g, "");
export function mintTokens(sub: string) {
  const access = `eyJhbGciOiJIUzI1NiJ9.${b64({ sub, typ: "access", exp: Date.now() + 15 * 60e3 })}.${b64({ sig: Math.random().toString(36).slice(2) })}`;
  const refresh = `rt_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  return { accessToken: access, refreshToken: refresh, tokenExpiresAt: Date.now() + 15 * 60e3 };
}

export const DEMO_ACCOUNTS: Array<Omit<User, "accessToken" | "refreshToken" | "tokenExpiresAt">> = [
  { id: "u_viewer",   handle: "you",           displayName: "You (viewer demo)", email: "viewer@airtime.tv",  role: "user",  avatarHue: 174 },
  { id: "u_streamer", handle: "signalkid",     displayName: "Signal Kid",        email: "streamer@airtime.tv", role: "user",  avatarHue: 348 },
  { id: "u_admin",    handle: "watchtower",    displayName: "Watchtower",        email: "admin@airtime.tv",    role: "admin", avatarHue: 44 },
];

// ————————————————————————————————————————————————
export type Toast = { id: number; kind: "success" | "error" | "live" | "info"; title: string; body?: string; to?: string };
export type Notification = { id: number; kind: "go-live" | "system"; title: string; body: string; to?: string; at: number; read: boolean };

type OwnStreamState = {
  live: boolean;
  title: string;
  category: string;
  tags: string[];
  startedAt: number;
  viewers: number;
  viewersSeries: number[];
  health: { bitrate: number; fps: number; dropped: number; rtt: number; buffer: number }[];
  chatMessages: number;
};

type Store = {
  user: User | null;
  channels: Channel[];
  offline: Channel[];
  follows: string[];               // channel ids
  pastBroadcasts: PastBroadcast[];
  own: OwnStreamState;
  streamKey: string;
  notifications: Notification[];
  toasts: Toast[];
  authOpen: boolean;
  booted: boolean;                 // drives skeleton loaders
  query: string;
  setQuery: (q: string) => void;

  boot: () => void;
  tick: () => void;
  login: (email: string, provider?: "google" | "github" | "email") => User;
  logout: () => void;
  setAuthOpen: (v: boolean) => void;
  toggleFollow: (channelId: string) => void;
  isFollowing: (channelId: string) => boolean;
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
  markNotificationsRead: () => void;
  pushNotification: (n: Omit<Notification, "id" | "at" | "read">) => void;
  regenerateKey: () => void;
  startOwnStream: (title: string, category: string, tags: string[]) => void;
  stopOwnStream: () => void;
};

let idSeq = 1;
const genKey = () => `at_live_${Math.random().toString(36).slice(2, 10)}_${Math.random().toString(36).slice(2, 10)}`;

const freshOwn = (): OwnStreamState => ({
  live: false, title: "", category: "code", tags: [], startedAt: 0, viewers: 0,
  viewersSeries: [], health: [], chatMessages: 0,
});

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      user: null,
      channels: SEED_CHANNELS,
      offline: OFFLINE_CHANNELS,
      follows: ["c1", "c7"],
      pastBroadcasts: PAST_BROADCASTS,
      own: freshOwn(),
      streamKey: genKey(),
      notifications: [
        { id: 0, kind: "go-live", title: "NOVA went live", body: "Radiant ranked grind → Immortal or bust", to: "#/channel/nova", at: Date.now() - 142 * 60e3, read: true },
      ],
      toasts: [],
      authOpen: false,
      booted: false,
      query: "",
      setQuery: (q) => set({ query: q }),

      boot: () => { if (!get().booted) setTimeout(() => set({ booted: true }), 850); },

      // ————— simulation engine (stands in for Socket.IO events) —————
      tick: () => {
        const { channels, follows, user } = get();
        let changed = false;
        const next = channels.map((c) => {
          if (!c.live) return c;
          const drift = (Math.random() - 0.47) * Math.max(30, c.viewers * 0.035);
          const viewers = Math.max(120, Math.round(c.viewers + drift));
          if (viewers !== c.viewers) changed = true;
          return { ...c, viewers, trend: trendScore(viewers, c.startedAt, c.followers) };
        });
        set({ channels: changed ? next : next });

        // Occasionally a followed offline channel goes live → WebSocket + toast notification
        if (user && Math.random() < 0.16) {
          const { offline } = get();
          const candidates = offline.filter((c) => follows.includes(c.id));
          const pick = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : offline[Math.floor(Math.random() * offline.length)];
          if (pick) {
            const live: Channel = {
              ...pick, live: true, startedAt: Date.now(),
              viewers: 240 + Math.round(Math.random() * 900),
              title: pick.title.replace(/^Was: /, ""),
            };
            set((s) => ({
              offline: s.offline.filter((c) => c.id !== pick.id),
              channels: [...s.channels, live],
            }));
            if (follows.includes(pick.id)) {
              get().pushNotification({ kind: "go-live", title: `${pick.displayName} went live`, body: live.title, to: `#/channel/${pick.slug}` });
              get().toast({ kind: "live", title: `${pick.displayName} is now live`, body: live.title, to: `#/channel/${pick.slug}` });
            }
          }
        }

        // Own stream grows while live
        const own = get().own;
        if (own.live) {
          const viewers = Math.round(Math.max(1, own.viewers + (Math.random() - 0.3) * Math.max(6, own.viewers * 0.12)));
          const bitrate = 5850 + Math.round((Math.random() - 0.5) * 320);
          const h = {
            bitrate,
            fps: 59 + Math.round(Math.random()),
            dropped: Math.random() < 0.12 ? Math.round(Math.random() * 4) : 0,
            rtt: 18 + Math.round(Math.random() * 14),
            buffer: 96 + Math.round(Math.random() * 4),
          };
          set({
            own: {
              ...own, viewers,
              viewersSeries: [...own.viewersSeries, viewers].slice(-48),
              health: [...own.health, h].slice(-40),
              chatMessages: own.chatMessages + Math.round(Math.random() * 5),
            },
          });
        }
      },

      login: (email, provider = "email") => {
        const demo = DEMO_ACCOUNTS.find((d) => d.email.toLowerCase() === email.toLowerCase());
        const base = demo ?? {
          id: `u_${Math.random().toString(36).slice(2, 8)}`,
          handle: email.split("@")[0].replace(/[^a-z0-9._]/gi, "").slice(0, 18) || "newcomer",
          displayName: email.split("@")[0].replace(/[._]/g, " "),
          email, role: "user" as const, avatarHue: Math.floor(Math.random() * 360),
        };
        const user: User = { ...base, ...mintTokens(base.id) };
        set({ user, authOpen: false });
        get().toast({ kind: "success", title: `Signed in${provider !== "email" ? ` with ${provider}` : ""}`, body: `Welcome back, ${user.displayName}.` });
        return user;
      },

      logout: () => {
        set({ user: null });
        get().toast({ kind: "info", title: "Signed out", body: "Watching stays public — sign back in to chat or go live." });
      },

      setAuthOpen: (v) => set({ authOpen: v }),

      toggleFollow: (channelId) => {
        const { follows, user } = get();
        if (!user) { set({ authOpen: true }); return; }
        const has = follows.includes(channelId);
        set({ follows: has ? follows.filter((f) => f !== channelId) : [...follows, channelId] });
        if (!has) {
          const ch = get().channels.find((c) => c.id === channelId) ?? get().offline.find((c) => c.id === channelId);
          if (ch) get().toast({ kind: "success", title: `Following ${ch.displayName}`, body: "You'll get notified the moment they go live." });
        }
      },

      isFollowing: (channelId) => get().follows.includes(channelId),

      toast: (t) => {
        const id = idSeq++;
        set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
        setTimeout(() => get().dismissToast(id), 5200);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      markNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      pushNotification: (n) => set((s) => ({ notifications: [{ ...n, id: idSeq++, at: Date.now(), read: false }, ...s.notifications].slice(0, 20) })),

      regenerateKey: () => {
        set({ streamKey: genKey() });
        get().toast({ kind: "info", title: "Stream key rotated", body: "The old key is dead in every region within 30s (Redis pub/sub invalidation)." });
      },

      startOwnStream: (title, category, tags) => {
        const { user } = get();
        if (!user) { set({ authOpen: true }); return; }
        const own: OwnStreamState = {
          live: true, title, category, tags, startedAt: Date.now(),
          viewers: 3, viewersSeries: [1, 2, 3], chatMessages: 0,
          health: [{ bitrate: 5920, fps: 60, dropped: 0, rtt: 21, buffer: 99 }],
        };
        const me: Channel = {
          id: "me", slug: user.handle, handle: user.handle, displayName: user.displayName,
          avatarHue: user.avatarHue, title, category, tags,
          viewers: 3, followers: 42, startedAt: Date.now(), live: true, verified: false, trend: 12,
          desc: "Streaming from the Airtime studio dashboard.",
        };
        set((s) => ({ own, channels: [me, ...s.channels.filter((c) => c.id !== "me")] }));
        get().toast({ kind: "live", title: "You're live on Airtime", body: "Ingest: WebRTC → SFU. Viewers served via LL-HLS on the CDN." , to: `#/channel/${user.handle}` });
      },

      stopOwnStream: () => {
        const { own, user, pastBroadcasts } = get();
        if (!own.live) return;
        const peak = Math.max(...own.viewersSeries, 1);
        const pb: PastBroadcast = {
          id: `p_${Date.now()}`, title: own.title || "Untitled broadcast", category: own.category,
          date: Date.now(), durationMin: Math.max(1, Math.round((Date.now() - own.startedAt) / 60e3)),
          peakViewers: peak, avgViewers: Math.round(own.viewersSeries.reduce((a, b) => a + b, 0) / Math.max(1, own.viewersSeries.length)),
          chatMessages: own.chatMessages, followsGained: Math.round(peak / 12),
          series: own.viewersSeries.length ? own.viewersSeries.filter((_, i) => i % Math.max(1, Math.floor(own.viewersSeries.length / 12)) === 0) : [1],
        };
        set((s) => ({
          own: freshOwn(),
          channels: s.channels.filter((c) => c.id !== "me"),
          pastBroadcasts: [pb, ...pastBroadcasts],
        }));
        get().toast({ kind: "success", title: "Broadcast ended", body: `Peak ${peak} concurrent viewers. VOD processing pushed to the transcode queue.` });
      },
    }),
    {
      name: "airtime-v1",
      partialize: (s) => ({ user: s.user, follows: s.follows, streamKey: s.streamKey, pastBroadcasts: s.pastBroadcasts }),
    }
  )
);
