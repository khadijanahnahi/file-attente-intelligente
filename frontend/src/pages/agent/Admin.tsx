import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  affecterGuichet, creerAgent, creerGuichet, listerAgents, listerGuichets, modifierAgent,
} from '../../api/agent';
import { listerServices } from '../../api/citoyen';
import type { AgentView, GuichetView, RoleAgent, ServiceView } from '../../api/types';
import { useSession } from '../../auth/useSession';
import MessageErreur, { useTexteErreur } from '../../components/MessageErreur';
import Onglets from '../../components/Onglets';
import ServicesConfig from '../../components/ServicesConfig';
import { nomService } from '../../i18n/nomService';

const ROLES: RoleAgent[] = ['ACCUEIL', 'GUICHET', 'RESPONSABLE', 'ADMIN'];
const champ = 'min-h-11 w-full rounded-lg border border-line bg-sheet px-3 text-base font-normal';
const boutonPrincipal =
  'min-h-11 rounded-lg bg-majorelle px-5 font-semibold text-white hover:bg-majorelle-dark disabled:opacity-60';

/** Administrateur : agents et rôles, guichets (affectation), services. */
export default function Admin() {
  const { t } = useTranslation();
  const [onglet, setOnglet] = useState<'agents' | 'guichets' | 'services'>('agents');
  return (
    <div className="mt-2">
      <h1 className="text-[1.75rem] leading-tight font-bold">{t('admin.titre')}</h1>
      <div className="mt-4">
        <Onglets
          libelle={t('admin.titre')} valeur={onglet} surChoix={setOnglet}
          options={[
            { id: 'agents', titre: t('admin.agents') },
            { id: 'guichets', titre: t('admin.guichets') },
            { id: 'services', titre: t('admin.services') },
          ]}
        />
      </div>
      <div className="mt-6">
        {onglet === 'agents' && <Agents />}
        {onglet === 'guichets' && <Guichets />}
        {onglet === 'services' && <ServicesConfig peutCreer />}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ agents

function Agents() {
  const texteErreur = useTexteErreur();
  const moi = useSession()!;
  const [agents, setAgents] = useState<AgentView[] | null>(null);
  const [erreur, setErreur] = useState<unknown>(null);

  const charger = useCallback(() => {
    listerAgents().then(setAgents).catch(setErreur);
  }, []);
  useEffect(charger, [charger]);

  const remplacer = (a: AgentView) => setAgents((l) => l?.map((x) => (x.id === a.id ? a : x)) ?? null);

  return (
    <div className="space-y-6">
      {erreur !== null && <MessageErreur texte={texteErreur(erreur)} surReessayer={charger} />}
      {agents && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-sheet shadow-[0_2px_0_var(--color-line)]">
          {agents.map((a) => (
            <LigneAgent key={a.id} agent={a} estMoi={a.id === moi.agentId} surChange={remplacer} />
          ))}
        </ul>
      )}
      <NouvelAgent surCree={(a) => setAgents((l) => [...(l ?? []), a])} />
    </div>
  );
}

function LigneAgent({ agent, estMoi, surChange }: { agent: AgentView; estMoi: boolean; surChange: (a: AgentView) => void }) {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const [erreur, setErreur] = useState<unknown>(null);
  const [mdp, setMdp] = useState<string | null>(null);

  async function modifier(corps: Parameters<typeof modifierAgent>[1]) {
    setErreur(null);
    try {
      surChange(await modifierAgent(agent.id, corps));
      setMdp(null);
    } catch (e) {
      setErreur(e);
    }
  }

  return (
    <li className="p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-40 flex-1">
          <p className={`font-semibold ${agent.actif ? '' : 'text-muted line-through'}`}>{agent.nom}</p>
          <p className="text-sm text-muted" dir="ltr">{agent.login}</p>
        </div>
        <label className="text-sm font-semibold">
          <span className="sr-only">{t('admin.role')}</span>
          <select
            value={agent.role} disabled={estMoi}
            onChange={(e) => void modifier({ role: e.target.value as RoleAgent })}
            className="min-h-11 rounded-lg border border-line bg-sheet px-2 font-normal disabled:opacity-60"
          >
            {ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox" checked={agent.actif} disabled={estMoi}
            onChange={(e) => void modifier({ actif: e.target.checked })}
            className="size-5 accent-majorelle"
          />
          {t('admin.actif')}
        </label>
        <button type="button" onClick={() => setMdp(mdp === null ? '' : null)} className="min-h-11 px-2 text-sm font-semibold text-majorelle-dark underline">
          {t('admin.changerMdp')}
        </button>
      </div>
      {mdp !== null && (
        <form
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void modifier({ motDePasse: mdp });
          }}
        >
          <label className="text-sm font-semibold">
            {t('admin.nouveauMdp')}
            <input
              type="password" minLength={10} maxLength={72} required autoComplete="new-password" dir="ltr"
              value={mdp} onChange={(e) => setMdp(e.target.value)} className={`${champ} mt-1 w-64`}
            />
          </label>
          <button type="submit" className={boutonPrincipal}>{t('config.enregistrer')}</button>
        </form>
      )}
      {erreur !== null && <div className="mt-3"><MessageErreur texte={texteErreur(erreur)} /></div>}
    </li>
  );
}

