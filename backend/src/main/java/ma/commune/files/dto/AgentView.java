package ma.commune.files.dto;

import ma.commune.files.domain.Agent;
import ma.commune.files.domain.RoleAgent;

public record AgentView(Long id, String nom, String login, RoleAgent role, boolean actif) {
    public static AgentView de(Agent agent) {
        return new AgentView(agent.getId(), agent.getNom(), agent.getLogin(), agent.getRole(), agent.isActif());
    }
}
