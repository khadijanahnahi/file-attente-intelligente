package ma.commune.files.service;

import ma.commune.files.domain.*;
import ma.commune.files.dto.*;
import ma.commune.files.pattern.Fixtures;
import ma.commune.files.repository.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ServiceCatalogueServiceTest {

    private final Fakes.Services servicesMem = new Fakes.Services();
    private final Fakes.Files filesMem = new Fakes.Files();
    private final Fakes.Tickets ticketsMem = new Fakes.Tickets();
    private final ServiceCatalogueService catalogue;

    ServiceCatalogueServiceTest() {
        FileRepository fr = Fakes.repo(FileRepository.class, filesMem);
        TicketRepository tr = Fakes.repo(TicketRepository.class, ticketsMem);
        GuichetRepository gr = Fakes.repo(GuichetRepository.class, new Fakes.Guichets());
        catalogue = new ServiceCatalogueService(Fakes.repo(ServiceRepository.class, servicesMem), fr,
                new FileService(fr, tr, List.of()), new EstimationService(gr, tr));
    }

    private CreerServiceRequest nouveau(String nom, String prefixe) {
        return new CreerServiceRequest(nom, prefixe, new BigDecimal("6"), 50, LocalTime.MIN, LocalTime.MAX);
    }

    @Test
    void creerUnServiceCreeSaFileEtMajusculePrefixe() {
        ServiceView v = catalogue.creer(nouveau("État civil", "ec"));
        assertEquals("EC", v.prefixe());
        assertEquals(CodePolitique.PRIORITE, v.politique());
        assertEquals(50, v.capaciteMax());
        assertEquals(true, v.ouvert());
        assertEquals(1, filesMem.data.size());
    }

    @Test
    void doublonsRefuses() {
        catalogue.creer(nouveau("État civil", "EC"));
        assertThrows(IllegalStateException.class, () -> catalogue.creer(nouveau("état civil", "XX")));
        assertThrows(IllegalStateException.class, () -> catalogue.creer(nouveau("Autre", "ec")));
    }

    @Test
    void horairesIncoherentsRefuses() {
        assertThrows(IllegalArgumentException.class,
                () -> catalogue.creer(new CreerServiceRequest("X", "X", null, null, LocalTime.of(16, 0), LocalTime.of(8, 0))));
    }

    @Test
    void modifierSeulementLesChampsFournis() {
        ServiceView v = catalogue.creer(nouveau("État civil", "EC"));
        ServiceView m = catalogue.modifier(v.id(), new ModifierServiceRequest(null, new BigDecimal("12"), null, null, null, null));
        assertEquals(0, new BigDecimal("12").compareTo(m.dureeMoyenneMin()));
        assertEquals(50, m.capaciteMax());
        assertEquals("État civil", m.nom());
    }

    @Test
    void desactiverRetireLeServiceDeLaListe() {
        ServiceView v = catalogue.creer(nouveau("État civil", "EC"));
        assertEquals(1, catalogue.lister().size());
        catalogue.modifier(v.id(), new ModifierServiceRequest(null, null, null, null, null, false));
        assertEquals(0, catalogue.lister().size());
    }

    @Test
    void changerLaPolitiqueEtVoirLAffluence() {
        ServiceView v = catalogue.creer(nouveau("État civil", "EC"));
        assertEquals(CodePolitique.FIFO, catalogue.changerPolitique(v.id(), CodePolitique.FIFO).politique());
        // deux personnes en attente : 2 x 6 min / 1 guichet = 12 min pour un nouvel arrivant
        File f = filesMem.data.get(1L);
        Service s = servicesMem.data.get(v.id());
        for (int i = 0; i < 2; i++) {
            Ticket t = Fixtures.ticket(s, f, Priorite.NORMALE, 5);
            ticketsMem.data.put(t.getId(), t);
        }
        ServiceView apres = catalogue.detail(v.id());
        assertEquals(2, apres.nbEnAttente());
        assertEquals(12, apres.attenteEstimeeMin());
    }
}
