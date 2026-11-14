package ma.commune.files.pattern.observer;

import ma.commune.files.domain.Ticket;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Écran de la salle d'attente : reçoit les événements et les pousse en WebSocket
 * sur /topic/ecran. Le frontend affiche le numéro et le guichet et déclenche le signal sonore
 * quand type = TICKET_APPELE.
 */
@Component
public class EcranAffichage implements FileObserver {

    public static final String DESTINATION = "/topic/ecran";

    private final SimpMessagingTemplate messagerie;

    public EcranAffichage(SimpMessagingTemplate messagerie) {
        this.messagerie = messagerie;
    }

    @Override
    public void mettreAJour(EvenementFile evt) {
        Ticket t = evt.ticket();
        Map<String, Object> message = new HashMap<>();
        message.put("type", evt.type().name());
        message.put("ticketId", t.getId());
        message.put("numero", t.getNumero());
        message.put("service", t.getService().getNom());
        message.put("guichet", t.getGuichet() != null ? t.getGuichet().getNumero() : null);
        message.put("date", evt.date().toString());
        messagerie.convertAndSend(DESTINATION, message);
        messagerie.convertAndSend("/topic/file/" + t.getService().getId(), message);
    }
}
