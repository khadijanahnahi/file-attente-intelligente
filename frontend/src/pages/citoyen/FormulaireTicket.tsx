import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { prendreTicket } from '../../api/citoyen';
import { ticketPourCitoyen } from '../../api/agent';
import type { MotifPriorite, PriseTicketRequest, ServiceView, TicketInfo } from '../../api/types';
import MessageErreur, { useTexteErreur } from '../../components/MessageErreur';
import { memoriserContact, memoriserTicket } from '../../hooks/useTicketEnCours';

const MOTIFS: MotifPriorite[] = ['PERSONNE_AGEE', 'HANDICAP', 'FEMME_ENCEINTE'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEPHONE = /^\+?\d{8,15}$/;

type Erreurs = Partial<Record<'contact' | 'telephone' | 'email' | 'motif', string>>;

/**
 * Formulaire de prise de ticket. Côté citoyen (par défaut) il crée le ticket puis ouvre la page de suivi.
 * Côté agent d'accueil, passer surCree : le ticket est créé via /api/accueil/tickets et rendu à l'appelant.
 */
export default function FormulaireTicket({
  service, surFermer, surCree,
}: { service: ServiceView; surFermer: () => void; surCree?: (ticket: TicketInfo) => void }) {
  const { t, i18n } = useTranslation();
  const texteErreur = useTexteErreur();
  const navigate = useNavigate();
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [prioritaire, setPrioritaire] = useState(false);
  const [motif, setMotif] = useState<MotifPriorite | ''>('');
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurServeur, setErreurServeur] = useState<unknown>(null);
  const [envoi, setEnvoi] = useState(false);

  function valider(): Erreurs {
    const e: Erreurs = {};
    const tel = telephone.replace(/[\s.-]/g, '');
    if (!tel && !email.trim()) e.contact = t('form.erreurs.contact');
    if (tel && !TELEPHONE.test(tel)) e.telephone = t('form.erreurs.telephone');
    if (email.trim() && !EMAIL.test(email.trim())) e.email = t('form.erreurs.email');
    if (prioritaire && !motif) e.motif = t('form.erreurs.motif');
    return e;
  }

  async function envoyer(ev: FormEvent) {
    ev.preventDefault();
    const e = valider();
    setErreurs(e);
    setErreurServeur(null);
    if (Object.keys(e).length > 0) return;

    const demande: PriseTicketRequest = {
      serviceId: service.id,
      nom: nom.trim() || undefined,
      telephone: telephone.replace(/[\s.-]/g, '') || undefined,
      email: email.trim() || undefined,
      langue: i18n.language === 'ar' ? 'ar' : 'fr',
      priorite: prioritaire ? 'PRIORITAIRE' : 'NORMALE',
      motif: prioritaire && motif ? motif : undefined,
    };
    setEnvoi(true);
    try {
      if (surCree) {
        surCree(await ticketPourCitoyen(demande));
        return;
      }
      const ticket = await prendreTicket(demande);
      memoriserTicket(ticket.id);
      memoriserContact(ticket.id, [demande.telephone, demande.email]);
      navigate(`/ticket/${ticket.id}`, { state: { ticket } });
    } catch (err) {
      setErreurServeur(err);
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={envoyer} noValidate className="space-y-4">
      <h2 className="text-base font-semibold">{t('form.titre')}</h2>

      <Champ id="nom" etiquette={t('form.nom')} aide={t('form.facultatif')}>
        <input id="nom" autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} className={entree} />
      </Champ>

      <Champ id="tel" etiquette={t('form.telephone')} erreur={erreurs.telephone}>
        <input
          id="tel"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          aria-invalid={!!erreurs.telephone}
          className={`${entree} text-start`}
          placeholder="06 12 34 56 78"
        />
      </Champ>

      <Champ id="email" etiquette={t('form.email')} erreur={erreurs.email}>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!erreurs.email}
          className={`${entree} text-start`}
        />
      </Champ>

      <p className={`text-sm ${erreurs.contact ? 'font-semibold text-danger' : 'text-muted'}`} role={erreurs.contact ? 'alert' : undefined}>
        {erreurs.contact ?? t('form.contactAide')}
      </p>

      <label className="flex min-h-11 items-center gap-3 font-medium">
        <input
          type="checkbox"
          checked={prioritaire}
          onChange={(e) => setPrioritaire(e.target.checked)}
          className="size-5 accent-majorelle"
        />
        {t('form.priorite')}
      </label>

      {prioritaire && (
        <fieldset className="space-y-1">
          <legend className="mb-1 text-sm font-semibold">{t('form.motifTitre')}</legend>
          {MOTIFS.map((m) => (
            <label key={m} className="flex min-h-11 items-center gap-3">
              <input
                type="radio"
                name="motif"
                value={m}
                checked={motif === m}
                onChange={() => setMotif(m)}
                className="size-5 accent-majorelle"
              />
              {t(`form.motif.${m}`)}
            </label>
          ))}
          {erreurs.motif && <p role="alert" className="text-sm font-semibold text-danger">{erreurs.motif}</p>}
        </fieldset>
      )}

      {erreurServeur !== null && <MessageErreur texte={texteErreur(erreurServeur)} />}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={envoi}
          className="min-h-12 flex-1 rounded-xl bg-majorelle px-5 font-semibold text-white hover:bg-majorelle-dark disabled:opacity-60"
        >
          {envoi ? t('form.envoi') : t('form.envoyer')}
        </button>
        <button type="button" onClick={surFermer} className="min-h-12 rounded-xl px-4 font-semibold text-muted hover:text-ink">
          {t('form.annuler')}
        </button>
      </div>
    </form>
  );
}

const entree =
  'min-h-12 w-full rounded-xl border border-line bg-sheet px-3 text-base aria-[invalid=true]:border-danger';

function Champ({
  id, etiquette, aide, erreur, children,
}: { id: string; etiquette: string; aide?: string; erreur?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex items-baseline justify-between gap-2 text-sm font-semibold">
        <span>{etiquette}</span>
        {aide && <span className="font-normal text-muted">{aide}</span>}
      </label>
      {children}
      {erreur && <p role="alert" className="mt-1 text-sm font-semibold text-danger">{erreur}</p>}
    </div>
  );
}
