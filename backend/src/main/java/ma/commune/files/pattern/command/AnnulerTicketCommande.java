package ma.commune.files.pattern.command;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.File;
import ma.commune.files.domain.Ticket;
import ma.commune.files.domain.TypeCommande;
import ma.commune.files.pattern.observer.EvenementFile;
import ma.commune.files.pattern.observer.TypeEvenement;

/** Annule un ticket et mémorise son état précédent pour pouvoir le restaurer. */
public class AnnulerTicketCommande implements Commande {

    private final File file;
    private final Ticket ticket;
    private CodeEtat avant;
    private CodeEtat apres;

    public AnnulerTicketCommande(File file, Ticket ticket) {
        this.file = file;
        this.ticket = ticket;
    }

    @Override public TypeCommande type() { return TypeCommande.ANNULER_TICKET; }

    @Override public void executer() {
        avant = ticket.getEtat();
        ticket.annuler();   // lève TransitionInterditeException si l'état ne le permet pas
        apres = ticket.getEtat();
        file.notifier(EvenementFile.de(TypeEvenement.TICKET_ANNULE, ticket));
    }

    @Override public void annuler() {
        ticket.restaurerEtat(avant);
        file.notifier(EvenementFile.de(TypeEvenement.TICKET_REMIS_EN_ATTENTE, ticket));
    }

    @Override public Ticket ticket()      { return ticket; }
    @Override public CodeEtat etatAvant() { return avant; }
    @Override public CodeEtat etatApres() { return apres; }
}
