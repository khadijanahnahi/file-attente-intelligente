package ma.commune.files.pattern.strategy;

import ma.commune.files.domain.CodePolitique;
import ma.commune.files.domain.Ticket;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

/**
 * Équilibrage de la charge dans le temps : priorité d'abord, mais un ticket qui attend
 * depuis plus de FACTEUR_ATTENTE x la durée moyenne du service passe devant (pas de famine :
 * un flux continu de tickets prioritaires ne bloque pas indéfiniment les tickets normaux).
 *
 * C'est une interprétation simple du « équilibrage de charge » du cahier des charges ;
 * à justifier ou à adapter dans le rapport.
 */
public class LoadBalancedStrategy implements PolitiqueFile {

    static final int FACTEUR_ATTENTE = 3;

    private final Supplier<LocalDateTime> horloge;

    public LoadBalancedStrategy() { this(LocalDateTime::now); }

    /** Constructeur avec horloge injectable (tests). */
    public LoadBalancedStrategy(Supplier<LocalDateTime> horloge) { this.horloge = horloge; }

    @Override public CodePolitique code() { return CodePolitique.CHARGE_EQUILIBREE; }

    @Override public Optional<Ticket> choisirSuivant(List<Ticket> enAttente) {
        LocalDateTime maintenant = horloge.get();
        Optional<Ticket> tropAttendu = enAttente.stream()
                .filter(t -> depasseSeuil(t, maintenant))
                .min(FifoStrategy.PAR_ARRIVEE);
        if (tropAttendu.isPresent()) {
            return tropAttendu;
        }
        return enAttente.stream().min(PriorityStrategy.PAR_PRIORITE_PUIS_ARRIVEE);
    }

    private boolean depasseSeuil(Ticket t, LocalDateTime maintenant) {
        BigDecimal duree = t.getService().getDureeMoyenneMin();
        long seuilSecondes = duree.multiply(BigDecimal.valueOf(60L * FACTEUR_ATTENTE)).longValue();
        return Duration.between(t.getHeureCreation(), maintenant).getSeconds() > seuilSecondes;
    }
}
