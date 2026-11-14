package ma.commune.files.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Agrégats par jour et par service, calculés à partir des tickets (tableau de bord). */
@Entity
@Table(name = "statistique", uniqueConstraints = @UniqueConstraint(columnNames = {"jour", "service_id"}))
@Getter @Setter @NoArgsConstructor
public class Statistique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate jour;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @Column(name = "nb_tickets", nullable = false)
    private int nbTickets;

    @Column(name = "attente_moy_min", precision = 6, scale = 2)
    private BigDecimal attenteMoyMin;

    @Column(name = "traitement_moy_min", precision = 6, scale = 2)
    private BigDecimal traitementMoyMin;

    /** En pourcentage. */
    @Column(name = "taux_abandon", precision = 5, scale = 2)
    private BigDecimal tauxAbandon;
}
