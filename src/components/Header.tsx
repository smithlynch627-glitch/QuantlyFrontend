import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useBalance, useDisconnect, useSwitchChain } from 'wagmi';
import { BRAND, LINKS, NATIVE, OFFICIAL, activeChain } from '../config';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import { fromWei, short } from '../lib/format';
import { gweiText, useChainLive } from '../lib/live';
import { useExitAnimation, usePresence, useSlidingIndicator } from '../lib/motion';
import { clearSession } from '../lib/session';
import { useTheme } from '../lib/theme';
import type { Collection } from '../lib/types';
import { useAppConfig } from '../lib/appConfig';
import { Avatar, CollectionAvatar } from './Art';
import {
  IconArrowRight, IconClose, IconCompass, IconCopy, IconDroplet, IconExternal, IconHelp, IconHome, IconLogout, IconMenu, IconMoon,
  IconPlus, IconPulse, IconRocket, IconSearch, IconSun, IconUser, IconVerified,
} from './Icons';
import { Badge, useToast } from './ui';
import { useWalletUI } from './wallet';
import { Logo } from './Logo';

/** Closes a popover when the visitor clicks outside it or presses Escape. */
function useDismiss(open: boolean, close: () => void, ...refs: React.RefObject<HTMLElement>[]) {
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent | TouchEvent) => {
      if (refs.some((r) => r.current?.contains(e.target as Node))) return;
      close();
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', outside);
    document.addEventListener('touchstart', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('touchstart', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [open, close]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** A small panel under a header button. Animates in, and out again when it closes. */
function Popover({ open, children, className = '', label }: { open: boolean; children: ReactNode; className?: string; label?: string }) {
  const { mounted, closing } = usePresence(open, 150);
  if (!mounted) return null;
  return <div className={`popover ${className}${closing ? ' is-closing' : ''}`} role="dialog" aria-label={label}>{children}</div>;
}

// ── Theme ─────────────────────────────────────────────────────────────────────
export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { t } = useI18n();
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? t('theme.light') : t('theme.dark');
  return (
    <button
      type="button"
      className={`theme-toggle${withLabel ? ' theme-toggle--label' : ''}`}
      data-theme-now={theme}
      aria-label={label}
      title={label}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
    >
      <span className="theme-toggle__icons" aria-hidden="true">
        <IconSun size={17} />
        <IconMoon size={17} />
      </span>
      {withLabel && <span>{label}</span>}
    </button>
  );
}

// ── Network ───────────────────────────────────────────────────────────────────
/** Seconds since the latest block, re-rendered once a second while the panel is open. */
function useBlockAge(timestamp: number | undefined, active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return timestamp ? Math.max(0, Math.round(now / 1000 - timestamp)) : null;
}

/** Live network status: a dot and the block number in the header; block age, gas, faucet and explorer on click. */
function NetworkChip() {
  const { t } = useI18n();
  const live = useChainLive();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);
  const age = useBlockAge(live.data?.timestamp, open);
  const explorer = activeChain.blockExplorers?.default.url;
  const transfer = live.data ? (Number(live.data.gasPrice) * 21_000) / 1e18 : null;
  const down = live.isError;
  const waiting = !live.data && !down;
  return (
    <div className="pop-anchor hide-sm" ref={ref}>
      <button type="button" className="net-chip" aria-expanded={open} onClick={() => setOpen((o) => !o)} title={t('status.liveChain')}>
        <span className={`live-dot ${down ? 'is-down' : waiting ? 'is-wait' : ''}`} />
        <span className="net-chip__name">{activeChain.name}</span>
        <span className="net-chip__block mono-num">{live.data ? `#${Number(live.data.block).toLocaleString()}` : down ? t('net.down') : '…'}</span>
      </button>
      <Popover open={open} className="popover--net" label={t('net.title')}>
        <div className="popover__head">
          <span className="strong">{activeChain.name}</span>
          <span className={`pill ${down ? 'pill--bad' : waiting ? '' : 'pill--live'}`}>{down ? t('net.offline') : waiting ? t('net.connecting') : t('net.online')}</span>
        </div>
        <dl className="net-rows">
          <div><dt>{t('net.block')}</dt><dd className="mono-num">{live.data ? `#${Number(live.data.block).toLocaleString()}` : '—'}</dd></div>
          <div title={t('status.blockAgeHint')}><dt>{t('status.blockAge')}</dt><dd className={`mono-num ${age !== null && age > 90 ? 'is-bad' : ''}`}>{age !== null ? t('net.ago', { n: age }) : '—'}</dd></div>
          <div><dt>{t('status.gas')}</dt><dd className="mono-num">{gweiText(live.data?.gasPrice)} gwei</dd></div>
          <div><dt>{t('net.transfer')}</dt><dd className="mono-num">{transfer === null ? '—' : `${transfer < 0.000001 ? '<0.000001' : Number(transfer.toPrecision(2))} ${NATIVE}`}</dd></div>
        </dl>
        <p className="tiny muted">{t('status.blockAgeHint')}</p>
        <div className="popover__links">
          {activeChain.testnet && <a href={LINKS.faucet} target="_blank" rel="noreferrer"><IconDroplet size={15} />{t('status.faucet', { coin: NATIVE })}<IconExternal size={12} /></a>}
          {explorer && <a href={explorer} target="_blank" rel="noreferrer"><IconCompass size={15} />{t('footer.explorer')}<IconExternal size={12} /></a>}
          <a href={LINKS.status} target="_blank" rel="noreferrer"><IconPulse size={15} />{t('net.status')}<IconExternal size={12} /></a>
        </div>
      </Popover>
    </div>
  );
}

// ── Search (command palette) ──────────────────────────────────────────────────
function CommandSearch({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const nav = useNavigate();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useExitAnimation(root, true, 180);
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 200);
    return () => clearTimeout(id);
  }, [q]);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    input.current?.focus();
    return () => { document.body.style.overflow = ''; prev?.focus?.(); };
  }, []);
  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => api.get<{ collections: Collection[] }>('/search', { q: debounced }),
    enabled: debounced.length > 0,
  });
  const results = debounced ? data?.collections ?? [] : [];
  const quick = useMemo(() => [
    { to: '/explore', label: t('nav.explore'), icon: <IconCompass size={17} /> },
    { to: '/launchpad', label: t('nav.launchpad'), icon: <IconRocket size={17} /> },
    { to: '/activity', label: t('nav.activity'), icon: <IconPulse size={17} /> },
    { to: '/create', label: t('nav.create'), icon: <IconPlus size={17} /> },
    { to: `/${OFFICIAL.slug}`, label: OFFICIAL.name, icon: <IconVerified size={17} official /> },
    { to: '/faq', label: t('nav.faq'), icon: <IconHelp size={17} /> },
  ], [t]);
  const items = debounced ? results.map((c) => ({ to: `/collection/${c.slug}` })) : quick;
  useEffect(() => { setActive(0); }, [debounced, results.length]);
  const go = (to: string) => { onClose(); nav(to); };

  return createPortal(
    <div className="cmd-root" ref={root} role="dialog" aria-modal="true" aria-label={t('nav.search')}>
      <div className="cmd-backdrop" onClick={onClose} />
      <div className="cmd">
        <div className="cmd__input">
          <IconSearch size={19} />
          <input
            ref={input}
            value={q}
            placeholder={t('nav.search')}
            aria-label={t('nav.search')}
            autoComplete="off"
            spellCheck={false}
            maxLength={80}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              if (e.key === 'Enter' && items[active]) go(items[active].to);
            }}
          />
          {isFetching && <span className="spinner" />}
          <button type="button" className="icon-btn icon-btn--close" onClick={onClose} aria-label={t('common.close')}><IconClose size={15} /></button>
        </div>
        <div className="cmd__list" role="listbox">
          {!debounced && <div className="cmd__label">{t('search.goTo')}</div>}
          {!debounced && quick.map((x, i) => (
            <button key={x.to} type="button" role="option" aria-selected={active === i} className="cmd__item" style={{ ['--i' as any]: i }} onMouseEnter={() => setActive(i)} onClick={() => go(x.to)}>
              <span className="cmd__icon">{x.icon}</span>
              <span className="strong">{x.label}</span>
              <IconArrowRight size={15} />
            </button>
          ))}
          {debounced && results.length === 0 && !isFetching && <div className="cmd__empty">{t('nav.searchEmpty')}</div>}
          {results.map((c, i) => (
            <button key={c.address} type="button" role="option" aria-selected={active === i} className="cmd__item" style={{ ['--i' as any]: i }} onMouseEnter={() => setActive(i)} onClick={() => go(`/collection/${c.slug}`)}>
              <span className="thumb thumb--sm" style={{ position: 'relative' }}><CollectionAvatar collection={c} /></span>
              <span className="cmd__main">
                <span className="row" style={{ gap: 6 }}><span className="strong">{c.name}</span><Badge official={c.is_official} verified={c.verified} size={14} /></span>
                <span className="tiny muted">{t('common.floor')} {c.floor_wei ? `${fromWei(c.floor_wei)} ${NATIVE}` : '—'}</span>
              </span>
              <IconArrowRight size={15} />
            </button>
          ))}
        </div>
        <div className="cmd__foot hide-sm">
          <span><kbd>↑</kbd><kbd>↓</kbd>{t('search.move')}</span>
          <span><kbd>↵</kbd>{t('search.open')}</span>
          <span><kbd>esc</kbd>{t('common.close')}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Wallet ────────────────────────────────────────────────────────────────────
