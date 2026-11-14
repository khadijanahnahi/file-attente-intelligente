package ma.commune.files.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import ma.commune.files.domain.Agent;
import ma.commune.files.repository.AgentRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Lit l'en-tête « Authorization: Bearer <jeton> », vérifie le jeton, puis recharge l'agent en base :
 * un agent désactivé ou dont le rôle a changé est pris en compte immédiatement, sans attendre
 * l'expiration du jeton. Sans jeton valide, la requête continue sans authentification
 * (les règles de SecurityConfig décident alors : 401 ou accès public).
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwt;
    private final AgentRepository agents;

    public JwtAuthFilter(JwtService jwt, AgentRepository agents) {
        this.jwt = jwt;
        this.agents = agents;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest requete, HttpServletResponse reponse, FilterChain chaine)
            throws ServletException, IOException {
        String entete = requete.getHeader("Authorization");
        if (entete != null && entete.startsWith("Bearer ")) {
            jwt.verifier(entete.substring(7))
                    .flatMap(agents::findById)
                    .filter(Agent::isActif)
                    .ifPresent(a -> {
                        AgentPrincipal principal = new AgentPrincipal(a.getId(), a.getLogin(), a.getNom(), a.getRole());
                        SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(principal, null,
                                        List.of(new SimpleGrantedAuthority("ROLE_" + a.getRole().name()))));
                    });
        }
        chaine.doFilter(requete, reponse);
    }
}
