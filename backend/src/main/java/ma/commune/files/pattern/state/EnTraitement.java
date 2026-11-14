package ma.commune.files.pattern.state;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.Ticket;

import java.time.LocalDateTime;

/** Le citoyen est au guichet, la demande est en cours de traitement. */
public final class EnTraitement implements EtatTicket {
    public static final EnTraitement INSTANCE = new EnTraitement();
    private EnTraitement() {}

    @Override public CodeEtat code() { return CodeEtat.EN_TRAITEMENT; }

    @Override public EtatTicket terminer(Ticket t) {
        t.setHeureFin(LocalDateTime.now());
        return Termine.INSTANCE;
    }
}
