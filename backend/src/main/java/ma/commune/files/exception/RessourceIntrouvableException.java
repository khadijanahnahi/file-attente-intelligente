package ma.commune.files.exception;

/** Élément demandé inexistant (le contrôleur la traduira en HTTP 404). */
public class RessourceIntrouvableException extends RuntimeException {
    public RessourceIntrouvableException(String message) { super(message); }
}
