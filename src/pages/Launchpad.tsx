// Launchpad: what is minting now, what opens next (as a timeline), what has finished, and how to start a drop.
import { useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import type { DropListItem } from '../lib/types';
import { DropStatusPill, phasePrice } from '../components/DropCard';
import { CollectionAvatar } from '../components/Art';
import { IconArrowRight, IconCheck, IconPlus } from '../components/Icons';
import { num } from '../lib/format';
import { Badge, CountdownLabel, Progress, Skeleton } from '../components/ui';
import { BRAND } from '../config';

const pctOf = (d: DropListItem) => (d.collection.max_supply ? Math.min(100, Math.floor((d.collection.total_supply / d.collection.max_supply) * 100)) : 0);
const startOf = (d: DropListItem) => new Date(d.nextPhase?.start ?? d.phases[0]?.start ?? 0).getTime();

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Launchpad() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ['drops', 'all'], queryFn: () => api.get<{ drops: DropListItem[] }>('/drops') });
  const groups = useMemo(() => {
    const all = data?.drops ?? [];
    return {
      live: all.filter((d) => d.status === 'live'),
      soon: all.filter((d) => d.status === 'upcoming').sort((a, b) => startOf(a) - startOf(b)),
      done: all.filter((d) => d.status === 'ended' || d.status === 'sold_out'),
    };
  }, [data]);

  return (
    <div className="page container lq">
      <header className="lq-head">
        <div className="lq-head__text">
          <h1 className="lq-head__title">{t('lp.title')}</h1>
          <p className="lq-head__lead">{t('lp.sub')}</p>
          <div className="row-wrap">
            <Link to="/create" className="btn btn--lg btn--glow"><IconPlus size={17} />{t('lp.create')}</Link>
            <button type="button" className="btn btn--lg btn--ghost" onClick={() => jump('lq-how')}>{t('lp.howLink')}</button>
          </div>
        </div>
        <nav className="lq-board" aria-label={t('lp.boardLabel')}>
          {([
            ['lq-live', 'lp.boardLive', groups.live.length],
            ['lq-soon', 'lp.boardSoon', groups.soon.length],
            ['lq-done', 'lp.boardDone', groups.done.length],
          ] as const).map(([id, key, n], i) => (
            <button key={id} type="button" className={`lq-board__row${i === 0 && n > 0 ? ' is-hot' : ''}`} onClick={() => jump(id)} style={{ '--i': i } as CSSProperties}>
              <span className="lq-board__n mono-num">{isLoading ? '–' : n}</span>
              <span className="lq-board__label">{t(key)}</span>
              <IconArrowRight size={16} />
            </button>
          ))}
        </nav>
      </header>

      {/* Minting now: one wide row per drop, so price, progress and time left read across in one line. */}
      <section id="lq-live" className="lq-section">
        <div className="lq-section__head">
          <h2 className="lq-section__title"><span className="lq-dot" aria-hidden="true" />{t('lp.liveTitle')}</h2>
          <p className="small soft">{t('lp.liveSub')}</p>
        </div>
        {isLoading ? (
          <div className="lq-rows">{[0, 1].map((i) => <Skeleton key={i} h={150} r={30} />)}</div>
        ) : groups.live.length === 0 ? (
          <div className="lq-empty">{t('lp.emptyLive')}{groups.soon.length > 0 && <button type="button" className="link" onClick={() => jump('lq-soon')}>{t('lp.seeSoon')}</button>}</div>
        ) : (
          <div className="lq-rows">{groups.live.map((d, i) => <LiveRow key={d.collection.address} d={d} i={i} />)}</div>
        )}
      </section>

      {/* Opening soon: a timeline in the order the drops open. */}
      <section id="lq-soon" className="lq-section">
        <div className="lq-section__head">
          <h2 className="lq-section__title">{t('lp.soonTitle')}</h2>
          <p className="small soft">{t('lp.soonSub')}</p>
        </div>
        {isLoading ? (
          <Skeleton h={120} r={26} />
        ) : groups.soon.length === 0 ? (
          <div className="lq-empty">{t('lp.emptyUpcoming')}</div>
        ) : (
          <ol className="lq-time">{groups.soon.map((d, i) => <SoonItem key={d.collection.address} d={d} i={i} />)}</ol>
        )}
      </section>

      {/* Finished: small tiles with the final count. */}
      <section id="lq-done" className="lq-section">
        <div className="lq-section__head">
          <h2 className="lq-section__title">{t('lp.doneTitle')}</h2>
          <p className="small soft">{t('lp.doneSub')}</p>
        </div>
        {isLoading ? (
          <Skeleton h={120} r={26} />
        ) : groups.done.length === 0 ? (
          <div className="lq-empty">{t('lp.emptyEnded')}</div>
        ) : (
          <div className="lq-done">{groups.done.map((d) => <DoneTile key={d.collection.address} d={d} />)}</div>
        )}
      </section>

      <HowItWorks />
    </div>
  );
}

