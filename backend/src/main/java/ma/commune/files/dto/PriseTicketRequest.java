package ma.commune.files.dto;

import ma.commune.files.domain.MotifPriorite;
import ma.commune.files.domain.Priorite;

/**
 * Demande de ticket (CU1). Au moins un contact (telephone ou email) est exigé.
 * priorite = null signifie NORMALE. agentAccueilId est renseigné quand l'agent d'accueil
 * crée le ticket pour un citoyen sans smartphone.
 */
public record PriseTicketRequest(
        Long serviceId,
        String nom,
        String telephone,
        String email,
        String langue,
        Priorite priorite,
        MotifPriorite motif,
        Long agentAccueilId) {
}
