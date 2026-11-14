package ma.commune.files.pattern.strategy;

import ma.commune.files.domain.CodePolitique;
import ma.commune.files.domain.Ticket;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/** Premier arrivé, premier servi : le ticket dont heureCreation est la plus ancienne. */
public class FifoStrategy implements PolitiqueFile {

    static final Comparator<Ticket> PAR_ARRIVEE = Comparator
            .comparing(Ticket::getHeureCreation)
            .thenComparing(Ticket::getId, Comparator.nullsLast(Comparator.naturalOrder()));

    @Override public CodePolitique code() { return CodePolitique.FIFO; }

    @Override public Optional<Ticket> choisirSuivant(List<Ticket> enAttente) {
        return enAttente.stream().min(PAR_ARRIVEE);
    }
}
