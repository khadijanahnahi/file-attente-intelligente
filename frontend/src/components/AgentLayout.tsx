import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fermerSession } from '../api/session';
import { useSession } from '../auth/useSession';
import type { RoleAgent } from '../api/types';
import LangSwitch from './LangSwitch';

const LIENS: { vers: string; cle: string; roles: RoleAgent[] }[] = [
  { vers: '/agent/guichet', cle: 'nav.guichet', roles: ['GUICHET'] },
  { vers: '/agent/accueil', cle: 'nav.accueil', roles: ['ACCUEIL'] },
  { vers: '/agent/tableau', cle: 'nav.tableau', roles: ['RESPONSABLE'] },
  { vers: '/agent/admin', cle: 'nav.admin', roles: ['ADMIN'] },
];

/** Cadre commun des écrans d'agent : identité, navigation selon le rôle, déconnexion. */
export default function AgentLayout() {
  const { t } = useTranslation();
  const session = useSession();
  const navigate = useNavigate();
  if (!session) return <Navigate to="/connexion" replace />;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{session.nom}</p>
          <p className="text-sm text-muted">{t(`roles.${session.role}`)}</p>
        </div>
        <nav aria-label={t('nav.titre')} className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {LIENS.filter((l) => l.roles.includes(session.role)).map((l) => (
            <NavLink
              key={l.vers}
              to={l.vers}
              className={({ isActive }) =>
                `flex min-h-11 items-center rounded-lg px-4 font-semibold whitespace-nowrap ${
                  isActive ? 'bg-majorelle text-white' : 'text-ink hover:bg-majorelle-tint'
                }`
              }
            >
              {t(l.cle)}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch />
          <button
            type="button"
            onClick={() => {
              fermerSession();
              navigate('/connexion', { replace: true });
            }}
            className="min-h-11 rounded-full border border-line bg-sheet px-4 text-sm font-semibold hover:border-danger hover:text-danger"
          >
            {t('connexion.deconnexion')}
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
