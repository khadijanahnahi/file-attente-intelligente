import { useSyncExternalStore } from 'react';
import { sessionCourante, surSession } from '../api/session';

/** Session de l'agent connecté (null si personne). Se met à jour à la connexion, à la déconnexion et sur 401. */
export function useSession() {
  return useSyncExternalStore(surSession, sessionCourante);
}
