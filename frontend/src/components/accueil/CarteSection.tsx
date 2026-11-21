import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listerServices } from '../../api/citoyen';
import type { ServiceView } from '../../api/types';
import CarteDesServices from './CarteDesServices';
import { annoncerChoix, ecouterChoix } from './evenementsService';

/** Section décorative : la carte en points. Choisir une pastille sélectionne la démarche dans la liste plus haut. */
export default function CarteSection() {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceView[]>([]);
  const [choisiId, setChoisiId] = useState<number | null>(null);

  useEffect(() => {
    let actif = true;
    listerServices().then((s) => actif && setServices(s)).catch(() => {}); // décoratif : pas d'erreur affichée
    const arreter = ecouterChoix('carte', setChoisiId);
    return () => {
      actif = false;
      arreter();
    };
  }, []);

  if (services.length === 0) return null;

  function choisir(id: number) {
    const suivant = id === choisiId ? null : id;
    setChoisiId(suivant);
    annoncerChoix(suivant, 'carte');
    if (suivant !== null) document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="py-14">
      <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-12">
        <div className="lp-rv">
          <h2 className="text-[clamp(1.7rem,3.6vw,2.5rem)] leading-tight font-extrabold text-balance">{t('landing.carte.titre')}</h2>
          <p className="mt-3 max-w-[40ch] text-muted">{t('landing.carte.texte')}</p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-orange-400" />
            {t('landing.carte.legende')}
          </p>
        </div>
        <CarteDesServices services={services} choisiId={choisiId} surChoisir={choisir} className="lp-rv" />
      </div>
    </section>
  );
}
