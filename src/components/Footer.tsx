import { Link, useLocation } from 'react-router-dom';
import { BRAND, LINKS, OFFICIAL, activeChain } from '../config';
import { useI18n } from '../i18n';
import { ThemeToggle } from './Header';
import { SocialLink } from './Social';
import { Logo } from './Logo';
import { useAppConfig } from '../lib/appConfig';

/**
 * Site footer: one stage with the brand on top, the site's links as labelled rows (not columns), and the name set
 * very large along the bottom edge. Support and Security are reached from here.
 */
export function Footer() {
  const { t } = useI18n();
  const { socials } = useAppConfig();
  const { pathname } = useLocation();
  // The invitation to launch is pointless on the pages where the visitor is already creating or managing one.
  const showLaunch = !['/create', '/studio', '/official'].some((p) => pathname.startsWith(p));
  const explorer = activeChain.blockExplorers?.default.url;
  return (
    <footer className="ft">
      <div className="ft__stage oc-stage">
        <div className="ft__top">
          <Link to="/" className="ft__brand" aria-label={BRAND.name}>
            <Logo size={46} />
            <span>{BRAND.name}</span>
          </Link>
          <p className="ft__say">{t('footer.say')}</p>
          <div className="ft__actions">
            {socials?.x && <SocialLink kind="x" href={socials.x} />}
            {socials?.discord && <SocialLink kind="discord" href={socials.discord} />}
            {socials?.telegram && <SocialLink kind="telegram" href={socials.telegram} />}
            <ThemeToggle withLabel />
            {showLaunch && <Link to="/create" className="btn btn--white">{t('home.launch')}</Link>}
          </div>
        </div>

        <nav className="ft__index" aria-label={t('footer.nav')}>
          <div className="ft__row">
            <h2 className="ft__label">{t('footer.market')}</h2>
            <div className="ft__links">
              <Link to="/explore">{t('nav.explore')}</Link>
              <Link to="/launchpad">{t('nav.launchpad')}</Link>
              <Link to="/activity">{t('nav.activity')}</Link>
              <Link to="/create">{t('nav.create')}</Link>
              <Link to={`/${OFFICIAL.slug}`}>{OFFICIAL.name}</Link>
            </div>
          </div>
          <div className="ft__row">
            <h2 className="ft__label">{t('footer.help')}</h2>
            <div className="ft__links">
              <Link to="/support">{t('nav.support')}</Link>
              <Link to="/security">{t('footer.security')}</Link>
              <Link to="/faq#marketplace">{t('footer.marketFaq')}</Link>
              <Link to="/faq#launchpad">{t('footer.launchFaq')}</Link>
            </div>
          </div>
          <div className="ft__row">
            <h2 className="ft__label">{t('footer.legal')}</h2>
            <div className="ft__links">
              <Link to="/terms">{t('legal.termsFull')}</Link>
              <Link to="/privacy">{t('legal.privacyFull')}</Link>
            </div>
          </div>
          <div className="ft__row">
            <h2 className="ft__label">{t('footer.network')}</h2>
            <div className="ft__links">
              <a href={LINKS.docs} target="_blank" rel="noreferrer">{t('footer.docs')}</a>
              {explorer && <a href={explorer} target="_blank" rel="noreferrer">{t('footer.explorer')}</a>}
              {activeChain.testnet && <a href={LINKS.faucet} target="_blank" rel="noreferrer">{t('footer.faucet')}</a>}
            </div>
          </div>
        </nav>

        <div className="ft__base">
          <span>© {new Date().getFullYear()} {BRAND.name}</span>
          <span>{t('footer.independent')}</span>
          <span>{t('footer.builtOn', { chain: activeChain.name })}</span>
        </div>

        <div className="ft__word" aria-hidden="true">{BRAND.name}</div>
      </div>
    </footer>
  );
}
