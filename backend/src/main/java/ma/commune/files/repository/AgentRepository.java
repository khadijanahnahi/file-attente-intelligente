package ma.commune.files.repository;

import ma.commune.files.domain.Agent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AgentRepository extends JpaRepository<Agent, Long> {
    Optional<Agent> findByLogin(String login);
}
