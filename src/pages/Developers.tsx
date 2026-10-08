// Developers: what the read-only Quantly API offers, how to ask for a key, your keys (show once, rotate, revoke),
// and the reference: how to call it, routes, pages, following new activity, limits, errors and rules.
// Keys are managed with the wallet's normal sign-in; the key itself is only ever shown once, in a dialog.
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { API_URL, BRAND, NATIVE } from '../config';
import { useI18n } from '../i18n';
import type { DictKey } from '../i18n/en';
import { useAppConfig } from '../lib/appConfig';
import { errorMessage } from '../lib/actions';
import { num, timeAgo } from '../lib/format';
import { getSession } from '../lib/session';
import { useAuthedApi } from '../lib/tx';
import type { ApiKey } from '../lib/types';
import { ACTIVITY_TYPES, ERRORS, ROUTES, RULES, SAMPLE_RESPONSE } from '../content/developers';
import { IconAlert, IconCheck, IconKey, IconLock, IconPlus } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { CopyButton, Modal, Progress, Skeleton, useToast } from '../components/ui';
import { useWalletUI } from '../components/wallet';

const BASE = `${API_URL}/api/v1`;
type KeysResponse = { keys: ApiKey[]; limits: { max_pending: number; max_keys: number; default_per_minute: number; default_per_day: number }; contact_enabled: boolean };

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Developers() {
  const { t } = useI18n();
  const cfg = useAppConfig();
  const lim = cfg.api ?? { perMinute: 60, perDay: 10_000, maxKeys: 3 };
  const fill = (s: string) => s.replace(/\{brand\}/g, BRAND.name).replace(/\{maxKeys\}/g, String(lim.maxKeys));
  // The one-time key is held here, above the keys list, so a refetch or a list change can't drop it before it is copied.
  const [secret, setSecret] = useState<string | null>(null);
  return (
    <div className="page container dv">
      <div className="back-row"><BackButton /></div>
      <header className="dv-hero">
        <div className="dv-hero__text">
          <h1 className="dv-hero__title">{t('dev.title', { brand: BRAND.name })}</h1>
          <p className="dv-hero__lead">{t('dev.lead')}</p>
          <div className="row-wrap">
            <button type="button" className="btn btn--lg btn--glow" onClick={() => jump('dv-keys')}><IconKey size={17} />{t('dev.ctaKey')}</button>
            <button type="button" className="btn btn--lg btn--ghost" onClick={() => jump('dv-call')}>{t('dev.ctaDocs')}</button>
          </div>
          <p className="small soft dv-hero__limits">{t('dev.limitsLine', { min: num(lim.perMinute), day: num(lim.perDay) })}</p>
        </div>
        <figure className="dv-term" aria-label={t('dev.exampleLabel')}>
          <pre className="dv-term__req"><span className="dv-tok-verb">GET</span> /api/v1/collections?limit=1{'\n'}<span className="dv-tok-key">X-API-Key:</span> qk_live_••••••••</pre>
          <pre className="dv-term__res"><span className="dv-tok-ok">200</span>{'\n'}{SAMPLE_RESPONSE}</pre>
        </figure>
      </header>

      <Section id="dv-keys" title={t('dev.keysTitle')} sub={t('dev.keysSub')}>
        <Keys onSecret={setSecret} />
      </Section>

      <Section id="dv-call" title={t('dev.callTitle')} sub={t('dev.callSub')}>
        <dl className="dv-kv">
          <div><dt>{t('dev.base')}</dt><dd><code className="dv-code-inline">{BASE}</code><CopyButton value={BASE} /></dd></div>
          <div><dt>{t('dev.header')}</dt><dd><code className="dv-code-inline">X-API-Key: qk_live_…</code></dd></div>
          <div><dt>{t('dev.method')}</dt><dd>{t('dev.methodBody')}</dd></div>
        </dl>
        <CodeTabs />
        <p className="notice small"><IconLock size={15} />{t('dev.serverOnly')}</p>
      </Section>

      <Section id="dv-routes" title={t('dev.routesTitle')} sub={t('dev.routesSub')}>
        {ROUTES.map((g) => (
          <div key={g.title} className="dv-group">
            <h3 className="dv-group__title">{g.title}</h3>
            <ul className="dv-routes">
              {g.routes.map((r) => (
                <li key={r.path} className="dv-route">
                  <code className="dv-route__path"><span className="dv-tok-verb">GET</span> {r.path}</code>
                  <span className="dv-route__what">{r.what}</span>
                  {r.params && (
                    <span className="dv-route__params">
                      {r.params.split(' · ').map((p) => <code key={p}>{p}</code>)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="small soft" style={{ margin: 0 }}>{t('dev.types')} <code className="dv-code-inline">{ACTIVITY_TYPES}</code></p>
        <p className="small soft" style={{ margin: 0 }}>{t('dev.amounts', { coin: NATIVE })}</p>
      </Section>

      <Section id="dv-pages" title={t('dev.pagesTitle')} sub={t('dev.pagesSub')}>
        <p className="small" style={{ margin: 0 }}>{t('dev.pagesBody')}</p>
        <Code lang="js" text={`let cursor = null;\ndo {\n  const url = new URL('${BASE}/collections/aurora-tiles/tokens');\n  url.searchParams.set('limit', '100');\n  if (cursor) url.searchParams.set('cursor', cursor);\n  const { data, next } = await (await fetch(url, { headers })).json();\n  save(data);\n  cursor = next;\n} while (cursor);`} />
      </Section>

      <Section id="dv-follow" title={t('dev.followTitle')} sub={t('dev.followSub')}>
        <ol className="dv-steps">
          <li>{t('dev.follow1')}</li>
          <li>{t('dev.follow2')}</li>
          <li>{t('dev.follow3')}</li>
        </ol>
        <Code lang="js" text={`// A sales bot: posts every new sale once, oldest first.\nlet after = loadCursor() ?? 'latest';\nsetInterval(async () => {\n  const res = await fetch(\`${BASE}/activity?type=sale&after=\${after}\`, { headers });\n  if (!res.ok) return; // 429: wait for the next round\n  const { data, next } = await res.json();\n  for (const sale of data) await post(sale);\n  after = next;\n  saveCursor(after); // a restart continues where it stopped\n}, 15_000);`} />
      </Section>

      <Section id="dv-limits" title={t('dev.limitsTitle')} sub={t('dev.limitsSub')}>
        <p className="small" style={{ margin: 0 }}>{t('dev.limitsBody', { min: num(lim.perMinute), day: num(lim.perDay) })}</p>
        <dl className="dv-kv">
          <div><dt><code>RateLimit-Remaining</code></dt><dd>{t('dev.hRemaining')}</dd></div>
          <div><dt><code>RateLimit-Reset</code></dt><dd>{t('dev.hReset')}</dd></div>
          <div><dt><code>X-RateLimit-Day-Remaining</code></dt><dd>{t('dev.hDay')}</dd></div>
          <div><dt><code>Retry-After</code></dt><dd>{t('dev.hRetry')}</dd></div>
        </dl>
      </Section>

      <Section id="dv-errors" title={t('dev.errorsTitle')} sub={t('dev.errorsSub')}>
        <ul className="dv-routes">
          {ERRORS.map((e) => (
            <li key={e.code} className="dv-route">
              <code className="dv-route__path"><span className="dv-err-status">{e.status}</span> {e.code}</code>
              <span className="dv-route__what">{e.meaning}</span>
            </li>
          ))}
        </ul>
        <Code lang="json" text={`{ "error": "Too many requests: this key allows ${lim.perMinute} a minute. Try again in 12 seconds.", "code": "rate_limited" }`} />
      </Section>

      <Section id="dv-rules" title={t('dev.rulesTitle')} sub={t('dev.rulesSub')}>
        <ul className="dv-rules">{RULES.map((r) => <li key={r}>{fill(r)}</li>)}</ul>
        <p className="small soft" style={{ margin: 0 }}>{t('dev.questions')} <Link className="link" to="/support">{t('nav.support')}</Link></p>
      </Section>
      <RevealModal secret={secret} onClose={() => setSecret(null)} />
    </div>
  );
}

function Section({ id, title, sub, children }: { id: string; title: string; sub: string; children: ReactNode }) {
  return (
    <section id={id} className="st-sec dv-sec">
      <header className="st-sec__head">
        <h2 className="st-sec__title">{title}</h2>
        <p className="small soft">{sub}</p>
      </header>
      <div className="st-sec__body">{children}</div>
    </section>
  );
}

function Code({ text, lang }: { text: string; lang: string }) {
  return (
    <div className="dv-code" data-lang={lang}>
      <div className="dv-code__copy"><CopyButton value={text} /></div>
      <pre><code>{text}</code></pre>
    </div>
  );
}

const SAMPLES = {
  curl: `curl -H "X-API-Key: $QUANTLY_KEY" \\\n  "${BASE}/collections?limit=10"`,
  node: `const headers = { 'X-API-Key': process.env.QUANTLY_KEY };\nconst res = await fetch('${BASE}/collections?limit=10', { headers });\nif (!res.ok) throw new Error((await res.json()).error);\nconst { data, next } = await res.json();`,
  python: `import os, requests\n\nr = requests.get(\n    "${BASE}/collections",\n    params={"limit": 10},\n    headers={"X-API-Key": os.environ["QUANTLY_KEY"]},\n    timeout=20,\n)\nr.raise_for_status()\ndata = r.json()["data"]`,
} as const;

function CodeTabs() {
  const [tab, setTab] = useState<keyof typeof SAMPLES>('curl');
  const labels = { curl: 'curl', node: 'Node.js', python: 'Python' } as const;
  return (
    <div className="dv-tabs">
      <div className="segmented md-modes" role="tablist" aria-label="Code examples">
        {(Object.keys(SAMPLES) as (keyof typeof SAMPLES)[]).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} aria-pressed={tab === k} onClick={() => setTab(k)}>{labels[k]}</button>
        ))}
      </div>
      <Code lang={tab} text={SAMPLES[tab]} />
    </div>
  );
}

// ── Keys ──────────────────────────────────────────────────────────────────────

function Keys({ onSecret }: { onSecret: (secret: string) => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const { address } = useAccount();
  const { openConnect } = useWalletUI();
  const authed = useAuthedApi();
  const [signed, setSigned] = useState(() => !!getSession(address));
  const [busy, setBusy] = useState(false);
  useEffect(() => setSigned(!!getSession(address)), [address]);
  const q = useQuery({
    queryKey: ['api-keys', address?.toLowerCase()],
    queryFn: () => authed.get<KeysResponse>('/keys'),
    enabled: !!address && signed,
    retry: false,
  });

  if (!address) {
    return (
      <div className="dv-gate">
        <span className="dv-gate__icon" aria-hidden="true"><IconKey size={20} /></span>
        <p className="small" style={{ margin: 0 }}>{t('dev.connect')}</p>
        <button className="btn" onClick={openConnect}>{t('wallet.connect')}</button>
      </div>
    );
  }
  if (!signed) {
    return (
      <div className="dv-gate">
        <span className="dv-gate__icon" aria-hidden="true"><IconLock size={20} /></span>
        <p className="small" style={{ margin: 0 }}>{t('dev.signIn')}</p>
        <button className="btn" disabled={busy} onClick={async () => {
          setBusy(true);
          try { await authed.token(); setSigned(true); } catch (e) { toast(errorMessage(e, t), 'error'); } finally { setBusy(false); }
        }}>{busy && <span className="spinner" />}{t('dev.signInBtn')}</button>
      </div>
    );
  }
  if (q.isLoading) return <Skeleton h={160} r={22} />;
  if (q.error) return <div className="notice notice--strong"><IconAlert size={16} />{errorMessage(q.error, t)}</div>;
  const data = q.data!;
  const keys = data.keys;
  const pending = keys.some((k) => k.status === 'pending');
  const usable = keys.filter((k) => k.status === 'active' || k.status === 'paused').length;
  const canAsk = !pending && usable < data.limits.max_keys;
  return (
    <>
      {keys.length > 0 && <div className="dv-keys">{keys.map((k) => <KeyCard key={k.id} k={k} onSecret={onSecret} />)}</div>}
      {canAsk ? (
        <RequestForm contact={data.contact_enabled} first={!keys.length} />
      ) : (
        <p className="small soft" style={{ margin: 0 }}>{pending ? t('dev.oneAtATime') : t('dev.maxKeys', { n: data.limits.max_keys })}</p>
      )}
    </>
  );
}

const STATUS: Record<ApiKey['status'], [DictKey, string]> = {
  pending: ['dev.stPending', 'is-pending'],
  active: ['dev.stActive', 'is-active'],
  paused: ['dev.stPaused', 'is-paused'],
  rejected: ['dev.stRejected', 'is-closed'],
  revoked: ['dev.stRevoked', 'is-closed'],
};

function KeyCard({ k, onSecret }: { k: ApiKey; onSecret: (secret: string) => void }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const authed = useAuthedApi();
  const [busy, setBusy] = useState<string | null>(null);
  const [label, cls] = STATUS[k.status];
  const closed = k.status === 'revoked' || k.status === 'rejected';

  async function act(kind: 'reveal' | 'rotate' | 'revoke') {
    if (kind === 'rotate' && !window.confirm(t('dev.rotateConfirm'))) return;
    if (kind === 'revoke' && !window.confirm(k.status === 'pending' ? t('dev.withdrawConfirm') : t('dev.revokeConfirm'))) return;
    setBusy(kind);
    try {
      const res = await authed.post<{ secret?: string; key: ApiKey }>(`/keys/${k.id}/${kind}`);
      if (res.secret) onSecret(res.secret);
      else toast(k.status === 'pending' ? t('dev.withdrawn') : t('dev.revoked'));
      qc.invalidateQueries({ queryKey: ['api-keys'] });
    } catch (e) {
      toast(errorMessage(e, t), 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className={`dv-key ${cls}`}>
      <header className="dv-key__head">
        <strong className="dv-key__name">{k.project}</strong>
        <span className={`dv-key__status ${cls}`}>{t(label)}</span>
      </header>
      {k.prefix && !closed && <code className="dv-key__prefix">{k.prefix}••••••••</code>}
      {k.status === 'pending' && <p className="small soft">{t('dev.pendingBody')}</p>}
      {k.status === 'rejected' && <p className="small soft">{k.reject_reason ? t('dev.rejectedWhy', { why: k.reject_reason }) : t('dev.rejectedBody')}</p>}
      {k.status === 'paused' && <p className="small soft">{t('dev.pausedBody')}</p>}
      {(k.status === 'active' || k.status === 'paused') && (
        <div className="dv-key__use">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="tiny muted">{t('dev.today', { n: num(k.usage_today, lang), max: num(k.per_day, lang) })}</span>
            <span className="tiny muted">{t('dev.perMinute', { n: num(k.per_minute, lang) })}</span>
          </div>
          <Progress value={Math.min(k.usage_today, k.per_day)} max={k.per_day} />
          <span className="tiny muted">{k.last_used_at ? t('dev.lastUsed', { when: timeAgo(k.last_used_at, lang) }) : t('dev.neverUsed')}</span>
        </div>
      )}
      {k.status === 'active' && !k.revealed_at && <p className="dv-key__ready small"><IconCheck size={15} />{t('dev.approved')}</p>}
      <div className="row-wrap">
        {k.can_reveal && <button className="btn btn--sm" disabled={!!busy} onClick={() => act('reveal')}>{busy === 'reveal' && <span className="spinner" />}{t('dev.reveal')}</button>}
        {k.can_rotate && <button className="btn btn--outline btn--sm" disabled={!!busy} onClick={() => act('rotate')}>{busy === 'rotate' && <span className="spinner" />}{t('dev.rotate')}</button>}
        {k.can_revoke && (
          <button className="btn btn--ghost btn--sm dv-key__revoke" disabled={!!busy} onClick={() => act('revoke')}>
            {busy === 'revoke' && <span className="spinner" />}{k.status === 'pending' ? t('dev.withdraw') : t('dev.revoke')}
          </button>
        )}
      </div>
    </article>
  );
}

/** The key, shown this one time. It lives only in this dialog's state and is dropped when the dialog closes. */
function RevealModal({ secret, onClose }: { secret: string | null; onClose: () => void }) {
  const { t } = useI18n();
  const [saved, setSaved] = useState(false);
  useEffect(() => setSaved(false), [secret]);
  return (
    <Modal open={!!secret} onClose={() => saved && onClose()} locked={!saved} title={t('dev.revealTitle')} width={540}>
      <p className="small soft" style={{ marginTop: 0 }}>{t('dev.revealBody')}</p>
      <div className="dv-secret">
        <code>{secret}</code>
        {secret && <CopyButton value={secret} label={t('common.copy')} />}
      </div>
      <label className="dv-check dv-saved">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        <span className="small">{t('dev.savedCheck')}</span>
      </label>
      <button className="btn btn--lg btn--block" disabled={!saved} onClick={onClose}>{t('dev.done')}</button>
    </Modal>
  );
}

function RequestForm({ contact, first }: { contact: boolean; first: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const authed = useAuthedApi();
  const [f, setF] = useState({ project: '', useCase: '', website: '', contact: '' });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const p = f.project.trim(), u = f.useCase.trim();
  const ready = p.length >= 3 && p.length <= 60 && u.length >= 20 && u.length <= 1000 && agree;

  async function send() {
    setBusy(true);
    setError(null);
    try {
      await authed.post('/keys', { project: p, useCase: u, ...(f.website.trim() ? { website: f.website.trim() } : {}), ...(contact && f.contact.trim() ? { contact: f.contact.trim() } : {}) });
      toast(t('dev.sent'));
      setF({ project: '', useCase: '', website: '', contact: '' });
      setAgree(false);
      qc.invalidateQueries({ queryKey: ['api-keys'] });
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dv-form">
      <h3 className="dv-group__title"><IconPlus size={15} />{first ? t('dev.formTitle') : t('dev.formTitleMore')}</h3>
      <div className="field">
        <label className="label" htmlFor="dv-project">{t('dev.project')}</label>
        <input id="dv-project" className="input" maxLength={60} value={f.project} onChange={(e) => setF({ ...f, project: e.target.value })} placeholder={t('dev.projectPh')} />
      </div>
      <div className="field">
        <div className="st-count"><label className="label" htmlFor="dv-use">{t('dev.useCase')}</label><span className="tiny muted mono-num">{u.length} / 1000</span></div>
        <textarea id="dv-use" className="textarea" maxLength={1000} value={f.useCase} onChange={(e) => setF({ ...f, useCase: e.target.value })} placeholder={t('dev.useCasePh')} />
        <span className="hint">{t('dev.useCaseHint')}</span>
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="label" htmlFor="dv-site">{t('dev.website')} <span className="muted">({t('create.optional')})</span></label>
          <input id="dv-site" className="input" inputMode="url" maxLength={300} value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://" />
        </div>
        {contact && (
          <div className="field">
            <label className="label" htmlFor="dv-contact">{t('dev.contact')} <span className="muted">({t('create.optional')})</span></label>
            <input id="dv-contact" className="input" maxLength={120} value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} placeholder={t('dev.contactPh')} />
            <span className="hint">{t('dev.contactHint')}</span>
          </div>
        )}
      </div>
      <label className="dv-check">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span className="small">{t('dev.agree')} <button type="button" className="link" onClick={() => jump('dv-rules')}>{t('dev.rulesLink')}</button></span>
      </label>
      {error && <div className="notice notice--strong small"><IconAlert size={15} />{error}</div>}
      <div className="row-wrap">
        <button className="btn" disabled={!ready || busy} onClick={send}>{busy && <span className="spinner" />}{t('dev.send')}</button>
        <span className="tiny muted">{t('dev.review')}</span>
      </div>
    </div>
  );
}
