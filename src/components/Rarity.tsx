// Rarity rank and trait rarity, coloured on one smooth scale sized to the collection (see lib/rarity.ts).
import { useI18n } from '../i18n';
import { rarityPosition, rarityTone, scaleGradient, toneVars, topText, traitTone } from '../lib/rarity';

export function GemIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="rk-gem">
      <path d="M6.5 3h11L22 9l-10 12L2 9z" fill="currentColor" opacity="0.28" />
      <path d="M6.5 3h11L22 9l-10 12L2 9zM2 9h20M9 3l3 18M15 3l-3 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Rank as a coloured number. Variants:
 *  media – glass pill on top of artwork · chip – tinted pill · plain – just the coloured number ·
 *  tag – compact "#12" pill (NFT cards).
 */
export function RarityRank({ rank, of, variant = 'chip', className = '' }: { rank: number; of: number; variant?: 'media' | 'chip' | 'plain' | 'tag'; className?: string }) {
  const { t, lang } = useI18n();
  const tone = rarityTone(rank, Math.max(of, rank));
  const tip = t('rarity.tip', { rank: rank.toLocaleString(lang), total: Math.max(of, rank).toLocaleString(lang), pct: topText(tone.topPct) });
  return (
    <span className={`rk rk--${variant} ${className}`} style={toneVars(tone)} title={tip} aria-label={tip}>
      {variant !== 'plain' && variant !== 'tag' && <GemIcon size={variant === 'media' ? 12 : 13} />}
      <span className="rk__n mono-num">{variant === 'tag' ? '#' : ''}{rank.toLocaleString(lang)}</span>
    </span>
  );
}

/** Item page: the rank, "of N", "Top x%" and where it sits on the colour scale. */
export function RarityPanel({ rank, of }: { rank: number | null; of: number }) {
  const { t, lang } = useI18n();
  if (!rank) {
    return (
      <section className="ix-card rar">
        <h2 className="ix-card__title">{t('rarity.title')}</h2>
        <p className="small muted">{t('rarity.none')}</p>
      </section>
    );
  }
  const total = Math.max(of, rank);
  const tone = rarityTone(rank, total);
  const p = rarityPosition(rank, total);
  return (
    <section className="ix-card rar" style={toneVars(tone)}>
      <h2 className="ix-card__title">{t('rarity.title')}<span className="rar__how small muted" title={t('rarity.how')}>{t('rarity.method')}</span></h2>
      <div className="rar__row">
        <span className="rk rk--plain rar__rank"><GemIcon size={22} /><span className="rk__n mono-num">{rank.toLocaleString(lang)}</span></span>
        <span className="rar__of small soft">{t('rarity.of', { total: total.toLocaleString(lang) })}</span>
        <span className="rk rk--plain rar__top mono-num">{t('rarity.top', { pct: topText(tone.topPct) })}</span>
      </div>
      <div className="rarity-scale" aria-hidden="true">
        <span className="rarity-scale__bar rarity-scale__bar--dark" style={{ background: scaleGradient('dark') }} />
        <span className="rarity-scale__bar rarity-scale__bar--light" style={{ background: scaleGradient('light') }} />
        <span className="rarity-scale__mark" style={{ left: `${p * 100}%` }} />
      </div>
      <div className="rarity-scale__legend tiny muted"><span>{t('rarity.rarest')}</span><span>{t('rarity.common')}</span></div>
      <p className="small soft" style={{ margin: 0 }}>
        {rank === 1 ? t('rarity.isRarest') : rank >= total ? t('rarity.isCommonest') : t('rarity.rarerThan', { pct: topText(((total - rank) / total) * 100) })}
      </p>
    </section>
  );
}

/** "12 · 0.4%" with the share coloured by how rare the trait is. */
export function TraitShare({ count, total }: { count: number; total: number }) {
  const { lang } = useI18n();
  const tone = traitTone(count, total);
  const share = total ? (count / total) * 100 : 0;
  return (
    <span className="trait-share" style={toneVars(tone)}>
      <span className="rk rk--plain mono-num strong">{topText(share)}</span>
      <span className="muted mono-num">{count.toLocaleString(lang)}</span>
    </span>
  );
}
