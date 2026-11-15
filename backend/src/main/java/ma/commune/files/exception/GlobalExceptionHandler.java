package ma.commune.files.exception;

import ma.commune.files.dto.ErreurApi;
import ma.commune.files.pattern.command.FileVideException;
import ma.commune.files.pattern.state.TransitionInterditeException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RessourceIntrouvableException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErreurApi introuvable(RessourceIntrouvableException exception) {
        return erreur(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(AuthentificationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErreurApi authentification(AuthentificationException exception) {
        return erreur(HttpStatus.UNAUTHORIZED, exception.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErreurApi requeteInvalide(IllegalArgumentException exception) {
        return erreur(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler({
            ServiceFermeException.class,
            FileSatureeException.class,
            FileVideException.class,
            TransitionInterditeException.class,
            IllegalStateException.class,
            DataIntegrityViolationException.class
    })
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErreurApi conflit(RuntimeException exception) {
        String message = exception instanceof DataIntegrityViolationException
                ? "L'opération entre en conflit avec l'état actuel des données."
                : exception.getMessage();
        return erreur(HttpStatus.CONFLICT, message);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErreurApi validation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage() == null ? "La requête est invalide." : error.getDefaultMessage())
                .orElse("La requête est invalide.");
        return erreur(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErreurApi corpsInvalide(HttpMessageNotReadableException exception) {
        return erreur(HttpStatus.BAD_REQUEST, "Le corps de la requête est absent ou invalide.");
    }

    private static ErreurApi erreur(HttpStatus statut, String message) {
        return new ErreurApi(statut.value(), message, Instant.now());
    }
}
