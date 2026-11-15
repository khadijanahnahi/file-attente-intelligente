package ma.commune.files.exception;

public class AuthentificationException extends RuntimeException {
    public AuthentificationException() {
        super("Identifiant ou mot de passe incorrect.");
    }
}
