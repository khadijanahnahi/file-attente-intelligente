import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { RoleAgent } from '../api/types';
import { useSession } from './useSession';

/** Page d'accueil de chaque rôle. */
export const ACCUEIL_ROLE: Record<RoleAgent, string> = {
  GUICHET: '/agent/guichet',
  ACCUEIL: '/agent/accueil',
  RESPONSABLE: '/agent/tableau',
  ADMIN: '/agent/admin',
};

/** Laisse passer les rôles listés (mêmes règles que SecurityConfig) ; sinon connexion ou page de son rôle. */
export default function RequireRole({ roles }: { roles: RoleAgent[] }) {
  const session = useSession();
  const lieu = useLocation();
  if (!session) return <Navigate to="/connexion" replace state={{ depuis: lieu.pathname }} />;
  if (!roles.includes(session.role)) return <Navigate to={ACCUEIL_ROLE[session.role]} replace />;
  return <Outlet />;
}
