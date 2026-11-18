/**
 * Types de l'API. Ils reprennent les enums et DTO du backend (package ma.commune.files).
 *
 * Tous les types sont recopiés des records du backend (dto/*.java).
 * Si un DTO change côté Java, ce fichier est le seul endroit à corriger.
 */

export type CodeEtat =
  | 'CREE' | 'EN_ATTENTE' | 'APPELE' | 'EN_TRAITEMENT' | 'TERMINE' | 'ABSENT' | 'ANNULE';
export type Priorite = 'NORMALE' | 'PRIORITAIRE' | 'URGENTE';
export type MotifPriorite = 'PERSONNE_AGEE' | 'HANDICAP' | 'FEMME_ENCEINTE';
export type RoleAgent = 'ACCUEIL' | 'GUICHET' | 'RESPONSABLE' | 'ADMIN';
export type EtatGuichet = 'OUVERT' | 'PAUSE' | 'FERME';
export type CodePolitique = 'FIFO' | 'PRIORITE' | 'CHARGE_EQUILIBREE';

/** Ce que voit le citoyen (backend : dto/TicketInfo). */
export interface TicketInfo {
  id: number;
  numero: string;
  service: string;
  etat: CodeEtat;
  priorite: Priorite;
  position: number; // 1 = prochain ; 0 si le ticket n'est plus en attente
  ticketsDevant: number;
  attenteEstimeeMin: number;
  guichet: number | null; // numéro du guichet une fois appelé
  dejaExistant: boolean; // le citoyen avait déjà un ticket actif (CU1 alternatif)
}

/** Corps de POST /api/tickets (backend : dto/PriseTicketRequest, sans agentAccueilId). */
export interface PriseTicketRequest {
  serviceId: number;
  nom?: string;
  telephone?: string;
  email?: string;
  langue: 'fr' | 'ar';
  priorite?: Priorite;
  motif?: MotifPriorite;
}

/** Service (backend : dto/ServiceView). */
export interface ServiceView {
  id: number;
  nom: string;
  prefixe: string;
  dureeMoyenneMin: number;
  capaciteMax: number;
  heureOuverture: string; // "08:30:00"
  heureFermeture: string;
  actif: boolean;
  ouvert: boolean; // actif ET dans ses horaires
  politique: CodePolitique;
  nbEnAttente: number;
  attenteEstimeeMin: number;
}

/** Ticket vu par un agent (backend : dto/TicketView). */
export interface TicketView {
  id: number;
  numero: string;
  service: string;
  etat: CodeEtat;
  priorite: Priorite;
  heureCreation: string;
  guichet: number | null;
  nbRappels: number;
}

/** Backend : dto/GuichetView. */
export interface GuichetView {
  id: number;
  numero: number;
  etat: EtatGuichet;
  serviceId: number | null;
  service: string | null;
  agentId: number | null;
  agent: string | null;
}

/** Backend : dto/AgentView. */
export interface AgentView {
  id: number;
  nom: string;
  login: string;
  role: RoleAgent;
  actif: boolean;
}

/** Backend : dto/LoginResponse. */
export interface LoginResponse {
  jeton: string;
  expireDansSecondes: number;
  agentId: number;
  nom: string;
  role: RoleAgent;
}

/** Backend : dto/IndicateursService (moyennes null s'il n'y a pas de données). */
export interface IndicateursService {
  serviceId: number;
  service: string;
  nbTickets: number;
  enAttente: number;
  attenteMoyenneMin: number | null;
  traitementMoyenMin: number | null;
  tauxAbandonPct: number;
}

/** Backend : dto/ChargeGuichet. */
export interface ChargeGuichet {
  guichetId: number;
  numero: number;
  etat: EtatGuichet;
  ticketsTraites: number;
  dureeMoyenneMin: number | null;
}

export interface CreerAgentRequest { nom: string; login: string; motDePasse: string; role: RoleAgent }
export interface ModifierAgentRequest { nom?: string; role?: RoleAgent; actif?: boolean; motDePasse?: string }
export interface CreerGuichetRequest { numero: number; serviceId: number; agentId?: number | null }
export interface AffecterGuichetRequest { serviceId: number | null; agentId: number | null }
export interface CreerServiceRequest {
  nom: string; prefixe: string; dureeMoyenneMin?: number; capaciteMax?: number;
  heureOuverture?: string; heureFermeture?: string;
}
export interface ModifierServiceRequest {
  nom?: string; dureeMoyenneMin?: number; capaciteMax?: number;
  heureOuverture?: string; heureFermeture?: string; actif?: boolean;
}

/** Message reçu sur /topic/ecran et /topic/file/{serviceId} (backend : EcranAffichage). */
export interface EvenementEcran {
  type: 'TICKET_CREE' | 'TICKET_APPELE' | 'TICKET_TERMINE' | 'TICKET_ABSENT' | 'TICKET_ANNULE' | 'TICKET_REMIS_EN_ATTENTE';
  ticketId: number;
  numero: string;
  service: string;
  guichet: number | null;
  date: string;
}

/** Message reçu sur /topic/ticket/{id} (backend : PushCanal). */
export interface NotificationPush {
  message: string;
}
