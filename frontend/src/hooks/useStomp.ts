import { useEffect, useRef, useState } from 'react';
import { abonner, surEtatConnexion } from '../api/stomp';

/** Écoute une destination STOMP tant que le composant est affiché. destination = null : aucune écoute. */
export function useTopic<T>(destination: string | null, surMessage: (corps: T) => void) {
  const dernier = useRef(surMessage);
  useEffect(() => {
    dernier.current = surMessage;
  });

  useEffect(() => {
    if (!destination) return;
    return abonner(destination, (corps) => dernier.current(corps as T));
  }, [destination]);
}

/** true quand la connexion temps réel est établie. */
export function useConnexionTempsReel(): boolean {
  const [connecte, setConnecte] = useState(false);
  useEffect(() => surEtatConnexion(setConnecte), []);
  return connecte;
}
