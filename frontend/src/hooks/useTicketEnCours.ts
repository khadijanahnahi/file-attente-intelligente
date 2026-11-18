import { useEffect, useState } from 'react';
import { suivreTicket } from '../api/citoyen';
import type { CodeEtat, TicketInfo } from '../api/types';

const CLE = 'ticket-en-cours';
const CLE_CONTACT = 'ticket-contact';
const ACTIFS: CodeEtat[] = ['CREE', 'EN_ATTENTE', 'APPELE', 'EN_TRAITEMENT'];

export const estActif = (etat: CodeEtat) => ACTIFS.includes(etat);

/** Mémorise le ticket du citoyen sur cet appareil, pour pouvoir le retrouver s'il ferme la page. */
export function memoriserTicket(id: number | null) {
  try {
    if (id === null) {
      localStorage.removeItem(CLE);
      localStorage.removeItem(CLE_CONTACT);
    } else localStorage.setItem(CLE, String(id));
  } catch {
    /* stockage indisponible : le citoyen garde son lien */
  }
}

/** Ticket mémorisé s'il est toujours actif, sinon null. */
export function useTicketEnCours(): TicketInfo | null {
  const [ticket, setTicket] = useState<TicketInfo | null>(null);

  useEffect(() => {
    let id: string | null = null;
    try {
      id = localStorage.getItem(CLE);
    } catch {
      /* ignoré */
    }
    if (!id) return;
    let annule = false;
    suivreTicket(id)
      .then((t) => {
        if (annule) return;
        if (estActif(t.etat)) setTicket(t);
        else memoriserTicket(null);
      })
      .catch(() => {
        /* serveur injoignable ou ticket supprimé : on n'affiche rien */
      });
    return () => {
      annule = true;
    };
  }, []);

  return ticket;
}

/** Contacts donnés à la prise du ticket (téléphone et/ou e-mail) : évite de les retaper pour annuler, sur cet appareil. */
export function memoriserContact(id: number, contacts: (string | undefined)[]) {
  try {
    localStorage.setItem(CLE_CONTACT, JSON.stringify({ id, contacts: contacts.filter(Boolean) }));
  } catch {
    /* le citoyen les retapera */
  }
}

export function contactsMemorises(id: number): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_CONTACT) ?? 'null');
    return v && v.id === id && Array.isArray(v.contacts) ? v.contacts : [];
  } catch {
    return [];
  }
}
