import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { activerAlertes, alertesAdemander, bip, notifierSysteme } from '../hooks/alerte';

/** Champs de la réponse de GET /api/tickets/{id} utilisés ici. */
interface TicketSuivi {
  numero: string;
  etat: string;
  position: number;
  guichet: number | null;
}

type Alerte = { type: 'tour'; guichet: number | null } | { type: 'file'; position: number };

const TEXTES = {
  fr: {
    tour: "C'est votre tour",
    tourAide: (num: string) => `Présentez-vous maintenant avec le ticket ${num}.`,
    guichet: 'Guichet',
    prochain: 'Vous êtes le prochain',
    prochainAide: 'Préparez vos documents.',
    devant: (n: number) => (n === 1 ? 'Plus qu’une personne devant vous' : `Plus que ${n} personnes devant vous`),
    devantAide: (p: number) => `Votre position dans la file : ${p}`,
    notif: (a: Alerte, num: string) =>
      a.type === 'tour' ? `C'est votre tour ! Guichet ${a.guichet ?? ''}` : a.position === 1 ? `${num} : vous êtes le prochain` : `${num} : plus que ${a.position - 1} personne(s) devant vous`,
    activer: 'Activer les alertes',
    aide: 'Son, vibration et notification quand votre tour approche.',
    fermer: 'Fermer l’alerte',
    personnes: 'personnes devant vous',
    vous: 'Vous',
  },
  ar: {
    tour: 'حان دورك',
    tourAide: (num: string) => `توجّه الآن إلى الشباك بالتذكرة ${num}.`,
    guichet: 'الشباك',
    prochain: 'أنت التالي',
    prochainAide: 'جهّز وثائقك.',
    devant: (n: number) => (n === 1 ? 'بقي شخص واحد أمامك' : n === 2 ? 'بقي شخصان أمامك' : `بقي ${n} أشخاص أمامك`),
    devantAide: (p: number) => `ترتيبك في الطابور: ${p}`,
    notif: (a: Alerte, num: string) =>
      a.type === 'tour' ? `حان دورك! الشباك ${a.guichet ?? ''}` : a.position === 1 ? `${num}: أنت التالي` : `${num}: بقي ${a.position - 1} أمامك`,
    activer: 'تفعيل التنبيهات',
    aide: 'صوت واهتزاز وإشعار عندما يقترب دورك.',
    fermer: 'إغلاق التنبيه',
    personnes: 'أشخاص أمامك',
    vous: 'أنت',
  },
};

/** File de personnes : chaque rond est quelqu'un devant le citoyen, le dernier (plein) est le citoyen. */
function FileDePersonnes({ devant, vous }: { devant: number; vous: string }) {
  const visibles = Math.min(devant, 6);
  return (
    <div className="mt-4 flex items-center gap-1.5" dir="ltr" aria-hidden="true">
      {Array.from({ length: visibles }, (_, i) => (
        <span key={i} className="size-5 rounded-full bg-majorelle/25" />
      ))}
      {devant > visibles && <span className="px-1 text-xs font-semibold text-majorelle-dark">+{devant - visibles}</span>}
      <span className="ms-1 flex h-7 items-center rounded-full bg-majorelle px-3 text-xs font-bold text-white ring-4 ring-majorelle/20">
        {vous}
      </span>
    </div>
  );
}