function WalletButton() {
  const { t } = useI18n();
  const toast = useToast();
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { openConnect, forget } = useWalletUI();
  const { data: bal } = useBalance({ address, chainId: activeChain.id, query: { enabled: !!address } });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  if (!isConnected || !address) return <button className="btn btn--sm btn--glow" onClick={openConnect}>{t('wallet.connect')}</button>;
  if (chainId !== activeChain.id) return <button className="btn btn--sm" onClick={() => switchChain({ chainId: activeChain.id })}>{t('wallet.switch')}</button>;

  return (
    <div className="pop-anchor" ref={ref}>
      <button className="wallet-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Avatar address={address} size={30} />
        <span className="hide-sm mono-num">{short(address)}</span>
      </button>
      <Popover open={open} className="popover--wallet" label={t('wallet.profile')}>
        <div className="popover__head popover__head--stack">
          <span className="tiny muted">{t('wallet.balance')}</span>
          <span className="h3 mono-num">{bal ? fromWei(bal.value) : '—'} {NATIVE}</span>
        </div>
        <div className="menu-list">
          <Link to={`/profile/${address}`} onClick={close}><IconUser size={17} />{t('wallet.profile')}</Link>
          <button onClick={() => { navigator.clipboard?.writeText(address); toast(t('wallet.copied')); close(); }}><IconCopy size={17} />{t('wallet.copy')}</button>
          <button onClick={() => { clearSession(address); forget(); disconnect(); close(); }}><IconLogout size={17} />{t('wallet.disconnect')}</button>
        </div>
      </Popover>
    </div>
  );
}

