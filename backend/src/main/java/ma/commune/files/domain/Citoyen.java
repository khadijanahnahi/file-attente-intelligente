package ma.commune.files.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Citoyen qui prend un ticket. Données minimales (loi 09-08) : nom facultatif, téléphone ou e-mail. */
@Entity
@Table(name = "citoyen")
@Getter @Setter @NoArgsConstructor
public class Citoyen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100)
    private String nom;

    @Column(length = 20)
    private String telephone;

    @Column(length = 150)
    private String email;

    /** "fr" ou "ar". */
    @Column(nullable = false, length = 2)
    private String langue = "fr";

    @Column(name = "cree_le", nullable = false)
    private LocalDateTime creeLe = LocalDateTime.now();
}
