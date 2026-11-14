package ma.commune.files.pattern.state;

import ma.commune.files.domain.CodeEtat;

/** Citoyen absent après rappel (état final). Aucune action n'est permise. */
public final class Absent implements EtatTicket {
    public static final Absent INSTANCE = new Absent();
    private Absent() {}

    @Override public CodeEtat code() { return CodeEtat.ABSENT; }

    @Override public boolean estFinal() { return true; }
}
