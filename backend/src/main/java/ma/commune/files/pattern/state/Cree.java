package ma.commune.files.pattern.state;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.Ticket;

/** Ticket créé, pas encore placé dans la file. */
public final class Cree implements EtatTicket {
    public static final Cree INSTANCE = new Cree();
    private Cree() {}

    @Override public CodeEtat code() { return CodeEtat.CREE; }

    @Override public EtatTicket placerEnFile(Ticket t) { return EnAttente.INSTANCE; }
}
