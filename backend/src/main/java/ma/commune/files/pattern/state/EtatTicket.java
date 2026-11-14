package ma.commune.files.pattern.state;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.Guichet;
import ma.commune.files.domain.Ticket;

/**
 * Pattern STATE : cycle de vie d'un ticket.
 *
 * Chaque état n'implémente que les actions qui lui sont permises ; toute autre
 * action lève TransitionInterditeException (comportement par défaut ci-dessous).
 * Une action applique ses effets sur le ticket (horodatages, guichet...) et
 * retourne l'état suivant ; c'est Ticket qui enregistre ensuite le nouveau code.
 *
 *   CREE ──placerEnFile──> EN_ATTENTE ──appeler──> APPELE ──traiter──> EN_TRAITEMENT ──terminer──> TERMINE
 *                               │                    │  ├─rappeler─> APPELE
 *                               └─annuler─> ANNULE   │  ├─marquerAbsent─> ABSENT
 *                                                    └──remettreEnAttente (annulation d'un appel)──> EN_ATTENTE
 */
public interface EtatTicket {

    CodeEtat code();

    default EtatTicket placerEnFile(Ticket t)           { throw interdit("placerEnFile"); }
    default EtatTicket appeler(Ticket t, Guichet g)     { throw interdit("appeler"); }
    default EtatTicket rappeler(Ticket t)               { throw interdit("rappeler"); }
    default EtatTicket traiter(Ticket t)                { throw interdit("traiter"); }
    default EtatTicket terminer(Ticket t)               { throw interdit("terminer"); }
    default EtatTicket marquerAbsent(Ticket t)          { throw interdit("marquerAbsent"); }
    default EtatTicket annuler(Ticket t)                { throw interdit("annuler"); }
    default EtatTicket remettreEnAttente(Ticket t)      { throw interdit("remettreEnAttente"); }

    /** Vrai pour TERMINE, ABSENT et ANNULE. */
    default boolean estFinal() { return false; }

    private TransitionInterditeException interdit(String action) {
        return new TransitionInterditeException(code(), action);
    }

    /** Reconstruit l'objet état à partir du code enregistré en base (colonne ticket.etat). */
    static EtatTicket depuis(CodeEtat code) {
        return switch (code) {
            case CREE          -> Cree.INSTANCE;
            case EN_ATTENTE    -> EnAttente.INSTANCE;
            case APPELE        -> Appele.INSTANCE;
            case EN_TRAITEMENT -> EnTraitement.INSTANCE;
            case TERMINE       -> Termine.INSTANCE;
            case ABSENT        -> Absent.INSTANCE;
            case ANNULE        -> Annule.INSTANCE;
        };
    }
}
