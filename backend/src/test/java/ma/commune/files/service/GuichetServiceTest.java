package ma.commune.files.service;

import ma.commune.files.domain.*;
import ma.commune.files.pattern.Fixtures;
import ma.commune.files.pattern.command.FileVideException;
import ma.commune.files.pattern.observer.EvenementFile;
import ma.commune.files.pattern.observer.FileObserver;
import ma.commune.files.pattern.observer.TypeEvenement;
import ma.commune.files.repository.*;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class GuichetServiceTest {

    private final Fakes.Tickets ticketsMem = new Fakes.Tickets();
    private final List<EvenementFile> evenements = new ArrayList<>();
    private final List<String> journal = new ArrayList<>();

    private final Service service = Fixtures.service();
    private final File file = Fixtures.file(service);
    private final Guichet guichet = Fixtures.guichet();
    private final Agent agent = Fixtures.agent();
    private final Fakes.Files filesMem = new Fakes.Files();
    private final Fakes.Guichets guichetsMem = new Fakes.Guichets();

    private Ticket normal;
    private Ticket urgent;

    private GuichetService creer(long delaiAbsenceMin) {
        file.setPolitique(CodePolitique.PRIORITE);
        filesMem.data.put(1L, file);
        guichet.setService(service);
        guichet.setAgent(agent);
        guichet.setEtat(EtatGuichet.FERME);
        guichetsMem.data.put(1L, guichet);

        normal = Fixtures.ticket(service, file, Priorite.NORMALE, 30);
        urgent = Fixtures.ticket(service, file, Priorite.URGENTE, 2);
        ticketsMem.data.put(normal.getId(), normal);
        ticketsMem.data.put(urgent.getId(), urgent);

        TicketRepository tr = Fakes.repo(TicketRepository.class, ticketsMem);
        FileObserver espion = evenements::add;
        FileService fs = new FileService(Fakes.repo(FileRepository.class, filesMem), tr, List.of(espion));
        return new GuichetService(Fakes.repo(GuichetRepository.class, guichetsMem), tr, fs,
                (c, a, annulee) -> journal.add(c.type() + (annulee ? " (annulée)" : "")), delaiAbsenceMin);
    }

    @Test
    void ilFautOuvrirLeGuichetPourAppeler() {
        GuichetService gs = creer(0);
        assertThrows(IllegalStateException.class, () -> gs.appelerSuivant(1L));
        gs.ouvrir(1L);
        Ticket appele = gs.appelerSuivant(1L);
        assertSame(urgent, appele);                       // politique PRIORITE
        assertEquals(CodeEtat.APPELE, appele.getEtat());
        assertSame(guichet, appele.getGuichet());
        assertEquals(TypeEvenement.TICKET_APPELE, evenements.get(0).type());
        assertEquals(List.of("APPELER"), journal);
    }

    @Test
    void impossibleDAppelerUnSecondTicketPendantLePremier() {
        GuichetService gs = creer(0);
        gs.ouvrir(1L);
        gs.appelerSuivant(1L);
        assertThrows(IllegalStateException.class, () -> gs.appelerSuivant(1L));
    }

    @Test
    void parcoursCompletAppelTraitementFin() {
        GuichetService gs = creer(0);
        gs.ouvrir(1L);
        gs.appelerSuivant(1L);
        assertThrows(IllegalStateException.class, () -> gs.fermer(1L));   // ticket en cours
        assertEquals(CodeEtat.EN_TRAITEMENT, gs.commencerTraitement(1L).getEtat());
        assertEquals(CodeEtat.TERMINE, gs.terminer(1L).getEtat());
        assertEquals(TypeEvenement.TICKET_TERMINE, evenements.get(evenements.size() - 1).type());
        assertTrue(gs.ticketEnCoursDe(1L).isEmpty());
        assertEquals(EtatGuichet.FERME, gs.fermer(1L).getEtat());
        // le deuxième appel prend le ticket normal
        gs.ouvrir(1L);
        assertSame(normal, gs.appelerSuivant(1L));
    }

    @Test
    void absenceExigeUnRappelEtUnDelai() {
        GuichetService avecDelai = creer(2);
        avecDelai.ouvrir(1L);
        avecDelai.appelerSuivant(1L);
        avecDelai.rappeler(1L);
        // délai de 2 min pas écoulé
        assertThrows(IllegalStateException.class, () -> avecDelai.marquerAbsent(1L));
    }

    @Test
    void absenceApresRappelSansDelai() {
        GuichetService gs = creer(0);
        gs.ouvrir(1L);
        gs.appelerSuivant(1L);
        assertThrows(RuntimeException.class, () -> gs.marquerAbsent(1L));   // aucun rappel (State)
        gs.rappeler(1L);
        assertEquals(CodeEtat.ABSENT, gs.marquerAbsent(1L).getEtat());
        assertEquals(TypeEvenement.TICKET_ABSENT, evenements.get(evenements.size() - 1).type());
    }

    @Test
    void fileVide() {
        GuichetService gs = creer(0);
        ticketsMem.data.clear();
        gs.ouvrir(1L);
        assertThrows(FileVideException.class, () -> gs.appelerSuivant(1L));
    }

    @Test
    void annulerLeDernierAppel() {
        GuichetService gs = creer(0);
        gs.ouvrir(1L);
        Ticket t = gs.appelerSuivant(1L);
        assertSame(t, gs.annulerDernierAppel(1L).orElseThrow());
        assertEquals(CodeEtat.EN_ATTENTE, t.getEtat());
        assertTrue(gs.annulerDernierAppel(1L).isEmpty());
        assertEquals(List.of("APPELER", "APPELER (annulée)"), journal);
        // le ticket peut être rappelé
        assertSame(t, gs.appelerSuivant(1L));
    }

    @Test
    void annulerUnTicketPrecis() {
        GuichetService gs = creer(0);
        gs.annulerTicket(1L, normal.getId());
        assertEquals(CodeEtat.ANNULE, normal.getEtat());
        assertEquals(List.of("ANNULER_TICKET"), journal);
    }

    @Test
    void agentSansGuichet() {
        GuichetService gs = creer(0);
        assertThrows(ma.commune.files.exception.RessourceIntrouvableException.class, () -> gs.ouvrir(99L));
    }
}
