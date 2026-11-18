import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listerServices } from '../../api/citoyen';
import type { ServiceView, TicketInfo } from '../../api/types';
import MessageErreur, { useTexteErreur } from '../../components/MessageErreur';
import TicketStub from '../../components/TicketStub';
import FormulaireTicket from '../citoyen/FormulaireTicket';

/** Agent d'accueil : crée un ticket pour un citoyen sans smartphone (POST /api/accueil/tickets). */
export default function Accueil() {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const [services, setServices] = useState<ServiceView[] | null>(null);
  const [erreur, setErreur] = useState<unknown>(null);
  const [choisi, setChoisi] = useState<ServiceView | null>(null);
  const [cree, setCree] = useState<TicketInfo | null>(null);

  useEffect(() => {
    listerServices().then(setServices).catch(setErreur);
  }, []);

  function nouveau() {
    setCree(null);
    setChoisi(null);
  }

  return (
    <div className="mx-auto mt-2 max-w-lg">
      <h1 className="text-[1.75rem] leading-tight font-bold">{t('accueil.titre')}</h1>
      <p className="mt-2 text-muted">{t('accueil.sousTitre')}</p>

      {cree ? (
        <div className="mt-6 space-y-5">
          <TicketStub ticket={cree} />
          {cree.dejaExistant && <p className="rounded-xl bg-majorelle-tint p-3 text-sm font-medium">{t('ticket.dejaExistant')}</p>}
          <button
            type="button" onClick={nouveau}
            className="min-h-12 w-full rounded-xl bg-majorelle px-5 font-semibold text-white hover:bg-majorelle-dark"
          >
            {t('accueil.nouveau')}
          </button>
        </div>
      ) : erreur !== null ? (
        <div className="mt-6"><MessageErreur texte={texteErreur(erreur)} /></div>
      ) : services === null ? (
        <p className="mt-6 text-muted" aria-busy="true">{t('services.chargement')}</p>
      ) : choisi ? (
        <div className="mt-6 rounded-2xl bg-sheet p-5 shadow-[0_2px_0_var(--color-line)]">
          <h2 className="mb-4 text-lg font-semibold">{choisi.nom}</h2>
          <FormulaireTicket service={choisi} surFermer={() => setChoisi(null)} surCree={setCree} />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-sheet shadow-[0_2px_0_var(--color-line)]">
          {services.map((s) => {
            const ferme = !s.actif || !s.ouvert;
            return (
              <li key={s.id}>
                <button
                  type="button" disabled={ferme} onClick={() => setChoisi(s)}
                  className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 text-start disabled:opacity-60"
                >
                  <span>
                    <span className="block font-semibold">{s.nom}</span>
                    {ferme && <span className="text-sm text-muted">{t('services.ferme')}</span>}
                  </span>
                  {!ferme && (
                    <span className="text-sm text-muted">
                      <bdi dir="ltr" className="text-lg font-bold text-ink tabular-nums">{s.nbEnAttente}</bdi> {t('services.enAttente').toLowerCase()}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
