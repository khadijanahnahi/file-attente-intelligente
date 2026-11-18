import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Connexion STOMP unique pour toute l'application (le backend expose /ws avec SockJS).
 * Les abonnements sont mémorisés : ils sont refaits automatiquement après une coupure.
 */
type Gestionnaire = (corps: unknown) => void;

interface Abonnement {
  gestionnaires: Set<Gestionnaire>;
  souscription?: StompSubscription;
}

const abonnements = new Map<string, Abonnement>();
const ecouteursEtat = new Set<(connecte: boolean) => void>();
let client: Client | null = null;
let connecte = false;

function changerEtat(valeur: boolean) {
  connecte = valeur;
  ecouteursEtat.forEach((l) => l(valeur));
}

function souscrire(destination: string, a: Abonnement) {
  if (!client || !connecte || a.souscription) return;
  a.souscription = client.subscribe(destination, (message) => {
    let corps: unknown = message.body;
    try {
      corps = JSON.parse(message.body);
    } catch {
      /* texte brut */
    }
    a.gestionnaires.forEach((g) => g(corps));
  });
}

function assurerClient() {
  if (client) return;
  client = new Client({
    webSocketFactory: () => new SockJS('/ws') as WebSocket,
    reconnectDelay: 3000,
    onConnect: () => {
      changerEtat(true);
      abonnements.forEach((a, destination) => {
        a.souscription = undefined; // les anciennes souscriptions sont mortes avec la connexion
        souscrire(destination, a);
      });
    },
    onWebSocketClose: () => changerEtat(false),
    onStompError: () => changerEtat(false),
  });
  client.activate();
}

/** S'abonne à une destination (ex. /topic/ecran). Retourne la fonction de désabonnement. */
export function abonner(destination: string, gestionnaire: Gestionnaire): () => void {
  assurerClient();
  let a = abonnements.get(destination);
  if (!a) {
    a = { gestionnaires: new Set() };
    abonnements.set(destination, a);
  }
  a.gestionnaires.add(gestionnaire);
  souscrire(destination, a);

  return () => {
    const courant = abonnements.get(destination);
    if (!courant) return;
    courant.gestionnaires.delete(gestionnaire);
    if (courant.gestionnaires.size === 0) {
      courant.souscription?.unsubscribe();
      abonnements.delete(destination);
    }
  };
}

export function surEtatConnexion(ecouteur: (connecte: boolean) => void): () => void {
  ecouteursEtat.add(ecouteur);
  ecouteur(connecte);
  return () => ecouteursEtat.delete(ecouteur);
}
