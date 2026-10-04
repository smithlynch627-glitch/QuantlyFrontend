import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import type { DropListItem } from '../lib/types';
import { DropCard, DropStatusPill, phasePrice } from '../components/DropCard';
import { CollectionAvatar } from '../components/Art';
import { IconArrowRight, IconPlus } from '../components/Icons';
import { num } from '../lib/format';
import { Badge, CountdownLabel, EmptyState, Progress, Skeleton, Tabs } from '../components/ui';
import type { DictKey } from '../i18n/en';

type Tab = 'live' | 'upcoming' | 'ended';

export default function Launchpad() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const asked = params.get('tab') as Tab | null;
  const [picked, setPicked] = useState<Tab | null>(asked && ['live', 'upcoming', 'ended'].includes(asked) ? asked : null);
  const { data, isLoading } = useQuery({ queryKey: ['drops', 'all'], queryFn: () => api.get<{ drops: DropListItem[] }>('/drops') });
  const all = data?.drops ?? [];
  const by = (s: Tab) => all.filter((d) => (s === 'ended' ? d.status === 'ended' || d.status === 'sold_out' : d.status === s));
  // Open on the first tab that has drops (a brand-new drop usually starts as "upcoming").
  const tab: Tab = picked ?? (by('live').length ? 'live' : by('upcoming').length ? 'upcoming' : 'live');
  const setTab = (x: Tab) => { setPicked(x); setParams({ tab: x }, { replace: true }); };
  const list = by(tab);
  const empty: Record<Tab, DictKey> = { live: 'lp.emptyLive', upcoming: 'lp.emptyUpcoming', ended: 'lp.emptyEnded' };

  // The drop people can mint right now (or the next one to open) gets the stage at the top.
  const feature = by('live')[0] ?? by('upcoming')[0];

  return (
    <div className="page container lx">
      <header className="lx-head">
        <div>
          <h1 className="lx-head__title">{t('lp.title')}</h1>
          <p className="lead">{t('lp.sub')}</p>
        </div>
        <Link to="/create" className="btn btn--lg btn--glow"><IconPlus size={17} />{t('lp.create')}</Link>
      </header>

      {feature && <Feature d={feature} />}

      <div className="lx-bar">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'live', label: t('lp.live'), count: by('live').length },
            { id: 'upcoming', label: t('lp.upcoming'), count: by('upcoming').length },
            { id: 'ended', label: t('lp.ended'), count: by('ended').length },
          ]}
        />
      </div>
      {isLoading ? (
        <div className="lx-grid">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={380} r={30} />)}</div>
      ) : list.length === 0 ? (
        <EmptyState title={t(empty[tab])} action={<Link className="btn btn--outline" to="/create">{t('lp.create')}</Link>} />
      ) : (
        <div className="lx-grid" key={tab}>{list.map((d) => <DropCard key={d.collection.address} d={d} />)}</div>
      )}
    </div>
  );
}

/** The headline drop: big artwork, what it costs, how far along it is, and one button. */
function Feature({ d }: { d: DropListItem }) {
  const { t, lang } = useI18n();
  const c = d.collection;
  const phase = d.livePhase ?? d.nextPhase ?? d.phases[d.phases.length - 1];
  const pct = c.max_supply ? Math.floor((c.total_supply / c.max_supply) * 100) : 0;
  return (
    <Link to={`/launchpad/${c.slug}`} className="lx-feature">
      <span className="lx-feature__art"><CollectionAvatar collection={c} /></span>
      <span className="lx-feature__body">
        <span className="lx-feature__status">
          <DropStatusPill d={d} />
          <span className="small soft">
            {d.status === 'live' && d.livePhase?.end && <CountdownLabel k="lp.endsIn" to={d.livePhase.end} />}
            {d.status === 'upcoming' && d.nextPhase && <CountdownLabel k="lp.startsIn" to={d.nextPhase.start} />}
          </span>
        </span>
        <span className="lx-feature__name">{c.name}<Badge official={c.is_official} verified={c.verified} size={24} /></span>
        {c.description?.trim() && <span className="lx-feature__desc soft">{c.description}</span>}
        <span className="lx-feature__facts">
          <span><span className="tiny muted">{phase?.name}</span><strong className="mono-num">{phasePrice(phase?.priceWei, t('lp.free'))}</strong></span>
          <span><span className="tiny muted">{t('drop.supply')}</span><strong className="mono-num">{num(c.max_supply, lang)}</strong></span>
          <span><span className="tiny muted">{t('drop.minted')}</span><strong className="mono-num">{pct}%</strong></span>
        </span>
        <Progress value={c.total_supply} max={c.max_supply || 1} />
        <span className="btn btn--lg btn--glow lx-feature__cta">{d.status === 'live' ? t('drop.mint') : t('lp.view')}<IconArrowRight size={17} /></span>
      </span>
    </Link>
  );
}
