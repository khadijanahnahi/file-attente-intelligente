import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listerServices } from '../../api/citoyen';
import type { ServiceView, TicketInfo } from '../../api/types';
import MessageErreur, { useTexteErreur } from '../../components/MessageErreur';
import TicketStub from '../../components/TicketStub';
import FormulaireTicket from '../citoyen/FormulaireTicket';
import { nomService } from '../../i18n/nomService';
import IconeService, { iconeDuService } from '../../components/accueil/IconeService';
import { btnPrincipal, carte, EnteteEspace } from '../../components/agent/ui';

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
    <div className="space-y-8">
      <EnteteEspace role="ACCUEIL" titre={t('accueil.titre')} sousTitre={t('accueil.sousTitre')} />
      <div className="mx-auto max-w-2xl">
        {cree ? (
          <div className="space-y-5">
            <TicketStub ticket={cree} />
            {cree.dejaExistant && <p className="rounded-xl bg-majorelle-tint p-3 text-sm font-medium">{t('ticket.dejaExistant')}</p>}
            <button type="button" onClick={nouveau} className={`${btnPrincipal} min-h-12 w-full`}>{t('accueil.nouveau')}</button>
          </div>
        ) : erreur !== null ? (
          <MessageErreur texte={texteErreur(erreur)} />
        ) : services === null ? (
          <p className="text-muted" aria-busy="true">{t('services.chargement')}</p>
        ) : choisi ? (
          <div className={`${carte} p-6`}>
            <h2 className="mb-4 text-lg font-extrabold">{nomService(choisi.nom)}</h2>
            <FormulaireTicket service={choisi} surFermer={() => setChoisi(null)} surCree={setCree} />
          </div>
        ) : (
          <ul className={`${carte} divide-y divide-line overflow-hidden`}>
            {services.map((s, i) => {
              const ferme = !s.actif || !s.ouvert;
              return (
                <li key={s.id}>
                  <button
                    type="button" disabled={ferme} onClick={() => setChoisi(s)}
                    className="flex min-h-20 w-full items-center gap-4 px-5 py-3 text-start transition-colors hover:bg-majorelle-tint disabled:opacity-60 disabled:hover:bg-transparent"
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-majorelle-tint text-majorelle">
                      <IconeService type={iconeDuService(s.prefixe, i)} className="size-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{nomService(s.nom)}</span>
                      {ferme && <span className="text-sm text-muted">{t('services.ferme')}</span>}
                    </span>
                    {!ferme && (
                      <span className="text-end text-sm text-muted">
                        <bdi dir="ltr" className="block text-2xl leading-none font-extrabold text-ink tabular-nums">{s.nbEnAttente}</bdi>
                        {t('services.enAttente').toLowerCase()}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
