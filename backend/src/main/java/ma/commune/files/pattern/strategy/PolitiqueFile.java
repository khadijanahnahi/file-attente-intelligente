package ma.commune.files.pattern.strategy;

import ma.commune.files.domain.CodePolitique;
import ma.commune.files.domain.Ticket;

import java.util.List;
import java.util.Optional;

/**
 * Pattern STRATEGY : règle de choix du prochain ticket d'une file.
 * File garde la stratégie courante et lui délègue le choix (CU2, étape 1).
 */
public interface PolitiqueFile {

    CodePolitique code();

    /** Retourne le prochain ticket parmi ceux en attente, ou vide si la file est vide (CU2, alternatif). */
    Optional<Ticket> choisirSuivant(List<Ticket> enAttente);

    /** Reconstruit la stratégie à partir du code enregistré en base (colonne file_attente.politique). */
    static PolitiqueFile depuis(CodePolitique code) {
        return switch (code) {
            case FIFO              -> new FifoStrategy();
            case PRIORITE          -> new PriorityStrategy();
            case CHARGE_EQUILIBREE -> new LoadBalancedStrategy();
        };
    }
}
