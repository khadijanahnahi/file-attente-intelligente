package ma.commune.files.config;

import ma.commune.files.repository.AgentRepository;
import ma.commune.files.security.JwtAuthFilter;
import ma.commune.files.security.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Sécurité : API sans session (stateless), mots de passe BCrypt, accès par rôle (RBAC).
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @org.springframework.beans.factory.annotation.Value("${files.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String corsAllowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Autorise le frontend React (Vite : port 5173) à appeler l'API. À restreindre en production. */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim).filter(origin -> !origin.isEmpty()).toList());
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService,
                                                  AgentRepository agents) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)           // API REST + JWT : pas de cookie de session
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .authorizeHttpRequests(auth -> auth
                // Public : connexion, WebSocket, prise de ticket, suivi du ticket, liste des services
                .requestMatchers("/api/auth/login", "/ws/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/services/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/tickets").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tickets/*").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/tickets/*/annuler").hasAnyRole("ACCUEIL", "GUICHET", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/tickets/*/annuler-citoyen").permitAll()
                // Agent d'accueil : ticket pour un citoyen sans smartphone
                .requestMatchers("/api/accueil/**").hasAnyRole("ACCUEIL", "ADMIN")
                // Agent de guichet : appeler, traiter, terminer...
                .requestMatchers("/api/guichet/**").hasAnyRole("GUICHET", "ADMIN")
                // Responsable : configuration et tableau de bord
                .requestMatchers("/api/dashboard/**", "/api/config/**").hasAnyRole("RESPONSABLE", "ADMIN")
                // Administrateur : utilisateurs, rôles, guichets
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(new JwtAuthFilter(jwtService, agents), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
