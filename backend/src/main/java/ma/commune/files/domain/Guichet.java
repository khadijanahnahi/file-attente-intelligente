package ma.commune.files.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Guichet tenu par un agent et rattaché à un service. */
@Entity
@Table(name = "guichet")
@Getter @Setter @NoArgsConstructor
public class Guichet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private int numero;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EtatGuichet etat = EtatGuichet.FERME;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private Service service;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", unique = true)
    private Agent agent;
}
