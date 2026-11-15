package ma.commune.files.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalTime;

public record CreerServiceRequest(
        @NotBlank @Size(max = 120) String nom,
        @NotBlank @Size(max = 3) String prefixe,
        @DecimalMin(value = "0.01") BigDecimal dureeMoyenneMin,
        @Positive Integer capaciteMax,
        LocalTime heureOuverture,
        LocalTime heureFermeture) {
}
