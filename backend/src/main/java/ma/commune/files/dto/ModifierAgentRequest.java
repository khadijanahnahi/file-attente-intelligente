package ma.commune.files.dto;

import jakarta.validation.constraints.Size;
import ma.commune.files.domain.RoleAgent;

public record ModifierAgentRequest(
        @Size(max = 100) String nom,
        RoleAgent role,
        Boolean actif,
        @Size(min = 10, max = 72) String motDePasse) {
}
