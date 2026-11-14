package ma.commune.files.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalTime;

/** Service proposé au guichet (acte de naissance, légalisation, certificat de résidence...). */
@Entity
@Table(name = "service")
@Getter @Setter @NoArgsConstructor
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String nom;

    /** Préfixe de numérotation : N donne N-001, N-002... */
    @Column(nullable = false, unique = true, length = 3)
    private String prefixe;

    @Column(name = "duree_moyenne_min", nullable = false, precision = 5, scale = 2)
    private BigDecimal dureeMoyenneMin = BigDecimal.TEN;

    @Column(name = "capacite_max", nullable = false)
    private int capaciteMax = 200;

    @Column(name = "heure_ouverture", nullable = false)
    private LocalTime heureOuverture = LocalTime.of(8, 30);

    @Column(name = "heure_fermeture", nullable = false)
    private LocalTime heureFermeture = LocalTime.of(16, 0);

    @Column(nullable = false)
    private boolean actif = true;

    /** Le service est-il ouvert à cette heure ? (CU1 : précondition « service actif et bureau ouvert ») */
    public boolean estOuvertA(LocalTime heure) {
        return actif && !heure.isBefore(heureOuverture) && heure.isBefore(heureFermeture);
    }
}
