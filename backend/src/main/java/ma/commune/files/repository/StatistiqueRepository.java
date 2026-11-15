package ma.commune.files.repository;

import ma.commune.files.domain.Statistique;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface StatistiqueRepository extends JpaRepository<Statistique, Long> {
    Optional<Statistique> findByJourAndServiceId(LocalDate jour, Long serviceId);
}
