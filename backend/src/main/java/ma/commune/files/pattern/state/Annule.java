package ma.commune.files.pattern.state;

import ma.commune.files.domain.CodeEtat;

/** Ticket annulé (état final). Aucune action n'est permise. */
public final class Annule implements EtatTicket {
    public static final Annule INSTANCE = new Annule();
    private Annule() {}

    @Override public CodeEtat code() { return CodeEtat.ANNULE; }

    @Override public boolean estFinal() { return true; }
}
