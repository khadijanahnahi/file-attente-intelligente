package ma.commune.files.pattern.strategy;

import ma.commune.files.domain.CodePolitique;
import ma.commune.files.domain.Ticket;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/** Priorité d'abord (URGENTE, PRIORITAIRE, NORMALE), puis heure d'arrivée. */
public class PriorityStrategy implements PolitiqueFile {

    // L'ordre de l'enum Priorite est NORMALE < PRIORITAIRE < URGENTE : on inverse pour passer l'urgent en premier.
    static final Comparator<Ticket> PAR_PRIORITE_PUIS_ARRIVEE =
            Comparator.comparing(Ticket::getPriorite, Comparator.reverseOrder())
                      .thenComparing(FifoStrategy.PAR_ARRIVEE);

    @Override public CodePolitique code() { return CodePolitique.PRIORITE; }

    @Override public Optional<Ticket> choisirSuivant(List<Ticket> enAttente) {
        return enAttente.stream().min(PAR_PRIORITE_PUIS_ARRIVEE);
    }
}