function NouvelAgent({ surCree }: { surCree: (a: AgentView) => void }) {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const [nom, setNom] = useState('');
  const [login, setLogin] = useState('');
  const [mdp, setMdp] = useState('');
  const [role, setRole] = useState<RoleAgent>('GUICHET');
  const [erreur, setErreur] = useState<unknown>(null);
  const [occupe, setOccupe] = useState(false);

  async function creer(ev: FormEvent) {
    ev.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      surCree(await creerAgent({ nom: nom.trim(), login: login.trim(), motDePasse: mdp, role }));
      setNom('');
      setLogin('');
      setMdp('');
    } catch (e) {
      setErreur(e);
    } finally {
      setOccupe(false);
    }
  }

  return (
    <form onSubmit={creer} className="rounded-2xl border-2 border-dashed border-line p-5">
      <h3 className="text-lg font-semibold">{t('admin.nouvelAgent')}</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold">{t('admin.nom')}
          <input value={nom} onChange={(e) => setNom(e.target.value)} required maxLength={100} className={`${champ} mt-1`} />
        </label>
        <label className="text-sm font-semibold">{t('connexion.login')}
          <input value={login} onChange={(e) => setLogin(e.target.value)} required maxLength={60} dir="ltr" autoComplete="off" className={`${champ} mt-1`} />
        </label>
        <label className="text-sm font-semibold">{t('connexion.mdp')}
          <input type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} required minLength={10} maxLength={72} dir="ltr" autoComplete="new-password" className={`${champ} mt-1`} />
          <span className="mt-1 block text-xs font-normal text-muted">{t('admin.mdpAide')}</span>
        </label>
        <label className="text-sm font-semibold">{t('admin.role')}
          <select value={role} onChange={(e) => setRole(e.target.value as RoleAgent)} className={`${champ} mt-1`}>
            {ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
          </select>
        </label>
      </div>
      <button type="submit" disabled={occupe} className={`${boutonPrincipal} mt-4`}>{t('config.creer')}</button>
      {erreur !== null && <div className="mt-3"><MessageErreur texte={texteErreur(erreur)} /></div>}
    </form>
  );
}

// ------------------------------------------------------------------ guichets

function Guichets() {
  const texteErreur = useTexteErreur();
  const [guichets, setGuichets] = useState<GuichetView[] | null>(null);
  const [agents, setAgents] = useState<AgentView[]>([]);
  const [services, setServices] = useState<ServiceView[]>([]);
  const [erreur, setErreur] = useState<unknown>(null);

  const charger = useCallback(() => {
    Promise.all([listerGuichets(), listerAgents(), listerServices()])
      .then(([g, a, s]) => {
        setGuichets(g);
        setAgents(a.filter((x) => x.role === 'GUICHET' && x.actif));
        setServices(s);
      })
      .catch(setErreur);
  }, []);
  useEffect(charger, [charger]);

  return (
    <div className="space-y-6">
      {erreur !== null && <MessageErreur texte={texteErreur(erreur)} surReessayer={charger} />}
      {guichets && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-sheet shadow-[0_2px_0_var(--color-line)]">
          {guichets.map((g) => (
            <LigneGuichet
              key={g.id} guichet={g} agents={agents} services={services}
              surChange={(n) => setGuichets((l) => l?.map((x) => (x.id === n.id ? n : x)) ?? null)}
            />
          ))}
        </ul>
      )}
      <NouveauGuichet agents={agents} services={services} surCree={(g) => setGuichets((l) => [...(l ?? []), g])} />
    </div>
  );
}

