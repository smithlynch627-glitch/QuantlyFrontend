// About: the collection's story (written by the creator in the Studio, or by an admin), key facts, custom details and links.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { dateTime, explorerCollectionUrl, num, safeHref, short } from '../../lib/format';
import { useAppConfig } from '../../lib/appConfig';
import type { Collection } from '../../lib/types';
import { CollectionBanner, SmartImage, TileArt } from '../Art';
import { CollectionViewer, useExtraImages } from '../ImageViewer';
import { IconExternal } from '../Icons';
import { SocialIcon } from '../Social';
import { CopyButton } from '../ui';
import { activeChain } from '../../config';

export function AboutTab({ c }: { c: Collection }) {
  const { t, lang } = useI18n();
  const cfg = useAppConfig();
  const story = (c.about || c.description || '').trim();
  const extra = useExtraImages(c);
  // Detail rows are shown as plain text; anything that is not a pair of short texts is left out.
  const items = (Array.isArray(c.about_items) ? c.about_items : []).filter((x) => x && typeof x.label === 'string' && typeof x.value === 'string').slice(0, 12);
  const [shown, setShown] = useState<number | null>(null);
  const facts: [string, React.ReactNode][] = [
    [t('about.contract'), (
      <span className="row" style={{ gap: 4 }}>
        <a className="link mono-num" href={explorerCollectionUrl(cfg.explorerUrl, c)} target="_blank" rel="noreferrer">{short(c.address)}</a>
        <CopyButton value={c.address} />
      </span>
    )],
    [t('about.chain'), cfg.network?.name || activeChain.name],
    [t('about.standard'), 'ERC-721'],
    [t('about.supply'), c.max_supply ? num(c.max_supply, lang) : num(c.total_supply, lang)],
    [t('about.minted'), num(c.total_supply, lang)],
    [t('about.owners'), num(c.owners_count, lang)],
    [t('about.royalty'), `${c.royalty_bps / 100}%`],
    [t('about.creator'), c.creator ? <Link className="link mono-num" to={`/profile/${c.creator}`}>{short(c.creator)}</Link> : '—'],
    [t('about.created'), dateTime(c.created_at, lang)],
  ];
  if (c.revealed !== null && c.revealed !== undefined) facts.push([t('about.metadata'), c.metadata_frozen ? t('about.frozen') : c.revealed ? t('about.revealed') : t('about.unrevealed')]);
  const links = [
    safeHref(c.twitter) && { kind: 'x' as const, href: safeHref(c.twitter)!, label: 'X' },
    safeHref(c.discord) && { kind: 'discord' as const, href: safeHref(c.discord)!, label: 'Discord' },
    safeHref(c.telegram) && { kind: 'telegram' as const, href: safeHref(c.telegram)!, label: 'Telegram' },
    safeHref(c.website) && { kind: 'website' as const, href: safeHref(c.website)!, label: t('col.website') },
  ].filter(Boolean) as { kind: 'x' | 'discord' | 'telegram' | 'website'; href: string; label: string }[];

  return (
    <div className="ab">
      {/* The story beside its picture, then every on-chain fact as a tile. */}
      <div className="ab__top">
        <article className="ab__story">
          <h2 className="ab__title">{t('about.title', { name: c.name })}</h2>
          {story ? story.split(/\n{2,}/).map((para, i) => <p key={i} className="soft">{para}</p>) : <p className="muted">{t('about.empty')}</p>}
          {items.length > 0 && (
            <dl className="ab__items">
              {items.map((it, i) => (
                <div key={i}><dt>{it.label}</dt><dd>{it.value}</dd></div>
              ))}
            </dl>
          )}
          {extra.length > 0 && (
            <div className="ab__gallery" role="group" aria-label={t('about.gallery')}>
              {extra.map((src, i) => (
                <button key={src} type="button" className="ab__shot" onClick={() => setShown(i + 1)} aria-label={t('drop.galleryOpen', { name: t('drop.galleryN', { n: i + 2 }) })}>
                  <SmartImage src={src} alt="" fallback={<TileArt seed={`${c.address}:g${i}`} />} />
                </button>
              ))}
            </div>
          )}
          {links.length > 0 && (
            <div className="ab__links">
              {links.map((l) => (
                <a key={l.kind} className="btn btn--outline btn--sm" href={l.href} target="_blank" rel="noreferrer noopener">
                  <SocialLinkIcon kind={l.kind} />{l.label}<IconExternal size={13} />
                </a>
              ))}
            </div>
          )}
        </article>
        <div className="ab__art">
          {c.about_image_url ? (
            <SmartImage src={c.about_image_url} alt={c.name} fallback={<TileArt seed={c.address} wide />} />
          ) : (
            <CollectionBanner collection={c} />
          )}
        </div>
      </div>
      <CollectionViewer c={c} extra={extra} index={shown} onIndex={setShown} />
      <h3 className="ab__sub">{t('about.details')}</h3>
      <dl className="ix-kv">
        {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
    </div>
  );
}

function SocialLinkIcon({ kind }: { kind: 'x' | 'discord' | 'telegram' | 'website' }) {
  return <span className="ab__icon"><SocialIcon kind={kind} size={14} /></span>;
}
