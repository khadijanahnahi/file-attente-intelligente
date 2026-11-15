package ma.commune.files.service;

import ma.commune.files.domain.*;
import ma.commune.files.dto.ChargeGuichet;
import ma.commune.files.dto.IndicateursService;
import ma.commune.files.pattern.Fixtures;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class StatistiqueServiceTest {

    private final Service s = Fixtures.service();
    private final File f = Fixtures.file(s);

    /** Ticket créé à 09:00, appelé à 09:00+attente, traité duree minutes. */
    private Ticket termine(int attente, int duree) {
        Ticket t = Fixtures.ticket(s, f, Priorite.NORMALE, 0);
        LocalDateTime base = LocalDateTime.of(2026, 11, 14, 9, 0);
        t.setHeureCreation(base);
        t.setHeureAppel(base.plusMinutes(attente));
        t.setHeureDebut(base.plusMinutes(attente));
        t.setHeureFin(base.plusMinutes(attente + duree));
        t.setEtat(CodeEtat.TERMINE);
        return t;
    }

    @Test
    void indicateursDUneJournee() {
        Ticket t1 = termine(10, 6);
        Ticket t2 = termine(20, 10);
        Ticket enAttente = Fixtures.ticket(s, f, Priorite.NORMALE, 5);
        Ticket annule = Fixtures.ticket(s, f, Priorite.NORMALE, 5);
        annule.setEtat(CodeEtat.ANNULE);

        IndicateursService i = StatistiqueService.agreger(s, List.of(t1, t2, enAttente, annule));

        assertEquals(4, i.nbTickets());
        assertEquals(1, i.enAttente());
        assertEquals(15.0, i.attenteMoyenneMin());
        assertEquals(8.0, i.traitementMoyenMin());
        assertEquals(25.0, i.tauxAbandonPct());   // 1 annulé sur 4
    }

    @Test
    void journeeVide() {
        IndicateursService i = StatistiqueService.agreger(s, List.of());
        assertEquals(0, i.nbTickets());
        assertNull(i.attenteMoyenneMin());
        assertEquals(0.0, i.tauxAbandonPct());
    }

    @Test
    void chargeDUnGuichet() {
        Guichet g = Fixtures.guichet();
        ChargeGuichet c = StatistiqueService.charge(g, List.of(termine(5, 4), termine(5, 8)));
        assertEquals(2, c.ticketsTraites());
        assertEquals(6.0, c.dureeMoyenneMin());
        assertEquals(3, c.numero());
    }
}
