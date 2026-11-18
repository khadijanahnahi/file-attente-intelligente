import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { connexion } from '../api/agent';
import { ApiError } from '../api/http';
import { ouvrirSession } from '../api/session';
import { ACCUEIL_ROLE } from '../auth/RequireRole';
import { useSession } from '../auth/useSession';
import LangSwitch from '../components/LangSwitch';
import MessageErreur, { useTexteErreur } from '../components/MessageErreur';

export default function Login() {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const session = useSession();
  const navigate = useNavigate();
  const lieu = useLocation();
  const [login, setLogin] = useState('');
  const [mdp, setMdp] = useState('');
  const [erreur, setErreur] = useState<unknown>(null);
  const [envoi, setEnvoi] = useState(false);

  if (session) return <Navigate to={ACCUEIL_ROLE[session.role]} replace />;

  async function envoyer(ev: FormEvent) {
    ev.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      const r = await connexion(login.trim(), mdp);
      ouvrirSession(r);
      const depuis = (lieu.state as { depuis?: string } | null)?.depuis;
      navigate(depuis && depuis.startsWith('/agent') ? depuis : ACCUEIL_ROLE[r.role], { replace: true });
    } catch (e) {
      setErreur(e);
      setEnvoi(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <div className="mb-8 flex justify-end">
        <LangSwitch />
      </div>
      <h1 className="text-[1.75rem] leading-tight font-bold">{t('connexion.titre')}</h1>
      <p className="mt-2 text-muted">{t('connexion.sousTitre')}</p>

      <form onSubmit={envoyer} className="mt-8 space-y-4">
        <div>
          <label htmlFor="login" className="mb-1 block text-sm font-semibold">{t('connexion.login')}</label>
          <input
            id="login" autoComplete="username" required dir="ltr" value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-line bg-sheet px-3 text-start text-base"
          />
        </div>
        <div>
          <label htmlFor="mdp" className="mb-1 block text-sm font-semibold">{t('connexion.mdp')}</label>
          <input
            id="mdp" type="password" autoComplete="current-password" required dir="ltr" value={mdp}
            onChange={(e) => setMdp(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-line bg-sheet px-3 text-start text-base"
          />
        </div>
        {erreur !== null && (
          <MessageErreur
            texte={erreur instanceof ApiError && erreur.status === 401 ? t('connexion.erreur') : texteErreur(erreur)}
          />
        )}
        <button
          type="submit" disabled={envoi}
          className="min-h-12 w-full rounded-xl bg-majorelle px-5 font-semibold text-white hover:bg-majorelle-dark disabled:opacity-60"
        >
          {envoi ? t('connexion.enCours') : t('connexion.bouton')}
        </button>
      </form>
    </div>
  );
}
