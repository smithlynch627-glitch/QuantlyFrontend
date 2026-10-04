import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useI18n } from '../i18n';
import { fromWei, tokenLabel } from '../lib/format';
import { useMoney } from '../lib/currency';
import type { Token } from '../lib/types';
import { TokenArt } from './Art';
import { IconCheck } from './Icons';
import { RarityRank } from './Rarity';
import { useTrade } from './trade';
import { NATIVE } from '../config';

type ColLike = { address: string; slug: string; art_style: 'official' | 'tile' | string; name?: string; tradable?: boolean; total_supply?: number };

export function NftCard({
  token, collection, sweeping = false, manage = false, selected = false, onToggle, onQuickSelect, showCollection = false,
}: {
  token: Token; collection: ColLike; sweeping?: boolean; manage?: boolean; selected?: boolean; onToggle?: () => void; onQuickSelect?: () => void; showCollection?: boolean;
}) {
  const { t } = useI18n();
  const { money } = useMoney();
  const nav = useNavigate();
  const trade = useTrade();
  const { address } = useAccount();
  const mine = !!address && token.owner?.toLowerCase() === address.toLowerCase();
  const listed = !!token.listing_hash;
  // sweeping: pick listings to buy · manage: pick your own items to list, delist or send
  const selecting = sweeping || manage;
  // Manage mode only picks your own items; sweep mode only picks other people's listings.
  const selectable = (manage && mine) || (sweeping && listed && !mine);
  const href = `/item/${collection.slug}/${token.token_id}`;

  function onClick() {
    if (selecting) {
      if (selectable) onToggle?.();
      return;
    }
    nav(href);
  }

  return (
    <article
      className={`tk ${selected ? 'is-selected' : ''} ${selecting && !selectable ? 'is-disabled' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())}
      tabIndex={0}
      role={selecting ? 'checkbox' : 'link'}
      aria-checked={selecting ? selected : undefined}
      aria-label={tokenLabel(token.name, token.token_id)}
    >
      <div className="tk__art">
        <TokenArt collection={collection} token={token} />
        {token.rarity_rank && collection.total_supply ? <RarityRank rank={token.rarity_rank} of={collection.total_supply} variant="media" className="tk__rank" /> : null}
        {selecting && selectable && <span className="tk__check">{selected && <IconCheck size={14} />}</span>}
        {!selecting && onQuickSelect && listed && !mine && collection.tradable !== false && (
          <button type="button" className="tk__pick" aria-label={t('col.select')} title={t('col.select')} onClick={(e) => { e.stopPropagation(); onQuickSelect(); }}>
            <IconCheck size={14} />
          </button>
        )}
        {/* The price sits on the artwork; the action slides in next to it on hover or focus. */}
        <div className="tk__bar">
          <span className={`tk__price mono-num ${listed ? '' : 'is-none'}`} title={listed ? `${fromWei(token.listing_price_wei)} ${NATIVE}` : undefined}>
            {listed ? money(token.listing_price_wei) : t('common.notListed')}
          </span>
          {!selecting && collection.tradable !== false && (listed && !mine ? (
            <button className="tk__act" onClick={(e) => { e.stopPropagation(); trade.buy(collection.address, [token]); }}>{t('col.buyNow')}</button>
          ) : mine ? (
            <button className="tk__act" onClick={(e) => { e.stopPropagation(); trade.list(collection.address, token); }}>{listed ? t('item.editPrice') : t('item.list')}</button>
          ) : null)}
        </div>
      </div>
      <div className="tk__info">
        <div className="tk__line">
          <span className="tk__name" title={token.name || `#${token.token_id}`}>{tokenLabel(token.name, token.token_id)}</span>
          {mine && <span className="tk__you">{t('common.you')}</span>}
        </div>
        <div className="tk__line tk__line--sub">
          {showCollection && <span className="tk__col">{collection.name}</span>}
          <span className="tk__last" title={token.last_sale_wei ? `${fromWei(token.last_sale_wei)} ${NATIVE}` : undefined}>
            {t('card.lastSale')} <b className="mono-num">{token.last_sale_wei ? money(token.last_sale_wei) : '—'}</b>
          </span>
        </div>
      </div>
    </article>
  );
}
