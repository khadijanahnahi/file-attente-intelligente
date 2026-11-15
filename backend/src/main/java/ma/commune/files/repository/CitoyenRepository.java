package ma.commune.files.repository;

import ma.commune.files.domain.Citoyen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CitoyenRepository extends JpaRepository<Citoyen, Long> {
    Optional<Citoyen> findFirstByEmail(String email);
    Optional<Citoyen> findFirstByTelephone(String telephone);
}
