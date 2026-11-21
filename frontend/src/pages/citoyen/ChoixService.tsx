import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listerServices } from '../../api/citoyen';
import type { ServiceView } from '../../api/types';
import CarteService, { estFerme } from '../../components/accueil/CarteService';
import { annoncerChoix, ecouterChoix } from '../../components/accueil/evenementsService';
import MessageErreur, { useTexteErreur } from '../../components/MessageErreur';
import { useTopic } from '../../hooks/useStomp';
import { useTicketEnCours } from '../../hooks/useTicketEnCours';
import FormulaireTicket from './FormulaireTicket';
import { nomService } from '../../i18n/nomService';

export default function ChoixService() {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const [services, setServices] = useState<ServiceView[] | null>(null);
  const [erreur, setErreur] = useState<unknown>(null);
  const [choisiId, setChoisiId] = useState<number | null>(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const ticketEnCours = useTicketEnCours();
  const minuteur = useRef<number | undefined>(undefined);
  const panneau = useRef<HTMLDivElement>(null);

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

  // Le service choisi doit rester ouvert : s'il ferme pendant la sélection, on la retire.
  const choisi = services?.find((s) => s.id === choisiId && !estFerme(s)) ?? null;

  useEffect(() => {
    if (choisi) panneau.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [choisi?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Un choix fait sur la carte (section plus bas) est repris ici.
  useEffect(
    () =>
      ecouterChoix('liste', (id) => {
        setChoisiId(id);
        setFormulaireOuvert(false);
      }),
    [],
  );

  function choisir(id: number) {
    const suivant = id === choisiId ? null : id;
    setChoisiId(suivant);
    setFormulaireOuvert(false);
    annoncerChoix(suivant, 'liste');
  }

  return (
    <section>
      <h2 className="text-center text-[1.75rem] leading-tight font-bold text-balance text-ink md:text-4xl">{t('services.titre')}</h2>
      <p className="mx-auto mt-3 max-w-prose text-center text-pretty text-muted">{t('services.sousTitre')}</p>

      {ticketEnCours && (
        <Link
          to={`/ticket/${ticketEnCours.id}`}
          className="mx-auto mt-6 flex min-h-14 max-w-2xl items-center justify-between gap-3 rounded-xl bg-majorelle px-4 py-3 text-white"
        >
          <span>
            {t('services.reprendre', { numero: '' })}
            <bdi dir="ltr" className="font-bold">{ticketEnCours.numero}</bdi>
          </span>
          <span className="font-semibold underline">{t('services.voirTicket')}</span>
        </Link>
      )}

      <div className="mt-10">
        {erreur !== null ? (
          <div className="mx-auto max-w-2xl">
            <MessageErreur texte={texteErreur(erreur)} surReessayer={charger} />
          </div>
        ) : services === null ? (
          <p className="text-center text-muted" aria-busy="true">{t('services.chargement')}</p>
        ) : services.length === 0 ? (
          <p className="text-center text-muted">{t('services.vide')}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {services.map((s, i) => (
              <li key={s.id}>
                <CarteService service={s} position={i} selectionnee={choisi?.id === s.id} surChoisir={() => choisir(s.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div ref={panneau} aria-live="polite">
        {choisi && (
          <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all duration-300">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p>
                <span className="block text-sm text-muted">{t('services.choisi')}</span>
                <span className="block text-lg font-semibold text-ink">{nomService(choisi.nom)}</span>
              </p>
              {!formulaireOuvert && (
                <button
                  type="button"
                  onClick={() => setFormulaireOuvert(true)}
                  className="min-h-12 rounded-xl bg-majorelle px-6 font-semibold text-white transition-all duration-300 hover:bg-majorelle-dark"
                >
                  {t('services.prendre')}
                </button>
              )}
            </div>
            {formulaireOuvert && (
              <div className="mt-5 border-t border-gray-200 pt-5">
                <FormulaireTicket service={choisi} surFermer={() => setFormulaireOuvert(false)} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
