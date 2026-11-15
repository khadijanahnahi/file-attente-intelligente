package ma.commune.files.pattern;

import ma.commune.files.domain.*;
import ma.commune.files.pattern.command.*;
import ma.commune.files.pattern.observer.EvenementFile;
import ma.commune.files.pattern.observer.TypeEvenement;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CommandTest {

    private final Service s = Fixtures.service();
    private final File f = Fixtures.file(s);
    private final Guichet g = Fixtures.guichet();
    private final List<EvenementFile> evenements = new ArrayList<>();
    private final List<String> journal = new ArrayList<>();

    private InvocateurGuichet invocateur() {
        f.changerPolitique(CodePolitique.PRIORITE);
        f.abonner(evenements::add);
        return new InvocateurGuichet(Fixtures.agent(),
                (c, agent, annulee) -> journal.add(c.type() + (annulee ? " (annulée)" : "")));
    }

    @Test
    void appelerChoisitLeBonTicketEtPrevientLesObservateurs() {
        Ticket normal = Fixtures.ticket(s, f, Priorite.NORMALE, 30);
        Ticket urgent = Fixtures.ticket(s, f, Priorite.URGENTE, 2);
        InvocateurGuichet inv = invocateur();

        AppelerCommande cmd = new AppelerCommande(f, g, List.of(normal, urgent));
        inv.executer(cmd);

        assertSame(urgent, cmd.ticket());
        assertEquals(CodeEtat.APPELE, urgent.getEtat());
        assertEquals(CodeEtat.EN_ATTENTE, normal.getEtat());
        assertEquals(1, evenements.size());
        assertEquals(TypeEvenement.TICKET_APPELE, evenements.get(0).type());
        assertEquals(List.of("APPELER"), journal);
    }

    @Test
    void annulerUnAppelRemetLeTicketDansLaFile() {
        Ticket t = Fixtures.ticket(s, f, Priorite.NORMALE, 5);
        InvocateurGuichet inv = invocateur();
        inv.executer(new AppelerCommande(f, g, List.of(t)));

        Commande annulee = inv.annulerDerniere();

        assertNotNull(annulee);
        assertEquals(CodeEtat.EN_ATTENTE, t.getEtat());
        assertNull(t.getGuichet());
        assertEquals(TypeEvenement.TICKET_REMIS_EN_ATTENTE, evenements.get(1).type());
        assertEquals(List.of("APPELER", "APPELER (annulée)"), journal);
        assertNull(inv.annulerDerniere());   // plus rien à annuler
    }

    @Test
    void fileVideNEmpileRienEtNeJournalisePas() {
        InvocateurGuichet inv = invocateur();
        assertThrows(FileVideException.class, () -> inv.executer(new AppelerCommande(f, g, List.of())));
        assertEquals(0, inv.tailleHistorique());
        assertTrue(journal.isEmpty());
        assertTrue(evenements.isEmpty());
    }

    @Test
    void annulerUnTicketPuisRestaurer() {
        Ticket t = Fixtures.ticket(s, f, Priorite.NORMALE, 5);
        InvocateurGuichet inv = invocateur();
        inv.executer(new AnnulerTicketCommande(f, t));
        assertEquals(CodeEtat.ANNULE, t.getEtat());
        assertEquals(TypeEvenement.TICKET_ANNULE, evenements.get(0).type());

        inv.annulerDerniere();
        assertEquals(CodeEtat.EN_ATTENTE, t.getEtat());
        assertNull(t.getHeureFin());
    }

    @Test
    void transfererUnTicketVersUneAutreFile() {
        Service autre = Fixtures.service();
        autre.setId(2L);
        autre.setPrefixe("L");
        File fileAutre = Fixtures.file(autre);
        Ticket t = Fixtures.ticket(s, f, Priorite.NORMALE, 5);
        InvocateurGuichet inv = invocateur();

        inv.executer(new TransfererCommande(t, fileAutre));
        assertSame(fileAutre, t.getFile());
        assertSame(autre, t.getService());

        inv.annulerDerniere();
        assertSame(f, t.getFile());
        assertSame(s, t.getService());
    }

    @Test
    void transfertRefuseSiLeTicketNEstPasEnAttente() {
        Ticket t = Fixtures.ticket(s, f, Priorite.NORMALE, 5);
        t.appeler(g);
        assertThrows(IllegalStateException.class,
                () -> invocateur().executer(new TransfererCommande(t, Fixtures.file(s))));
    }

    @Test
    void abonnerDeuxFoisLeMemeObservateurNeNotifieQuUneFois() {
        List<EvenementFile> recus = new ArrayList<>();
        ma.commune.files.pattern.observer.FileObserver obs = recus::add;
        f.abonner(obs);
        f.abonner(obs);
        f.notifier(EvenementFile.de(TypeEvenement.TICKET_CREE, Fixtures.ticket(s, f, Priorite.NORMALE, 1)));
        assertEquals(1, recus.size());
        f.desabonner(obs);
        f.notifier(EvenementFile.de(TypeEvenement.TICKET_CREE, Fixtures.ticket(s, f, Priorite.NORMALE, 1)));
        assertEquals(1, recus.size());
    }
}
