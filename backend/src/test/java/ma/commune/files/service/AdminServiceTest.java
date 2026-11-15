package ma.commune.files.service;

import ma.commune.files.domain.*;
import ma.commune.files.dto.*;
import ma.commune.files.pattern.Fixtures;
import ma.commune.files.repository.*;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AdminServiceTest {

    private final Fakes.Agents agentsMem = new Fakes.Agents();
    private final Fakes.Guichets guichetsMem = new Fakes.Guichets();
    private final Fakes.Services servicesMem = new Fakes.Services();
    private final AdminService admin;

    AdminServiceTest() {
        Service s = Fixtures.service();
        servicesMem.data.put(1L, s);
        admin = new AdminService(Fakes.repo(AgentRepository.class, agentsMem),
                Fakes.repo(GuichetRepository.class, guichetsMem),
                Fakes.repo(ServiceRepository.class, servicesMem), new Fakes.FauxEncodeur());
    }

    @Test
    void creerAgentHacheLeMotDePasseEtNeLeRenvoiePas() {
        AgentView v = admin.creerAgent(new CreerAgentRequest("Karim", "karim", "motdepasse1", RoleAgent.GUICHET));
        assertEquals("karim", v.login());
        assertEquals(true, v.actif());
        Agent enBase = agentsMem.data.get(v.id());
        assertEquals("h:motdepasse1", enBase.getMotDePasse());   // haché, jamais en clair
        assertNotEquals("motdepasse1", enBase.getMotDePasse());
    }

    @Test
    void loginEnDoubleRefuse() {
        admin.creerAgent(new CreerAgentRequest("Karim", "karim", "motdepasse1", RoleAgent.GUICHET));
        assertThrows(IllegalStateException.class,
                () -> admin.creerAgent(new CreerAgentRequest("Autre", "karim", "motdepasse2", RoleAgent.ACCUEIL)));
    }

    @Test
    void unAdminNePeutPasSeDesactiverNiSeRetrograder() {
        AgentView v = admin.creerAgent(new CreerAgentRequest("Boss", "boss", "motdepasse1", RoleAgent.ADMIN));
        assertThrows(IllegalStateException.class,
                () -> admin.modifierAgent(v.id(), new ModifierAgentRequest(null, null, false, null), v.id()));
        assertThrows(IllegalStateException.class,
                () -> admin.modifierAgent(v.id(), new ModifierAgentRequest(null, RoleAgent.GUICHET, null, null), v.id()));
        // un autre admin peut le faire
        assertEquals(false, admin.modifierAgent(v.id(), new ModifierAgentRequest(null, null, false, null), 999L).actif());
    }

    @Test
    void changerLeMotDePasse() {
        AgentView v = admin.creerAgent(new CreerAgentRequest("Karim", "karim", "motdepasse1", RoleAgent.GUICHET));
        admin.modifierAgent(v.id(), new ModifierAgentRequest(null, null, null, "nouveaumdp99"), 999L);
        assertEquals("h:nouveaumdp99", agentsMem.data.get(v.id()).getMotDePasse());
    }

    @Test
    void creerGuichetEtRefusDesDoublons() {
        AgentView a = admin.creerAgent(new CreerAgentRequest("Karim", "karim", "motdepasse1", RoleAgent.GUICHET));
        GuichetView g = admin.creerGuichet(new CreerGuichetRequest(5, 1L, a.id()));
        assertEquals(EtatGuichet.FERME, g.etat());
        assertEquals(a.id(), g.agentId());
        assertThrows(IllegalStateException.class, () -> admin.creerGuichet(new CreerGuichetRequest(5, 1L, null)));      // numéro pris
        assertThrows(IllegalStateException.class, () -> admin.creerGuichet(new CreerGuichetRequest(6, 1L, a.id())));    // agent déjà affecté
        assertThrows(ma.commune.files.exception.RessourceIntrouvableException.class,
                () -> admin.creerGuichet(new CreerGuichetRequest(7, 99L, null)));
    }

    @Test
    void affectationSeulementSiLeGuichetEstFerme() {
        GuichetView g = admin.creerGuichet(new CreerGuichetRequest(5, 1L, null));
        guichetsMem.data.get(g.id()).setEtat(EtatGuichet.OUVERT);
        assertThrows(IllegalStateException.class, () -> admin.affecterGuichet(g.id(), new AffecterGuichetRequest(1L, null)));
    }
}
