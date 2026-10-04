import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { OFFICIAL } from '../config';
import { useAppConfig } from '../lib/appConfig';
import { hashSeed, mulberry32 } from '../lib/art';
import type { Attribute } from '../lib/types';

/** Official-collection artwork by index (wraps around the published pieces); generated art while there is none. */
export function OfficialImage({ index, alt }: { index: number; alt?: string }) {
  const n = OFFICIAL.images.length;
  const src = n ? OFFICIAL.images[((index % n) + n) % n] : '';
  if (!src) return <TileArt seed={`official-${index}`} />;
  return <SmartImage src={src} alt={alt || `${OFFICIAL.name} artwork`} fallback={<TileArt seed={`official-${index}`} />} />;
}

// Colours come from the theme (see --art-* in styles.css), so generated art follows light and dark.
const ACCENTS = ['var(--art-a1)', 'var(--art-a2)', 'var(--art-a3)'];

/**
 * Placeholder art for collections without images: a symmetric lattice, a nod to the QUBO matrices that QMS
 * miners solve to produce each block. Every seed (collection address, token id) gives a different lattice.
 */
export function TileArt({ seed, wide = false }: { seed: string; wide?: boolean }) {
  const s = useMemo(() => {
    const rand = mulberry32(hashSeed(seed));
    const n = 4 + Math.floor(rand() * 4);
    const accent = ACCENTS[Math.floor(rand() * ACCENTS.length)];
    const round = rand() > 0.5;
    const w: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const v = rand();
        const weight = v < 0.34 ? 0 : v < 0.62 ? 0.12 : v < 0.86 ? 0.32 : 0.78;
        w[i][j] = weight;
        w[j][i] = weight;
      }
    }
    return { n, accent, round, w };
  }, [seed]);
  const H = 100;
  const W = wide ? 300 : 100;
  const cell = H / s.n;
  const gap = cell * 0.09;
  const cols = Math.ceil(W / cell);
  const cells: ReactNode[] = [];
  for (let r = 0; r < s.n; r++) {
    for (let c = 0; c < cols; c++) {
      const j = c % s.n;
      const weight = s.w[r][j];
      const diagonal = r === j;
      if (!weight && !diagonal) continue;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={c * cell + gap}
          y={r * cell + gap}
          width={cell - gap * 2}
          height={cell - gap * 2}
          rx={s.round ? (cell - gap * 2) / 2 : cell * 0.14}
          style={{ fill: diagonal ? s.accent : 'var(--art-cell)' }}
          opacity={(diagonal ? 0.95 : weight) * (wide ? 0.55 : 1)}
        />,
      );
    }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="art" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
      <rect width={W} height={H} style={{ fill: 'var(--art-bg)' }} />
      {cells}
    </svg>
  );
}

/** Image with skeleton while loading and generated art if it fails. */
/**
 * IPFS images can be slow or missing on any single gateway (new uploads take time to spread, public gateways
 * rate-limit). Each image is tried on: the marketplace's own gateway (if set) → the link as saved → Pinata's
 * public gateway → w3s.link → dweb.link. A "bafkrei…" CID is one raw file, so a file name after it is dropped;
 * for other CIDs the bare CID is tried last (images uploaded one by one with a name added by mistake).
 */
