package ma.commune.files.security;

import ma.commune.files.domain.Agent;
import ma.commune.files.domain.RoleAgent;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String SECRET = "une-cle-secrete-de-test-assez-longue-0123456789";
    private final JwtService jwt = new JwtService(SECRET, 8);
    private final Instant t0 = Instant.parse("2026-11-14T09:00:00Z");

    private Agent agent(long id, RoleAgent role) {
        Agent a = new Agent();
        a.setId(id);
        a.setRole(role);
        return a;
    }

    private static String b64(String s) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(s.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void jetonValideRetrouveLAgent() {
        String jeton = jwt.creer(agent(42, RoleAgent.GUICHET), t0);
        assertEquals(3, jeton.split("\\.").length);
        assertEquals(Optional.of(42L), jwt.verifier(jeton, t0.plusSeconds(60)));
    }

    @Test
    void jetonExpireApresLaDuree() {
        String jeton = jwt.creer(agent(1, RoleAgent.ADMIN), t0);
        assertTrue(jwt.verifier(jeton, t0.plusSeconds(8 * 3600 - 1)).isPresent());
        assertTrue(jwt.verifier(jeton, t0.plusSeconds(8 * 3600)).isEmpty());
    }

    @Test
    void chargeModifieeEstRefusee() {
        String[] p = jwt.creer(agent(5, RoleAgent.GUICHET), t0).split("\\.");
        // l'attaquant remplace l'agent 5 par l'agent 1 en gardant l'ancienne signature
        String charge = new String(Base64.getUrlDecoder().decode(p[1]), StandardCharsets.UTF_8).replace("\"sub\":\"5\"", "\"sub\":\"1\"");
        assertTrue(jwt.verifier(p[0] + "." + b64(charge) + "." + p[2], t0).isEmpty());
    }

    @Test
    void signatureAvecUneAutreCleEstRefusee() {
        String jeton = new JwtService("une-AUTRE-cle-secrete-de-test-0123456789012", 8).creer(agent(1, RoleAgent.ADMIN), t0);
        assertTrue(jwt.verifier(jeton, t0).isEmpty());
    }

    @Test
    void algorithmeNoneEstRefuse() {
        String entete = b64("{\"alg\":\"none\",\"typ\":\"JWT\"}");
        String charge = b64("{\"sub\":\"1\",\"role\":\"ADMIN\",\"iat\":0,\"exp\":99999999999}");
        assertTrue(jwt.verifier(entete + "." + charge + ".", t0).isEmpty());
        assertTrue(jwt.verifier(entete + "." + charge, t0).isEmpty());
    }

    @Test
    void jetonsIllisibles() {
        assertTrue(jwt.verifier(null, t0).isEmpty());
        assertTrue(jwt.verifier("", t0).isEmpty());
        assertTrue(jwt.verifier("abc", t0).isEmpty());
        assertTrue(jwt.verifier("a.b.c", t0).isEmpty());
        assertTrue(jwt.verifier("%%%.%%%.%%%", t0).isEmpty());
    }

    @Test
    void cleTropCourteRefusee() {
        assertThrows(IllegalStateException.class, () -> new JwtService("trop-court", 8));
    }
}
