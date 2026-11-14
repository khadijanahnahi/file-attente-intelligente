package ma.commune.files.pattern.observer;

import ma.commune.files.domain.Canal;
import ma.commune.files.domain.Citoyen;
import ma.commune.files.domain.Notification;
import ma.commune.files.domain.Ticket;
import ma.commune.files.domain.TypeNotification;
import ma.commune.files.pattern.factory.CanalNotification;
import ma.commune.files.pattern.factory.EmailFactory;
import ma.commune.files.pattern.factory.NotificationFactory;
import ma.commune.files.pattern.factory.PushFactory;
import ma.commune.files.pattern.factory.SmsFactory;
import ma.commune.files.repository.NotificationRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Observateur qui prévient le citoyen (confirmation, appel, absence).
 * Le canal est créé par une NotificationFactory (Factory Method) :
 * e-mail si le citoyen en a un, sinon SMS (simulé en MVP). Le push est envoyé en plus
 * sur /topic/ticket/{id} pour la page de suivi.
 */
@Component
public class NotificationService implements FileObserver {

    private final NotificationRepository repository;
    private final PushFactory pushFactory;

    public NotificationService(NotificationRepository repository, PushFactory pushFactory) {
        this.repository = repository;
        this.pushFactory = pushFactory;
    }

    @Override
    public void mettreAJour(EvenementFile evt) {
        Optional<TypeNotification> type = typePour(evt.type());
        if (type.isEmpty()) {
            return;   // cet événement n'envoie rien au citoyen
        }
        Ticket ticket = evt.ticket();
        Citoyen citoyen = ticket.getCitoyen();
        String message = messagePour(type.get(), ticket);

        envoyer(pushFactory, ticket, type.get(), String.valueOf(ticket.getId()), message);
        if (citoyen.getEmail() != null && !citoyen.getEmail().isBlank()) {
            envoyer(new EmailFactory(), ticket, type.get(), citoyen.getEmail(), message);
        } else if (citoyen.getTelephone() != null && !citoyen.getTelephone().isBlank()) {
            envoyer(new SmsFactory(), ticket, type.get(), citoyen.getTelephone(), message);
        }
    }

    private void envoyer(NotificationFactory fabrique, Ticket ticket, TypeNotification type,
                         String destinataire, String message) {
        CanalNotification canal = fabrique.creerCanal();
        boolean succes = true;
        try {
            canal.envoyer(destinataire, message);
        } catch (RuntimeException e) {
            succes = false;   // un échec d'envoi ne doit jamais bloquer le guichet
        }
        Notification n = new Notification();
        n.setTicket(ticket);
        n.setCanal(canal.type());
        n.setType(type);
        n.setMessage(message);
        n.setSucces(succes);
        repository.save(n);
    }

    static Optional<TypeNotification> typePour(TypeEvenement t) {
        return switch (t) {
            case TICKET_CREE   -> Optional.of(TypeNotification.CONFIRMATION);
            case TICKET_APPELE -> Optional.of(TypeNotification.APPELE);
            case TICKET_ABSENT -> Optional.of(TypeNotification.ABSENT);
            default            -> Optional.empty();
        };
    }

    static String messagePour(TypeNotification type, Ticket t) {
        return switch (type) {
            case CONFIRMATION   -> "Votre ticket " + t.getNumero() + " est enregistré (" + t.getService().getNom() + ").";
            case BIENTOT_APPELE -> "Votre tour approche : ticket " + t.getNumero() + ".";
            case APPELE         -> "Ticket " + t.getNumero() + " : présentez-vous au guichet "
                                   + (t.getGuichet() != null ? t.getGuichet().getNumero() : "") + ".";
            case ABSENT         -> "Ticket " + t.getNumero() + " : vous étiez absent, le ticket est clôturé.";
        };
    }
}
