import { useTranslation } from 'react-i18next';
import type { TicketInfo } from '../api/types';

/** Un nombre ou un numéro de ticket reste écrit de gauche à droite, même en arabe. */
function Ltr({ children }: { children: React.ReactNode }) {
  return <bdi dir="ltr">{children}</bdi>;
}

/** Ticket de papier : le numéro est l'élément principal, l'attente est détaillée sous le pointillé. */
export default function TicketStub({ ticket }: { ticket: TicketInfo }) {
  const { t } = useTranslation();
  const appele = ticket.etat === 'APPELE';
  const enAttente = ticket.etat === 'EN_ATTENTE' || ticket.etat === 'CREE';

  return (
    <article className="stub stub-print overflow-hidden" aria-label={t('ticket.titre')}>
      <div className={`px-6 pt-6 pb-8 text-center ${appele ? 'bg-saffron' : ''}`}>
        <p className={`text-sm font-medium ${appele ? 'text-ink' : 'text-muted'}`}>{ticket.service}</p>
        <p
          className="mt-2 text-[clamp(4.5rem,24vw,7.5rem)] leading-none font-bold tracking-tight tabular-nums"
          aria-label={ticket.numero}
        >
          <Ltr>{ticket.numero}</Ltr>
        </p>
        <p
          className={`mt-4 inline-block rounded-full px-3 py-1 text-sm font-semibold ${
            appele ? 'bg-ink text-white' : 'bg-majorelle-tint text-majorelle-dark'
          }`}
        >
          {t(`ticket.etat.${ticket.etat}`)}
        </p>
      </div>

      <div className="stub-tear" />

      {enAttente ? (
        <dl className="grid grid-cols-3 gap-2 px-4 py-5 text-center">
          <Mesure etiquette={t('ticket.position')} valeur={<Ltr>{ticket.position}</Ltr>} />
          <Mesure etiquette={t('ticket.devant')} valeur={<Ltr>{ticket.ticketsDevant}</Ltr>} />
          <Mesure etiquette={t('ticket.attente')} valeur={<Ltr>{t('ticket.min', { n: ticket.attenteEstimeeMin })}</Ltr>} />
        </dl>
      ) : ticket.guichet !== null ? (
        <p className="px-4 py-5 text-center text-2xl font-semibold">{t('ticket.guichet', { n: ticket.guichet })}</p>
      ) : (
        <div className="h-4" />
      )}
    </article>
  );
}

function Mesure({ etiquette, valeur }: { etiquette: string; valeur: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse items-center gap-1">
      <dt className="text-xs leading-snug text-muted">{etiquette}</dt>
      <dd className="text-2xl font-bold tabular-nums">{valeur}</dd>
    </div>
  );
}
