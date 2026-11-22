import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as api from '../../api/agent';
import { ApiError } from '../../api/http';
import type { GuichetView, TicketView } from '../../api/types';
import { useSession } from '../../auth/useSession';
import MessageErreur, { useTexteErreur } from '../../components/MessageErreur';
import { useTopic } from '../../hooks/useStomp';
import { nomService } from '../../i18n/nomService';
import { btnDanger, btnGrand, btnPrincipal, btnSecondaire, carte, EnteteEspace, Pastille, Section } from '../../components/agent/ui';

/**
 * Poste de l'agent de guichet (CU2). Le guichet est celui de l'agent connecté (déduit du jeton).
 * Le backend n'a pas de GET « mon guichet » : on essaie /api/guichet/moi (à ajouter, voir README) et,
 * à défaut, on reprend le dernier état connu renvoyé par ouvrir / pause / fermer.
 */
const cleGuichet = (agentId: number) => `guichet.${agentId}`;

function lireMemo(agentId: number): GuichetView | null {
  try {
    const v = localStorage.getItem(cleGuichet(agentId));
    return v ? (JSON.parse(v) as GuichetView) : null;
  } catch {
    return null;
  }
}

export default function Guichet() {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const session = useSession()!;
  const [guichet, setGuichet] = useState<GuichetView | null>(() => lireMemo(session.agentId));
  const [enCours, setEnCours] = useState<TicketView | null>(null);
  const [file, setFile] = useState<TicketView[]>([]);
  const [sansGuichet, setSansGuichet] = useState(false);
  const [erreur, setErreur] = useState<unknown>(null);
  const [erreurFile, setErreurFile] = useState<unknown>(null);
  const [occupe, setOccupe] = useState(false);
  const [annulerId, setAnnulerId] = useState<number | null>(null);
  const minuteur = useRef<number | undefined>(undefined);

  const memoriser = useCallback((g: GuichetView) => {
    setGuichet(g);
    try {
      localStorage.setItem(cleGuichet(session.agentId), JSON.stringify(g));
    } catch {
      /* rien */
    }
  }, [session.agentId]);

  const rafraichir = useCallback(async () => {
    const [g, cours, f] = await Promise.allSettled([api.monGuichet(), api.ticketEnCours(), api.fileDuGuichet()]);
    if (g.status === 'fulfilled') memoriser(g.value);
    setEnCours(cours.status === 'fulfilled' ? cours.value : null);
    if (cours.status === 'rejected' && !(cours.reason instanceof ApiError && cours.reason.status === 404)) {
      setErreur(cours.reason);
    }
    if (f.status === 'fulfilled') {
      setFile(f.value);
      setSansGuichet(false);
      setErreurFile(null);
    } else {
      setFile([]);
      if (f.reason instanceof ApiError && f.reason.status === 404) {
        setSansGuichet(true);
        setErreurFile(null);
      } else {
        setErreurFile(f.reason); // ex. guichet sans service : on l'affiche au lieu d'une file vide silencieuse
      }
    }
    // un ticket en cours prouve que le guichet est ouvert, même si l'état mémorisé est périmé
    if (cours.status === 'fulfilled') setGuichet((g0) => (g0 && g0.etat !== 'OUVERT' ? { ...g0, etat: 'OUVERT' } : g0));
  }, [memoriser]);

  useEffect(() => {
    void rafraichir();
    const id = window.setInterval(() => void rafraichir(), 15000);
    return () => window.clearInterval(id);
  }, [rafraichir]);
  useEffect(() => () => window.clearTimeout(minuteur.current), []);

  // Un citoyen prend ou annule un ticket : la file change, on recharge sans bruit.
  useTopic('/topic/ecran', () => {
    window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => void rafraichir(), 300);
  });

  async function agir<T>(action: () => Promise<T>, apres?: (r: T) => void) {
    setOccupe(true);
    setErreur(null);
    try {
      const r = await action();
      apres?.(r);
      await rafraichir();
    } catch (e) {
      setErreur(e);
    } finally {
      setOccupe(false);
    }
  }

  const etat = guichet?.etat ?? 'FERME';
  const ouvert = etat === 'OUVERT';
  const principal = `${btnPrincipal} ${btnGrand}`;
  const secondaire = btnSecondaire;
  const danger = btnDanger;
  const ton = ouvert ? 'ok' : etat === 'PAUSE' ? 'attention' : 'neutre';

  if (sansGuichet) {
    return (
      <>
        <EnteteEspace role="GUICHET" titre={t('guichet.titre')} sousTitre={t('espace.sous.GUICHET')} />
        <p className={`${carte} mt-6 p-6`}>{t('guichet.sansGuichet')}</p>
      </>
    );
  }

  return (
    <div className="space-y-8">
      <EnteteEspace
        role="GUICHET"
        titre={guichet ? t('ticket.guichet', { n: guichet.numero }) : t('guichet.titre')}
        sousTitre={guichet?.service ? nomService(guichet.service) : t('espace.sous.GUICHET')}
        actions={
          <>
            <Pastille ton={ton}>{t(`guichet.etat.${etat}`)}</Pastille>
            {!ouvert && (
              <button type="button" disabled={occupe} className={btnPrincipal} onClick={() => agir(api.ouvrirGuichet, memoriser)}>
                {etat === 'PAUSE' ? t('guichet.reprendre') : t('guichet.ouvrir')}
              </button>
            )}
            {ouvert && (
              <button type="button" disabled={occupe} className={secondaire} onClick={() => agir(api.pauseGuichet, memoriser)}>
                {t('guichet.pause')}
              </button>
            )}
            {etat !== 'FERME' && (
              <button type="button" disabled={occupe} className={secondaire} onClick={() => agir(api.fermerGuichet, memoriser)}>
                {t('guichet.fermer')}
              </button>
            )}
          </>
        }
      />

      {erreur !== null && <MessageErreur texte={texteErreur(erreur)} />}

      <div className="grid items-start gap-8 lg:grid-cols-[3fr_2fr]">
        <Section titre={t('guichet.enCours')}>
          {enCours ? (
            <div className={`${carte} overflow-hidden`}>
              <div className={`px-6 py-9 text-center ${enCours.etat === 'APPELE' ? 'bg-saffron' : 'bg-majorelle-tint'}`}>
                <p className="font-bold">{nomService(enCours.service)}</p>
                <p className="mt-1 text-[clamp(4rem,12vw,6.5rem)] leading-none font-extrabold tabular-nums">
                  <bdi dir="ltr">{enCours.numero}</bdi>
                </p>
                <p className="mt-4 inline-block rounded-full bg-ink px-4 py-1 text-sm font-bold text-white">{t(`ticket.etat.${enCours.etat}`)}</p>
                {enCours.priorite !== 'NORMALE' && <p className="mt-2 text-sm font-bold">{t(`guichet.priorite.${enCours.priorite}`)}</p>}
                {enCours.etat === 'APPELE' && <p className="mt-2 text-sm">{t('guichet.rappels', { n: enCours.nbRappels })}</p>}
              </div>
              <div className="stub-tear grid gap-3 p-5 sm:grid-cols-2">
                {enCours.etat === 'APPELE' ? (
                  <>
                    <button type="button" disabled={occupe} className={`${principal} sm:col-span-2`} onClick={() => agir(api.commencerTraitement)}>
                      {t('guichet.traiter')}
                    </button>
                    <button type="button" disabled={occupe} className={secondaire} onClick={() => agir(api.rappeler)}>{t('guichet.rappeler')}</button>
                    <button type="button" disabled={occupe} className={danger} onClick={() => agir(api.marquerAbsent)}>{t('guichet.absent')}</button>
                    <button type="button" disabled={occupe} className={`${secondaire} sm:col-span-2`} onClick={() => agir(api.annulerDernierAppel)}>
                      {t('guichet.annulerAppel')}
                    </button>
                    <p className="text-sm text-muted sm:col-span-2">{t('guichet.aideAbsent')}</p>
                  </>
                ) : (
                  <button type="button" disabled={occupe} className={`${principal} sm:col-span-2`} onClick={() => agir(api.terminer)}>
                    {t('guichet.terminer')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-line bg-white/60 p-10 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-majorelle-tint text-majorelle">
                <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" /><path d="M10 7v10" strokeDasharray="2 2.2" />
                </svg>
              </span>
              <p className="mt-4 text-lg font-bold">{t('guichet.aucunEnCours')}</p>
              <button
                type="button" disabled={occupe || !ouvert || file.length === 0} onClick={() => agir(api.appelerSuivant)}
                className={`${principal} mt-5 w-full max-w-xs`}
              >
                {t('guichet.appeler')}
              </button>
              {!ouvert && <p className="mt-3 text-sm text-muted">{t('guichet.ouvrirPourAppeler')}</p>}
            </div>
          )}
        </Section>

        <Section titre={t('guichet.file')} compteur={file.length}>
          {erreurFile !== null && <div className="mb-3"><MessageErreur texte={texteErreur(erreurFile)} /></div>}
          {file.length === 0 ? (
            <p className={`${carte} p-6 text-center text-muted`}>{t('guichet.fileVide')}</p>
          ) : (
            <ol className={`${carte} divide-y divide-line overflow-hidden`}>
              {file.map((tk, i) => (
                <li key={tk.id} className="flex min-h-16 items-center gap-3 px-4 py-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-paper text-sm font-bold text-muted tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-extrabold tabular-nums"><bdi dir="ltr">{tk.numero}</bdi></span>
                    {tk.priorite !== 'NORMALE' && <span className="block text-xs font-bold text-[#a15c00]">{t(`guichet.priorite.${tk.priorite}`)}</span>}
                  </span>
                  {annulerId === tk.id ? (
                    <span className="flex gap-1">
                      <button
                        type="button" disabled={occupe} className="min-h-11 rounded-lg bg-danger px-3 text-sm font-bold text-white"
                        onClick={() => agir(() => api.annulerTicketAgent(tk.id), () => setAnnulerId(null))}
                      >
                        {t('guichet.confirmer')}
                      </button>
                      <button type="button" className="min-h-11 px-2 text-sm font-bold text-muted" onClick={() => setAnnulerId(null)}>{t('guichet.non')}</button>
                    </span>
                  ) : (
                    <button type="button" className="min-h-11 rounded-lg px-3 text-sm font-bold text-danger hover:bg-danger/5" onClick={() => setAnnulerId(tk.id)}>
                      {t('guichet.annulerTicket')}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Section>
      </div>
    </div>
  );
}
