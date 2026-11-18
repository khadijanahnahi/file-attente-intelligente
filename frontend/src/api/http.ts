import { fermerSession, jeton, sessionCourante } from './session';

/** Erreur renvoyée par l'API. status = 0 quand le serveur est injoignable. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function requete<T>(chemin: string, init?: RequestInit, garderSession = false): Promise<T> {
  const token = jeton();
  let reponse: Response;
  try {
    reponse = await fetch(chemin, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, '');
  }
  if (!reponse.ok) {
    let message = '';
    try {
      const corps = await reponse.json(); // backend : { statut, message, date }
      message = corps.message ?? corps.erreur ?? corps.error ?? '';
    } catch {
      // Corps vide ou non JSON avec un 5xx : c'est le proxy de Vite qui répond parce que le backend est arrêté.
      if (reponse.status >= 500) throw new ApiError(0, '');
    }
    // Jeton expiré ou refusé : on referme la session, l'écran de connexion prend le relais.
    // garderSession : appel facultatif (ex. /api/guichet/moi absent du backend, Spring répond 401 via /error).
    // Spring répond aussi 401 (via /error) pour une route inconnue ou une exception non gérée : on ne
    // déconnecte donc que si le jeton est réellement arrivé à expiration.
    if (reponse.status === 401 && token && !garderSession && (sessionCourante()?.expireLe ?? 0) <= Date.now()) fermerSession();
    throw new ApiError(reponse.status, typeof message === 'string' ? message : '');
  }
  if (reponse.status === 204) return undefined as T;
  return (await reponse.json()) as T;
}

const corps = (c: unknown) => (c === undefined ? undefined : JSON.stringify(c));

export const http = {
  get: <T>(chemin: string, garderSession = false) => requete<T>(chemin, undefined, garderSession),
  post: <T>(chemin: string, c?: unknown) => requete<T>(chemin, { method: 'POST', body: corps(c) }),
  put: <T>(chemin: string, c?: unknown) => requete<T>(chemin, { method: 'PUT', body: corps(c) }),
};
