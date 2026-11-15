package ma.commune.files.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import ma.commune.files.domain.RoleAgent;

public record CreerAgentRequest(
        @NotBlank @Size(max = 100) String nom,
        @NotBlank @Size(max = 60) String login,
        @NotBlank @Size(min = 10, max = 72) String motDePasse,
        @NotNull RoleAgent role) {
}
