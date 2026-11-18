import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <section className="py-16 text-center">
      <h1 className="text-2xl font-bold">{t('introuvable.titre')}</h1>
      <Link to="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-majorelle px-5 font-semibold text-white">
        {t('introuvable.retour')}
      </Link>
    </section>
  );
}
