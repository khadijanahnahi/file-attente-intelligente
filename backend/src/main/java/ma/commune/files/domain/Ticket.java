package ma.commune.files.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Ticket numérique.
 *
 * Pattern State (étape 4) : le champ etat (CodeEtat) est enregistré en base ;
 * Ticket délèguera ses actions (placerEnFile, appeler, traiter, terminer, marquerAbsent, annuler)
 * à un objet EtatTicket reconstruit à partir de ce code.
 */
@Entity
@Table(name = "ticket")
@Getter @Setter @NoArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ex. N-042 : unique par service et par jour. */
    @Column(nullable = false, length = 10)
    private String numero;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private Priorite priorite = Priorite.NORMALE;

    @Enumerated(EnumType.STRING)
    @Column(name = "motif_priorite", length = 30)
    private MotifPriorite motifPriorite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private CodeEtat etat = CodeEtat.CREE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "citoyen_id", nullable = false)
    private Citoyen citoyen;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private File file;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guichet_id")
    private Guichet guichet;

    /** Renseigné si le ticket a été créé par un agent d'accueil. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cree_par_agent")
    private Agent creeParAgent;

    @Column(name = "nb_rappels", nullable = false)
    private int nbRappels = 0;

    @Column(name = "heure_creation", nullable = false)
    private LocalDateTime heureCreation = LocalDateTime.now();

    @Column(name = "heure_appel")
    private LocalDateTime heureAppel;

    @Column(name = "heure_debut")
    private LocalDateTime heureDebut;

    @Column(name = "heure_fin")
    private LocalDateTime heureFin;
}
