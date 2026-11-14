package ma.commune.files.pattern.factory;

import ma.commune.files.domain.Citoyen;
import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.File;
import ma.commune.files.domain.MotifPriorite;
import ma.commune.files.domain.Priorite;
import ma.commune.files.domain.Service;
import ma.commune.files.domain.Ticket;

/**
 * Pattern FACTORY METHOD : création des tickets.
 * La méthode creerTicket() fixe le déroulement ; les sous-classes redéfinissent
 * priorite() et formaterNumero() (priorité et règle de numérotation).
 * Le code appelant ne manipule que ce type abstrait.
 */
public abstract class TicketFactory {

    /** Priorité donnée aux tickets de cette fabrique. */
    protected abstract Priorite priorite();

    /** Numéro affiché : sequence = rang du ticket dans le service pour la journée (1, 2, 3...). */
    protected abstract String formaterNumero(Service service, int sequence);

    /** Le motif de priorité est-il obligatoire pour cette fabrique ? */
    protected boolean motifObligatoire() { return false; }

    public Ticket creerTicket(Service service, File file, Citoyen citoyen, int sequence) {
        return creerTicket(service, file, citoyen, sequence, null);
    }

    public Ticket creerTicket(Service service, File file, Citoyen citoyen, int sequence, MotifPriorite motif) {
        if (sequence < 1) {
            throw new IllegalArgumentException("La séquence doit être >= 1");
        }
        if (motifObligatoire() && motif == null) {
            throw new IllegalArgumentException("Un motif de priorité est obligatoire (personne âgée, handicap, femme enceinte)");
        }
        Ticket t = new Ticket();
        t.setService(service);
        t.setFile(file);
        t.setCitoyen(citoyen);
        t.setPriorite(priorite());
        t.setMotifPriorite(motif);
        t.setNumero(formaterNumero(service, sequence));
        t.setEtat(CodeEtat.CREE);
        return t;
    }

    /** Choisit la fabrique d'après la priorité demandée. */
    public static TicketFactory pour(Priorite priorite) {
        return switch (priorite) {
            case NORMALE     -> new NormalTicketFactory();
            case PRIORITAIRE -> new PrioritaireTicketFactory();
            case URGENTE     -> new UrgentTicketFactory();
        };
    }
}
