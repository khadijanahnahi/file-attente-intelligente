package ma.commune.files.pattern.observer;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Tableau de bord : à chaque événement, prévient le frontend (/topic/dashboard) qu'il doit
 * rafraîchir ses indicateurs. Les chiffres eux-mêmes viennent des requêtes agrégées
 * (StatistiqueService, étape 10) : le message ne transporte que l'événement.
 */
@Component
public class TableauDeBord implements FileObserver {

    public static final String DESTINATION = "/topic/dashboard";

    private final SimpMessagingTemplate messagerie;

    public TableauDeBord(SimpMessagingTemplate messagerie) {
        this.messagerie = messagerie;
    }

    @Override
    public void mettreAJour(EvenementFile evt) {
        messagerie.convertAndSend(DESTINATION, Map.of(
                "type", evt.type().name(),
                "serviceId", evt.ticket().getService().getId(),
                "date", evt.date().toString()));
    }
}
