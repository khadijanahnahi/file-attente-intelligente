package ma.commune.files.pattern.state;

import ma.commune.files.domain.CodeEtat;

/** Demande traitée (état final). Aucune action n'est permise. */
public final class Termine implements EtatTicket {
    public static final Termine INSTANCE = new Termine();
    private Termine() {}

    @Override public CodeEtat code() { return CodeEtat.TERMINE; }

    @Override public boolean estFinal() { return true; }
}
