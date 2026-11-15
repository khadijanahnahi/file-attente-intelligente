package ma.commune.files.dto;

import ma.commune.files.domain.RoleAgent;

public record LoginResponse(String jeton, long expireDansSecondes, Long agentId, String nom, RoleAgent role) {
}
