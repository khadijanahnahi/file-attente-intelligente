package ma.commune.files.repository;

import ma.commune.files.domain.EtatGuichet;
import ma.commune.files.domain.Guichet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GuichetRepository extends JpaRepository<Guichet, Long> {
    Optional<Guichet> findByAgentId(Long agentId);
    boolean existsByNumero(int numero);
    boolean existsByAgentId(Long agentId);
    long countByServiceIdAndEtat(Long serviceId, EtatGuichet etat);
}
