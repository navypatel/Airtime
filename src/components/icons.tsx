import type { SVGProps } from "react";

// Hand-drawn inline icon set — 24px grid, 1.7 stroke, round joins.
type P = SVGProps<SVGSVGElement> & { size?: number };
const I = ({ size = 20, children, ...rest }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
);

export const IconLogo = ({ size = 26, ...rest }: P) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" {...rest}>
    <rect x="1.5" y="1.5" width="29" height="29" rx="8" stroke="currentColor" strokeOpacity="0.25" />
    <circle cx="16" cy="16" r="4.2" fill="var(--color-pulse-500)" />
    <path d="M8.2 16a7.8 7.8 0 0 1 3.2-6.3M23.8 16a7.8 7.8 0 0 1-3.2 6.3" stroke="var(--color-signal-400)" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M5.4 16a10.6 10.6 0 0 1 3.8-8.2M26.6 16a10.6 10.6 0 0 1-3.8 8.2" stroke="var(--color-signal-400)" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

export const IconPlay = (p: P) => <I {...p}><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" /></I>;
export const IconEye = (p: P) => <I {...p}><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.6" /></I>;
export const IconHeart = (p: P & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return <I {...rest}><path d="M12 20s-7.2-4.4-9-9c-1-2.7.6-6 3.8-6 2.1 0 3.7 1.2 5.2 3.3C13.5 6.2 15.1 5 17.2 5c3.2 0 4.9 3.3 3.8 6-1.8 4.6-9 9-9 9Z" fill={filled ? "currentColor" : "none"} /></I>;
};
export const IconBell = (p: P) => <I {...p}><path d="M6 9.5a6 6 0 0 1 12 0c0 5 1.8 6 1.8 6H4.2S6 14.5 6 9.5Z" /><path d="M10 19a2.2 2.2 0 0 0 4 0" /></I>;
export const IconSearch = (p: P) => <I {...p}><circle cx="10.5" cy="10.5" r="6" /><path d="m20 20-4.8-4.8" /></I>;
export const IconKey = (p: P) => <I {...p}><circle cx="8" cy="14.5" r="4" /><path d="m11 11.5 8-8M17 6l2.5 2.5M14 9l2 2" /></I>;
export const IconCopy = (p: P) => <I {...p}><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M5.5 15.5h-1a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></I>;
export const IconCheck = (p: P) => <I {...p}><path d="m4.5 12.5 5 5L19.5 7" /></I>;
export const IconX = (p: P) => <I {...p}><path d="M6 6l12 12M18 6 6 18" /></I>;
export const IconSignal = (p: P) => <I {...p}><path d="M4 19v-3M9 19v-7M14 19V8M19 19V4" /></I>;
export const IconShield = (p: P) => <I {...p}><path d="M12 3 5 6v5.2c0 4.6 3 7.7 7 9.8 4-2.1 7-5.2 7-9.8V6Z" /><path d="m9 11.5 2.2 2.2L15.5 9" /></I>;
export const IconArrowRight = (p: P) => <I {...p}><path d="M4.5 12h15M13.5 6l6 6-6 6" /></I>;
export const IconShare = (p: P) => <I {...p}><circle cx="6" cy="12" r="2.5" /><circle cx="17.5" cy="5.5" r="2.5" /><circle cx="17.5" cy="18.5" r="2.5" /><path d="m8.3 10.8 6.9-4M8.3 13.2l6.9 4" /></I>;
export const IconTheater = (p: P) => <I {...p}><rect x="3" y="6" width="18" height="12" rx="2" /></I>;
export const IconFullscreen = (p: P) => <I {...p}><path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5V8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M16 20h2.5a1.5 1.5 0 0 0 1.5-1.5V16" /></I>;
export const IconVolume = (p: P) => <I {...p}><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5Z" /><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.8a7.6 7.6 0 0 1 0 10.4" /></I>;
export const IconSliders = (p: P) => <I {...p}><path d="M4 7h10M18 7h2M4 17h4M12 17h8M4 12h14" /><circle cx="16" cy="7" r="1.8" /><circle cx="10" cy="17" r="1.8" /></I>;
export const IconUsers = (p: P) => <I {...p}><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><path d="M15.5 5.8a3.2 3.2 0 0 1 0 5.4M17.8 14.9c1.6.8 2.5 2.4 2.8 4.6" /></I>;
export const IconTrend = (p: P) => <I {...p}><path d="M3.5 17.5 9 11l4 4 7-8" /><path d="M15 7h5v5" /></I>;
export const IconGrid = (p: P) => <I {...p}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></I>;
export const IconChat = (p: P) => <I {...p}><path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19l1-4.9A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" strokeWidth={2.4} /></I>;
export const IconSend = (p: P) => <I {...p}><path d="M20 4 3.5 10.5l6.5 2.5L12.5 20 20 4Z" /><path d="m10 13 4-4" /></I>;
export const IconClock = (p: P) => <I {...p}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></I>;
export const IconBroadcast = (p: P) => <I {...p}><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" /><path d="M7.7 7.7a6 6 0 0 0 0 8.6M16.3 7.7a6 6 0 0 1 0 8.6M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></I>;
export const IconRefresh = (p: P) => <I {...p}><path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L19.5 9M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4.5 15" /><path d="M19.5 4.5V9H15M4.5 19.5V15H9" /></I>;
export const IconLock = (p: P) => <I {...p}><rect x="5.5" y="10.5" width="13" height="9.5" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></I>;
export const IconChevron = (p: P) => <I {...p}><path d="m6 9 6 6 6-6" /></I>;
export const IconLogout = (p: P) => <I {...p}><path d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" /><path d="M17 8.5 20.5 12 17 15.5M20.5 12H10" /></I>;
export const IconFlag = (p: P) => <I {...p}><path d="M5 21V4.5" /><path d="M5 4.5c4-2.2 7 2.2 14 0v9c-7 2.2-10-2.2-14 0" /></I>;
export const IconBan = (p: P) => <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></I>;
export const IconTrash = (p: P) => <I {...p}><path d="M4.5 6.5h15M9.5 6V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5V6M6.5 6.5l1 12A2 2 0 0 0 9.5 20.5h5a2 2 0 0 0 2-2l1-12" /><path d="M10 10.5v6M14 10.5v6" /></I>;
export const IconGlobe = (p: P) => <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c-5.5 5-5.5 12 0 17 5.5-5 5.5-12 0-17Z" /></I>;
export const IconZap = (p: P) => <I {...p}><path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5Z" /></I>;
export const IconServer = (p: P) => <I {...p}><rect x="3.5" y="4" width="17" height="7" rx="1.6" /><rect x="3.5" y="13" width="17" height="7" rx="1.6" /><path d="M7 7.5h.01M7 16.5h.01" strokeWidth={2.6} /><path d="M13 7.5h4M13 16.5h4" /></I>;
export const IconCamera = (p: P) => <I {...p}><rect x="3" y="7" width="13" height="11" rx="2" /><path d="m16 11 5-2.5v7L16 13" /></I>;
export const IconGear = (p: P) => <I {...p}><circle cx="12" cy="12" r="3" /><path d="M12 3.5 13 6h-2ZM12 20.5 11 18h2ZM3.5 12 6 11v2ZM20.5 12 18 13v-2ZM6 6l2.5 1.5L7 9ZM18 18l-2.5-1.5L17 15ZM18 6l-1.5 2.5L15 7ZM6 18l1.5-2.5L9 17Z" /></I>;
export const IconStop = (p: P) => <I {...p}><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" stroke="none" /></I>;
export const IconInfo = (p: P) => <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 7.8h.01" strokeWidth={2.2} /></I>;
export const IconMenu = (p: P) => <I {...p}><path d="M4 7h16M4 12h16M4 17h16" /></I>;
export const IconGoogle = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.9z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5.1l-3.9 3C3.1 21.3 7.2 24 12 24z" />
    <path fill="#FBBC05" d="M5.1 14.3c-.3-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3l-4-3C.4 8.3 0 10.1 0 12s.4 3.7 1.2 5.3l3.9-3z" />
    <path fill="#EA4335" d="M12 4.7c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.2 0 3.1 2.7 1.2 6.7l3.9 3c.9-3 3.7-5 6.9-5z" />
  </svg>
);
export const IconGitHub = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 1.8A10.4 10.4 0 0 0 8.7 22.1c.5.1.7-.2.7-.5v-1.9c-2.9.6-3.5-1.2-3.5-1.2-.5-1.2-1.2-1.5-1.2-1.5-.9-.7.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.8-1.2-4.8-5.2 0-1.1.4-2 1.1-2.8-.1-.2-.5-1.3.1-2.7 0 0 .9-.3 2.8 1.1a9.7 9.7 0 0 1 5.2 0c2-1.4 2.8-1.1 2.8-1.1.6 1.4.2 2.5.1 2.7.7.7 1.1 1.6 1.1 2.8 0 4-2.4 4.9-4.8 5.2.4.3.8 1 .8 2v2.9c0 .3.2.6.7.5A10.4 10.4 0 0 0 12 1.8Z" />
  </svg>
);
