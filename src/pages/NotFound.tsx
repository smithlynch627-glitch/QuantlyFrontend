import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { TileArt } from '../components/Art';
import { IconArrowRight } from '../components/Icons';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="page container nf">
      <div className="nf__code" aria-hidden="true">
        <span>4</span>
        <span className="nf__tile"><TileArt seed="not-found" /></span>
        <span>4</span>
      </div>
      <h1 className="nf__title">{t('nf.title')}</h1>
      <p className="lead">{t('nf.body')}</p>
      <div className="row-wrap" style={{ justifyContent: 'center' }}>
        <Link className="btn btn--lg btn--glow" to="/">{t('nf.home')}</Link>
        <Link className="btn btn--lg btn--outline" to="/explore">{t('nav.explore')}<IconArrowRight size={16} /></Link>
      </div>
    </div>
  );
}