// ── Mobile: tab bar + "More" sheet ────────────────────────────────────────────
function MoreSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  useExitAnimation(root, true, 240);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', esc); };
  }, [onClose]);
  const links = [
    { to: '/activity', label: t('nav.activity'), icon: <IconPulse size={19} /> },
    { to: `/${OFFICIAL.slug}`, label: OFFICIAL.name, icon: <IconVerified size={19} official /> },
    { to: '/faq', label: t('nav.faq'), icon: <IconHelp size={19} /> },
  ];
  return createPortal(
    <div className="sheet-root" ref={root} role="dialog" aria-modal="true" aria-label={t('nav.menu')}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet__grip" aria-hidden="true" />
        <div className="sheet__head">
          <span className="h3">{t('nav.menu')}</span>
          <button className="icon-btn icon-btn--close" onClick={onClose} aria-label={t('common.close')}><IconClose size={16} /></button>
        </div>
        <nav className="sheet__links">
          {links.map((l, i) => (
            <Link key={l.to} to={l.to} onClick={onClose} style={{ ['--i' as any]: i }}>
              <span className="sheet__icon">{l.icon}</span>{l.label}<IconArrowRight size={16} />
            </Link>
          ))}
        </nav>
        <div className="sheet__foot">
          <ThemeToggle withLabel />
          {activeChain.testnet && <a className="btn btn--outline btn--sm" href={LINKS.faucet} target="_blank" rel="noreferrer"><IconDroplet size={15} />{t('status.faucet', { coin: NATIVE })}</a>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MobileTabBar({ onMore, moreOpen }: { onMore: () => void; moreOpen: boolean }) {
  const { t } = useI18n();
  const tabs = [
    { to: '/', label: t('nav.home'), icon: <IconHome size={21} />, end: true },
    { to: '/explore', label: t('nav.explore'), icon: <IconCompass size={21} /> },
    { to: '/launchpad', label: t('nav.launchpad'), icon: <IconRocket size={21} /> },
    { to: '/create', label: t('nav.create'), icon: <IconPlus size={21} /> },
  ];
  return (
    <nav className="tabbar" aria-label={t('nav.menu')}>
      {tabs.map((x) => (
        <NavLink key={x.to} to={x.to} end={x.end} className="tabbar__item">
          <span className="tabbar__icon">{x.icon}</span>
          <span>{x.label}</span>
        </NavLink>
      ))}
      <button type="button" className={`tabbar__item${moreOpen ? ' active' : ''}`} onClick={onMore} aria-expanded={moreOpen}>
        <span className="tabbar__icon"><IconMenu size={21} /></span>
        <span>{t('nav.more')}</span>
      </button>
    </nav>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
export function Header() {
  const { t } = useI18n();
  const cfg = useAppConfig();
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [search, setSearch] = useState(false);
  const [more, setMore] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const navRef = useRef<HTMLElement>(null);
  useSlidingIndicator(navRef, 'a.active', loc.pathname);

  useEffect(() => { setMore(false); setSearch(false); }, [loc.pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  // "/" or Ctrl/⌘ + K opens search from anywhere (but not while typing in a field).
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setSearch(true); }
      else if (e.key === '/' && !typing) { e.preventDefault(); setSearch(true); }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  const closeSearch = useCallback(() => setSearch(false), []);
  const closeMore = useCallback(() => setMore(false), []);

  const links = [
    { to: '/explore', label: t('nav.explore') },
    { to: '/launchpad', label: t('nav.launchpad') },
    { to: '/activity', label: t('nav.activity') },
    { to: '/create', label: t('nav.create') },
    { to: `/${OFFICIAL.slug}`, label: OFFICIAL.name },
  ];

  return (
    <>
      {cfg.loaded && !cfg.ready && <div className="test-banner">{t('banner.notReady')}</div>}
      {cfg.loaded && cfg.chainId !== activeChain.id && (
        <div className="test-banner">
          {t('banner.networkChanged', { name: cfg.network?.name || `chain ${cfg.chainId}` })}{' '}
          <button className="link" style={{ background: 'none', border: 0, color: 'inherit', fontWeight: 700 }} onClick={() => window.location.reload()}>{t('common.reload')}</button>
        </div>
      )}
      <header className={`topbar${scrolled ? ' is-scrolled' : ''}`}>
        <div className="topbar__bar">
          <Link to="/" className="brand" aria-label={BRAND.name}>
            <Logo size={34} />
            <span className="brand__name">{BRAND.name}</span>
          </Link>
          <nav className="topnav" ref={navRef} aria-label={t('nav.menu')}>
            <span className="topnav__ind" aria-hidden="true" />
            {links.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
          </nav>
          <div className="topbar__right">
            <button type="button" className="search-trigger" onClick={() => setSearch(true)} aria-label={t('nav.search')}>
              <IconSearch size={17} />
              <span className="search-trigger__text">{t('nav.search')}</span>
              <kbd>/</kbd>
            </button>
            <NetworkChip />
            <span className="hide-sm"><ThemeToggle /></span>
            <WalletButton />
          </div>
        </div>
      </header>
      {isConnected && chainId !== activeChain.id && (
        <div className="network-bar">
          <div className="container">
            <span>{t('wallet.wrongNetwork', { chain: activeChain.name })}</span>
            <span className="spacer" />
            <button className="btn btn--sm" onClick={() => switchChain({ chainId: activeChain.id })}>{t('wallet.switch')}</button>
          </div>
        </div>
      )}
      <MobileTabBar onMore={() => setMore((m) => !m)} moreOpen={more} />
      {more && <MoreSheet onClose={closeMore} />}
      {search && <CommandSearch onClose={closeSearch} />}
    </>
  );
}
