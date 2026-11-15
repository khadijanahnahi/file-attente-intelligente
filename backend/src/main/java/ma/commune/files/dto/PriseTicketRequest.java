package ma.commune.files.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import ma.commune.files.domain.MotifPriorite;
import ma.commune.files.domain.Priorite;

/**
 * Demande de ticket (CU1). Au moins un contact (telephone ou email) est exigé.
 * priorite = null signifie NORMALE. agentAccueilId est renseigné quand l'agent d'accueil
 * crée le ticket pour un citoyen sans smartphone.
 */
public record PriseTicketRequest(
        @NotNull @Positive
        Long serviceId,
        @Size(max = 100)
        String nom,
        @Pattern(regexp = "^$|^[+0-9() .-]{7,20}$", message = "Le numéro de téléphone est invalide.")
        String telephone,
        @Email @Size(max = 150)
        String email,
        @Pattern(regexp = "^$|^(fr|ar)$", message = "La langue doit être fr ou ar.")
        String langue,
        Priorite priorite,
        MotifPriorite motif,
        Long agentAccueilId) {
}
