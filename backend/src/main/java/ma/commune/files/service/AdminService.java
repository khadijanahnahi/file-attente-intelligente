package ma.commune.files.service;

import ma.commune.files.domain.Agent;
import ma.commune.files.domain.EtatGuichet;
import ma.commune.files.domain.Guichet;
import ma.commune.files.domain.RoleAgent;
import ma.commune.files.domain.Service;
import ma.commune.files.dto.AffecterGuichetRequest;
import ma.commune.files.dto.AgentView;
import ma.commune.files.dto.CreerAgentRequest;
import ma.commune.files.dto.CreerGuichetRequest;
import ma.commune.files.dto.GuichetView;
import ma.commune.files.dto.ModifierAgentRequest;
import ma.commune.files.exception.RessourceIntrouvableException;
import ma.commune.files.repository.AgentRepository;
import ma.commune.files.repository.GuichetRepository;
import ma.commune.files.repository.ServiceRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@org.springframework.stereotype.Service
public class AdminService {

    private final AgentRepository agents;
    private final GuichetRepository guichets;
    private final ServiceRepository services;
    private final PasswordEncoder encodeur;

    public AdminService(AgentRepository agents, GuichetRepository guichets,
                        ServiceRepository services, PasswordEncoder encodeur) {
        this.agents = agents;
        this.guichets = guichets;
        this.services = services;
        this.encodeur = encodeur;
    }

    @Transactional(readOnly = true)
    public List<AgentView> listerAgents() {
        return agents.findAll().stream().map(AgentView::de).toList();
    }

    @Transactional
    public AgentView creerAgent(CreerAgentRequest requete) {
        String login = requete.login().trim();
        if (agents.findByLogin(login).isPresent()) {
            throw new IllegalStateException("Ce login est déjà utilisé.");
        }
        Agent agent = new Agent();
        agent.setNom(requete.nom().trim());
        agent.setLogin(login);
        agent.setMotDePasse(encodeur.encode(requete.motDePasse()));
        agent.setRole(requete.role());
        agent.setActif(true);
        return AgentView.de(agents.save(agent));
    }

    @Transactional
    public AgentView modifierAgent(Long id, ModifierAgentRequest requete, Long adminConnecteId) {
        Agent agent = agents.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Agent inconnu : " + id));
        if (id.equals(adminConnecteId)
                && (Boolean.FALSE.equals(requete.actif())
                || (requete.role() != null && requete.role() != RoleAgent.ADMIN))) {
            throw new IllegalStateException("Un administrateur ne peut pas désactiver son compte ni changer son rôle.");
        }
        if (requete.nom() != null) {
            agent.setNom(requete.nom().trim());
        }
        if (requete.role() != null) {
            agent.setRole(requete.role());
        }
        if (requete.actif() != null) {
            agent.setActif(requete.actif());
        }
        if (requete.motDePasse() != null && !requete.motDePasse().isBlank()) {
            agent.setMotDePasse(encodeur.encode(requete.motDePasse()));
        }
        return AgentView.de(agent);
    }

    @Transactional(readOnly = true)
    public List<GuichetView> listerGuichets() {
        return guichets.findAll().stream().map(GuichetView::de).toList();
    }

    @Transactional
    public GuichetView creerGuichet(CreerGuichetRequest requete) {
        if (guichets.existsByNumero(requete.numero())) {
            throw new IllegalStateException("Ce numéro de guichet est déjà utilisé.");
        }
        Guichet guichet = new Guichet();
        guichet.setNumero(requete.numero());
        guichet.setEtat(EtatGuichet.FERME);
        guichet.setService(trouverService(requete.serviceId()));
        guichet.setAgent(trouverAgentDisponible(requete.agentId()));
        return GuichetView.de(guichets.save(guichet));
    }

    @Transactional
    public GuichetView affecterGuichet(Long id, AffecterGuichetRequest requete) {
        Guichet guichet = guichets.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Guichet inconnu : " + id));
        if (guichet.getEtat() != EtatGuichet.FERME) {
            throw new IllegalStateException("L'affectation n'est possible que lorsque le guichet est fermé.");
        }
        guichet.setService(requete.serviceId() == null ? null : trouverService(requete.serviceId()));
        guichet.setAgent(trouverAgentDisponible(requete.agentId(), id));
        return GuichetView.de(guichet);
    }

    private Service trouverService(Long id) {
        return services.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Service inconnu : " + id));
    }

    private Agent trouverAgentDisponible(Long id) {
        return trouverAgentDisponible(id, null);
    }

    private Agent trouverAgentDisponible(Long id, Long guichetIdCourant) {
        if (id == null) {
            return null;
        }
        Agent agent = agents.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Agent inconnu : " + id));
        if (agent.getRole() != RoleAgent.GUICHET) {
            throw new IllegalStateException("Seul un agent de guichet peut être affecté à un guichet.");
        }
        if (guichets.existsByAgentId(id)) {
            Guichet dejaAffecte = guichets.findByAgentId(id).orElse(null);
            if (dejaAffecte != null && !dejaAffecte.getId().equals(guichetIdCourant)) {
                throw new IllegalStateException("Cet agent est déjà affecté à un autre guichet.");
            }
        }
        return agent;
    }
}
