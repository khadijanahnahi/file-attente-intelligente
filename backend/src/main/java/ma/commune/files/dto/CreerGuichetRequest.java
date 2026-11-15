package ma.commune.files.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreerGuichetRequest(
        @Positive int numero,
        @NotNull @Positive Long serviceId,
        Long agentId) {
}
