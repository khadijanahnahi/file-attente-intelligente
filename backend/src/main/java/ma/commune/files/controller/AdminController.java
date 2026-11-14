package ma.commune.files.controller;

import jakarta.validation.Valid;
import ma.commune.files.dto.AffecterGuichetRequest;
import ma.commune.files.dto.AgentView;
import ma.commune.files.dto.CreerAgentRequest;
import ma.commune.files.dto.CreerGuichetRequest;
import ma.commune.files.dto.CreerServiceRequest;
import ma.commune.files.dto.GuichetView;
import ma.commune.files.dto.ModifierAgentRequest;
import ma.commune.files.dto.ServiceView;
import ma.commune.files.security.AgentPrincipal;
import ma.commune.files.service.AdminService;
import ma.commune.files.service.ServiceCatalogueService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Réservé au rôle ADMIN (voir SecurityConfig) : utilisateurs, rôles, guichets, services. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService admin;
    private final ServiceCatalogueService catalogue;

    public AdminController(AdminService admin, ServiceCatalogueService catalogue) {
        this.admin = admin;
        this.catalogue = catalogue;
    }

    @GetMapping("/agents")
    public List<AgentView> agents() {
        return admin.listerAgents();
    }

    @PostMapping("/agents")
    @ResponseStatus(HttpStatus.CREATED)
    public AgentView creerAgent(@Valid @RequestBody CreerAgentRequest r) {
        return admin.creerAgent(r);
    }

    @PutMapping("/agents/{id}")
    public AgentView modifierAgent(@AuthenticationPrincipal AgentPrincipal moi, @PathVariable Long id,
                                   @Valid @RequestBody ModifierAgentRequest r) {
        return admin.modifierAgent(id, r, moi.id());
    }

    @GetMapping("/guichets")
    public List<GuichetView> guichets() {
        return admin.listerGuichets();
    }

    @PostMapping("/guichets")
    @ResponseStatus(HttpStatus.CREATED)
    public GuichetView creerGuichet(@Valid @RequestBody CreerGuichetRequest r) {
        return admin.creerGuichet(r);
    }

    @PutMapping("/guichets/{id}")
    public GuichetView affecterGuichet(@PathVariable Long id, @RequestBody AffecterGuichetRequest r) {
        return admin.affecterGuichet(id, r);
    }

    @PostMapping("/services")
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceView creerService(@Valid @RequestBody CreerServiceRequest r) {
        return catalogue.creer(r);
    }
}
