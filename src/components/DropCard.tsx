import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { fromWei, num } from '../lib/format';
import type { DropListItem } from '../lib/types';
import { CollectionAvatar, CollectionBanner } from './Art';
import { Badge, CountdownLabel, Progress } from './ui';
import { NATIVE } from '../config';

export function DropStatusPill({ d }: { d: Pick<DropListItem, 'status' | 'livePhase' | 'nextPhase'> }) {
  const { t } = useI18n();
  if (d.status === 'live') return <span className="pill pill--live">{t('lp.live')}</span>;
  if (d.status === 'upcoming') return <span className="pill">{t('lp.upcoming')}</span>;
  if (d.status === 'sold_out') return <span className="pill">{t('lp.soldOut')}</span>;
  return <span className="pill">{t('lp.ended')}</span>;
}

export function phasePrice(wei: string | undefined, free: string) {
  if (!wei) return '—';
  return BigInt(wei) === 0n ? free : `${fromWei(wei)} ${NATIVE}`;
}

export function DropCard({ d }: { d: DropListItem }) {
  const { t, lang } = useI18n();
  const c = d.collection;
  const phase = d.livePhase ?? d.nextPhase ?? d.phases[d.phases.length - 1];
  const pct = c.max_supply ? Math.floor((c.total_supply / c.max_supply) * 100) : 0;
  return (
    <Link to={`/launchpad/${c.slug}`} className={`dc is-${d.status}`}>
      <span className="dc__art">{c.image_url || c.art_style !== 'tile' ? <CollectionAvatar collection={c} /> : <CollectionBanner collection={c} />}</span>
      <span className="dc__top">
        <DropStatusPill d={d} />
        <span className="dc__when">
          {d.status === 'live' && d.livePhase?.end && <CountdownLabel k="lp.endsIn" to={d.livePhase.end} />}
          {d.status === 'upcoming' && d.nextPhase && <CountdownLabel k="lp.startsIn" to={d.nextPhase.start} />}
        </span>
      </span>
      <span className="dc__panel">
        <span className="dc__name">{c.name}<Badge official={c.is_official} verified={c.verified} size={15} /></span>
        <span className="dc__row">
          <span className="dc__phase">{phase?.name}</span>
          <span className="dc__price mono-num">{phasePrice(phase?.priceWei, t('lp.free'))}</span>
        </span>
        <Progress value={c.total_supply} max={c.max_supply || 1} />
        <span className="dc__row dc__row--meta">
          <span>{t('lp.minted', { n: num(c.total_supply, lang), max: num(c.max_supply, lang) })}</span>
          <span className="mono-num">{pct}%</span>
        </span>
      </span>
    </Link>
  );
}
