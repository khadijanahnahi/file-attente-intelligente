package ma.commune.files.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * File d'attente d'un service.
 *
 * Rôles dans les design patterns (ajoutés aux étapes 6 et 7) :
 *  - Strategy : contexte. politique (FIFO, PRIORITE...) -> PolitiqueFile.choisirSuivant(tickets)
 *  - Observer : sujet. Liste de FileObserver + notifier(EvenementFile)
 *
 * Attention : cette classe porte le même nom que java.io.File ; ne pas importer java.io.* ici.
 */
@Entity
@Table(name = "file_attente")
@Getter @Setter @NoArgsConstructor
public class File {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false, unique = true)
    private Service service;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CodePolitique politique = CodePolitique.FIFO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EtatFile etat = EtatFile.OUVERTE;
}
