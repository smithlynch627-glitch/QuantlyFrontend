import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Accordion, useFaqGroups } from '../components/Faq';
import { IconArrowRight, IconClose, IconSearch } from '../components/Icons';
import { Tabs } from '../components/ui';
import type { FaqGroup } from '../content/faq';

/** Full Marketplace, Launchpad and Wallet safety FAQ with search. */
export default function FaqPage() {
  const { t } = useI18n();
  const groups = useFaqGroups();
  const { hash } = useLocation();
  const [q, setQ] = useState('');
  const [active, setActive] = useState<FaqGroup['id']>('marketplace');
  const term = q.trim().toLowerCase();

  const shown = useMemo(() => {
    if (!term) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((it) => `${it.q} ${it.a.join(' ')}`.toLowerCase().includes(term)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, term]);
  const total = shown.reduce((n, g) => n + g.items.length, 0);

  // /faq#launchpad opens that group.
  useEffect(() => {
    const id = hash.slice(1) as FaqGroup['id'];
    if (groups.some((g) => g.id === id)) setActive(id);
  }, [hash, groups]);
  const pick = (id: FaqGroup['id']) => { setActive(id); history.replaceState(null, '', `#${id}`); };
  // Searching looks through every group; otherwise one group is shown at a time.
  const visible = term ? shown : shown.filter((g) => g.id === active);

  return (
    <div className="page container fq">
      <header className="fq-hero">
        <h1 className="fq-hero__title">{t('faq.pageTitle')}</h1>
        <p className="lead">{t('faq.pageSub')}</p>
        <label className="fq-search">
          <IconSearch size={19} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('faq.search')} aria-label={t('faq.search')} />
          {q && <button type="button" className="icon-btn icon-btn--close" onClick={() => setQ('')} aria-label={t('common.close')}><IconClose size={15} /></button>}
        </label>
        {term ? <p className="small muted" aria-live="polite">{t('faq.results', { n: total })}</p> : (
          <Tabs value={active} onChange={pick} tabs={groups.map((g) => ({ id: g.id, label: g.title, count: g.items.length }))} />
        )}
      </header>

      <div className="fq-body">
        {visible.length === 0 && (
          <div className="empty">
            <strong>{t('faq.empty')}</strong>
            <Link to="/support" className="btn btn--outline btn--sm">{t('nav.support')}</Link>
          </div>
        )}
        {visible.map((g) => (
          <section key={g.id} id={g.id} className="fq-group" aria-labelledby={`${g.id}-title`}>
            <div className="fq-group__head">
              <h2 id={`${g.id}-title`} className="fq-group__title">{g.title}</h2>
              <p className="soft">{g.intro}</p>
            </div>
            <Accordion key={`${g.id}:${term}`} items={g.items} idPrefix={`faq-${g.id}`} openFirst={!!term} />
          </section>
        ))}
      </div>

      <div className="fq-help">
        <div>
          <h2 className="fq-help__title">{t('faq.helpTitle')}</h2>
          <p>{t('faq.helpBody')}</p>
        </div>
        <Link to="/support" className="btn btn--lg btn--white">{t('nav.support')}<IconArrowRight size={16} /></Link>
      </div>
    </div>
  );
}
