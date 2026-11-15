package ma.commune.files.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.commune.files.pattern.observer.EvenementFile;
import ma.commune.files.pattern.observer.FileObserver;
import ma.commune.files.pattern.strategy.PolitiqueFile;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

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

    @Transient
    private final Set<FileObserver> observateurs = new LinkedHashSet<>();

    public PolitiqueFile politiqueCourante() {
        return PolitiqueFile.depuis(politique);
    }

    public void changerPolitique(CodePolitique nouvellePolitique) {
        if (nouvellePolitique == null) {
            throw new IllegalArgumentException("La politique de file est obligatoire.");
        }
        this.politique = nouvellePolitique;
    }

    public Optional<Ticket> retirerSuivant(List<Ticket> enAttente) {
        return politiqueCourante().choisirSuivant(enAttente);
    }

    public void abonner(FileObserver observateur) {
        observateurs.add(observateur);
    }

    public void desabonner(FileObserver observateur) {
        observateurs.remove(observateur);
    }

    public void notifier(EvenementFile evenement) {
        observateurs.forEach(observateur -> observateur.mettreAJour(evenement));
    }
}
