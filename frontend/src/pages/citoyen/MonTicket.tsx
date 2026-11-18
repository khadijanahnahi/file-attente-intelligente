import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { annulerTicket, suivreTicket } from '../../api/citoyen';
import { ApiError } from '../../api/http';
import type { EvenementEcran, NotificationPush, TicketInfo } from '../../api/types';
import MessageErreur, { useTexteErreur } from '../../components/MessageErreur';
import TicketStub from '../../components/TicketStub';
import { useConnexionTempsReel, useTopic } from '../../hooks/useStomp';
import { contactsMemorises, estActif, memoriserTicket } from '../../hooks/useTicketEnCours';

const CLE_MESSAGE: Record<TicketInfo['etat'], string> = {
  CREE: 'attente',
  EN_ATTENTE: 'attente',
  APPELE: 'appele',
  EN_TRAITEMENT: 'enTraitement',
  TERMINE: 'termine',
  ABSENT: 'absent',
  ANNULE: 'annule',
};

export default function MonTicket() {
  const { id } = useParams();
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const initial = (useLocation().state as { ticket?: TicketInfo } | null)?.ticket;
  const [ticket, setTicket] = useState<TicketInfo | null>(initial ?? null);
  const [erreur, setErreur] = useState<unknown>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState(false);
  const [quitter, setQuitter] = useState(false);
  const [contact, setContact] = useState('');
  const [contactRefuse, setContactRefuse] = useState(false);
  const navigate = useNavigate();
  const [annulation, setAnnulation] = useState(false);
  const direct = useConnexionTempsReel();
  const ticketRef = useRef(ticket);
  const minuteur = useRef<number | undefined>(undefined);
  const etatPrecedent = useRef(ticket?.etat);

  useEffect(() => {
    ticketRef.current = ticket;
  }, [ticket]);

  const charger = useCallback(async () => {
    if (!id) return;
    try {
      setTicket(await suivreTicket(id));
      setErreur(null);
    } catch (e) {
      setErreur(e);
    }
  }, [id]);

  /** Plusieurs événements peuvent arriver d'un coup : une seule relecture suffit. */
  const rafraichir = useCallback(() => {
    window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => void charger(), 200);
  }, [charger]);

  // Lecture initiale, puis filet de sécurité si le temps réel est coupé (toutes les 20 s et au retour sur la page).
  useEffect(() => {
    void charger();
    const cycle = window.setInterval(() => void charger(), 20000);
    const auRetour = () => document.visibilityState === 'visible' && void charger();
    document.addEventListener('visibilitychange', auRetour);
    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(minuteur.current);
      document.removeEventListener('visibilitychange', auRetour);
    };
  }, [charger]);

  useTopic<NotificationPush>(id ? `/topic/ticket/${id}` : null, (m) => {
    if (m?.message) setMessages((liste) => [m.message, ...liste].slice(0, 5));
    rafraichir();
  });
  useTopic<EvenementEcran>('/topic/ecran', (e) => {
    if (ticketRef.current && e.service === ticketRef.current.service) rafraichir();
  });

  // Mémorisation du ticket sur l'appareil, vibration et titre d'onglet quand c'est le tour du citoyen.
  useEffect(() => {
    if (!ticket) return;
    memoriserTicket(estActif(ticket.etat) ? ticket.id : null);
    if (ticket.etat === 'APPELE' && etatPrecedent.current !== 'APPELE') {
      navigator.vibrate?.([250, 120, 250]);
    }
    etatPrecedent.current = ticket.etat;
    document.title =
      ticket.etat === 'APPELE' && ticket.guichet !== null
        ? `${ticket.numero} → ${t('ticket.guichet', { n: ticket.guichet })}`
        : `${ticket.numero} · ${t('app.nom')}`;
  }, [ticket, t]);
  useEffect(() => () => void (document.title = t('app.nom')), [t]);

  async function annuler() {
    if (!id) return;
    setAnnulation(true);
    setErreur(null);
    // Contact saisi en premier, puis ceux mémorisés à la prise du ticket (téléphone, e-mail) : le backend
    // compare avec le citoyen rattaché au ticket et répond 404 si ce n'est pas le bon.
    const candidats = [contact.trim(), ...contactsMemorises(Number(id))].filter((c, i, l) => c && l.indexOf(c) === i);
    let derniere: unknown = null;
    try {
      for (const c of candidats) {
        try {
          setTicket(await annulerTicket(id, c));
          setConfirmation(false);
          return;
        } catch (e) {
          derniere = e;
          if (!(e instanceof ApiError && e.status === 404)) throw e;
        }
      }
      setContactRefuse(true);
      throw derniere ?? new ApiError(404, '');
    } catch (e) {
      setErreur(e);
    } finally {
      setAnnulation(false);
    }
  }

  if (!ticket) {
    if (erreur instanceof ApiError && erreur.status === 404) {
      return <Introuvable />;
    }
    if (erreur !== null) return <MessageErreur texte={texteErreur(erreur)} surReessayer={() => void charger()} />;
    return <p className="py-10 text-center text-muted" aria-busy="true">…</p>;
  }

  const actif = estActif(ticket.etat);

  return (
    <section>
      {initial?.dejaExistant && (
        <p role="status" className="mb-4 rounded-xl bg-majorelle-tint px-4 py-3 text-sm font-medium text-majorelle-dark">
          {t('ticket.dejaExistant')}
        </p>
      )}

      <TicketStub ticket={ticket} />

      <p
        role="status"
        aria-live="polite"
        className={`mt-6 text-center text-lg text-pretty ${ticket.etat === 'APPELE' ? 'font-bold' : ''}`}
      >
        {t(`ticket.message.${CLE_MESSAGE[ticket.etat]}`, { n: ticket.guichet ?? '' })}
      </p>

      {actif && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
          <span className={`size-2 rounded-full ${direct ? 'bg-ok' : 'bg-line'}`} aria-hidden="true" />
          {direct ? t('ticket.direct') : t('ticket.reconnexion')}
        </p>
      )}

      {messages.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">{t('ticket.messages')}</h2>
          <ul className="divide-y divide-line rounded-xl bg-sheet text-sm shadow-[0_2px_0_var(--color-line)]">
            {messages.map((m, i) => (
              <li key={`${i}-${m}`} className="px-4 py-3">{m}</li>
            ))}
          </ul>
        </div>
      )}

      {erreur !== null && <div className="mt-6"><MessageErreur texte={texteErreur(erreur)} /></div>}

      <div className="mt-8 flex flex-col gap-3">
        {ticket.etat === 'EN_ATTENTE' &&
          (confirmation ? (
            <div className="space-y-3 rounded-2xl border border-danger/40 bg-sheet p-4">
              <p className="text-sm">{t('ticket.annulerAide')}</p>
              {(contactsMemorises(ticket.id).length === 0 || contactRefuse) && (
                <div>
                  <label htmlFor="contact-annulation" className="mb-1 block text-sm font-semibold">
                    {t('ticket.contactAnnulation')}
                  </label>
                  <input
                    id="contact-annulation" dir="ltr" autoComplete="off" value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-line bg-sheet px-3 text-start text-base"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => void annuler()}
                disabled={annulation || ((contactsMemorises(ticket.id).length === 0 || contactRefuse) && contact.trim() === '')}
                className="min-h-12 w-full rounded-xl bg-danger px-5 font-semibold text-white disabled:opacity-60"
              >
                {t('ticket.confirmerAnnuler')}
              </button>
              <button type="button" onClick={() => setConfirmation(false)} className="min-h-12 w-full rounded-xl border border-line bg-sheet px-5 font-semibold">
                {t('ticket.garder')}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmation(true)} className="min-h-12 rounded-xl border border-line bg-sheet px-5 font-semibold text-danger">
              {t('ticket.annuler')}
            </button>
          ))}

        {actif && (
          <div className="mt-2 border-t border-line pt-5">
            {quitter ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">{t('ticket.quitterAide', { numero: ticket.numero })}</p>
                <button
                  type="button"
                  onClick={() => {
                    memoriserTicket(null);
                    navigate('/');
                  }}
                  className="min-h-12 w-full rounded-xl border border-line bg-sheet px-5 font-semibold hover:border-majorelle"
                >
                  {t('ticket.quitterConfirmer')}
                </button>
                <button type="button" onClick={() => setQuitter(false)} className="min-h-12 w-full px-5 font-semibold text-muted">
                  {t('ticket.garder')}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setQuitter(true)} className="min-h-12 w-full px-5 font-semibold text-muted hover:text-ink">
                {t('ticket.quitter')}
              </button>
            )}
          </div>
        )}

        {!actif && (
          <Link to="/" className="flex min-h-12 items-center justify-center rounded-xl bg-majorelle px-5 font-semibold text-white">
            {t('ticket.nouveau')}
          </Link>
        )}
      </div>
    </section>
  );
}

function Introuvable() {
  const { t } = useTranslation();
  return (
    <section className="py-12 text-center">
      <p className="text-lg">{t('ticket.introuvable')}</p>
      <Link to="/" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-majorelle px-5 font-semibold text-white">
        {t('ticket.nouveau')}
      </Link>
    </section>
  );
}
