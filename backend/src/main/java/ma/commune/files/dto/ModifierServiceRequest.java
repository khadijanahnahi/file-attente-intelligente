package ma.commune.files.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalTime;

public record ModifierServiceRequest(
        @Size(max = 120) String nom,
        @DecimalMin(value = "0.01") BigDecimal dureeMoyenneMin,
        @Positive Integer capaciteMax,
        LocalTime heureOuverture,
        LocalTime heureFermeture,
        Boolean actif) {
}
