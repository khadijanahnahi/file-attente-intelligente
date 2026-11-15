package ma.commune.files.service;

import ma.commune.files.domain.*;
import ma.commune.files.pattern.Fixtures;
import ma.commune.files.repository.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class NettoyageServiceTest {

    private final Fakes.Tickets ticketsMem = new Fakes.Tickets();
    private final Fakes.Guichets guichetsMem = new Fakes.Guichets();
    private final Fakes.Statistiques statsMem = new Fakes.Statistiques();
    private final Service service = Fixtures.service();
    private final File file = Fixtures.file(service);
    private final NettoyageService nettoyage;

    NettoyageServiceTest() {
        Fakes.Services servicesMem = new Fakes.Services();
        servicesMem.data.put(1L, service);
        TicketRepository tr = Fakes.repo(TicketRepository.class, ticketsMem);
        GuichetRepository gr = Fakes.repo(GuichetRepository.class, guichetsMem);
        StatistiqueService stats = new StatistiqueService(tr, Fakes.repo(ServiceRepository.class, servicesMem),
                gr, Fakes.repo(StatistiqueRepository.class, statsMem));
        nettoyage = new NettoyageService(tr, gr, stats);
    }

    /** Ticket créé hier, dans l'état demandé. */
    private Ticket hier(CodeEtat etat) {
        Ticket t = Fixtures.ticket(service, file, Priorite.NORMALE, 24 * 60 + 30);
        LocalDateTime base = LocalDate.now().minusDays(1).atTime(9, 0);
        t.setHeureCreation(base);
        t.setEtat(etat);
        if (etat == CodeEtat.APPELE || etat == CodeEtat.EN_TRAITEMENT) {
            t.setGuichet(Fixtures.guichet());
            t.setHeureAppel(base.plusMinutes(10));
        }
        if (etat == CodeEtat.EN_TRAITEMENT) {
            t.setHeureDebut(t.getHeureAppel());
        }
        ticketsMem.data.put(t.getId(), t);
        return t;
    }

    @Test
    void lesTicketsOuvertsDeLaVeilleSontClotures() {
        Ticket cree = hier(CodeEtat.CREE);
        Ticket attente = hier(CodeEtat.EN_ATTENTE);
        Ticket appele = hier(CodeEtat.APPELE);
        Ticket traitement = hier(CodeEtat.EN_TRAITEMENT);
        Ticket dejaTermine = hier(CodeEtat.TERMINE);

        nettoyage.auDemarrage();

        assertEquals(CodeEtat.ANNULE, cree.getEtat());
        assertEquals(CodeEtat.ANNULE, attente.getEtat());
        assertEquals(CodeEtat.ABSENT, appele.getEtat());
        assertEquals(CodeEtat.TERMINE, traitement.getEtat());
        assertEquals(CodeEtat.TERMINE, dejaTermine.getEtat());   // inchangé
        assertNotNull(attente.getHeureFin());
    }

    @Test
    void lesTicketsDAujourdhuiNeSontPasTouches() {
        Ticket aujourdhui = Fixtures.ticket(service, file, Priorite.NORMALE, 20);
        aujourdhui.setHeureCreation(LocalDate.now().atTime(9, 0));
        ticketsMem.data.put(aujourdhui.getId(), aujourdhui);
        nettoyage.auDemarrage();
        assertEquals(CodeEtat.EN_ATTENTE, aujourdhui.getEtat());
    }

    @Test
    void auDemarrageLesGuichetsRestentOuverts() {
        Guichet g = Fixtures.guichet();
        g.setEtat(EtatGuichet.OUVERT);
        guichetsMem.data.put(1L, g);
        nettoyage.auDemarrage();
        assertEquals(EtatGuichet.OUVERT, g.getEtat());
    }

    @Test
    void laClotureNocturneFermeLesGuichetsEtEnregistreLesStatistiquesDeLaVeille() {
        Guichet g = Fixtures.guichet();
        g.setEtat(EtatGuichet.OUVERT);
        guichetsMem.data.put(1L, g);
        Ticket attente = hier(CodeEtat.EN_ATTENTE);

        nettoyage.cloturerLaJournee();

        assertEquals(EtatGuichet.FERME, g.getEtat());
        assertEquals(CodeEtat.ANNULE, attente.getEtat());
        Statistique s = statsMem.findByJourAndServiceId(LocalDate.now().minusDays(1), 1L).orElseThrow();
        assertEquals(1, s.getNbTickets());
        assertEquals(0, new java.math.BigDecimal("100.0").compareTo(s.getTauxAbandon()));   // l'unique ticket a été abandonné
    }
}
