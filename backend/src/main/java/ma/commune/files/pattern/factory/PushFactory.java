package ma.commune.files.pattern.factory;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/** Composant Spring car PushCanal a besoin de la messagerie WebSocket. */
@Component
public class PushFactory extends NotificationFactory {

    private final SimpMessagingTemplate messagerie;

    public PushFactory(SimpMessagingTemplate messagerie) { this.messagerie = messagerie; }

    @Override public CanalNotification creerCanal() { return new PushCanal(messagerie); }
}
