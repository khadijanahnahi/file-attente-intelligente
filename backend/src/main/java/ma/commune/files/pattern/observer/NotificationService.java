package ma.commune.files.pattern.observer;

import ma.commune.files.domain.Canal;
import ma.commune.files.domain.Citoyen;
import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.Notification;
import ma.commune.files.domain.Ticket;
import ma.commune.files.domain.TypeNotification;
import ma.commune.files.pattern.factory.CanalNotification;
import ma.commune.files.pattern.factory.EmailFactory;
import ma.commune.files.pattern.factory.NotificationFactory;
import ma.commune.files.pattern.factory.PushFactory;
import ma.commune.files.pattern.factory.SmsFactory;
import ma.commune.files.repository.TicketRepository;
import ma.commune.files.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Observateur qui prévient le citoyen (confirmation, prochain tour, appel, absence).
 * Le canal est créé par une NotificationFactory (Factory Method) :
 * e-mail si le citoyen en a un, sinon SMS (simulé en MVP). Le push est envoyé en plus
 * sur /topic/ticket/{id} pour la page de suivi.
 */
@Component
public class NotificationService implements FileObserver {

    private static final System.Logger LOG = System.getLogger(NotificationService.class.getName());

    private final NotificationRepository repository;
    private final TicketRepository tickets;
    private final PushFactory pushFactory;
    private final int seuilBientotAppele;

    public NotificationService(NotificationRepository repository, TicketRepository tickets,
                                PushFactory pushFactory,
                                @Value("${files.notifications.bientot-appele:3}") int seuilBientotAppele) {
        this.repository = repository;
        this.tickets = tickets;
        this.pushFactory = pushFactory;
        this.seuilBientotAppele = Math.max(0, seuilBientotAppele);
    }

    @Override
    public void mettreAJour(EvenementFile evt) {
        if (evt.type() == TypeEvenement.TICKET_CREE) {
            notifierUneFois(evt.ticket(), TypeNotification.CONFIRMATION);
        } else if (evt.type() == TypeEvenement.TICKET_APPELE) {
            notifierUneFois(evt.ticket(), TypeNotification.APPELE);
            notifierBientotAppeles(evt.ticket());
        } else if (evt.type() == TypeEvenement.TICKET_ABSENT) {
            notifierUneFois(evt.ticket(), TypeNotification.ABSENT);
            notifierBientotAppeles(evt.ticket());
        } else if (evt.type() == TypeEvenement.TICKET_ANNULE
                || evt.type() == TypeEvenement.TICKET_TERMINE) {
            notifierBientotAppeles(evt.ticket());
        }
    }

    private void notifierUneFois(Ticket ticket, TypeNotification type) {
        if (dejaEnvoyee(ticket, type)) {
            return;
        }
        Citoyen citoyen = ticket.getCitoyen();
        String message = messagePour(type, ticket);
        envoyerTousCanaux(ticket, type, citoyen, message);
    }

    private void notifierBientotAppeles(Ticket evenementTicket) {
        if (seuilBientotAppele == 0) {
            return;
        }
        List<Ticket> attente = new ArrayList<>(tickets.findByFileIdAndEtatOrderByHeureCreationAsc(
                evenementTicket.getFile().getId(), CodeEtat.EN_ATTENTE));
        List<Ticket> ordonnes = new ArrayList<>(attente.size());
        while (!attente.isEmpty() && ordonnes.size() < seuilBientotAppele) {
            Ticket suivant = evenementTicket.getFile().politiqueCourante()
                    .choisirSuivant(attente).orElseThrow();
            ordonnes.add(suivant);
            attente.remove(suivant);
        }
        ordonnes.forEach(ticket -> notifierUneFois(ticket, TypeNotification.BIENTOT_APPELE));
    }

    private boolean dejaEnvoyee(Ticket ticket, TypeNotification type) {
        return repository.existsByTicketIdAndType(ticket.getId(), type);
    }

    private void envoyerTousCanaux(Ticket ticket, TypeNotification type, Citoyen citoyen, String message) {
        envoyer(pushFactory, ticket, type, String.valueOf(ticket.getId()), message);
        if (citoyen.getEmail() != null && !citoyen.getEmail().isBlank()) {
            envoyer(new EmailFactory(), ticket, type, citoyen.getEmail(), message);
        } else if (citoyen.getTelephone() != null && !citoyen.getTelephone().isBlank()) {
            envoyer(new SmsFactory(), ticket, type, citoyen.getTelephone(), message);
        }
    }

    private void envoyer(NotificationFactory fabrique, Ticket ticket, TypeNotification type,
                         String destinataire, String message) {
        CanalNotification canal = fabrique.creerCanal();
        boolean succes = true;
        try {
            canal.envoyer(destinataire, message);
        } catch (RuntimeException e) {
            succes = false;
            LOG.log(System.Logger.Level.ERROR, "Échec d'envoi " + canal.type()
                    + " pour le ticket " + ticket.getId() + ": " + e.getMessage());
        }
        Notification n = new Notification();
        n.setTicket(ticket);
        n.setCanal(canal.type());
        n.setType(type);
        n.setMessage(message);
        n.setSucces(succes);
        repository.save(n);
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
