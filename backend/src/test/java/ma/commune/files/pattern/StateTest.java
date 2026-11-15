package ma.commune.files.pattern;

import ma.commune.files.domain.*;
import ma.commune.files.pattern.state.TransitionInterditeException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StateTest {

    private Ticket ticketEnAttente() {
        Service s = Fixtures.service();
        return Fixtures.ticket(s, Fixtures.file(s), Priorite.NORMALE, 5);
    }

    @Test
    void cycleNominalCreeJusquaTermine() {
        Ticket t = ticketEnAttente();
        t.setEtat(CodeEtat.CREE);
        t.placerEnFile();
        assertEquals(CodeEtat.EN_ATTENTE, t.getEtat());
        t.appeler(Fixtures.guichet());
        assertEquals(CodeEtat.APPELE, t.getEtat());
        assertNotNull(t.getHeureAppel());
        assertEquals(3, t.getGuichet().getNumero());
        t.traiter();
        assertEquals(CodeEtat.EN_TRAITEMENT, t.getEtat());
        t.terminer();
        assertEquals(CodeEtat.TERMINE, t.getEtat());
        assertNotNull(t.getHeureFin());
    }

    @Test
    void onNeTerminePasUnTicketEnAttente() {
        Ticket t = ticketEnAttente();
        TransitionInterditeException e = assertThrows(TransitionInterditeException.class, t::terminer);
        assertEquals(CodeEtat.EN_ATTENTE, e.getEtat());
        assertEquals(CodeEtat.EN_ATTENTE, t.getEtat());   // l'état n'a pas changé
    }

    @Test
    void onNAnnulePasUnTicketEnTraitement() {
        Ticket t = ticketEnAttente();
        t.appeler(Fixtures.guichet());
        t.traiter();
        assertThrows(TransitionInterditeException.class, t::annuler);
    }

    @Test
    void absentSeulementApresUnRappel() {
        Ticket t = ticketEnAttente();
        t.appeler(Fixtures.guichet());
        assertThrows(TransitionInterditeException.class, t::marquerAbsent);
        t.rappeler();
        assertEquals(CodeEtat.APPELE, t.getEtat());
        assertEquals(1, t.getNbRappels());
        t.marquerAbsent();
        assertEquals(CodeEtat.ABSENT, t.getEtat());
    }

    @Test
    void lesEtatsFinauxNAcceptentAucuneAction() {
        Ticket t = ticketEnAttente();
        t.annuler();
        assertEquals(CodeEtat.ANNULE, t.getEtat());
        assertTrue(t.etatCourant().estFinal());
        assertThrows(TransitionInterditeException.class, () -> t.appeler(Fixtures.guichet()));
        assertThrows(TransitionInterditeException.class, t::placerEnFile);
    }

    @Test
    void remettreEnAttenteApresUnAppel() {
        Ticket t = ticketEnAttente();
        t.appeler(Fixtures.guichet());
        t.remettreEnAttente();
        assertEquals(CodeEtat.EN_ATTENTE, t.getEtat());
        assertNull(t.getGuichet());
        assertNull(t.getHeureAppel());
    }
}
