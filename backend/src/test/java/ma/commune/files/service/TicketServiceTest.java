package ma.commune.files.service;

import ma.commune.files.domain.*;
import ma.commune.files.dto.PriseTicketRequest;
import ma.commune.files.dto.TicketInfo;
import ma.commune.files.exception.FileSatureeException;
import ma.commune.files.exception.ServiceFermeException;
import ma.commune.files.pattern.Fixtures;
import ma.commune.files.pattern.observer.EvenementFile;
import ma.commune.files.pattern.observer.FileObserver;
import ma.commune.files.pattern.observer.TypeEvenement;
import ma.commune.files.pattern.state.TransitionInterditeException;
import ma.commune.files.repository.*;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TicketServiceTest {

    private final Fakes.Services servicesMem = new Fakes.Services();
    private final Fakes.Files filesMem = new Fakes.Files();
    private final Fakes.Tickets ticketsMem = new Fakes.Tickets();
    private final Fakes.Citoyens citoyensMem = new Fakes.Citoyens();
    private final List<EvenementFile> evenements = new ArrayList<>();

    private final Service service = Fixtures.service();
    private final File file = Fixtures.file(service);
    private final TicketService ticketService;

    TicketServiceTest() {
        service.setHeureOuverture(LocalTime.MIN);                       // ouvert à toute heure
        service.setHeureFermeture(LocalTime.MAX);
        file.setPolitique(CodePolitique.PRIORITE);
        servicesMem.save(service);
        service.setId(1L);
        servicesMem.data.put(1L, service);
        filesMem.data.put(1L, file);

        TicketRepository tr = Fakes.repo(TicketRepository.class, ticketsMem);
        GuichetRepository gr = Fakes.repo(GuichetRepository.class, new Fakes.Guichets());
        FileObserver espion = evenements::add;
        FileService fs = new FileService(Fakes.repo(FileRepository.class, filesMem), tr, List.of(espion));
        ticketService = new TicketService(
                Fakes.repo(ServiceRepository.class, servicesMem),
                Fakes.repo(CitoyenRepository.class, citoyensMem),
                tr,
                Fakes.repo(AgentRepository.class, new Fakes.Agents()),
                fs,
                new EstimationService(gr, tr));
    }

    private PriseTicketRequest demande(String email, Priorite p, MotifPriorite m) {
        return new PriseTicketRequest(1L, "Test", null, email, "fr", p, m, null);
    }

    @Test
    void prendreUnTicketNominal() {
        TicketInfo info = ticketService.prendreTicket(demande("a@x.ma", null, null));
        assertEquals("N-001", info.numero());
        assertEquals(CodeEtat.EN_ATTENTE, info.etat());
        assertEquals(1, info.position());
        assertEquals(0, info.ticketsDevant());
        assertEquals(0, info.attenteEstimeeMin());
        assertEquals(false, info.dejaExistant());
        assertEquals(1, evenements.size());
        assertEquals(TypeEvenement.TICKET_CREE, evenements.get(0).type());
    }

    @Test
    void lePrioritairePasseDevantEtDecaleLesAutres() {
        TicketInfo premier = ticketService.prendreTicket(demande("a@x.ma", null, null));
        TicketInfo prio = ticketService.prendreTicket(demande("b@x.ma", Priorite.PRIORITAIRE, MotifPriorite.PERSONNE_AGEE));
        assertEquals("N-P002", prio.numero());
        assertEquals(1, prio.position());
        // le premier est maintenant 2e : 1 personne devant x 8 min / 1 guichet (aucun ouvert, on suppose 1)
        TicketInfo suivi = ticketService.suivre(premier.id());
        assertEquals(2, suivi.position());
        assertEquals(1, suivi.ticketsDevant());
        assertEquals(8, suivi.attenteEstimeeMin());
    }

    @Test
    void unCitoyenDejaEnFileRecoitSonTicketExistant() {
        TicketInfo un = ticketService.prendreTicket(demande("a@x.ma", null, null));
        TicketInfo deux = ticketService.prendreTicket(demande("a@x.ma", null, null));
        assertEquals(un.id(), deux.id());
        assertEquals(true, deux.dejaExistant());
        assertEquals(1, ticketsMem.data.size());
    }

    @Test
    void serviceFerme() {
        service.setHeureOuverture(LocalTime.NOON);
        service.setHeureFermeture(LocalTime.NOON);   // plage vide : toujours fermé
        ServiceFermeException e = assertThrows(ServiceFermeException.class,
                () -> ticketService.prendreTicket(demande("a@x.ma", null, null)));
        assertTrue(e.getMessage().contains("fermé"));
        assertEquals(0, ticketsMem.data.size());
    }

    @Test
    void fileFermee() {
        file.setEtat(EtatFile.FERMEE);
        assertThrows(ServiceFermeException.class, () -> ticketService.prendreTicket(demande("a@x.ma", null, null)));
    }

    @Test
    void fileSaturee() {
        service.setCapaciteMax(1);
        ticketService.prendreTicket(demande("a@x.ma", null, null));
        assertThrows(FileSatureeException.class, () -> ticketService.prendreTicket(demande("b@x.ma", null, null)));
    }

    @Test
    void contactObligatoire() {
        assertThrows(IllegalArgumentException.class,
                () -> ticketService.prendreTicket(new PriseTicketRequest(1L, "X", null, null, "fr", null, null, null)));
    }

    @Test
    void prioritaireSansMotifRefuse() {
        assertThrows(IllegalArgumentException.class,
                () -> ticketService.prendreTicket(demande("a@x.ma", Priorite.PRIORITAIRE, null)));
    }

    @Test
    void annulerTantQuEnAttente() {
        TicketInfo info = ticketService.prendreTicket(demande("a@x.ma", null, null));
        TicketInfo annule = ticketService.annuler(info.id());
        assertEquals(CodeEtat.ANNULE, annule.etat());
        assertEquals(0, annule.position());
        assertEquals(TypeEvenement.TICKET_ANNULE, evenements.get(evenements.size() - 1).type());
        assertThrows(TransitionInterditeException.class, () -> ticketService.annuler(info.id()));
        // après annulation, le citoyen peut reprendre un ticket
        assertEquals(false, ticketService.prendreTicket(demande("a@x.ma", null, null)).dejaExistant());
    }
}
