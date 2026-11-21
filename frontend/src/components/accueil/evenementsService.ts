/** Petit canal entre la liste des services et la carte : chacun annonce son choix, l'autre le suit. */
const EVENEMENT = 'lp:service-choisi';
export type Origine = 'carte' | 'liste';

export function annoncerChoix(id: number | null, origine: Origine) {
  window.dispatchEvent(new CustomEvent(EVENEMENT, { detail: { id, origine } }));
}

/** Écoute les choix venus de l'autre origine. Renvoie la fonction de désabonnement. */
export function ecouterChoix(origine: Origine, surChoix: (id: number | null) => void): () => void {
  const gestionnaire = (e: Event) => {
    const d = (e as CustomEvent<{ id: number | null; origine: Origine }>).detail;
    if (d.origine !== origine) surChoix(d.id);
  };
  window.addEventListener(EVENEMENT, gestionnaire);
  return () => window.removeEventListener(EVENEMENT, gestionnaire);
}
