package ma.commune.files.pattern.command;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.File;
import ma.commune.files.domain.Service;
import ma.commune.files.domain.Ticket;
import ma.commune.files.domain.TypeCommande;

/**
 * ÉVOLUTION : déplace un ticket en attente d'une file vers une autre.
 * Le ticket garde son numéro et son heure d'arrivée (il ne perd pas son rang).
 */
public class TransfererCommande implements Commande {

    private final Ticket ticket;
    private final File destination;

    private File origine;
    private Service serviceOrigine;
    private CodeEtat avant;

    public TransfererCommande(Ticket ticket, File destination) {
        this.ticket = ticket;
        this.destination = destination;
    }

    @Override public TypeCommande type() { return TypeCommande.TRANSFERER; }

    @Override public void executer() {
        if (ticket.getEtat() != CodeEtat.EN_ATTENTE) {
            throw new IllegalStateException("Seul un ticket en attente peut être transféré (état : " + ticket.getEtat() + ")");
        }
        avant = ticket.getEtat();
        origine = ticket.getFile();
        serviceOrigine = ticket.getService();
        ticket.setFile(destination);
        ticket.setService(destination.getService());
    }

    @Override public void annuler() {
        ticket.setFile(origine);
        ticket.setService(serviceOrigine);
    }

    @Override public Ticket ticket()      { return ticket; }
    @Override public CodeEtat etatAvant() { return avant; }
    @Override public CodeEtat etatApres() { return ticket.getEtat(); }
}
