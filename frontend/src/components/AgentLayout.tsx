import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fermerSession } from '../api/session';
import { useSession } from '../auth/useSession';
import { changerLangue, type Langue } from '../i18n';
import { Initiales, IconeRole, STYLE_ROLE } from './agent/ui';

/** Cadre commun des quatre espaces : marque, identité et rôle de l'agent connecté, langue, déconnexion. */
export default function AgentLayout() {
  const { t, i18n } = useTranslation();
  const session = useSession();
  const navigate = useNavigate();
  if (!session) return <Navigate to="/connexion" replace />;
  const langue = i18n.language === 'ar' ? 'ar' : 'fr';
  const s = STYLE_ROLE[session.role];

  const segment = (l: Langue, texte: string) => (
    <button
      type="button" lang={l} onClick={() => changerLangue(l)} aria-pressed={langue === l}
      className={`min-h-9 min-w-10 rounded-full px-3 text-sm font-bold transition-colors ${langue === l ? 'bg-majorelle text-white shadow-sm' : 'text-ink hover:bg-ink/5'}`}
    >
      {texte}
    </button>
  );

  return (
    <div className="lp-theme min-h-dvh bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#4f63f0] to-majorelle shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)]">
              <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
                <path d="M5 8h22a1 1 0 0 1 1 1v4.2a3 3 0 0 0 0 5.6V23a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4.2a3 3 0 0 0 0-5.6V9a1 1 0 0 1 1-1z" fill="#fff" />
                <path d="M15.5 13h8M15.5 16h8M15.5 19h5" stroke="var(--color-majorelle)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <span className="hidden leading-tight sm:block">
              <b className="block font-extrabold">{t('app.nom')}</b>
              <small className="text-xs font-semibold text-muted">{t('connexion.espaceAgent')}</small>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 rounded-full border border-line bg-white py-1 ps-1 pe-1 sm:pe-4">
              <Initiales nom={session.nom} role={session.role} className="size-9" />
              <span className="hidden min-w-0 leading-tight sm:block">
                <b className="block max-w-40 truncate text-sm font-bold">{session.nom}</b>
                <small className={`inline-flex items-center gap-1 text-xs font-bold ${s.texte}`}>
                  <IconeRole role={session.role} className="size-3.5" />
                  {t(`roles.${session.role}`)}
                </small>
              </span>
            </div>
            <div role="group" aria-label={t('langue.changer')} className="flex items-center gap-0.5 rounded-full border border-line bg-white p-1">
              {segment('fr', 'FR')}
              {segment('ar', 'عربي')}
            </div>
            <button
              type="button"
              onClick={() => {
                fermerSession();
                navigate('/connexion', { replace: true });
              }}
              aria-label={t('connexion.deconnexion')}
              title={t('connexion.deconnexion')}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-3 text-sm font-bold transition hover:border-danger hover:text-danger sm:px-4"
            >
              <svg viewBox="0 0 24 24" className="size-5 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" />
              </svg>
              <span className="hidden md:inline">{t('connexion.deconnexion')}</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
