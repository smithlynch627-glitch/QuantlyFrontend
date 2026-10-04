// Terms of Use and Privacy Policy. The text set in the admin panel is shown when there is
// one; otherwise the built-in text from content/legal.ts.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../i18n';
import { BRAND } from '../config';
import { api } from '../lib/api';
import { Blocks, parseLegal, type Block, type LegalSection } from '../lib/legalText';
import { UPDATED, legalDocs } from '../content/legal';
import { BackButton } from '../components/BackButton';
import { Skeleton } from '../components/ui';

export default function Legal({ kind }: { kind: 'terms' | 'privacy' }) {
  const { t } = useI18n();
  const l = 'en';
  const q = useQuery({
    queryKey: ['legal', kind, l],
    queryFn: () => api.get<{ doc: { text: string; updated: string | null } | null }>(`/legal/${kind}`, { lang: l }),
    staleTime: 30_000,
    retry: 0,
  });
  const builtIn = legalDocs(BRAND.name)[kind][l];
  const view = useMemo(() => {
    const custom = q.data?.doc;
    if (custom?.text) {
      const d = parseLegal(custom.text);
      return { intro: d.intro, sections: d.sections, updated: custom.updated || UPDATED };
    }
    const sections: LegalSection[] = builtIn.sections.map((x) => ({ h: x.h, blocks: x.p.map((p): Block => ({ t: 'p', text: p })) }));
    return { intro: [{ t: 'p', text: builtIn.intro } as Block], sections, updated: UPDATED };
  }, [q.data, builtIn]);
  const title = builtIn.title;

  if (q.isLoading) return <div className="page container lg"><Skeleton h={420} r={28} /></div>;
  return (
    <div className="page container lg">
      <header className="lg-head">
        <BackButton />
        <h1 className="lg-head__title">{title}</h1>
        <span className="pill pill--outline">{t('legal.updated', { date: view.updated })}</span>
      </header>
      <div className="lg-layout">
        <article className="lg-doc">
          <div className="lg-doc__intro"><Blocks blocks={view.intro} className="lead" /></div>
          {view.sections.map((s, i) => (
            <section key={`${i}:${s.h}`} id={`s${i + 1}`}>
              <h2 className="lg-doc__h">{s.h}</h2>
              <Blocks blocks={s.blocks} />
            </section>
          ))}
        </article>
        <aside className="lg-side">
          <nav className="lg-toc" aria-label={title}>
            {view.sections.map((s, i) => <a key={`${i}:${s.h}`} href={`#s${i + 1}`}>{s.h}</a>)}
          </nav>
          <div className="lg-side__links">
            <Link className="btn btn--outline btn--sm" to={kind === 'terms' ? '/privacy' : '/terms'}>{kind === 'terms' ? t('legal.privacy') : t('legal.terms')}</Link>
            <Link className="btn btn--sm" to="/support">{t('nav.support')}</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
