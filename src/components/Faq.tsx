import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAppConfig } from '../lib/appConfig';
import { faqGroups, type FaqGroup, type FaqItem } from '../content/faq';
import { IconArrowRight, IconPlus } from './Icons';
import { Tabs } from './ui';

/** Question list where one answer opens at a time, with a smooth height animation. `columns` lays it out in two. */
export function Accordion({ items, idPrefix, openFirst = false, columns = false }: { items: FaqItem[]; idPrefix: string; openFirst?: boolean; columns?: boolean }) {
  const [open, setOpen] = useState<number | null>(openFirst ? 0 : null);
  const row = (it: FaqItem, i: number) => {
    const isOpen = open === i;
    const id = `${idPrefix}-${i}`;
    return (
      <div key={`${idPrefix}-${it.q}`} className={`qa${isOpen ? ' is-open' : ''}`}>
        <h3 className="qa__q">
          <button type="button" id={`${id}-q`} aria-expanded={isOpen} aria-controls={`${id}-a`} onClick={() => setOpen(isOpen ? null : i)}>
            <span className="qa__text">{it.q}</span>
            <span className="qa__icon" aria-hidden="true"><IconPlus size={16} /></span>
          </button>
        </h3>
        <div className="qa__a" id={`${id}-a`} role="region" aria-labelledby={`${id}-q`}>
          <div className="qa__inner">
            <div className="qa__body">{it.a.map((p, k) => <p key={k}>{p}</p>)}</div>
          </div>
        </div>
      </div>
    );
  };
  if (!columns) return <div className="qa-list">{items.map(row)}</div>;
  // Two fixed columns (odd and even questions), so opening an answer never moves a question to the other side.
  return (
    <div className="qa-cols">
      <div className="qa-list">{items.map((it, i) => (i % 2 === 0 ? row(it, i) : null))}</div>
      <div className="qa-list">{items.map((it, i) => (i % 2 === 1 ? row(it, i) : null))}</div>
    </div>
  );
}

/** The marketplace, launchpad and wallet-safety questions with the live fees filled in. */
export function useFaqGroups(): FaqGroup[] {
  const { lang } = useI18n();
  const cfg = useAppConfig();
  return useMemo(() => faqGroups(lang, { market: cfg.marketFeeBps, mint: cfg.mintFeeBps }), [lang, cfg.marketFeeBps, cfg.mintFeeBps]);
}

/** Compact FAQ for the bottom of a page: a centred heading, a pill per group and the questions in two columns. */
export function FaqSection({ only, limit = 6 }: { only?: FaqGroup['id'][]; limit?: number }) {
  const { t } = useI18n();
  const groups = useFaqGroups().filter((g) => !only || only.includes(g.id));
  const [tab, setTab] = useState(groups[0]?.id);
  const g = groups.find((x) => x.id === tab) ?? groups[0];
  if (!g) return null;
  return (
    <section className="section fqs" aria-labelledby="faq-block-title">
      <header className="fqs__head">
        <h2 id="faq-block-title" className="fqs__title">{t('faq.title')}</h2>
        <p className="soft">{t('faq.sub')}</p>
        {groups.length > 1 && (
          <Tabs value={g.id} onChange={setTab} tabs={groups.map((x) => ({ id: x.id, label: x.title }))} />
        )}
      </header>
      <div key={g.id} className="fqs__panel">
        <Accordion items={g.items.slice(0, limit)} idPrefix={`faq-${g.id}`} columns />
      </div>
      <div className="fqs__foot">
        <Link to={`/faq#${g.id}`} className="btn btn--outline">{t('faq.all')}<IconArrowRight size={16} /></Link>
      </div>
    </section>
  );
}