const PUBLIC_GATEWAYS = ['https://gateway.pinata.cloud/ipfs/', 'https://w3s.link/ipfs/', 'https://dweb.link/ipfs/'];
export function imageCandidates(src: string, preferred?: string | null): string[] {
  const m = src.match(/^(?:ipfs:\/\/(?:ipfs\/)?|https?:\/\/[^/]+\/ipfs\/)([a-z0-9]{40,})(\/[^?#]*)?/i);
  if (!m) return [src];
  const [, cid, rawPath] = m;
  const path = rawPath && rawPath !== '/' ? rawPath : '';
  const tail = /^bafkrei/i.test(cid) ? '' : path;
  const own = src.startsWith('http') ? src.slice(0, src.indexOf('/ipfs/') + 6) : null;
  const gateways = [preferred, own, ...PUBLIC_GATEWAYS].filter((g): g is string => !!g);
  const out = gateways.map((g) => `${g}${cid}${tail}`);
  if (tail) out.push(`${gateways[0]}${cid}`, `${PUBLIC_GATEWAYS[0]}${cid}`);
  return [...new Set(out)];
}
export const fixImageUrl = (src: string, preferred?: string | null) => imageCandidates(src, preferred)[0];

/** Video files (by extension or data: type) are shown as silent looping video; everything else as an image. */
export const isVideoUrl = (src: string) => /^data:video\//i.test(src) || /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(src);

/**
 * NFT media in any browser format: PNG, JPG, GIF, WebP, AVIF, SVG, BMP (as <img>) and MP4/WebM/MOV (as <video>).
 * Links without a file extension are tried as an image first and as a video if no gateway can show them as one.
 */
export function SmartImage({ src, alt, fallback }: { src: string; alt: string; fallback: ReactNode }) {
  const { ipfsGateway } = useAppConfig();
  const list = useMemo(() => imageCandidates(src, ipfsGateway), [src, ipfsGateway]);
  const [i, setI] = useState(0);
  const [kind, setKind] = useState<'img' | 'video'>(isVideoUrl(src) ? 'video' : 'img');
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  useEffect(() => { setI(0); setKind(isVideoUrl(src) ? 'video' : 'img'); setState('loading'); }, [src, ipfsGateway]);
  const next = () => {
    if (i + 1 < list.length) return setI(i + 1);
    // No gateway could show it as an image: an extension-less link may be a video.
    if (kind === 'img' && !/^data:image\//i.test(src)) { setKind('video'); setI(0); return; }
    setState('error');
  };
  // Lazy media only starts loading near the screen, so the timeout below starts only once it is visible.
  const ref = useRef<HTMLImageElement & HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === 'undefined') return setVisible(true);
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setVisible(true), { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible, i, kind]);
  // A gateway that neither loads nor fails within 9 s is skipped (some hang instead of returning an error).
  useEffect(() => {
    if (!visible || state !== 'loading') return;
    const id = setTimeout(next, kind === 'video' ? 20_000 : 9_000);
    return () => clearTimeout(id);
  }, [i, kind, state, visible, list.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (state === 'error') return <>{fallback}</>;
  const hidden = state === 'loading' ? { opacity: 0 } : undefined;
  return (
    <>
      {state === 'loading' && <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />}
      {kind === 'video' ? (
        <video
          key={`v:${list[i]}`}
          ref={ref}
          className="art"
          src={list[i]}
          aria-label={alt}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setState('ok')}
          onError={next}
          style={hidden}
        />
      ) : (
        <img
          key={`i:${list[i]}`}
          ref={ref}
          className="art"
          src={list[i]}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setState('ok')}
          onError={next}
          style={hidden}
        />
      )}
    </>
  );
}

type ColLike = { address: string; art_style?: 'official' | 'tile' | string | null; image_url?: string | null; banner_url?: string | null; name?: string };
type TokLike = { token_id: string; image_url?: string | null; attributes?: Attribute[] | null; name?: string | null };

export function TokenArt({ collection, token }: { collection: ColLike; token: TokLike }) {
  const id = Number(token.token_id);
  const generated =
    collection.art_style === 'official' ? (
      <SmartImage src={OFFICIAL.logo} alt={`#${id}`} fallback={<TileArt seed={`${collection.address}:${token.token_id}`} />} />
    ) : (
      <TileArt seed={`${collection.address}:${token.token_id}`} />
    );
  if (token.image_url) return <SmartImage src={token.image_url} alt={token.name || `#${token.token_id}`} fallback={generated} />;
  return generated;
}

export function CollectionAvatar({ collection }: { collection: ColLike }) {
  const generated =
    collection.art_style === 'official' ? <SmartImage src={OFFICIAL.logo} alt={OFFICIAL.name} fallback={<TileArt seed={collection.address} />} /> : <TileArt seed={collection.address} />;
  if (collection.image_url) return <SmartImage src={collection.image_url} alt={collection.name || ''} fallback={generated} />;
  return generated;
}

export function CollectionBanner({ collection }: { collection: ColLike }) {
  const generated =
    collection.art_style === 'official' ? (
      <SmartImage src={OFFICIAL.banner} alt="" fallback={<TileArt seed={`${collection.address}:banner`} wide />} />
    ) : (
      <TileArt seed={`${collection.address}:banner`} wide />
    );
  if (collection.banner_url) return <SmartImage src={collection.banner_url} alt="" fallback={generated} />;
  return generated;
}

/** Wallet avatar: a small symmetric lattice unique to the address. */
export function Avatar({ address, size = 32 }: { address: string; size?: number }) {
  const a = useMemo(() => {
    const rand = mulberry32(hashSeed(address.toLowerCase()));
    const color = ACCENTS[Math.floor(rand() * ACCENTS.length)];
    const on: boolean[][] = Array.from({ length: 5 }, () => Array<boolean>(5).fill(false));
    for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) { on[y][x] = rand() > 0.5; on[y][4 - x] = on[y][x]; }
    return { color, on };
  }, [address]);
  return (
    <span className="avatar" style={{ width: size, height: size, display: 'inline-block' }}>
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
        <rect width="40" height="40" style={{ fill: 'var(--art-bg)' }} />
        {a.on.flatMap((row, y) => row.map((v, x) => (v ? <rect key={`${x}-${y}`} x={7.5 + x * 5} y={7.5 + y * 5} width="5" height="5" style={{ fill: a.color }} /> : null)))}
        <circle cx="20" cy="20" r="19.4" fill="none" style={{ stroke: 'var(--line-strong)' }} />
      </svg>
    </span>
  );
}
