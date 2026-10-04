import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BRAND, NATIVE, OFFICIAL, activeChain } from '../config';
import { useI18n } from '../i18n';
import { officialContent, type OfficialContent } from '../content/official';
import { SocialIcon } from '../components/Social';
import { api } from '../lib/api';
import { useAppConfig } from '../lib/appConfig';
import { fromWei, num, pct, safeHref, short } from '../lib/format';
import type { Collection, DropState, Token, TraitGroup } from '../lib/types';
import { NftCard } from '../components/NftCard';
import { fixImageUrl } from '../components/Art';
import { IconVerified, IconArrowRight } from '../components/Icons';
import { Accordion } from '../components/Faq';
import {
  AnimatedTitle, ArtDeck, ArtLightbox, ArtMarquee, CountUp, OfficialArt, Reveal, artIndex, useInView,
} from '../components/official';
import { ActivityTab } from './Collection';
import { MintBox, MintProgress, useDrop } from './Drop';

type SectionId = 'overview' | 'mint' | 'market' | 'arts' | 'faq';

/** The marketplace's official collection: facts, live mint or market, artwork and FAQ. */
export default function Official() {
  const { t } = useI18n();
  const copy = useMemo(() => officialContent({ name: OFFICIAL.name, supply: OFFICIAL.supply, brand: BRAND.name, chain: activeChain.name }), []);
  const { socials, ipfsGateway, official, explorerUrl } = useAppConfig();
  const col = useQuery({
    queryKey: ['collection', OFFICIAL.slug],
    queryFn: () => api.get<{ collection: Collection; drop: DropState | null }>(`/collections/${OFFICIAL.slug}`),
    retry: (n, e: any) => e?.status !== 404 && n < 2,
  });
  const drop = useDrop(OFFICIAL.slug);
  const c = col.data?.collection ?? null;
  const d = drop.data?.drop ?? col.data?.drop ?? null;
  const mintOpen = !!d && !!drop.data && (d.status === 'live' || d.status === 'upcoming');
  const xUrl = safeHref(c?.twitter) || safeHref(OFFICIAL.x) || safeHref(socials?.x) || '';
  const hasArt = OFFICIAL.images.length > 0;
  const [art, setArt] = useState<number | null>(null);
  const close = useCallback(() => setArt(null), []);

  const strip = Array.from({ length: 10 }, (_, k) => k * 3 + 1);

  return (
    <div className="og">
      {/* Hero: the name, centred, with a strip of the artwork drifting along its lower edge. */}
      <section className="oc-stage og-hero">
        <div className="og-hero__bg" aria-hidden="true">
          {OFFICIAL.banner && <img src={fixImageUrl(OFFICIAL.banner, ipfsGateway)} alt="" className="og-hero__banner" />}
          <span className="oc-glow oc-glow--a" />
          <span className="oc-glow oc-glow--b" />
        </div>
        <div className="container og-hero__inner">
          <span className="og-hero__chip"><IconVerified size={18} official />{copy.eyebrow}</span>
          <AnimatedTitle text={OFFICIAL.name} className="og-title" />
          <p className="og-hero__lead">{copy.lead}</p>
          <div className="og-hero__ctas">
            {mintOpen && <a href="#mint" className="btn btn--lg" onClick={(e) => { e.preventDefault(); jump('mint'); }}>{t('official.viewDrop')}</a>}
            {c && <Link to={`/collection/${c.slug}`} className={`btn btn--lg ${mintOpen ? 'btn--outline' : ''}`}>{t('official.trade')}</Link>}
            {xUrl && <a className={`btn btn--lg ${mintOpen || c ? 'btn--outline' : ''}`} href={xUrl} target="_blank" rel="noreferrer"><SocialIcon kind="x" size={15} />{t('official.follow')}</a>}
            <a href="#overview" className={`btn btn--lg ${xUrl || c || mintOpen ? 'btn--ghost' : ''}`} onClick={(e) => { e.preventDefault(); jump('overview'); }}>{t('official.aboutCta')}<IconArrowRight size={16} /></a>
          </div>
          {official?.address && (
            <a className="og-hero__contract mono-num" href={`${explorerUrl}/address/${official.address}`} target="_blank" rel="noreferrer">
              {t('official.contract')} {short(official.address)}
            </a>
          )}
        </div>
        <div className="og-strip" aria-hidden="true">
          <div className="og-strip__track">
            {[0, 1].map((g) => (
              <div className="og-strip__group" key={g}>
                {strip.map((k, n) => <span key={k} className="og-strip__tile" style={{ '--r': n % 2 ? 1 : -1 } as CSSProperties}><OfficialArt index={k} w={360} alt="" /></span>)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        <Specs copy={copy} c={c} />

        {mintOpen && d && drop.data && (
          <section id="mint" className="og-mint">
            <div className="og-mint__art"><ArtDeck labels={{ prev: t('official.prevArt'), next: t('official.nextArt') }} /></div>
            <div className="og-mint__box">
              <MintProgress c={drop.data.collection} />
              <MintBox c={drop.data.collection} drop={d} />
            </div>
          </section>
        )}

        <Overview copy={copy} />
        {c && <Market c={c} copy={copy} />}
      </div>

      {hasArt && <Arts copy={copy} onOpen={setArt} />}

      <div className="container">
        <OfficialFaq copy={copy} xUrl={xUrl} />
        <Join copy={copy} xUrl={xUrl} />
      </div>

      {art !== null && (
        <ArtLightbox index={art} onClose={close} onMove={setArt} labels={{ prev: t('official.prevArt'), next: t('official.nextArt'), close: t('common.close') }} />
      )}
    </div>
  );
}

function jump(id: SectionId) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
}

/** The collection's key facts as one joined bar; once it has minted, a second bar with its live market numbers. */
function Specs({ copy, c }: { copy: OfficialContent; c: Collection | null }) {
  const { t, lang } = useI18n();
  const [ref, inView] = useInView<HTMLDListElement>();
  return (
    <>
      <dl ref={ref} className={`og-specs reveal${inView ? ' is-in' : ''}`}>
        {copy.facts.map((f, i) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd className="mono-num">
              {i === 0 && OFFICIAL.supply ? <CountUp to={OFFICIAL.supply} active={inView} /> : f.value}
              {i === 3 && <IconVerified size={26} official />}
            </dd>
            <span className="og-specs__note">{f.note}</span>
          </div>
        ))}
      </dl>
      {c && c.total_supply > 0 && (
        <dl className="og-specs og-specs--live">
          <div><dt>{t('official.minted')}</dt><dd className="mono-num">{num(c.total_supply, lang)}</dd></div>
          <div><dt>{t('common.floor')}</dt><dd className="mono-num">{c.floor_wei ? `${fromWei(c.floor_wei)} ${NATIVE}` : '—'}</dd></div>
          <div><dt>{t('common.owners')}</dt><dd className="mono-num">{num(c.owners_count, lang)}</dd></div>
          <div><dt>{t('common.volume')}</dt><dd className="mono-num">{fromWei(c.volume_wei)} {NATIVE}</dd></div>
        </dl>
      )}
    </>
  );
}

/** What the collection is: a centred heading and its four points side by side. */
function Overview({ copy }: { copy: OfficialContent }) {
  return (
    <section id="overview" className="og-section og-about">
      <Reveal className="og-head">
        <h2 className="og-head__title">{copy.aboutTitle}</h2>
        <p className="lead">{copy.aboutLead}</p>
      </Reveal>
      <div className="og-points">
        {copy.pillars.map((p, i) => (
          <Reveal key={p.title} delay={i * 80} className="og-point">
            <div className="og-point__art"><OfficialArt index={i * 4 + 1} w={320} /></div>
            <h3 className="og-point__title">{p.title}</h3>
            <p className="soft small">{p.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Market({ c, copy }: { c: Collection; copy: OfficialContent }) {
  const { t } = useI18n();
  return (
    <section id="market" className="og-section">
      <div className="section__head">
        <h2 className="og-head__title">{copy.nav.market}</h2>
        <Link to={`/collection/${c.slug}`} className="btn btn--outline btn--sm">{t('official.trade')}</Link>
      </div>
      <Listings c={c} />
      <Traits c={c} />
      <div className="section">
        <h3 className="h2" style={{ marginBottom: 18 }}>{t('official.activity')}</h3>
        <ActivityTab collection={c.address} />
      </div>
    </section>
  );
}

function Listings({ c }: { c: Collection }) {
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ['tokens', c.address, 'official-floor'],
    queryFn: () => api.get<{ tokens: Token[] }>(`/collections/${c.address}/tokens`, { status: 'listed', sort: 'price_asc', limit: 8 }),
  });
  const tokens = q.data?.tokens ?? [];
  if (!q.isLoading && tokens.length === 0) return null;
  return (
    <div className="section" style={{ marginTop: 28 }}>
      <h3 className="h2" style={{ marginBottom: 18 }}>{t('official.floorListings')}</h3>
      <div className="nft-grid">{tokens.map((tok) => <NftCard key={tok.token_id} token={tok} collection={c} />)}</div>
    </div>
  );
}

function Traits({ c }: { c: Collection }) {
  const { t } = useI18n();
  const q = useQuery({ queryKey: ['traits', c.address], queryFn: () => api.get<{ traits: TraitGroup[]; total: number }>(`/collections/${c.address}/traits`) });
  const groups = q.data?.traits ?? [];
  if (groups.length === 0) return null;
  return (
    <div className="section">
      <h3 className="h2" style={{ marginBottom: 18 }}>{t('official.traits')}</h3>
      <div className="oc-traits">
        {groups.map((g) => (
          <div key={g.trait_type} className="card card--pad">
            <div className="strong" style={{ marginBottom: 10 }}>{g.trait_type}</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {g.values.slice(0, 6).map((v) => (
                <div key={v.value} className="row small" style={{ justifyContent: 'space-between' }}>
                  <span>{v.value}</span>
                  <span className="muted mono-num">{pct(v.count, q.data?.total || 1)}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Three endless rows of artwork, alternating direction. */
function Arts({ copy, onOpen }: { copy: OfficialContent; onOpen: (i: number) => void }) {
  const rows = useMemo(() => {
    const all = Array.from({ length: OFFICIAL.images.length }, (_, i) => i);
    const shift = (k: number) => all.map((i) => artIndex(i + k));
    return [shift(0), shift(7).reverse(), shift(13)];
  }, []);
  return (
    <section id="arts" className="og-section oc-arts">
      <div className="container">
        <Reveal className="oc-arts__head">
          <span className="kicker">{OFFICIAL.name}</span>
          <h2 className="h1">{copy.artsTitle}</h2>
          <p className="lead">{copy.artsLead}</p>
        </Reveal>
      </div>
      <div className="oc-arts__rows">
        <ArtMarquee order={rows[0]} reverse seconds={70} onOpen={onOpen} />
        <ArtMarquee order={rows[1]} seconds={58} onOpen={onOpen} />
        <ArtMarquee order={rows[2]} reverse seconds={80} onOpen={onOpen} />
      </div>
    </section>
  );
}

function OfficialFaq({ copy, xUrl }: { copy: OfficialContent; xUrl: string }) {
  const { t } = useI18n();
  return (
    <section id="faq" className="og-section">
      <Reveal className="og-head">
        <h2 className="og-head__title">{copy.faqTitle}</h2>
        <p className="lead">{copy.faqLead}</p>
      </Reveal>
      <Accordion items={copy.faq} idPrefix="official-faq" columns />
      <div className="row-wrap" style={{ justifyContent: 'center', marginTop: 22 }}>
        {xUrl && <a className="btn" href={xUrl} target="_blank" rel="noreferrer"><SocialIcon kind="x" size={14} />{t('official.askX')}</a>}
        <Link to="/faq" className="btn btn--outline">{t('official.moreFaq')}</Link>
      </div>
    </section>
  );
}

function Join({ copy, xUrl }: { copy: OfficialContent; xUrl: string }) {
  const { t } = useI18n();
  return (
    <section className="og-section">
      <Reveal className="og-join">
        <div className="og-join__art" aria-hidden="true">
          {[3, 8, 11].map((k, i) => <span key={k} style={{ '--k': i } as CSSProperties}><OfficialArt index={k} w={240} alt="" /></span>)}
        </div>
        <div className="og-join__text">
          <h2 className="og-join__title">{copy.joinTitle}</h2>
          <p>{copy.joinBody}</p>
        </div>
        <div className="og-join__ctas">
          {xUrl ? (
            <a className="btn btn--lg btn--white" href={xUrl} target="_blank" rel="noreferrer"><SocialIcon kind="x" size={15} />{t('official.follow')}</a>
          ) : (
            <Link to="/explore" className="btn btn--lg btn--white">{t('home.explore')}</Link>
          )}
          <Link to="/launchpad" className="btn btn--lg btn--glass">{t('nav.launchpad')}</Link>
        </div>
      </Reveal>
    </section>
  );
}
