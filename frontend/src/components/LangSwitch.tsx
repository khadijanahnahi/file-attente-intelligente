import { useTranslation } from 'react-i18next';
import { changerLangue } from '../i18n';

export default function LangSwitch() {
  const { t, i18n } = useTranslation();
  const cible = i18n.language === 'ar' ? 'fr' : 'ar';
  return (
    <button
      type="button"
      onClick={() => changerLangue(cible)}
      lang={cible}
      aria-label={t('langue.changer')}
      className="min-h-11 rounded-full border border-line bg-sheet px-4 text-sm font-semibold text-ink hover:border-majorelle"
    >
      {t('langue.autre')}
    </button>
  );
}
