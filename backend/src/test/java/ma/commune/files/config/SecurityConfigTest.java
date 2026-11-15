package ma.commune.files.config;

import ma.commune.files.domain.Agent;
import ma.commune.files.domain.RoleAgent;
import ma.commune.files.repository.AgentRepository;
import ma.commune.files.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SecurityConfigTest.ProbeController.class)
@Import({SecurityConfig.class, SecurityConfigTest.ProbeController.class})
class SecurityConfigTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private JwtService jwt;

    @MockBean
    private AgentRepository agents;

    @Test
    void protectedAdminRouteRequiresJwtAndAdminRole() throws Exception {
        mvc.perform(get("/api/admin/probe")).andExpect(status().isUnauthorized());

        Agent admin = new Agent();
        admin.setId(8L);
        admin.setLogin("admin");
        admin.setNom("Admin");
        admin.setRole(RoleAgent.ADMIN);
        admin.setActif(true);
        when(jwt.verifier("valid")).thenReturn(Optional.of(8L));
        when(agents.findById(8L)).thenReturn(Optional.of(admin));

        mvc.perform(get("/api/admin/probe").header("Authorization", "Bearer valid"))
                .andExpect(status().isOk());

        Agent guichet = new Agent();
        guichet.setId(9L);
        guichet.setLogin("guichet");
        guichet.setNom("Guichet");
        guichet.setRole(RoleAgent.GUICHET);
        guichet.setActif(true);
        when(jwt.verifier("guichet-token")).thenReturn(Optional.of(9L));
        when(agents.findById(9L)).thenReturn(Optional.of(guichet));

        mvc.perform(get("/api/admin/probe").header("Authorization", "Bearer guichet-token"))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/tickets/12/annuler").header("Authorization", "Bearer guichet-token"))
                .andExpect(status().isOk());
    }

    @Test
    void seulLeLoginEstPublicDansLesRoutesAuth() throws Exception {
        mvc.perform(post("/api/auth/login")).andExpect(status().isOk());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @RestController
    public static class ProbeController {
        @GetMapping("/api/admin/probe")
        public String admin() {
            return "ok";
        }

        @PostMapping("/api/auth/login")
        public String login() {
            return "ok";
        }

        @GetMapping("/api/auth/me")
        public String me() {
            return "ok";
        }

        @PostMapping("/api/tickets/{id}/annuler")
        public String annuler() {
            return "ok";
        }
    }
}
