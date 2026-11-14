package ma.commune.files.pattern.state;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.Ticket;

import java.time.LocalDateTime;

/** Ticket appelé : le citoyen doit se présenter au guichet. */
public final class Appele implements EtatTicket {
    public static final Appele INSTANCE = new Appele();
    private Appele() {}

    @Override public CodeEtat code() { return CodeEtat.APPELE; }

    /** Nouveau rappel : le ticket reste « Appelé ». */
    @Override public EtatTicket rappeler(Ticket t) {
        t.setNbRappels(t.getNbRappels() + 1);
        return this;
    }

    @Override public EtatTicket traiter(Ticket t) {
        t.setHeureDebut(LocalDateTime.now());
        return EnTraitement.INSTANCE;
    }

    /** CU2 : « après un rappel et un délai, le ticket passe à Absent ». Le délai est vérifié par le service. */
    @Override public EtatTicket marquerAbsent(Ticket t) {
        if (t.getNbRappels() < 1) {
            throw new TransitionInterditeException(code(), "marquerAbsent (aucun rappel effectué)");
        }
        t.setHeureFin(LocalDateTime.now());
        return Absent.INSTANCE;
    }

    /** Annulation d'un appel (AppelerCommande.annuler) : le ticket retourne dans la file. */
    @Override public EtatTicket remettreEnAttente(Ticket t) {
        t.setGuichet(null);
        t.setHeureAppel(null);
        t.setNbRappels(0);
        return EnAttente.INSTANCE;
    }
}
