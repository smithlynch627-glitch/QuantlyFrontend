// In-page viewer for a collection's pictures: the logo and the extra images its creator added.
// Pictures always open here and never in a new tab. Their links are typed by creators, so the site shows the
// picture but does not send a visitor to the address behind it.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { isAcceptedImageLink } from '../lib/mediaLink';
import type { Collection } from '../lib/types';
import { CollectionAvatar, SmartImage, TileArt } from './Art';
import { IconArrowLeft, IconArrowRight } from './Icons';
import { Modal } from './ui';

export const MAX_EXTRA_SHOWN = 3;

/**
 * The extra images of a collection: at most three, no repeats, and only real picture links. The API already
 * checks every link when it is saved; the website checks again so that nothing else is ever put in a page,
 * whatever the API answers.
 */
export function useExtraImages(c: Pick<Collection, 'gallery'>): string[] {
  return useMemo(() => {
    const list = Array.isArray(c.gallery) ? c.gallery : [];
    return [...new Set(list.filter((x): x is string => typeof x === 'string' && isAcceptedImageLink(x)))].slice(0, MAX_EXTRA_SHOWN);
  }, [c.gallery]);
}

/** `index` 0 is the logo, 1 to 3 are the extra images; null keeps the viewer closed. */
export function CollectionViewer({ c, extra, index, onIndex }: { c: Collection; extra: string[]; index: number | null; onIndex: (i: number | null) => void }) {
  const { t } = useI18n();
  const count = extra.length + 1;
  const open = index !== null;
  const active = open ? Math.min(Math.max(index, 0), count - 1) : 0;
  const [ratios, setRatios] = useState<Record<number, number>>({});
  // One stable function for the dialog, so moving between pictures never restarts it (which would move the focus).
  const close = useCallback(() => onIndex(null), [onIndex]);
  useEffect(() => { setRatios({}); }, [c.address]);
  // Left and right arrow keys move between pictures while the viewer is open.
  useEffect(() => {
    if (!open || count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onIndex((active + 1) % count);
      if (e.key === 'ArrowLeft') onIndex((active + count - 1) % count);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, active, count, onIndex]);

  const label = (k: number) => (k === 0 ? t('drop.galleryMain') : t('drop.galleryN', { n: k + 1 }));
  // The stage takes the shape of the picture (width / height), so it is shown whole with nothing cropped.
  const sized = (k: number) => (w: number, h: number) => {
    const r = w > 0 && h > 0 ? Math.min(3, Math.max(0.45, w / h)) : 1;
    setRatios((x) => (x[k] === r ? x : { ...x, [k]: r }));
  };
  const picture = (k: number, withSize: boolean) =>
    k === 0
      ? <CollectionAvatar collection={c} onSize={withSize ? sized(0) : undefined} />
      : <SmartImage src={extra[k - 1]} alt={withSize ? `${c.name} · ${label(k)}` : ''} fallback={<TileArt seed={`${c.address}:g${k - 1}`} />} onSize={withSize ? sized(k) : undefined} />;

  return (
    <Modal open={open} onClose={close} width={880} title={<span className="iv__title">{c.name}<span className="iv__count mono-num">{active + 1} / {count}</span></span>}>
      <div className="iv">
        <div className="iv__stage" style={{ ['--ar' as any]: String(ratios[active] ?? 1) }}>
          <div className="iv__pic" key={active}>{picture(active, true)}</div>
        </div>
        {count > 1 && (
          <div className="iv__bar">
            <button type="button" className="icon-btn" onClick={() => onIndex((active + count - 1) % count)} aria-label={t('common.prev')} title={t('common.prev')}><IconArrowLeft size={16} /></button>
            <div className="iv__thumbs" role="tablist" aria-label={t('drop.gallery')}>
              {Array.from({ length: count }, (_, k) => (
                <button key={k} type="button" role="tab" aria-selected={active === k} aria-label={label(k)} title={label(k)}
                  className={`iv__thumb${active === k ? ' is-active' : ''}`} onClick={() => onIndex(k)}>
                  {picture(k, false)}
                </button>
              ))}
            </div>
            <button type="button" className="icon-btn" onClick={() => onIndex((active + 1) % count)} aria-label={t('common.next')} title={t('common.next')}><IconArrowRight size={16} /></button>
          </div>
        )}
      </div>
    </Modal>
  );
}
