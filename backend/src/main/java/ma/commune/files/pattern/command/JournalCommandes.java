package ma.commune.files.pattern.command;

import ma.commune.files.domain.Agent;

/** Trace des commandes exécutées ou annulées (qui, quoi, quand). */
public interface JournalCommandes {
    void enregistrer(Commande commande, Agent agent, boolean annulee);
}
