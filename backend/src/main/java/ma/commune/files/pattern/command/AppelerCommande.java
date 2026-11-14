package ma.commune.files.pattern.command;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.File;
import ma.commune.files.domain.Guichet;
import ma.commune.files.domain.Ticket;
import ma.commune.files.domain.TypeCommande;
import ma.commune.files.pattern.observer.EvenementFile;
import ma.commune.files.pattern.observer.TypeEvenement;

import java.util.List;

/**
 * CU2 : appeler le ticket suivant.
 * La File choisit le ticket (Strategy), le ticket passe à « Appelé » (State),
 * puis la File prévient écran et citoyen (Observer).
 */
public class AppelerCommande implements Commande {

    private final File file;
    private final Guichet guichet;
    private final List<Ticket> enAttente;   // tickets EN_ATTENTE de la file (lus par le service)

    private Ticket ticket;
    private CodeEtat avant;
    private CodeEtat apres;

    public AppelerCommande(File file, Guichet guichet, List<Ticket> enAttente) {
        this.file = file;
        this.guichet = guichet;
        this.enAttente = enAttente;
    }

    @Override public TypeCommande type() { return TypeCommande.APPELER; }

    /** @throws FileVideException si aucun ticket n'attend (CU2, scénario alternatif). */
    @Override public void executer() {
        ticket = file.retirerSuivant(enAttente).orElseThrow(FileVideException::new);
        avant = ticket.getEtat();
        ticket.appeler(guichet);
        apres = ticket.getEtat();
        file.notifier(EvenementFile.de(TypeEvenement.TICKET_APPELE, ticket));
    }

    /** Remet le ticket dans la file (transition Appelé -> En attente). */
    @Override public void annuler() {
        ticket.remettreEnAttente();
        file.notifier(EvenementFile.de(TypeEvenement.TICKET_REMIS_EN_ATTENTE, ticket));
    }

    @Override public Ticket ticket()     { return ticket; }
    @Override public CodeEtat etatAvant() { return avant; }
    @Override public CodeEtat etatApres() { return apres; }
}
