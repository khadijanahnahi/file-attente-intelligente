import { http } from './http';
import type {
  AffecterGuichetRequest, AgentView, ChargeGuichet, CodePolitique, CreerAgentRequest, CreerGuichetRequest,
  CreerServiceRequest, GuichetView, IndicateursService, LoginResponse, ModifierAgentRequest,
  ModifierServiceRequest, PriseTicketRequest, ServiceView, TicketInfo, TicketView,
} from './types';

// --- Connexion ---
export const connexion = (login: string, motDePasse: string) =>
  http.post<LoginResponse>('/api/auth/login', { login, motDePasse });

// --- Agent de guichet (le guichet est déduit du jeton) ---
export const monGuichet = () => http.get<GuichetView>('/api/guichet/moi', true); // à ajouter côté backend (voir README)
export const ouvrirGuichet = () => http.post<GuichetView>('/api/guichet/ouvrir');
export const pauseGuichet = () => http.post<GuichetView>('/api/guichet/pause');
export const fermerGuichet = () => http.post<GuichetView>('/api/guichet/fermer');
export const appelerSuivant = () => http.post<TicketView>('/api/guichet/appeler');
export const rappeler = () => http.post<TicketView>('/api/guichet/rappeler');
export const commencerTraitement = () => http.post<TicketView>('/api/guichet/traiter');
export const terminer = () => http.post<TicketView>('/api/guichet/terminer');
export const marquerAbsent = () => http.post<TicketView>('/api/guichet/absent');
export const annulerDernierAppel = () => http.post<TicketView>('/api/guichet/annuler-appel');
export const annulerTicketAgent = (id: number) => http.post<TicketView>(`/api/guichet/tickets/${id}/annuler`);
export const ticketEnCours = () => http.get<TicketView>('/api/guichet/en-cours');
export const fileDuGuichet = () => http.get<TicketView[]>('/api/guichet/file');

// --- Accueil ---
export const ticketPourCitoyen = (d: Omit<PriseTicketRequest, 'langue'> & { langue: 'fr' | 'ar' }) =>
  http.post<TicketInfo>('/api/accueil/tickets', d);

// --- Responsable ---
export const indicateurs = (jour?: string) =>
  http.get<IndicateursService[]>(`/api/dashboard/indicateurs${jour ? `?jour=${jour}` : ''}`);
export const chargeGuichets = (jour?: string) =>
  http.get<ChargeGuichet[]>(`/api/dashboard/guichets${jour ? `?jour=${jour}` : ''}`);
export const modifierService = (id: number, d: ModifierServiceRequest) =>
  http.put<ServiceView>(`/api/config/services/${id}`, d);
export const changerPolitique = (id: number, politique: CodePolitique) =>
  http.put<ServiceView>(`/api/config/services/${id}/politique`, { politique });

// --- Administrateur ---
export const listerAgents = () => http.get<AgentView[]>('/api/admin/agents');
export const creerAgent = (d: CreerAgentRequest) => http.post<AgentView>('/api/admin/agents', d);
export const modifierAgent = (id: number, d: ModifierAgentRequest) => http.put<AgentView>(`/api/admin/agents/${id}`, d);
export const listerGuichets = () => http.get<GuichetView[]>('/api/admin/guichets');
export const creerGuichet = (d: CreerGuichetRequest) => http.post<GuichetView>('/api/admin/guichets', d);
export const affecterGuichet = (id: number, d: AffecterGuichetRequest) =>
  http.put<GuichetView>(`/api/admin/guichets/${id}`, d);
export const creerService = (d: CreerServiceRequest) => http.post<ServiceView>('/api/admin/services', d);