function LigneGuichet({
  guichet, agents, services, surChange,
}: { guichet: GuichetView; agents: AgentView[]; services: ServiceView[]; surChange: (g: GuichetView) => void }) {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const [erreur, setErreur] = useState<unknown>(null);
  const verrou = guichet.etat !== 'FERME'; // le backend refuse d'affecter un guichet ouvert ou en pause

  async function affecter(serviceId: number | null, agentId: number | null) {
    setErreur(null);
    try {
      surChange(await affecterGuichet(guichet.id, { serviceId, agentId }));
    } catch (e) {
      setErreur(e);
    }
  }

  return (
    <li className="p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="min-w-28 font-semibold">
          {t('ticket.guichet', { n: guichet.numero })}
          <span className={`ms-2 text-sm ${guichet.etat === 'OUVERT' ? 'text-ok' : 'text-muted'}`}>{t(`guichet.etat.${guichet.etat}`)}</span>
        </p>
        <label className="text-sm font-semibold">
          <span className="sr-only">{t('admin.service')}</span>
          <select
            value={guichet.serviceId ?? ''} disabled={verrou}
            onChange={(e) => void affecter(e.target.value ? Number(e.target.value) : null, guichet.agentId)}
            className="min-h-11 rounded-lg border border-line bg-sheet px-2 font-normal disabled:opacity-60"
          >
            <option value="">{t('admin.aucunService')}</option>
            {services.map((s) => <option key={s.id} value={s.id}>{nomService(s.nom)}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">
          <span className="sr-only">{t('admin.agent')}</span>
          <select
            value={guichet.agentId ?? ''} disabled={verrou}
            onChange={(e) => void affecter(guichet.serviceId, e.target.value ? Number(e.target.value) : null)}
            className="min-h-11 rounded-lg border border-line bg-sheet px-2 font-normal disabled:opacity-60"
          >
            <option value="">{t('admin.aucunAgent')}</option>
            {/* l'agent déjà affecté reste listé même s'il n'est plus « disponible » */}
            {guichet.agentId && !agents.some((a) => a.id === guichet.agentId) && (
              <option value={guichet.agentId}>{guichet.agent}</option>
            )}
            {agents.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
        </label>
        {verrou && <span className="text-sm text-muted">{t('admin.affectationFerme')}</span>}
      </div>
      {erreur !== null && <div className="mt-3"><MessageErreur texte={texteErreur(erreur)} /></div>}
    </li>
  );
}

function NouveauGuichet({ agents, services, surCree }: { agents: AgentView[]; services: ServiceView[]; surCree: (g: GuichetView) => void }) {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const [numero, setNumero] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [erreur, setErreur] = useState<unknown>(null);
  const [occupe, setOccupe] = useState(false);

  async function creer(ev: FormEvent) {
    ev.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      surCree(await creerGuichet({ numero: Number(numero), serviceId: Number(serviceId), agentId: agentId ? Number(agentId) : null }));
      setNumero('');
    } catch (e) {
      setErreur(e);
    } finally {
      setOccupe(false);
    }
  }

  return (
    <form onSubmit={creer} className="rounded-2xl border-2 border-dashed border-line p-5">
      <h3 className="text-lg font-semibold">{t('admin.nouveauGuichet')}</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-semibold">{t('admin.numero')}
          <input type="number" min="1" value={numero} onChange={(e) => setNumero(e.target.value)} required dir="ltr" className={`${champ} mt-1`} />
        </label>
        <label className="text-sm font-semibold">{t('admin.service')}
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required className={`${champ} mt-1`}>
            <option value="" disabled>—</option>
            {services.map((s) => <option key={s.id} value={s.id}>{nomService(s.nom)}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">{t('admin.agent')}
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className={`${champ} mt-1`}>
            <option value="">{t('admin.aucunAgent')}</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
        </label>
      </div>
      <button type="submit" disabled={occupe} className={`${boutonPrincipal} mt-4`}>{t('config.creer')}</button>
      {erreur !== null && <div className="mt-3"><MessageErreur texte={texteErreur(erreur)} /></div>}
    </form>
  );
}
