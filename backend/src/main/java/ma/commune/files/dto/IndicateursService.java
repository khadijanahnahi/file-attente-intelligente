package ma.commune.files.dto;

/** Indicateurs d'un service pour une journée (tableau de bord). Les moyennes sont null s'il n'y a pas de données. */
public record IndicateursService(
        Long serviceId,
        String service,
        int nbTickets,
        int enAttente,
        Double attenteMoyenneMin,
        Double traitementMoyenMin,
        double tauxAbandonPct) {
}
