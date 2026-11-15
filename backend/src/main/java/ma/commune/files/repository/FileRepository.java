package ma.commune.files.repository;

import jakarta.persistence.LockModeType;
import ma.commune.files.domain.File;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FileRepository extends JpaRepository<File, Long> {
    Optional<File> findByServiceId(Long serviceId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from File f where f.service.id = :serviceId")
    Optional<File> findByServiceIdForUpdate(@Param("serviceId") Long serviceId);
}
