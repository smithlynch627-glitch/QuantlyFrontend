import { useI18n } from '../i18n';
import { ActivityTab } from './Collection';

export default function ActivityPage() {
  const { t } = useI18n();
  return (
    <div className="page container ap">
      <header className="ap-head">
        <span className="ap-head__live"><span className="live-dot" />{t('lp.live')}</span>
        <h1 className="ap-head__title">{t('act.title')}</h1>
        <p className="lead">{t('act.sub')}</p>
      </header>
      <ActivityTab rail />
    </div>
  );
}
