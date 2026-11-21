import { useTranslation } from 'react-i18next';
import type { ServiceView } from '../../api/types';
import IconeService, { iconeDuService } from './IconeService';
import { nomService } from '../../i18n/nomService';

const heure = (h?: string) => (h ? h.slice(0, 5) : '');

/** Un service est fermé s'il est désactivé ou hors de ses horaires. */
export const estFerme = (s: ServiceView) => s.actif === false || s.ouvert === false;

interface Props {
  service: ServiceView;
  position: number;
  selectionnee: boolean;
  surChoisir: () => void;
}

/**
 * Carte d'un service.
 *  - ouvert : cliquable, se soulève au survol (bordure bleue), bordure bleue épaisse une fois choisie ;
 *  - fermé : grisée et inactive (attribut disabled : ni clic ni focus clavier).
 */
export default function CarteService({ service, position, selectionnee, surChoisir }: Props) {
  const { t } = useTranslation();
  const ferme = estFerme(service);
  const aHoraires = Boolean(service.heureOuverture && service.heureFermeture);

  const etat = ferme
    ? 'cursor-not-allowed bg-gray-50 opacity-60 ring-1 ring-gray-200'
    : selectionnee
      ? 'cursor-pointer bg-white shadow-md ring-2 ring-blue-600'
      : 'cursor-pointer bg-white ring-1 ring-gray-200 hover:-translate-y-1 hover:shadow-md hover:ring-2 hover:ring-blue-800';

  return (
    <button
      type="button"
      disabled={ferme}
      aria-pressed={selectionnee}
      onClick={surChoisir}
      className={`relative flex h-full w-full flex-col gap-5 rounded-2xl p-6 text-start shadow-sm transition-all duration-300 ${etat}`}
    >
      <span
        className={`absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          ferme ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'
        }`}
      >
        <span aria-hidden="true" className={`size-2 rounded-full ${ferme ? 'bg-gray-400' : 'bg-emerald-500'}`} />
        {ferme ? t('services.ferme') : t('services.ouvert')}
      </span>

      <span className={`grid size-14 place-items-center rounded-xl ${ferme ? 'bg-gray-100 text-gray-400' : 'bg-majorelle-tint text-majorelle'}`}>
        <IconeService type={iconeDuService(service.prefixe, position)} />
      </span>

      <span className="block">
        <span className="block text-lg font-semibold text-balance text-ink">{nomService(service.nom)}</span>
        {aHoraires && (
          <span className="mt-1 block text-sm text-muted">
            {t(ferme ? 'services.horairesFerme' : 'services.horaires', { debut: heure(service.heureOuverture), fin: heure(service.heureFermeture) })}
          </span>
        )}
      </span>

      {!ferme && typeof service.nbEnAttente === 'number' && (
        <span className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-muted">
          <span>
            <bdi dir="ltr" className="font-bold text-ink tabular-nums">{service.nbEnAttente}</bdi> {t('services.enAttente')}
          </span>
          {typeof service.attenteEstimeeMin === 'number' && (
            <bdi dir="ltr" className="tabular-nums">{t('services.attenteEstimee', { n: service.attenteEstimeeMin })}</bdi>
          )}
        </span>
      )}
    </button>
  );
}
