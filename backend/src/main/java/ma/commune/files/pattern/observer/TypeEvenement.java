package ma.commune.files.pattern.observer;

public enum TypeEvenement {
    TICKET_CREE, TICKET_APPELE, TICKET_TERMINE, TICKET_ABSENT, TICKET_ANNULE,
    /** Un appel a été annulé : le ticket est retourné dans la file. */
    TICKET_REMIS_EN_ATTENTE
}
