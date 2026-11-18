import type { LoginResponse, RoleAgent } from './types';

/** Session de l'agent : jeton JWT + identité, gardés dans sessionStorage (effacés à la fermeture de l'onglet). */
export interface Session {
  jeton: string;
  agentId: number;
  nom: string;
  role: RoleAgent;
  expireLe: number; // ms epoch
}

const CLE = 'files.session';
let courante: Session | null = lire();
const ecouteurs = new Set<() => void>();

function lire(): Session | null {
  try {
    const brut = sessionStorage.getItem(CLE);
    if (!brut) return null;
    const s = JSON.parse(brut) as Session;
    return s.expireLe > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export const sessionCourante = () => courante;
export const jeton = () => courante?.jeton ?? null;

export function ouvrirSession(r: LoginResponse) {
  courante = { jeton: r.jeton, agentId: r.agentId, nom: r.nom, role: r.role, expireLe: Date.now() + r.expireDansSecondes * 1000 };
  try {
    sessionStorage.setItem(CLE, JSON.stringify(courante));
  } catch {
    /* stockage indisponible : la session reste en mémoire */
  }
  ecouteurs.forEach((e) => e());
}

export function fermerSession() {
  courante = null;
  try {
    sessionStorage.removeItem(CLE);
  } catch {
    /* rien */
  }
  ecouteurs.forEach((e) => e());
}

export function surSession(ecouteur: () => void): () => void {
  ecouteurs.add(ecouteur);
  return () => ecouteurs.delete(ecouteur);
}
