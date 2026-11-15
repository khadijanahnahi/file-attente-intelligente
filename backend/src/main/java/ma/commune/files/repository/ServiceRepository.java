package ma.commune.files.repository;

import ma.commune.files.domain.Service;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRepository extends JpaRepository<Service, Long> {
    List<Service> findByActifTrue();
    boolean existsByNomIgnoreCase(String nom);
    boolean existsByPrefixeIgnoreCase(String prefixe);
}
