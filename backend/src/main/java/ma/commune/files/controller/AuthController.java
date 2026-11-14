package ma.commune.files.controller;

import jakarta.validation.Valid;
import ma.commune.files.domain.Agent;
import ma.commune.files.dto.AgentView;
import ma.commune.files.dto.LoginRequest;
import ma.commune.files.dto.LoginResponse;
import ma.commune.files.exception.AuthentificationException;
import ma.commune.files.exception.RessourceIntrouvableException;
import ma.commune.files.repository.AgentRepository;
import ma.commune.files.security.AgentPrincipal;
import ma.commune.files.security.JwtService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Connexion des agents : POST /api/auth/login renvoie un jeton JWT à mettre dans « Authorization: Bearer ... ». */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AgentRepository agents;
    private final PasswordEncoder encodeur;
    private final JwtService jwt;

    public AuthController(AgentRepository agents, PasswordEncoder encodeur, JwtService jwt) {
        this.agents = agents;
        this.encodeur = encodeur;
        this.jwt = jwt;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest requete) {
        // même erreur pour « login inconnu », « mauvais mot de passe » et « compte désactivé »
        Agent agent = agents.findByLogin(requete.login().trim())
                .filter(Agent::isActif)
                .filter(a -> encodeur.matches(requete.motDePasse(), a.getMotDePasse()))
                .orElseThrow(AuthentificationException::new);
        return new LoginResponse(jwt.creer(agent), jwt.dureeSecondes(), agent.getId(), agent.getNom(), agent.getRole());
    }

    /** L'agent connecté (le frontend s'en sert pour afficher son nom et choisir ses écrans). */
    @GetMapping("/me")
    public AgentView moi(@AuthenticationPrincipal AgentPrincipal agent) {
        return agents.findById(agent.id()).map(AgentView::de)
                .orElseThrow(() -> new RessourceIntrouvableException("Agent inconnu : " + agent.id()));
    }
}
