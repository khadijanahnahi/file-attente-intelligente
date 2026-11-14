package ma.commune.files.dto;

import ma.commune.files.domain.EtatGuichet;

/** Charge d'un guichet pour une journée. */
public record ChargeGuichet(
        Long guichetId,
        int numero,
        EtatGuichet etat,
        int ticketsTraites,
        Double dureeMoyenneMin) {
}
