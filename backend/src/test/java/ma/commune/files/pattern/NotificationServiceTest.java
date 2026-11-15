package ma.commune.files.pattern;

import ma.commune.files.domain.*;
import ma.commune.files.pattern.factory.CanalNotification;
import ma.commune.files.pattern.factory.PushFactory;
import ma.commune.files.pattern.observer.EvenementFile;
import ma.commune.files.pattern.observer.NotificationService;
import ma.commune.files.pattern.observer.TypeEvenement;
import ma.commune.files.repository.NotificationRepository;
import ma.commune.files.repository.TicketRepository;
import ma.commune.files.service.Fakes;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class NotificationServiceTest {

    private final Service service = Fixtures.service();
    private final File file = Fixtures.file(service);
    private final Fakes.Tickets ticketsMem = new Fakes.Tickets();
    private final Fakes.Notifications notifsMem = new Fakes.Notifications();
    private final List<String> pushs = new ArrayList<>();
    private final NotificationService notifications;

    NotificationServiceTest() {
        file.setPolitique(CodePolitique.FIFO);
        // canal push factice : pas de WebSocket dans les tests
        PushFactory pushFactice = new PushFactory(null) {
            @Override public CanalNotification creerCanal() {
                return new CanalNotification() {
                    @Override public Canal type() { return Canal.PUSH; }
                    @Override public void envoyer(String dest, String msg) { pushs.add(dest + " : " + msg); }
                };
            }
        };
        notifications = new NotificationService(Fakes.repo(NotificationRepository.class, notifsMem),
                Fakes.repo(TicketRepository.class, ticketsMem), pushFactice, 3);
    }

    /** Cinq tickets en attente, du plus ancien (45 min) au plus récent. */
    private List<Ticket> cinqEnAttente() {
        List<Ticket> liste = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            Ticket t = Fixtures.ticket(service, file, Priorite.NORMALE, 45 - i * 5);
            t.getCitoyen().setEmail("c" + i + "@x.ma");
            ticketsMem.data.put(t.getId(), t);
            liste.add(t);
        }
        return liste;
    }

    private Set<Long> ticketsPrevenus(TypeNotification type) {
        return notifsMem.data.values().stream().filter(n -> n.getType() == type)
                .map(n -> n.getTicket().getId()).collect(Collectors.toSet());
    }

    @Test
    void quandUnTicketEstAppeleLesTroisPremiersSontPrevenus() {
        List<Ticket> t = cinqEnAttente();
        Ticket appele = t.get(0);
        appele.appeler(Fixtures.guichet());

        notifications.mettreAJour(EvenementFile.de(TypeEvenement.TICKET_APPELE, appele));

        assertEquals(Set.of(t.get(0).getId()), ticketsPrevenus(TypeNotification.APPELE));
        // il reste t1..t4 en attente : t1, t2, t3 sont dans les 3 premières places
        assertEquals(Set.of(t.get(1).getId(), t.get(2).getId(), t.get(3).getId()),
                ticketsPrevenus(TypeNotification.BIENTOT_APPELE));
    }

    @Test
    void personneNEstPrevenuDeuxFois() {
        List<Ticket> t = cinqEnAttente();
        t.get(0).appeler(Fixtures.guichet());
        notifications.mettreAJour(EvenementFile.de(TypeEvenement.TICKET_APPELE, t.get(0)));
        // t1, t2, t3 prévenus (push + e-mail chacun)
        assertEquals(Set.of(t.get(1).getId(), t.get(2).getId(), t.get(3).getId()),
                ticketsPrevenus(TypeNotification.BIENTOT_APPELE));

        // t1 est appelé à son tour : seul t4 entre dans les 3 premières places
        t.get(1).appeler(Fixtures.guichet());
        notifications.mettreAJour(EvenementFile.de(TypeEvenement.TICKET_APPELE, t.get(1)));
        assertEquals(Set.of(t.get(1).getId(), t.get(2).getId(), t.get(3).getId(), t.get(4).getId()),
                ticketsPrevenus(TypeNotification.BIENTOT_APPELE));

        // t2 n'a reçu son « bientôt appelé » qu'une fois (2 envois : push + e-mail)
        long envoisPourT2 = notifsMem.data.values().stream()
                .filter(n -> n.getType() == TypeNotification.BIENTOT_APPELE && n.getTicket() == t.get(2)).count();
        assertEquals(2L, envoisPourT2);
    }

    @Test
    void uneAnnulationFaitAvancerLaFileAussi() {
        List<Ticket> t = cinqEnAttente();
        t.get(1).annuler();
        notifications.mettreAJour(EvenementFile.de(TypeEvenement.TICKET_ANNULE, t.get(1)));
        assertEquals(Set.of(t.get(0).getId(), t.get(2).getId(), t.get(3).getId()),
                ticketsPrevenus(TypeNotification.BIENTOT_APPELE));
        assertTrue(ticketsPrevenus(TypeNotification.APPELE).isEmpty());   // pas de message « appelé » pour une annulation
    }

    @Test
    void laCreationEnvoieUneConfirmationSansBientotAppele() {
        List<Ticket> t = cinqEnAttente();
        notifications.mettreAJour(EvenementFile.de(TypeEvenement.TICKET_CREE, t.get(4)));
        assertEquals(Set.of(t.get(4).getId()), ticketsPrevenus(TypeNotification.CONFIRMATION));
        assertTrue(ticketsPrevenus(TypeNotification.BIENTOT_APPELE).isEmpty());
        assertTrue(pushs.stream().anyMatch(p -> p.contains("enregistré")));
    }

    @Test
    void echecDEnvoiNeBloquePasEtEstEnregistre() {
        PushFactory casse = new PushFactory(null) {
            @Override public CanalNotification creerCanal() {
                return new CanalNotification() {
                    @Override public Canal type() { return Canal.PUSH; }
                    @Override public void envoyer(String d, String m) { throw new IllegalStateException("panne"); }
                };
            }
        };
        NotificationService n = new NotificationService(Fakes.repo(NotificationRepository.class, notifsMem),
                Fakes.repo(TicketRepository.class, ticketsMem), casse, 3);
        Ticket t = cinqEnAttente().get(0);
        n.mettreAJour(EvenementFile.de(TypeEvenement.TICKET_CREE, t));
        Notification push = notifsMem.data.values().stream().filter(x -> x.getCanal() == Canal.PUSH).findFirst().orElseThrow();
        assertEquals(false, push.isSucces());
    }
}