const IcCloche = () => (
  <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

/**
 * Alertes en direct pour le citoyen : panneau de guichet quand c'est son tour, file de personnes
 * quand sa position avance. Bip, vibration et notification du navigateur en plus (si autorisés).
 *   <AlerteSuivi ticket={ticket} />
 */
export default function AlerteSuivi({ ticket }: { ticket: TicketSuivi | null }) {
  const { i18n } = useTranslation();
  const tx = i18n.language?.startsWith('ar') ? TEXTES.ar : TEXTES.fr;
  const [alerte, setAlerte] = useState<Alerte | null>(null);
  const [aActiver, setAActiver] = useState(alertesAdemander());
  const etatPrec = useRef<string | undefined>(undefined);
  const posPrec = useRef<number | null>(null);

  useEffect(() => {
    if (!ticket) return;
    let nouvelle: Alerte | null = null;
    if (ticket.etat === 'APPELE' && etatPrec.current !== 'APPELE') {
      nouvelle = { type: 'tour', guichet: ticket.guichet };
      navigator.vibrate?.([250, 120, 250, 120, 400]);
      bip(true);
    } else if (
      ticket.etat === 'EN_ATTENTE' &&
      posPrec.current !== null &&
      ticket.position > 0 &&
      ticket.position < posPrec.current
    ) {
      nouvelle = { type: 'file', position: ticket.position };
      navigator.vibrate?.(ticket.position === 1 ? [200, 100, 200] : [150]);
      bip(ticket.position === 1);
    }
    if (nouvelle) {
      setAlerte(nouvelle);
      notifierSysteme(ticket.numero, tx.notif(nouvelle, ticket.numero));
    }
    if (ticket.etat !== 'APPELE' && ticket.etat !== 'EN_ATTENTE') setAlerte(null);
    posPrec.current = ticket.etat === 'EN_ATTENTE' && ticket.position > 0 ? ticket.position : null;
    etatPrec.current = ticket.etat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket]);

  const actif = ticket?.etat === 'EN_ATTENTE' || ticket?.etat === 'APPELE';
  const bouton =
    'absolute top-3 inset-e-3 grid size-9 place-items-center rounded-full text-lg leading-none focus-visible:outline-2';

  return (
    <>
      {alerte?.type === 'tour' && (
        <div
          role="alert"
          className="alerte-entree relative mb-5 flex items-center gap-4 overflow-hidden rounded-3xl bg-majorelle p-5 pe-14 text-white shadow-[0_10px_30px_-10px_rgba(43,63,203,0.7)]"
        >
          <div className="relative shrink-0">
            <span className="alerte-onde absolute inset-0 rounded-2xl bg-saffron" aria-hidden="true" />
            <div className="relative grid size-20 place-items-center rounded-2xl bg-saffron text-ink">
              <div className="text-center leading-none">
                <p className="text-[0.7rem] font-semibold">{tx.guichet}</p>
                <p className="mt-1 text-4xl font-bold tabular-nums">{alerte.guichet ?? '–'}</p>
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-2xl leading-tight font-bold">{tx.tour}</p>
            <p className="mt-1 text-sm text-white/85 text-pretty">{tx.tourAide(ticket?.numero ?? '')}</p>
          </div>
          <button type="button" onClick={() => setAlerte(null)} aria-label={tx.fermer} className={`${bouton} text-white/80 hover:bg-white/15`}>
            ×
          </button>
        </div>
      )}

      {alerte?.type === 'file' && (
        <div role="alert" className="alerte-entree relative mb-5 rounded-3xl bg-majorelle-tint p-5 pe-14 text-ink">
          <p className="text-xl leading-tight font-bold text-majorelle-dark">
            {alerte.position === 1 ? tx.prochain : tx.devant(alerte.position - 1)}
          </p>
          <p className="mt-1 text-sm text-muted">{alerte.position === 1 ? tx.prochainAide : tx.devantAide(alerte.position)}</p>
          <FileDePersonnes devant={alerte.position - 1} vous={tx.vous} />
          <button type="button" onClick={() => setAlerte(null)} aria-label={tx.fermer} className={`${bouton} text-majorelle-dark hover:bg-majorelle/10`}>
            ×
          </button>
        </div>
      )}

      {actif && aActiver && (
        <button
          type="button"
          onClick={() => void activerAlertes().then(() => setAActiver(false))}
          className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-line bg-sheet px-4 py-3 text-start hover:border-majorelle"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-majorelle-tint text-majorelle-dark">
            <IcCloche />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold">{tx.activer}</span>
            <span className="block text-sm text-muted">{tx.aide}</span>
          </span>
        </button>
      )}
    </>
  );
}
