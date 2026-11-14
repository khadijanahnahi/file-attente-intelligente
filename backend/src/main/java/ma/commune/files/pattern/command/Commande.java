package ma.commune.files.pattern.command;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.Ticket;
import ma.commune.files.domain.TypeCommande;

/**
 * Pattern COMMAND : une action de l'agent devient un objet qu'on peut exécuter,
 * tracer dans un journal et annuler.
 */
public interface Commande {

    TypeCommande type();

    /** Exécute l'action. Doit mémoriser ce qu'il faut pour annuler(). */
    void executer();

    /** Annule l'action exécutée (ex. mauvais appel). */
    void annuler();

    /** Ticket concerné (disponible après executer()). */
    Ticket ticket();

    CodeEtat etatAvant();

    CodeEtat etatApres();
}
