package ma.commune.files.controller;

import ma.commune.files.domain.Agent;
import ma.commune.files.domain.RoleAgent;
import ma.commune.files.dto.LoginRequest;
import ma.commune.files.dto.LoginResponse;
import ma.commune.files.exception.AuthentificationException;
import ma.commune.files.repository.AgentRepository;
import ma.commune.files.security.JwtService;
import ma.commune.files.service.Fakes;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthControllerTest {

    private final Fakes.Agents agentsMem = new Fakes.Agents();
    private final JwtService jwt = new JwtService("une-cle-secrete-de-test-assez-longue-0123456789", 8);
    private final AuthController controller;

    AuthControllerTest() {
        Agent a = new Agent();
        a.setId(7L); a.setNom("Agent Guichet 1"); a.setLogin("guichet1");
        a.setMotDePasse("h:guichet123"); a.setRole(RoleAgent.GUICHET);
        agentsMem.save(a);
        Agent inactif = new Agent();
        inactif.setId(8L); inactif.setNom("Ancien"); inactif.setLogin("ancien");
        inactif.setMotDePasse("h:secret1234"); inactif.setRole(RoleAgent.GUICHET); inactif.setActif(false);
        agentsMem.save(inactif);
        controller = new AuthController(Fakes.repo(AgentRepository.class, agentsMem), new Fakes.FauxEncodeur(), jwt);
    }

    @Test
    void connexionReussie() {
        LoginResponse r = controller.login(new LoginRequest(" guichet1 ", "guichet123"));
        assertEquals(RoleAgent.GUICHET, r.role());
        assertEquals(7L, r.agentId());
        assertEquals(8 * 3600L, r.expireDansSecondes());
        assertEquals(java.util.Optional.of(7L), jwt.verifier(r.jeton()));
    }

    @Test
    void mauvaisMotDePasse() {
        assertThrows(AuthentificationException.class, () -> controller.login(new LoginRequest("guichet1", "faux")));
    }

    @Test
    void loginInconnuMemeErreur() {
        AuthentificationException e = assertThrows(AuthentificationException.class,
                () -> controller.login(new LoginRequest("personne", "x")));
        assertEquals("Identifiant ou mot de passe incorrect.", e.getMessage());
    }

    @Test
    void compteDesactiveRefuse() {
        assertThrows(AuthentificationException.class, () -> controller.login(new LoginRequest("ancien", "secret1234")));
    }
}
