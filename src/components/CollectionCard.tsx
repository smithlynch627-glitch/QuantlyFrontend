import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { fromWei, num } from '../lib/format';
import type { Collection } from '../lib/types';
import { CollectionAvatar, CollectionBanner } from './Art';
import { Badge } from './ui';
import { NATIVE } from '../config';

/**
 * A collection as a "ticket": artwork on the left, name and numbers on the right.
 * `poster` turns it into a tall card with the banner behind the text (used for the top ranks); `rank` shows its place.
 */
export function CollectionCard({ c, poster = false, rank }: { c: Collection; poster?: boolean; rank?: number }) {
  const { t, lang } = useI18n();
  const facts = (
    <dl className="cc__facts">
      <div><dt>{t('common.floor')}</dt><dd className="mono-num">{c.floor_wei ? `${fromWei(c.floor_wei)} ${NATIVE}` : '—'}</dd></div>
      <div><dt>{t('common.volume24h')}</dt><dd className="mono-num">{fromWei(c.volume_24h_wei)} {NATIVE}</dd></div>
      <div><dt>{t('common.items')}</dt><dd className="mono-num">{num(c.total_supply, lang)}</dd></div>
    </dl>
  );
  if (poster) {
    return (
      <Link to={`/collection/${c.slug}`} className="cc cc--poster">
        <span className="cc__cover"><CollectionBanner collection={c} /></span>
        {rank !== undefined && <span className="cc__rank mono-num">{rank}</span>}
        <span className="cc__panel">
          <span className="cc__avatar"><CollectionAvatar collection={c} /></span>
          <span className="cc__name">{c.name}<Badge official={c.is_official} verified={c.verified} /></span>
          {facts}
        </span>
      </Link>
    );
  }
  return (
    <Link to={`/collection/${c.slug}`} className="cc">
      {rank !== undefined && <span className="cc__rank mono-num">{rank}</span>}
      <span className="cc__avatar"><CollectionAvatar collection={c} /></span>
      <span className="cc__body">
        <span className="cc__name">{c.name}<Badge official={c.is_official} verified={c.verified} /></span>
        {facts}
      </span>
    </Link>
  );
}
