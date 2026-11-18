import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listerServices } from '../../api/citoyen';
import type { ServiceView } from '../../api/types';
import MessageErreur, { useTexteErreur } from '../../components/MessageErreur';
import { useTopic } from '../../hooks/useStomp';
import { useTicketEnCours } from '../../hooks/useTicketEnCours';
import FormulaireTicket from './FormulaireTicket';

const heure = (h?: string) => (h ? h.slice(0, 5) : '');

export default function ChoixService() {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const [services, setServices] = useState<ServiceView[] | null>(null);
  const [erreur, setErreur] = useState<unknown>(null);
  const [ouvert, setOuvert] = useState<number | null>(null);
  const ticketEnCours = useTicketEnCours();
  const minuteur = useRef<number | undefined>(undefined);

  const charger = useCallback(() => {
    setErreur(null);
    listerServices().then(setServices).catch(setErreur);
  }, []);

  useEffect(charger, [charger]);

  // L'affluence change à chaque événement de file : on recharge la liste sans bruit.
  useTopic('/topic/ecran', () => {
    window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => listerServices().then(setServices).catch(() => {}), 400);
  });
  useEffect(() => () => window.clearTimeout(minuteur.current), []);

  return (
    <section>
      <h1 className="mt-2 text-balance text-[1.75rem] leading-tight font-bold">{t('services.titre')}</h1>
      <p className="mt-3 max-w-prose text-pretty text-muted">{t('services.sousTitre')}</p>

      {ticketEnCours && (
        <Link
          to={`/ticket/${ticketEnCours.id}`}
          className="mt-6 flex min-h-14 items-center justify-between gap-3 rounded-xl bg-majorelle px-4 py-3 text-white"
        >
          <span>
            {t('services.reprendre', { numero: '' })}
            <bdi dir="ltr" className="font-bold">{ticketEnCours.numero}</bdi>
          </span>
          <span className="font-semibold underline">{t('services.voirTicket')}</span>
        </Link>
      )}

      <div className="mt-8">
        {erreur !== null ? (
          <MessageErreur texte={texteErreur(erreur)} surReessayer={charger} />
        ) : services === null ? (
          <p className="text-muted" aria-busy="true">{t('services.chargement')}</p>
        ) : services.length === 0 ? (
          <p className="text-muted">{t('services.vide')}</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-sheet shadow-[0_2px_0_var(--color-line)]">
            {services.map((s) => (
              <LigneService
                key={s.id}
                service={s}
                deploye={ouvert === s.id}
                surBasculer={() => setOuvert(ouvert === s.id ? null : s.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function LigneService({ service, deploye, surBasculer }: { service: ServiceView; deploye: boolean; surBasculer: () => void }) {
  const { t } = useTranslation();
  const ferme = service.actif === false || service.ouvert === false;
  const panneau = `form-service-${service.id}`;

  return (
    <li className={deploye ? 'border-s-4 border-majorelle' : 'border-s-4 border-transparent'}>
      <button
        type="button"
        onClick={surBasculer}
        disabled={ferme}
        aria-expanded={deploye}
        aria-controls={panneau}
        className="flex min-h-20 w-full items-center justify-between gap-4 px-4 py-4 text-start disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="min-w-0">
          <span className="block text-lg font-semibold text-balance">{service.nom}</span>
          <span className="mt-0.5 block text-sm text-muted">
            {ferme
              ? t('services.ferme')
              : service.heureOuverture && service.heureFermeture
                ? t('services.horaires', { debut: heure(service.heureOuverture), fin: heure(service.heureFermeture) })
                : null}
          </span>
        </span>

        {!ferme && typeof service.nbEnAttente === 'number' && (
          <span className="shrink-0 text-end">
            <span className="block text-2xl leading-none font-bold tabular-nums">
              <bdi dir="ltr">{service.nbEnAttente}</bdi>
            </span>
            <span className="mt-1 block text-xs text-muted">
              {t('services.enAttente')}
              {typeof service.attenteEstimeeMin === 'number' && (
                <>
                  {' · '}
                  <bdi dir="ltr">{t('services.attenteEstimee', { n: service.attenteEstimeeMin })}</bdi>
                </>
              )}
            </span>
          </span>
        )}
      </button>

      {deploye && (
        <div id={panneau} className="border-t border-line bg-paper/60 px-4 py-5">
          <FormulaireTicket service={service} surFermer={surBasculer} />
        </div>
      )}
    </li>
  );
}
