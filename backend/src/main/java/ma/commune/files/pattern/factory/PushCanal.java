package ma.commune.files.pattern.factory;

import ma.commune.files.domain.Canal;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;

/** Notification push : message WebSocket sur /topic/ticket/{ticketId} (page de suivi du citoyen). */
public class PushCanal implements CanalNotification {

    private final SimpMessagingTemplate messagerie;

    public PushCanal(SimpMessagingTemplate messagerie) { this.messagerie = messagerie; }

    @Override public Canal type() { return Canal.PUSH; }

    /** Ici le destinataire est l'identifiant du ticket. */
    @Override public void envoyer(String ticketId, String message) {
        messagerie.convertAndSend("/topic/ticket/" + ticketId, Map.of("message", message));
    }
}
