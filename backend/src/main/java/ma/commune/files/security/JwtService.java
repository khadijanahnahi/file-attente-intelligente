package ma.commune.files.security;

import ma.commune.files.domain.Agent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Jetons JWT signés HS256, implémentés avec le JDK seul (aucune librairie JWT à ajouter).
 *
 * Format standard : entete.charge.signature (Base64 URL). La charge contient
 * sub (id de l'agent), role, iat et exp. Le jeton est vérifié strictement :
 * entête imposé (HS256, donc pas de "alg":"none"), signature comparée en temps constant,
 * date d'expiration contrôlée. Le rôle réel est relu en base à chaque requête (voir JwtAuthFilter).
 */
@Component
public class JwtService {

    private static final String ENTETE = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    private static final Pattern SUB = Pattern.compile("\"sub\":\"(\\d+)\"");
    private static final Pattern EXP = Pattern.compile("\"exp\":(\\d+)");
    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64D = Base64.getUrlDecoder();

    private final byte[] cle;
    private final long dureeSecondes;

    public JwtService(@Value("${files.jwt.secret}") String secret,
                      @Value("${files.jwt.duree-heures:8}") long dureeHeures) {
        byte[] octets = secret.getBytes(StandardCharsets.UTF_8);
        if (octets.length < 32) {
            throw new IllegalStateException("files.jwt.secret doit faire au moins 32 caractères (variable JWT_SECRET).");
        }
        this.cle = octets;
        this.dureeSecondes = dureeHeures * 3600;
    }

    public String creer(Agent agent) {
        return creer(agent, Instant.now());
    }

    public Optional<Long> verifier(String jeton) {
        return verifier(jeton, Instant.now());
    }

    public long dureeSecondes() { return dureeSecondes; }

    // --- versions avec horloge, pour les tests ---

    String creer(Agent agent, Instant maintenant) {
        String charge = String.format("{\"sub\":\"%d\",\"role\":\"%s\",\"iat\":%d,\"exp\":%d}",
                agent.getId(), agent.getRole().name(), maintenant.getEpochSecond(),
                maintenant.getEpochSecond() + dureeSecondes);
        String signe = B64.encodeToString(ENTETE.getBytes(StandardCharsets.UTF_8))
                + "." + B64.encodeToString(charge.getBytes(StandardCharsets.UTF_8));
        return signe + "." + B64.encodeToString(signer(signe));
    }

    /** @return l'id de l'agent si le jeton est authentique et non expiré, sinon vide. */
    Optional<Long> verifier(String jeton, Instant maintenant) {
        if (jeton == null) {
            return Optional.empty();
        }
        String[] parties = jeton.split("\\.", -1);
        if (parties.length != 3) {
            return Optional.empty();
        }
        try {
            String enteteAttendue = B64.encodeToString(ENTETE.getBytes(StandardCharsets.UTF_8));
            if (!enteteAttendue.equals(parties[0])) {
                return Optional.empty();   // refuse tout autre algorithme, dont "none"
            }
            byte[] signatureRecue = B64D.decode(parties[2]);
            byte[] signatureAttendue = signer(parties[0] + "." + parties[1]);
            if (!MessageDigest.isEqual(signatureAttendue, signatureRecue)) {
                return Optional.empty();
            }
            String charge = new String(B64D.decode(parties[1]), StandardCharsets.UTF_8);
            Matcher exp = EXP.matcher(charge);
            Matcher sub = SUB.matcher(charge);
            if (!exp.find() || !sub.find() || maintenant.getEpochSecond() >= Long.parseLong(exp.group(1))) {
                return Optional.empty();
            }
            return Optional.of(Long.parseLong(sub.group(1)));
        } catch (IllegalArgumentException e) {   // Base64 ou nombre invalide
            return Optional.empty();
        }
    }

    private byte[] signer(String donnees) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(cle, "HmacSHA256"));
            return mac.doFinal(donnees.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA256 indisponible", e);
        }
    }
}
