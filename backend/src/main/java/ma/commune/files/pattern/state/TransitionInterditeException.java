package ma.commune.files.pattern.state;

import ma.commune.files.domain.CodeEtat;

/** Levée quand une action n'est pas autorisée dans l'état courant du ticket. */
public class TransitionInterditeException extends RuntimeException {

    private final CodeEtat etat;
    private final String action;

    public TransitionInterditeException(CodeEtat etat, String action) {
        super("Action '" + action + "' interdite pour un ticket à l'état " + etat);
        this.etat = etat;
        this.action = action;
    }

    public CodeEtat getEtat() { return etat; }
    public String getAction() { return action; }
}
