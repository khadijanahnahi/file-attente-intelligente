package ma.commune.files.exception;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.dto.ErreurApi;
import ma.commune.files.pattern.command.FileVideException;
import ma.commune.files.pattern.state.TransitionInterditeException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler h = new GlobalExceptionHandler();

    @Test
    void codesHttp() {
        assertEquals(404, h.introuvable(new RessourceIntrouvableException("x")).statut());
        assertEquals(401, h.authentification(new AuthentificationException()).statut());
        assertEquals(400, h.requeteInvalide(new IllegalArgumentException("x")).statut());
        assertEquals(409, h.conflit(new ServiceFermeException("x")).statut());
        assertEquals(409, h.conflit(new FileSatureeException("x")).statut());
        assertEquals(409, h.conflit(new FileVideException()).statut());
        assertEquals(409, h.conflit(new IllegalStateException("x")).statut());
    }

    @Test
    void messageTransmisAuFrontend() {
        ErreurApi e = h.conflit(new TransitionInterditeException(CodeEtat.EN_ATTENTE, "terminer"));
        assertEquals(409, e.statut());
        assertTrue(e.message().contains("terminer"));
        assertNotNull(e.date());
    }
}
