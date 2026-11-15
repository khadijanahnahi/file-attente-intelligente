package ma.commune.files.pattern;

import ma.commune.files.domain.*;
import ma.commune.files.pattern.factory.*;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FactoryTest {

    private final Service s = Fixtures.service();
    private final File f = Fixtures.file(s);

    @Test
    void ticketNormal() {
        Ticket t = new NormalTicketFactory().creerTicket(s, f, new Citoyen(), 42);
        assertEquals("N-042", t.getNumero());
        assertEquals(Priorite.NORMALE, t.getPriorite());
        assertEquals(CodeEtat.CREE, t.getEtat());
    }

    @Test
    void ticketPrioritaireExigeUnMotif() {
        TicketFactory fab = TicketFactory.pour(Priorite.PRIORITAIRE);
        assertThrows(IllegalArgumentException.class, () -> fab.creerTicket(s, f, new Citoyen(), 1));
        Ticket t = fab.creerTicket(s, f, new Citoyen(), 7, MotifPriorite.PERSONNE_AGEE);
        assertEquals("N-P007", t.getNumero());
        assertEquals(MotifPriorite.PERSONNE_AGEE, t.getMotifPriorite());
    }

    @Test
    void ticketUrgent() {
        Ticket t = TicketFactory.pour(Priorite.URGENTE).creerTicket(s, f, new Citoyen(), 3);
        assertEquals("N-U003", t.getNumero());
        assertEquals(Priorite.URGENTE, t.getPriorite());
    }

    @Test
    void lesNumerosDifferentsSelonLaPrioriteRestentUniques() {
        String a = new NormalTicketFactory().creerTicket(s, f, new Citoyen(), 5).getNumero();
        String b = new UrgentTicketFactory().creerTicket(s, f, new Citoyen(), 5, null).getNumero();
        assertNotEquals(a, b);
    }

    @Test
    void canauxDeNotification() {
        assertEquals(Canal.SMS, new SmsFactory().creerCanal().type());
        assertEquals(Canal.EMAIL, new EmailFactory().creerCanal().type());
        // le SMS simulé ne plante pas
        new SmsFactory().creerCanal().envoyer("0600000000", "test");
    }
}
