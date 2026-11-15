package ma.commune.files.repository;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByFileIdAndEtatOrderByHeureCreationAsc(Long fileId, CodeEtat etat);
    long countByFileIdAndEtat(Long fileId, CodeEtat etat);
    Optional<Ticket> findFirstByCitoyenIdAndServiceIdAndEtatIn(Long citoyenId, Long serviceId,
                                                                Collection<CodeEtat> etats);
    Optional<Ticket> findFirstByGuichetIdAndEtatIn(Long guichetId, Collection<CodeEtat> etats);
    List<Ticket> findByServiceIdAndEtatAndHeureFinGreaterThanEqual(Long serviceId, CodeEtat etat,
                                                                   LocalDateTime depuis);
    List<Ticket> findByEtatInAndHeureCreationLessThan(Collection<CodeEtat> etats, LocalDateTime avant);
    List<Ticket> findByHeureCreationGreaterThanEqualAndHeureCreationLessThan(LocalDateTime debut,
                                                                             LocalDateTime fin);

    @Query("select count(t) from Ticket t where t.numero like :motif "
            + "and t.heureCreation >= :debut and t.heureCreation < :fin")
    long compterNumerotesEntre(@Param("motif") String motif, @Param("debut") LocalDateTime debut,
                               @Param("fin") LocalDateTime fin);
}
