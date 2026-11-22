/** Alertes locales de la page de suivi : bip, vibration et notification du navigateur (si autorisée). */

let contexte: AudioContext | undefined;

/** Bip court (deux notes). Ignoré sans erreur si le navigateur bloque le son. */
export function bip(urgent: boolean) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    contexte ??= new Ctx();
    void contexte.resume();
    const notes = urgent ? [880, 1175, 880, 1175] : [660, 880];
    notes.forEach((freq, i) => {
      const o = contexte!.createOscillator();
      const g = contexte!.createGain();
      o.frequency.value = freq;
      g.gain.value = 0.15;
      o.connect(g).connect(contexte!.destination);
      const debut = contexte!.currentTime + i * 0.22;
      o.start(debut);
      o.stop(debut + 0.16);
    });
  } catch {
    /* son indisponible */
  }
}

export const alertesSupportees = () => typeof Notification !== 'undefined';
export const alertesAutorisees = () => alertesSupportees() && Notification.permission === 'granted';
export const alertesAdemander = () => alertesSupportees() && Notification.permission === 'default';

/** À appeler depuis un clic : autorise les notifications et débloque le son. */
export async function activerAlertes(): Promise<void> {
  bip(false);
  if (alertesSupportees()) {
    try {
      await Notification.requestPermission();
    } catch {
      /* refusé ou non supporté */
    }
  }
}

/** Notification système (visible même quand l'onglet est en arrière-plan). */
export function notifierSysteme(titre: string, corps: string) {
  if (!alertesAutorisees()) return;
  try {
    new Notification(titre, { body: corps, tag: 'file-attente' });
  } catch {
    /* certains mobiles exigent un service worker : on ignore */
  }
}
