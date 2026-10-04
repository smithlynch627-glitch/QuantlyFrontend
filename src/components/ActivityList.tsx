import { Link } from 'react-router-dom';
import { useAppConfig } from '../lib/appConfig';
import { useI18n } from '../i18n';
import type { DictKey } from '../i18n/en';
import { fromWei, short, timeAgo, tokenLabel } from '../lib/format';
import type { Activity } from '../lib/types';
import { TokenArt, CollectionAvatar } from './Art';
import { IconArrowRight, IconBag, IconExternal, IconHand, IconSpark, IconSwap, IconTag, IconClose } from './Icons';
import { NATIVE, WRAPPED } from '../config';

const ICONS: Record<string, JSX.Element> = {
  sale: <IconBag size={15} />, list: <IconTag size={15} />, delist: <IconClose size={15} />, mint: <IconSpark size={15} />,
  transfer: <IconSwap size={15} />, offer: <IconHand size={15} />, collection_offer: <IconHand size={15} />, offer_cancel: <IconClose size={15} />,
};

function Who({ a }: { a: string | null }) {
  const { t } = useI18n();
  if (!a) return <span className="muted">—</span>;
  if (/^0x0{40}$/.test(a)) return <span className="muted">{t('act.type.mint')}</span>;
  return <Link className="feed__who" to={`/profile/${a}`}>{short(a)}</Link>;
}

/** Activity as a feed: what happened, to which item, between whom, for how much and when. */
export function ActivityList({ items }: { items: Activity[] }) {
  const { t, lang } = useI18n();
  const cfg = useAppConfig();
  return (
    <ol className="feed">
      {items.map((a) => {
        const col = { address: a.collection, art_style: a.art_style, image_url: a.collection_image, name: a.collection_name };
        const href = a.token_id ? `/item/${a.collection_slug}/${a.token_id}` : `/collection/${a.collection_slug}`;
        return (
          <li key={a.id} className={`feed__row feed__row--${a.type}`}>
            <span className="feed__icon" title={t(`act.type.${a.type}` as DictKey)}>{ICONS[a.type]}</span>
            <Link to={href} className="feed__thumb" aria-hidden="true" tabIndex={-1}>
              {a.token_id ? <TokenArt collection={col} token={{ token_id: a.token_id, image_url: a.token_image, attributes: a.token_attributes }} /> : <CollectionAvatar collection={col} />}
            </Link>
            <div className="feed__main">
              <Link to={href} className="feed__title">{a.token_id ? tokenLabel(a.token_name, a.token_id) : a.collection_name}</Link>
              <div className="feed__sub">
                <span className="feed__type">{t(`act.type.${a.type}` as DictKey)}</span>
                <span className="feed__parties"><Who a={a.from_addr} />{a.to_addr && <><IconArrowRight size={12} /><Who a={a.to_addr} /></>}</span>
              </div>
            </div>
            <div className="feed__price mono-num">{a.price_wei ? `${fromWei(a.price_wei)} ${a.type.includes('offer') ? WRAPPED : NATIVE}` : ''}</div>
            {a.tx_hash ? (
              <a className="feed__time" href={`${cfg.explorerUrl}/tx/${a.tx_hash}`} target="_blank" rel="noreferrer">{timeAgo(a.created_at, lang)}<IconExternal size={12} /></a>
            ) : (
              <span className="feed__time">{timeAgo(a.created_at, lang)}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
