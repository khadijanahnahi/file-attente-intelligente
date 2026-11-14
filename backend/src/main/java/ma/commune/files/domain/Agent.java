package ma.commune.files.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Agent de la commune : accueil, guichet, responsable ou administrateur. */
@Entity
@Table(name = "agent")
@Getter @Setter @NoArgsConstructor
public class Agent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, unique = true, length = 60)
    private String login;

    /** Toujours haché (BCrypt), jamais en clair. */
    @Column(name = "mot_de_passe", nullable = false, length = 100)
    private String motDePasse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private RoleAgent role;

    @Column(nullable = false)
    private boolean actif = true;
}
