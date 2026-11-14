package ma.commune.files.domain;

/** Valeur stockée dans ticket.etat. Le pattern State reconstruit l'objet EtatTicket à partir de ce code. */
public enum CodeEtat {
    CREE, EN_ATTENTE, APPELE, EN_TRAITEMENT, TERMINE, ABSENT, ANNULE
}
