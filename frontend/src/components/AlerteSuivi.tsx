import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { activerAlertes, alertesAdemander, bip, notifierSysteme } from '../hooks/alerte';

/** Les champs de votre ticket (réponse de GET /api/tickets/{id}) dont le composant a besoin. */
interface TicketSuivi {
  numero: string;
  etat: string;
  position: number;
  guichet: number | null;
}

const TEXTES = {
  fr: {
    tour: (n: number | null) => `C'est votre tour ! Rendez-vous au guichet ${n ?? ''}.`,
    prochain: 'Vous êtes le prochain : préparez vos documents.',
    position: (n: number) => `Votre position est maintenant ${n}.`,
    activer: 'Activer les alertes sur cet appareil',
    aide: 'Vous serez prévenu par un son, une vibration et une notification quand votre tour approche.',
    ok: 'OK',
  },
  ar: {
    tour: (n: number | null) => `حان دورك! توجّه إلى الشباك ${n ?? ''}.`,
    prochain: 'أنت التالي: جهّز وثائقك.',
    position: (n: number) => `أصبح ترتيبك الآن ${n}.`,
    activer: 'تفعيل التنبيهات على هذا الجهاز',
    aide: 'سنُنبّهك بصوت واهتزاز وإشعار عندما يقترب دورك.',
    ok: 'حسنًا',
  },
};

/**
 * Alertes en direct pour le citoyen : bannière + bip + vibration + notification du navigateur
 * quand son ticket est appelé ou que sa position avance. Se place dans la page du ticket :
 *   <AlerteSuivi ticket={ticket} />
 * Ne dépend d'aucun style du projet (Tailwind standard) ni d'aucune clé de traduction.
 */
export default function AlerteSuivi({ ticket }: { ticket: TicketSuivi | null }) {
  const { i18n } = useTranslation();
  const tx = i18n.language?.startsWith('ar') ? TEXTES.ar : TEXTES.fr;
  const [alerte, setAlerte] = useState<{ texte: string; urgent: boolean } | null>(null);
  const [aActiver, setAActiver] = useState(alertesAdemander());
  const etatPrec = useRef<string | undefined>(undefined);
  const posPrec = useRef<number | null>(null);

  useEffect(() => {
    if (!ticket) return;
    if (ticket.etat === 'APPELE' && etatPrec.current !== 'APPELE') {
      const texte = tx.tour(ticket.guichet);
      setAlerte({ texte, urgent: true });
      navigator.vibrate?.([250, 120, 250, 120, 400]);
      bip(true);
      notifierSysteme(ticket.numero, texte);
    } else if (
      ticket.etat === 'EN_ATTENTE' &&
      posPrec.current !== null &&
      ticket.position > 0 &&
      ticket.position < posPrec.current
    ) {
      const texte = ticket.position === 1 ? tx.prochain : tx.position(ticket.position);
      setAlerte({ texte, urgent: ticket.position === 1 });
      navigator.vibrate?.(ticket.position === 1 ? [200, 100, 200] : [150]);
      bip(ticket.position === 1);
      notifierSysteme(ticket.numero, texte);
    }
    if (ticket.etat !== 'APPELE' && ticket.etat !== 'EN_ATTENTE') setAlerte(null);
    posPrec.current = ticket.etat === 'EN_ATTENTE' && ticket.position > 0 ? ticket.position : null;
    etatPrec.current = ticket.etat;
  }, [ticket, tx]);

  const actif = ticket?.etat === 'EN_ATTENTE' || ticket?.etat === 'APPELE';

  return (
    <>
      {alerte && (
        <div
          role="alert"
          className={`mb-4 flex items-start justify-between gap-3 rounded-2xl px-4 py-4 shadow-lg ${
            alerte.urgent ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-900'
          }`}
        >
          <p className="text-lg font-bold">{alerte.texte}</p>
          <button type="button" onClick={() => setAlerte(null)} className="shrink-0 rounded-lg border border-current px-3 py-2 text-sm font-semibold">
            {tx.ok}
          </button>
        </div>
      )}
      {actif && aActiver && (
        <div className="mb-4 rounded-xl border border-gray-300 bg-white p-4 text-sm">
          <p className="text-gray-600">{tx.aide}</p>
          <button
            type="button"
            onClick={() => void activerAlertes().then(() => setAActiver(false))}
            className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold"
          >
            {tx.activer}
          </button>
        </div>
      )}
    </>
  );
}
