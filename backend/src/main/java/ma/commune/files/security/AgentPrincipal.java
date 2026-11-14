package ma.commune.files.security;

import ma.commune.files.domain.RoleAgent;

/** Agent connecté, disponible dans les contrôleurs via @AuthenticationPrincipal. */
public record AgentPrincipal(Long id, String login, String nom, RoleAgent role) {
}
