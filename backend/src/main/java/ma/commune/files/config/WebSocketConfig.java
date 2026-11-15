package ma.commune.files.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

/**
 * Temps réel (STOMP sur WebSocket) pour l'écran d'affichage, la position du citoyen
 * et le tableau de bord (mise à jour attendue en moins de 1 s).
 *
 * Canaux prévus (utilisés par les observateurs du pattern Observer) :
 *   /topic/file/{serviceId}   -> état d'une file
 *   /topic/ecran              -> annonces « ticket N-042, guichet 3 »
 *   /topic/ticket/{ticketId}  -> position et attente estimée d'un citoyen
 *   /topic/dashboard          -> indicateurs du tableau de bord
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${files.websocket.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim).filter(origin -> !origin.isEmpty()).toArray(String[]::new))
                .withSockJS();
    }
}