function LiveRow({ d, i }: { d: DropListItem; i: number }) {
  const { t, lang } = useI18n();
  const c = d.collection;
  const phase = d.livePhase ?? d.phases[d.phases.length - 1];
  const left = Math.max(0, (c.max_supply || 0) - c.total_supply);
  return (
    <Link to={`/launchpad/${c.slug}`} className="lq-live" style={{ '--i': i } as CSSProperties}>
      <span className="lq-live__art"><CollectionAvatar collection={c} /></span>
      <span className="lq-live__who">
        <span className="lq-live__name">{c.name}<Badge official={c.is_official} verified={c.verified} size={18} /></span>
        <span className="lq-live__phase"><DropStatusPill d={d} />{phase?.name}</span>
      </span>
      <span className="lq-live__price">
        <span className="tiny muted">{t('lp.price')}</span>
        <strong className="mono-num">{phasePrice(phase?.priceWei, t('lp.free'))}</strong>
      </span>
      <span className="lq-live__progress">
        <span className="row" style={{ justifyContent: 'space-between' }}>
          <span className="tiny muted">{t('lp.minted', { n: num(c.total_supply, lang), max: num(c.max_supply, lang) })}</span>
          <span className="tiny strong mono-num">{pctOf(d)}%</span>
        </span>
        <Progress value={c.total_supply} max={c.max_supply || 1} />
        <span className="tiny muted">
          {d.livePhase?.end ? <CountdownLabel k="lp.endsIn" to={d.livePhase.end} /> : t('lp.left', { n: num(left, lang) })}
        </span>
      </span>
      <span className="btn btn--glow lq-live__cta">{t('drop.mint')}<IconArrowRight size={16} /></span>
    </Link>
  );
}

function SoonItem({ d, i }: { d: DropListItem; i: number }) {
  const { t } = useI18n();
  const c = d.collection;
  const phase = d.nextPhase ?? d.phases[0];
  const at = new Date(phase?.start ?? Date.now());
  return (
    <li className="lq-time__item" style={{ '--i': i } as CSSProperties}>
      <time className="lq-date" dateTime={at.toISOString()}>
        <span className="lq-date__day mono-num">{at.getDate()}</span>
        <span className="lq-date__month">{at.toLocaleString('en-US', { month: 'short' })}</span>
        <span className="lq-date__time mono-num">{at.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
      </time>
      <Link to={`/launchpad/${c.slug}`} className="lq-soon">
        <span className="lq-soon__art"><CollectionAvatar collection={c} /></span>
        <span className="lq-soon__body">
          <span className="lq-soon__name">{c.name}<Badge official={c.is_official} verified={c.verified} size={16} /></span>
          <span className="small soft">{t('lp.phasePrice', { phase: phase?.name ?? '', price: phasePrice(phase?.priceWei, t('lp.free')) })}</span>
        </span>
        <span className="lq-soon__when small strong">{phase?.start && <CountdownLabel k="lp.startsIn" to={phase.start} />}</span>
        <span className="btn btn--outline btn--sm">{t('lp.view')}</span>
      </Link>
    </li>
  );
}

function DoneTile({ d }: { d: DropListItem }) {
  const { t, lang } = useI18n();
  const c = d.collection;
  return (
    <Link to={`/collection/${c.slug}`} className="lq-tile">
      <span className="lq-tile__art"><CollectionAvatar collection={c} /></span>
      <span className="lq-tile__name">{c.name}<Badge official={c.is_official} verified={c.verified} size={14} /></span>
      <span className="tiny muted">{d.status === 'sold_out' ? t('lp.soldOut') : t('lp.minted', { n: num(c.total_supply, lang), max: num(c.max_supply, lang) })}</span>
      <span className="lq-tile__go small">{t('lp.trade')}<IconArrowRight size={14} /></span>
    </Link>
  );
}

/** How a creator goes from idea to a live mint, in the order the Create page asks for it. */
function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    ['lp.how1', 'lp.how1Body'],
    ['lp.how2', 'lp.how2Body'],
    ['lp.how3', 'lp.how3Body'],
    ['lp.how4', 'lp.how4Body'],
  ] as const;
  return (
    <section id="lq-how" className="lq-how">
      <div className="lq-how__intro">
        <h2 className="lq-how__title">{t('lp.howTitle')}</h2>
        <p className="lq-how__lead">{t('lp.howSub', { brand: BRAND.name })}</p>
        <Link to="/create" className="btn btn--lg btn--white"><IconPlus size={17} />{t('lp.create')}</Link>
      </div>
      <ol className="lq-steps">
        {steps.map(([title, body], i) => (
          <li key={title} className="lq-step">
            <span className="lq-step__n mono-num">{i + 1}</span>
            <span className="lq-step__title">{t(title)}</span>
            <span className="lq-step__body">{t(body, { brand: BRAND.name })}</span>
          </li>
        ))}
      </ol>
      <p className="lq-how__note"><IconCheck size={15} />{t('lp.howNote')}</p>
    </section>
  );
}
