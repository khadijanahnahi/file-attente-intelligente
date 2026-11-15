package ma.commune.files.pattern;

import ma.commune.files.domain.*;
import ma.commune.files.pattern.strategy.*;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class StrategyTest {

    private final Service s = Fixtures.service();
    private final File f = Fixtures.file(s);

    @Test
    void fifoChoisitLePlusAncien() {
        Ticket ancien = Fixtures.ticket(s, f, Priorite.NORMALE, 30);
        Ticket recentUrgent = Fixtures.ticket(s, f, Priorite.URGENTE, 2);
        assertSame(ancien, new FifoStrategy().choisirSuivant(List.of(recentUrgent, ancien)).orElseThrow());
    }

    @Test
    void prioriteFaitPasserLUrgentDevantLeNormalArriveAvant() {
        Ticket normal = Fixtures.ticket(s, f, Priorite.NORMALE, 30);
        Ticket prioritaire = Fixtures.ticket(s, f, Priorite.PRIORITAIRE, 10);
        Ticket urgent = Fixtures.ticket(s, f, Priorite.URGENTE, 2);
        PolitiqueFile p = new PriorityStrategy();
        assertSame(urgent, p.choisirSuivant(List.of(normal, prioritaire, urgent)).orElseThrow());
        assertSame(prioritaire, p.choisirSuivant(List.of(normal, prioritaire)).orElseThrow());
    }

    @Test
    void memePrioriteAlorsOrdreDArrivee() {
        Ticket a = Fixtures.ticket(s, f, Priorite.PRIORITAIRE, 20);
        Ticket b = Fixtures.ticket(s, f, Priorite.PRIORITAIRE, 5);
        assertSame(a, new PriorityStrategy().choisirSuivant(List.of(b, a)).orElseThrow());
    }

    @Test
    void fileVideDonneUnResultatVide() {
        assertTrue(new FifoStrategy().choisirSuivant(List.of()).isEmpty());
        assertTrue(new PriorityStrategy().choisirSuivant(List.of()).isEmpty());
        assertTrue(new LoadBalancedStrategy().choisirSuivant(List.of()).isEmpty());
    }

    @Test
    void equilibrageEvitelaFamineDesTicketsNormaux() {
        // durée moyenne 8 min -> seuil 24 min
        Ticket normalTresAttendu = Fixtures.ticket(s, f, Priorite.NORMALE, 40);
        Ticket urgentRecent = Fixtures.ticket(s, f, Priorite.URGENTE, 1);
        assertSame(normalTresAttendu,
                new LoadBalancedStrategy().choisirSuivant(List.of(urgentRecent, normalTresAttendu)).orElseThrow());
        // sans dépassement de seuil : comportement « priorité »
        Ticket normalPeuAttendu = Fixtures.ticket(s, f, Priorite.NORMALE, 10);
        assertSame(urgentRecent,
                new LoadBalancedStrategy().choisirSuivant(List.of(urgentRecent, normalPeuAttendu)).orElseThrow());
    }

    @Test
    void laFileChangeDePolitiqueALExecution() {
        Ticket normal = Fixtures.ticket(s, f, Priorite.NORMALE, 30);
        Ticket urgent = Fixtures.ticket(s, f, Priorite.URGENTE, 1);
        f.changerPolitique(CodePolitique.FIFO);
        assertSame(normal, f.retirerSuivant(List.of(normal, urgent)).orElseThrow());
        f.changerPolitique(CodePolitique.PRIORITE);
        assertSame(urgent, f.retirerSuivant(List.of(normal, urgent)).orElseThrow());
    }
}
