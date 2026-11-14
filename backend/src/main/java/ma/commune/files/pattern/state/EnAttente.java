package ma.commune.files.pattern.state;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.Guichet;
import ma.commune.files.domain.Ticket;

import java.time.LocalDateTime;

/** Ticket dans la file, en attente d'être appelé. */
public final class EnAttente implements EtatTicket {
    public static final EnAttente INSTANCE = new EnAttente();
    private EnAttente() {}

    @Override public CodeEtat code() { return CodeEtat.EN_ATTENTE; }

    @Override public EtatTicket appeler(Ticket t, Guichet g) {
        t.setGuichet(g);
        t.setHeureAppel(LocalDateTime.now());
        return Appele.INSTANCE;
    }

    @Override public EtatTicket annuler(Ticket t) {
        t.setHeureFin(LocalDateTime.now());
        return Annule.INSTANCE;
    }
}
