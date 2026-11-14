package ma.commune.files.pattern.command;

import ma.commune.files.domain.Agent;

import java.util.ArrayDeque;
import java.util.Deque;

/**
 * Invocateur : exécute les commandes d'un guichet, les enregistre dans le journal et
 * garde l'historique pour annulerDerniere(). Une instance par guichet/session d'agent
 * (ne pas en faire un singleton partagé : l'historique est propre à chaque agent).
 */
public class InvocateurGuichet {

    private final Agent agent;
    private final JournalCommandes journal;
    private final Deque<Commande> historique = new ArrayDeque<>();

    public InvocateurGuichet(Agent agent, JournalCommandes journal) {
        this.agent = agent;
        this.journal = journal;
    }

    public void executer(Commande commande) {
        commande.executer();            // si elle échoue, rien n'est empilé ni journalisé
        historique.push(commande);
        journal.enregistrer(commande, agent, false);
    }

    /** @return la commande annulée, ou null s'il n'y a rien à annuler. */
    public Commande annulerDerniere() {
        Commande derniere = historique.poll();
        if (derniere == null) {
            return null;
        }
        derniere.annuler();
        journal.enregistrer(derniere, agent, true);
        return derniere;
    }

    public int tailleHistorique() { return historique.size(); }
}
