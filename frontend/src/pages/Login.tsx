import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { connexion } from '../api/agent';
import { ApiError } from '../api/http';
import { ouvrirSession } from '../api/session';
import { ACCUEIL_ROLE } from '../auth/RequireRole';
import { useSession } from '../auth/useSession';
import { changerLangue, type Langue } from '../i18n';
import MessageErreur, { useTexteErreur } from '../components/MessageErreur';

export default function Login() {
  const { t, i18n } = useTranslation();
  const langue = i18n.language === 'ar' ? 'ar' : 'fr';
  const texteErreur = useTexteErreur();
  const session = useSession();
  const navigate = useNavigate();
  const lieu = useLocation();
  const [login, setLogin] = useState('');
  const [mdp, setMdp] = useState('');
  const [erreur, setErreur] = useState<unknown>(null);
  const [envoi, setEnvoi] = useState(false);
  const [voir, setVoir] = useState(false);

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

  const segment = (l: Langue, texte: string) => (
    <button
      type="button" lang={l} onClick={() => changerLangue(l)} aria-pressed={langue === l}
      className={`min-h-9 min-w-11 rounded-full px-3 text-sm font-bold transition-colors ${langue === l ? 'bg-white text-majorelle shadow-sm' : 'text-white hover:bg-white/10'}`}
    >
      {texte}
    </button>
  );
  const champ =
    'min-h-13 w-full rounded-xl border border-line bg-white ps-12 text-start text-base transition focus:border-majorelle focus:ring-4 focus:ring-majorelle/15 focus:outline-none';

  return (
    <div className="lp-theme relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#2b3fcb] to-[#16295f]">
      <div className="pointer-events-none absolute -end-24 -top-24 size-96 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -start-16 bottom-10 size-72 rounded-full bg-white/5" />
      {/* Formulaire */}
      <main className="relative flex min-h-dvh flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 text-sm font-bold text-white transition-transform hover:bg-white/20 hover:-translate-x-0.5 rtl:hover:translate-x-0.5">
            <svg viewBox="0 0 24 24" className="size-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            {t('connexion.retour')}
          </Link>
          <div role="group" aria-label={t('langue.changer')} className="flex items-center gap-0.5 rounded-full border border-white/25 bg-white/10 p-1">
            {segment('fr', 'FR')}
            {segment('ar', 'عربي')}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-center text-[2rem] leading-tight font-extrabold text-white">{t('connexion.titre')}</h1>
          <p className="mt-2 text-center text-white/80">{t('connexion.sousTitre')}</p>

          <form onSubmit={envoyer} className="mt-8 space-y-5 rounded-3xl border border-line bg-white p-6 shadow-[0_24px_50px_-30px_rgb(14_34_56/0.35)] sm:p-7">
            <div>
              <label htmlFor="login" className="mb-1.5 block text-sm font-bold">{t('connexion.login')}</label>
              <div className="relative">
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
                <input id="login" autoComplete="username" required dir="ltr" value={login} onChange={(e) => setLogin(e.target.value)} className={`${champ} pe-4`} />
              </div>
            </div>
            <div>
              <label htmlFor="mdp" className="mb-1.5 block text-sm font-bold">{t('connexion.mdp')}</label>
              <div className="relative">
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                <input id="mdp" type={voir ? 'text' : 'password'} autoComplete="current-password" required dir="ltr" value={mdp} onChange={(e) => setMdp(e.target.value)} className={`${champ} pe-12`} />
                <button
                  type="button" onClick={() => setVoir((v) => !v)} aria-pressed={voir} aria-label={t(voir ? 'connexion.masquer' : 'connexion.afficher')}
                  className="absolute end-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
                    {voir && <path d="M4 4l16 16" />}
                  </svg>
                </button>
              </div>
            </div>
            {erreur !== null && (
              <MessageErreur texte={erreur instanceof ApiError && erreur.status === 401 ? t('connexion.erreur') : texteErreur(erreur)} />
            )}
            <button
              type="submit" disabled={envoi}
              className="flex min-h-13 w-full items-center justify-center gap-2.5 rounded-xl bg-majorelle px-5 font-bold text-white shadow-[0_14px_24px_-14px_rgb(43_63_203/0.9)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:translate-y-0 disabled:opacity-70"
            >
              {envoi && (
                <svg viewBox="0 0 24 24" className="size-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 3a9 9 0 1 1-9 9" /></svg>
              )}
              {envoi ? t('connexion.enCours') : t('connexion.bouton')}
            </button>
          </form>
          <p className="mt-5 flex items-center justify-center gap-2 text-sm text-white/75">
            <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
            {t('connexion.reserve')}
          </p>
        </div>
      </main>
    </div>
  );
}
