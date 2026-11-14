package ma.commune.files.repository;

import ma.commune.files.domain.JournalCommande;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JournalCommandeRepository extends JpaRepository<JournalCommande, Long> {
}
