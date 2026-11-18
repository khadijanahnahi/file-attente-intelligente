import { http } from './http';
import type { PriseTicketRequest, ServiceView, TicketInfo } from './types';

export const listerServices = () => http.get<ServiceView[]>('/api/services');

export const prendreTicket = (demande: PriseTicketRequest) => http.post<TicketInfo>('/api/tickets', demande);

export const suivreTicket = (id: number | string) => http.get<TicketInfo>(`/api/tickets/${id}`);

/** Annulation par le citoyen : le contact (téléphone ou e-mail) donné à la prise du ticket sert de preuve. */
export const annulerTicket = (id: number | string, contact: string) =>
  http.post<TicketInfo>(`/api/tickets/${id}/annuler-citoyen`, { contact });
