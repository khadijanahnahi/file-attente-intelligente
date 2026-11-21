import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { changerPolitique, creerService, modifierService } from '../api/agent';
import { listerServices } from '../api/citoyen';
import type { CodePolitique, ServiceView } from '../api/types';
import MessageErreur, { useTexteErreur } from './MessageErreur';
import { nomService } from '../i18n/nomService';

const POLITIQUES: CodePolitique[] = ['FIFO', 'PRIORITE', 'CHARGE_EQUILIBREE'];
const champ = 'min-h-11 w-full rounded-lg border border-line bg-sheet px-3 text-base';
const hhmm = (h: string) => h.slice(0, 5);

/**
 * Configuration des services : politique de file (Strategy), horaires, durée moyenne, capacité, activation.
 * Responsable et administrateur (PUT /api/config/services/**) ; l'administrateur peut en plus créer un service.
 */
export default function ServicesConfig({ peutCreer }: { peutCreer?: boolean }) {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const [services, setServices] = useState<ServiceView[] | null>(null);
  const [erreur, setErreur] = useState<unknown>(null);

  const charger = useCallback(() => {
    listerServices().then(setServices).catch(setErreur);
  }, []);
  useEffect(charger, [charger]);

  const remplacer = (s: ServiceView) => setServices((l) => l?.map((x) => (x.id === s.id ? s : x)) ?? null);

  return (
    <div className="space-y-6">
      {erreur !== null && <MessageErreur texte={texteErreur(erreur)} surReessayer={charger} />}
      {services === null && erreur === null && <p className="text-muted">{t('services.chargement')}</p>}
      {services?.map((s) => <LigneService key={s.id} service={s} surChange={remplacer} />)}
      {peutCreer && <NouveauService surCree={(s) => setServices((l) => [...(l ?? []), s])} />}
    </div>
  );
}

function LigneService({ service, surChange }: { service: ServiceView; surChange: (s: ServiceView) => void }) {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const [nom, setNom] = useState(service.nom);
  const [duree, setDuree] = useState(String(service.dureeMoyenneMin));
  const [capacite, setCapacite] = useState(String(service.capaciteMax));
  const [ouverture, setOuverture] = useState(hhmm(service.heureOuverture));
  const [fermeture, setFermeture] = useState(hhmm(service.heureFermeture));
  const [actif, setActif] = useState(service.actif);
  const [erreur, setErreur] = useState<unknown>(null);
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);

  async function enregistrer(ev: FormEvent) {
    ev.preventDefault();
    setOccupe(true);
    setErreur(null);
    setMessage('');
    try {
      const s = await modifierService(service.id, {
        nom: nom.trim(), dureeMoyenneMin: Number(duree), capaciteMax: Number(capacite),
        heureOuverture: ouverture, heureFermeture: fermeture, actif,
      });
      surChange(s);
      setMessage(t('config.enregistre'));
    } catch (e) {
      setErreur(e);
    } finally {
      setOccupe(false);
    }
  }

  async function politique(p: CodePolitique) {
    setErreur(null);
    setMessage('');
    try {
      surChange(await changerPolitique(service.id, p));
      setMessage(t('config.enregistre'));
    } catch (e) {
      setErreur(e);
    }
  }

  return (
    <form onSubmit={enregistrer} className="rounded-2xl bg-sheet p-5 shadow-[0_2px_0_var(--color-line)]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold">
          {nomService(service.nom)} <span className="text-sm font-normal text-muted">({service.prefixe})</span>
        </h3>
        <label className="flex items-center gap-2 text-sm font-semibold">
          {t('config.politique')}
          <select
            value={service.politique} onChange={(e) => void politique(e.target.value as CodePolitique)}
            className="min-h-11 rounded-lg border border-line bg-sheet px-2"
          >
            {POLITIQUES.map((p) => <option key={p} value={p}>{t(`config.politiques.${p}`)}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold sm:col-span-2 lg:col-span-4">
          {t('config.nom')}
          <input value={nom} onChange={(e) => setNom(e.target.value)} className={`${champ} mt-1 font-normal`} required />
        </label>
        <label className="text-sm font-semibold">
          {t('config.duree')}
          <input type="number" min="0.01" step="0.5" dir="ltr" value={duree} onChange={(e) => setDuree(e.target.value)} className={`${champ} mt-1 font-normal`} />
        </label>
        <label className="text-sm font-semibold">
          {t('config.capacite')}
          <input type="number" min="1" dir="ltr" value={capacite} onChange={(e) => setCapacite(e.target.value)} className={`${champ} mt-1 font-normal`} />
        </label>
        <label className="text-sm font-semibold">
          {t('config.ouverture')}
          <input type="time" dir="ltr" value={ouverture} onChange={(e) => setOuverture(e.target.value)} className={`${champ} mt-1 font-normal`} />
        </label>
        <label className="text-sm font-semibold">
          {t('config.fermeture')}
          <input type="time" dir="ltr" value={fermeture} onChange={(e) => setFermeture(e.target.value)} className={`${champ} mt-1 font-normal`} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex min-h-11 items-center gap-2 font-medium">
          <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} className="size-5 accent-majorelle" />
          {t('config.actif')}
        </label>
        <button type="submit" disabled={occupe} className="min-h-11 rounded-lg bg-majorelle px-5 font-semibold text-white hover:bg-majorelle-dark disabled:opacity-60">
          {t('config.enregistrer')}
        </button>
        {message && <span role="status" className="text-sm font-semibold text-ok">{message}</span>}
      </div>
      {erreur !== null && <div className="mt-3"><MessageErreur texte={texteErreur(erreur)} /></div>}
    </form>
  );
}

function NouveauService({ surCree }: { surCree: (s: ServiceView) => void }) {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const [nom, setNom] = useState('');
  const [prefixe, setPrefixe] = useState('');
  const [erreur, setErreur] = useState<unknown>(null);
  const [occupe, setOccupe] = useState(false);

  async function creer(ev: FormEvent) {
    ev.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      surCree(await creerService({ nom: nom.trim(), prefixe: prefixe.trim().toUpperCase() }));
      setNom('');
      setPrefixe('');
    } catch (e) {
      setErreur(e);
    } finally {
      setOccupe(false);
    }
  }

  return (
    <form onSubmit={creer} className="rounded-2xl border-2 border-dashed border-line p-5">
      <h3 className="text-lg font-semibold">{t('config.nouveauService')}</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
        <label className="text-sm font-semibold">
          {t('config.nom')}
          <input value={nom} onChange={(e) => setNom(e.target.value)} required maxLength={120} className={`${champ} mt-1 font-normal`} />
        </label>
        <label className="text-sm font-semibold">
          {t('config.prefixe')}
          <input value={prefixe} onChange={(e) => setPrefixe(e.target.value)} required maxLength={3} dir="ltr" className={`${champ} mt-1 font-normal uppercase`} />
        </label>
        <button type="submit" disabled={occupe} className="min-h-11 rounded-lg bg-majorelle px-5 font-semibold text-white hover:bg-majorelle-dark disabled:opacity-60">
          {t('config.creer')}
        </button>
      </div>
      {erreur !== null && <div className="mt-3"><MessageErreur texte={texteErreur(erreur)} /></div>}
    </form>
  );
}
