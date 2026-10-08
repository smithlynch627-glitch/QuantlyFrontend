import { useId, type SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = ({ size = 18, ...p }: P) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p,
});

export const IconSearch = (p: P) => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const IconClose = (p: P) => <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>;
export const IconMenu = (p: P) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const IconCheck = (p: P) => <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
export const IconCopy = (p: P) => <svg {...base(p)}><rect x="9" y="9" width="12" height="12" rx="2.5" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>;
export const IconExternal = (p: P) => <svg {...base(p)}><path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></svg>;
export const IconChevron = (p: P) => <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>;
export const IconFilter = (p: P) => <svg {...base(p)}><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
export const IconGridLg = (p: P) => <svg {...base(p)}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>;
export const IconGridSm = (p: P) => <svg {...base(p)}><path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z" /></svg>;
export const IconSweep = (p: P) => <svg {...base(p)}><path d="M15 3 9 12M5 13h9l1 3-2 5H6l-2-5z" /><path d="M8 17v4M11 17v4" /></svg>;
export const IconSun = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
export const IconMoon = (p: P) => <svg {...base(p)}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" /></svg>;
export const IconPlus = (p: P) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>;
export const IconMinus = (p: P) => <svg {...base(p)}><path d="M5 12h14" /></svg>;
export const IconWallet = (p: P) => <svg {...base(p)}><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M16 13h2M3 10h18M7 6l8-3 2 3" /></svg>;
export const IconUser = (p: P) => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const IconLogout = (p: P) => <svg {...base(p)}><path d="M15 17l5-5-5-5M20 12H9M12 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" /></svg>;
export const IconAlert = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>;
export const IconTag = (p: P) => <svg {...base(p)}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>;
export const IconBag = (p: P) => <svg {...base(p)}><path d="M5 8h14l-1 12H6z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>;
export const IconSpark = (p: P) => <svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>;
export const IconHand = (p: P) => <svg {...base(p)}><path d="M7 11V6a1.5 1.5 0 0 1 3 0v5M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.5-4.3a1.5 1.5 0 0 1 2.6-1.5L7 14" /></svg>;
export const IconSwap = (p: P) => <svg {...base(p)}><path d="M7 7h13l-3-3M17 17H4l3 3" /></svg>;
export const IconShare = (p: P) => <svg {...base(p)}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>;
export const IconChart = (p: P) => <svg {...base(p)}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
export const IconList = (p: P) => <svg {...base(p)}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></svg>;
export const IconUsers = (p: P) => <svg {...base(p)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.1 2.4 3.5 5.2" /></svg>;
export const IconInfo = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>;
export const IconClock = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const IconArrowLeft = (p: P) => <svg {...base(p)}><path d="M15 18l-6-6 6-6" /></svg>;
export const IconArrowRight = (p: P) => <svg {...base(p)}><path d="M9 18l6-6-6-6" /></svg>;
export const IconLock = (p: P) => <svg {...base(p)}><rect x="5" y="11" width="14" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
export const IconTrash = (p: P) => <svg {...base(p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
export const IconBell = (p: P) => <svg {...base(p)}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
export const IconGlobe = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
export const IconRefresh = (p: P) => <svg {...base(p)}><path d="M19.5 10A8 8 0 0 0 5.2 7.2L4 8.5M4 4v4.500h4.500M4.500 14a8 8 0 0 0 14.300 2.800l1.200-1.300M20 20v-4.500h-4.500" /></svg>;
export const IconEye = (p: P) => <svg {...base(p)}><path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z" /><circle cx="12" cy="12" r="3" /></svg>;
export const IconEyeOff = (p: P) => <svg {...base(p)}><path d="M10.600 6.100A9.700 9.700 0 0 1 12 6c6 0 9.500 6 9.500 6a16 16 0 0 1-2.600 3.300M6.600 7.600C3.900 9.300 2.500 12 2.500 12S6 18 12 18c1.900 0 3.500-.6 4.900-1.400M9.900 9.900a3 3 0 0 0 4.200 4.200M3 3l18 18" /></svg>;
export const IconKey = (p: P) => <svg {...base(p)}><circle cx="8" cy="15" r="4" /><path d="m10.800 12.200 8.700-8.700M16 7l2.500 2.500M14 9l2 2" /></svg>;

export const IconHome = (p: P) => <svg {...base(p)}><path d="M4 11.5 12 4l8 7.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z" /></svg>;
export const IconCompass = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>;
export const IconRocket = (p: P) => <svg {...base(p)}><path d="M5 15c-1.5 1.3-2 5-2 5s3.700-.5 5-2a2.100 2.100 0 0 0-3-3z" /><path d="M9 15 6 12c1-4 4.500-8.500 13-9-.5 8.500-5 12-9 13z" /><circle cx="14.500" cy="9.500" r="1.500" /></svg>;
export const IconPulse = (p: P) => <svg {...base(p)}><path d="M3 12h4l2.500-7 5 14 2.500-7h4" /></svg>;
export const IconCube = (p: P) => <svg {...base(p)}><path d="m12 3 8 4.500v9L12 21l-8-4.500v-9z" /><path d="m4 7.500 8 4.500 8-4.500M12 12v9" /></svg>;
export const IconDroplet = (p: P) => <svg {...base(p)}><path d="M12 3.500c3 3.700 6 7 6 10.500a6 6 0 0 1-12 0c0-3.500 3-6.800 6-10.500z" /></svg>;
export const IconHelp = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.700.400-1 1-1 1.700M12 17h.010" /></svg>;
export const IconShield = (p: P) => <svg {...base(p)}><path d="M12 3 5 6v5.500c0 4.300 2.900 7.700 7 9.500 4.100-1.800 7-5.200 7-9.500V6z" /><path d="m9 12 2 2 4-4" /></svg>;

/** The tick: purple for verified collections, gold for the marketplace's official collection. */
export function IconVerified({ size = 16, official = false }: { size?: number; official?: boolean }) {
  const id = useId().replace(/:/g, '');
  const fill = `vg${id}`;
  const shine = `vs${id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`verified${official ? ' verified--official' : ''}`}>
      <defs>
        <linearGradient id={fill} x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={official ? '#FFE9A3' : '#B9A6FF'} />
          <stop offset="0.45" stopColor={official ? '#E7B635' : '#7A5CFF'} />
          <stop offset="1" stopColor={official ? '#B07A08' : '#5B3BE6'} />
        </linearGradient>
        <linearGradient id={shine} x1="12" y1="2" x2="12" y2="13" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.8l2.6 1.9 3.2-.2 1 3.1 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3.1-3.2-.2L12 22.2l-2.6-1.9-3.2.2-1-3.1-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3.1 3.2.2z"
        fill={`url(#${fill})`}
        stroke={official ? '#9C6B06' : '#4F31D4'}
        strokeWidth={official ? 1.1 : 0.9}
        strokeLinejoin="round"
      />
      <path d="M12 3.4l2.2 1.6 2.7-.2.9 2.6 2.2 1.6-.5 1.6H4.5L4 9l2.2-1.6.9-2.6 2.7.2z" fill={`url(#${shine})`} />
      <path d="m8 12.3 2.7 2.7L16.2 9.4" fill="none" stroke={official ? '#3B2600' : '#FFFFFF'} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
