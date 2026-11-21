import type { ServiceView } from '../../api/types';
import { estFerme } from './CarteService';
import { CARTE_HAUTEUR, CARTE_LARGEUR, CARTE_POINTS } from './carteDesPoints';
import IconeService, { iconeDuService } from './IconeService';
import { nomService } from '../../i18n/nomService';

/** Emplacements des pastilles (en % de la carte). Décoratifs : les services d'une commune ne sont pas géolocalisés. */
const EMPLACEMENTS = [
  { x: 27, y: 60 },
  { x: 38, y: 44 },
  { x: 48, y: 62 },
  { x: 58, y: 42 },
  { x: 67, y: 58 },
  { x: 76, y: 45 },
];

interface Props {
  services: ServiceView[];
  choisiId: number | null;
  surChoisir: (id: number) => void;
  className?: string;
}

/**
 * Carte en points avec une pastille ronde par service. La pastille du service choisi grossit
 * et son point orange pulse ; un service fermé reste grisé et ne se choisit pas.
 */
export default function CarteDesServices({ services, choisiId, surChoisir, className = '' }: Props) {
  return (
    <div
      className={`relative aspect-[6/5] w-full overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200 ${className}`}
      style={{ backgroundImage: 'radial-gradient(circle at 50% 42%, var(--color-majorelle-tint), transparent 72%)' }}
    >
      <svg viewBox={`0 0 ${CARTE_LARGEUR} ${CARTE_HAUTEUR}`} className="absolute inset-0 size-full" aria-hidden="true">
        <path d={CARTE_POINTS} fill="none" stroke="var(--color-majorelle)" strokeOpacity="0.22" strokeWidth="4.2" strokeLinecap="round" />
      </svg>

      {services.map((s, i) => {
        const place = EMPLACEMENTS[i % EMPLACEMENTS.length];
        const ferme = estFerme(s);
        const choisi = choisiId === s.id && !ferme;
        const bulle = ferme
          ? 'size-11 bg-gray-200 text-gray-400'
          : choisi
            ? 'size-[4.5rem] bg-majorelle text-white shadow-xl'
            : 'size-11 bg-majorelle-tint text-majorelle shadow-md hover:scale-110';
        return (
          <button
            key={s.id}
            type="button"
            disabled={ferme}
            aria-pressed={choisi}
            aria-label={nomService(s.nom)}
            title={nomService(s.nom)}
            onClick={() => surChoisir(s.id)}
            className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center disabled:cursor-not-allowed"
            style={{ left: `${place.x}%`, top: `${place.y}%`, zIndex: choisi ? 20 : 10 }}
          >
            <span className={`grid place-items-center rounded-full border-[3px] border-white transition-all duration-300 ${bulle}`}>
              <IconeService type={iconeDuService(s.prefixe, i)} className={choisi ? 'size-9' : 'size-5'} />
            </span>
            <span className={`w-0.5 bg-gray-300 transition-all duration-300 ${choisi ? 'h-4' : 'h-3'}`} />
            <span className="relative grid place-items-center">
              <span className={`size-2.5 rounded-full ${ferme ? 'bg-gray-300' : 'bg-orange-400'}`} />
              {choisi && <span className="absolute size-5 animate-[lp-ping_2s_infinite] rounded-full bg-orange-400/40" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
