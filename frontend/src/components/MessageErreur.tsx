import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/http';

/** Texte d'erreur affichable : message du backend s'il existe, sinon un message générique traduit. */
export function useTexteErreur() {
  const { t } = useTranslation();
  return (e: unknown) => {
    if (e instanceof ApiError) {
      if (e.status === 0) return t('erreurs.reseau');
      if (e.message) return e.message;
    }
    return e instanceof ApiError && e.status > 0 ? `${t('erreurs.generique')} (HTTP ${e.status})` : t('erreurs.generique');
  };
}

export default function MessageErreur({ texte, surReessayer }: { texte: string; surReessayer?: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="rounded-xl border border-danger/40 bg-white p-4 text-sm text-danger">
      <p>{texte}</p>
      {surReessayer && (
        <button type="button" onClick={surReessayer} className="mt-2 min-h-11 font-semibold underline">
          {t('erreurs.reessayer')}
        </button>
      )}
    </div>
  );
}
