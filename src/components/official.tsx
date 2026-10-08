import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { OFFICIAL } from '../config';
import { useAppConfig } from '../lib/appConfig';
import { TileArt, fixImageUrl } from './Art';
import { IconArrowLeft, IconArrowRight, IconClose } from './Icons';
import { reducedMotion, useExitAnimation } from '../lib/motion';

// The artwork list can be changed in the admin panel, so its length is read each time. Until the admin adds
// artwork, twelve generated lattices stand in for it.
const count = () => OFFICIAL.images.length || 12;
export const artIndex = (i: number) => ((i % count()) + count()) % count();

/** A resized copy from Cloudinary (the site's art CDN); any other host is returned unchanged. */
export function artSrc(src: string, w: number) {
  return /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\//.test(src)
    ? src.replace('/image/upload/', `/image/upload/c_limit,w_${w},q_auto,f_auto/`)
    : src;
}


/** Official-collection artwork, resized for its slot. Falls back to the original file, then to generated art. */
export function OfficialArt({ index, w = 480, eager = false, alt }: { index: number; w?: number; eager?: boolean; alt?: string }) {
  const { ipfsGateway } = useAppConfig();
  const link = OFFICIAL.images[artIndex(index)];
  const src = link ? fixImageUrl(link, ipfsGateway) : link;
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => { setStage(0); setLoaded(false); }, [src, w]);
  useEffect(() => { if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true); }, [stage, src]);
  if (!src || stage === 2) return <TileArt seed={`official-${artIndex(index)}`} />;
  const url = stage === 0 ? artSrc(src, w) : src;
  return (
    <img
      ref={ref}
      className={`oa-art${loaded ? ' is-loaded' : ''}`}
      src={url}
      alt={alt ?? `${OFFICIAL.name} artwork ${artIndex(index) + 1}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => setStage((s) => (s === 0 && url !== src ? 1 : 2))}
    />
  );
}

function preload(index: number, w: number, gateway?: string | null) {
  const link = OFFICIAL.images[artIndex(index)];
  if (!link) return;
  const img = new Image();
  img.src = artSrc(fixImageUrl(link, gateway), w);
}

/** A counter that ticks every `ms` while the tab is visible and not paused. */
export function useTicker(ms: number, paused = false) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => { if (!document.hidden) setI((x) => x + 1); }, ms);
    return () => window.clearInterval(id);
  }, [ms, paused]);
  return [i, setI] as const;
}

/** True once the element has scrolled into view (or right away where IntersectionObserver is missing). */
export function useInView<T extends Element>(once = true, rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); if (once) io.disconnect(); } else if (!once) setInView(false);
    }, { rootMargin, threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, [once, rootMargin]);
  return [ref, inView] as const;
}

/** Fades and lifts its children in when they scroll into view. */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'article' }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return <Tag ref={ref as any} className={`reveal${inView ? ' is-in' : ''} ${className}`} style={{ '--d': `${delay}ms` } as CSSProperties}>{children}</Tag>;
}

/** Artwork that crossfades to the next piece every few seconds (pauses on hover). */
export function ArtRotator({ start = 0, interval = 3400, w = 720, label }: { start?: number; interval?: number; w?: number; label?: ReactNode }) {
  const [paused, setPaused] = useState(false);
  const { ipfsGateway } = useAppConfig();
  const [i] = useTicker(interval, paused);
  const cur = start + i;
  useEffect(() => { preload(cur + 1, w, ipfsGateway); }, [cur, w, ipfsGateway]);
  const layers = i === 0 ? [cur] : [cur - 1, cur];
  return (
    <div className="oa-rotator" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {layers.map((k) => (
        <div key={k} className={`oa-rotator__layer${k === cur && i > 0 ? ' is-new' : ''}`}><OfficialArt index={k} w={w} eager /></div>
      ))}
      {label}
      <div className="oa-rotator__bar" aria-hidden="true">
        <span key={cur} className={paused ? 'is-paused' : ''} style={{ animationDuration: `${interval}ms` }} />
      </div>
    </div>
  );
}

/** A fanned deck of artwork: the front card flies off and the next one slides forward. */
export function ArtDeck({ interval = 2800, labels }: { interval?: number; labels: { prev: string; next: string } }) {
  const [paused, setPaused] = useState(false);
  const { ipfsGateway } = useAppConfig();
  const [i, setI] = useTicker(interval, paused);
  useEffect(() => { preload(i + 3, 720, ipfsGateway); }, [i, ipfsGateway]);
  return (
    <div className="oa-deck" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="oa-deck__stack">
        {[-1, 0, 1, 2, 3].map((o) => {
          const k = i + o;
          return (
            <div key={k} className="oa-deck__card" data-pos={o} aria-hidden={o !== 0}>
              <OfficialArt index={k} w={720} eager={o <= 1} />
              <span className="oa-deck__tag">{OFFICIAL.name}</span>
            </div>
          );
        })}
      </div>
      <div className="oa-deck__controls">
        <button type="button" className="oa-deck__btn" onClick={() => setI(i - 1)} aria-label={labels.prev}><IconArrowLeft size={18} /></button>
        <span className="oa-deck__count mono-num">{String(artIndex(i) + 1).padStart(2, '0')}<span> / {String(count()).padStart(2, '0')}</span></span>
        <button type="button" className="oa-deck__btn" onClick={() => setI(i + 1)} aria-label={labels.next}><IconArrowRight size={18} /></button>
      </div>
    </div>
  );
}

/** A heading whose letters rise into place each time the page opens, then a shine sweeps across. */
export function AnimatedTitle({ text, className = '' }: { text: string; className?: string }) {
  let n = 0;
  const words = text.split(' ');
  const render = (animated: boolean) =>
    words.map((w, wi) => (
      <span key={wi}>
        {wi > 0 && ' '}
        <span className="anim-title__word">
          {[...w].map((ch, ci) => (
            <span key={ci} className="anim-title__ch" style={animated ? ({ '--i': n++ } as CSSProperties) : undefined}>{ch}</span>
          ))}
        </span>
      </span>
    ));
  return (
    <h1 className={`anim-title ${className}`} aria-label={text}>
      <span className="anim-title__base" aria-hidden="true">{render(true)}</span>
      <span className="anim-title__shine" aria-hidden="true">{render(false)}</span>
    </h1>
  );
}

/** Counts up to `to` once visible. */
export function CountUp({ to, active, ms = 1400, format = (v: number) => v.toLocaleString('en-US') }: { to: number; active: boolean; ms?: number; format?: (v: number) => string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (reducedMotion()) { setV(to); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, to, ms]);
  return <>{format(active ? v : 0)}</>;
}

/** One endless row of artwork. `reverse` runs it left to right. Hover pauses it. */
export function ArtMarquee({ order, reverse = false, seconds = 60, onOpen }: { order: number[]; reverse?: boolean; seconds?: number; onOpen: (i: number) => void }) {
  const items = [...order, ...order];
  return (
    <div className={`marquee${reverse ? ' marquee--rev' : ''}`} style={{ '--dur': `${seconds}s` } as CSSProperties}>
      <div className="marquee__track">
        {items.map((idx, k) => {
          const copy = k >= order.length;
          return (
            <button key={k} type="button" className="marquee__tile" onClick={() => onOpen(idx)} tabIndex={copy ? -1 : 0} aria-hidden={copy || undefined}
              aria-label={`${OFFICIAL.name} artwork ${artIndex(idx) + 1}`}>
              <OfficialArt index={idx} w={360} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Full-screen artwork viewer with previous / next and keyboard support. */
export function ArtLightbox({ index, onClose, onMove, labels }: { index: number; onClose: () => void; onMove: (i: number) => void; labels: { prev: string; next: string; close: string } }) {
  const root = useRef<HTMLDivElement>(null);
  useExitAnimation(root, true, 200);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onMove(index + 1);
      if (e.key === 'ArrowLeft') onMove(index - 1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [index, onClose, onMove]);
  return (
    <div ref={root} className="oa-lightbox" role="dialog" aria-modal="true" aria-label={`${OFFICIAL.name} artwork ${artIndex(index) + 1}`} onClick={onClose}>
      <button type="button" className="oa-lightbox__close" onClick={onClose} aria-label={labels.close}><IconClose size={20} /></button>
      <button type="button" className="oa-lightbox__nav oa-lightbox__nav--prev" onClick={(e) => { e.stopPropagation(); onMove(index - 1); }} aria-label={labels.prev}><IconArrowLeft size={22} /></button>
      <figure key={index} className="oa-lightbox__art" onClick={(e) => e.stopPropagation()}>
        <OfficialArt index={index} w={1200} eager />
        <figcaption className="mono-num">{OFFICIAL.name} · {String(artIndex(index) + 1).padStart(2, '0')} / {count()}</figcaption>
      </figure>
      <button type="button" className="oa-lightbox__nav oa-lightbox__nav--next" onClick={(e) => { e.stopPropagation(); onMove(index + 1); }} aria-label={labels.next}><IconArrowRight size={22} /></button>
    </div>
  );
}

/**
 * "Meet the crew": one artwork large, the rest as a grid of picks beside it. The large card tilts toward the pointer
 * with a soft shine, and moves on to the next piece every few seconds while it is on screen (it stops when the
 * visitor hovers or focuses it, and never moves on its own for visitors who ask for reduced motion).
 */
export function ArtSpotlight({ onOpen, labels, interval = 3600 }: {
  onOpen: (i: number) => void; interval?: number;
  labels: { open: (n: number) => string; pick: (n: number) => string; prevPage: string; nextPage: string; page: (a: number, b: number) => string };
}) {
  const n = count();
  const per = 12;
  const [cur, setCur] = useState(0);
  const [hold, setHold] = useState(false);
  const [ref, inView] = useInView<HTMLDivElement>(false, '0px');
  const { ipfsGateway } = useAppConfig();
  const still = reducedMotion();
  useEffect(() => {
    if (hold || !inView || still) return;
    const id = window.setInterval(() => { if (!document.hidden) setCur((c) => (c + 1) % n); }, interval);
    return () => window.clearInterval(id);
  }, [hold, inView, still, n, interval]);
  useEffect(() => { preload(cur + 1, 900, ipfsGateway); }, [cur, ipfsGateway]);
  const pages = Math.ceil(n / per);
  const page = Math.floor(cur / per);
  const goPage = (p: number) => setCur((((p % pages) + pages) % pages) * per);
  const picks = Array.from({ length: Math.min(per, n - page * per) }, (_, k) => page * per + k);

  // Tilt: the card leans toward the pointer (at most 7 degrees) and a highlight follows it.
  const card = useRef<HTMLButtonElement>(null);
  const tilt = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    const el = card.current;
    if (!el || still || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((0.5 - y) * 14).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
  }, [still]);
  const untilt = useCallback(() => {
    const el = card.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }, []);

  return (
    <div className="spot-x" ref={ref} onMouseEnter={() => setHold(true)} onMouseLeave={() => { setHold(false); untilt(); }}
      onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      <div className="spot-x__stage">
        <button type="button" ref={card} className="spot-x__card" onPointerMove={tilt} onPointerLeave={untilt} onClick={() => onOpen(cur)} aria-label={labels.open(cur + 1)}>
          <span key={cur} className="spot-x__art"><OfficialArt index={cur} w={900} eager /></span>
          <span className="spot-x__shine" aria-hidden="true" />
          <span className="spot-x__count mono-num">{String(cur + 1).padStart(2, '0')}<span> / {String(n).padStart(2, '0')}</span></span>
        </button>
        <div className="spot-x__timer" aria-hidden="true">
          <span key={`${cur}-${hold}`} className={hold || still || !inView ? 'is-held' : ''} style={{ animationDuration: `${interval}ms` }} />
        </div>
      </div>
      <div className="spot-x__side">
        <div className="spot-x__picks">
          {picks.map((k, j) => (
            <button key={k} type="button" className={`spot-x__pick${k === cur ? ' is-on' : ''}`} style={{ '--j': j } as CSSProperties}
              onClick={() => setCur(k)} aria-pressed={k === cur} aria-label={labels.pick(k + 1)}>
              <OfficialArt index={k} w={240} alt="" />
            </button>
          ))}
        </div>
        {pages > 1 && (
          <div className="spot-x__pager">
            <button type="button" className="icon-btn" onClick={() => goPage(page - 1)} aria-label={labels.prevPage}><IconArrowLeft size={16} /></button>
            <span className="small soft mono-num">{labels.page(page + 1, pages)}</span>
            <button type="button" className="icon-btn" onClick={() => goPage(page + 1)} aria-label={labels.nextPage}><IconArrowRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
