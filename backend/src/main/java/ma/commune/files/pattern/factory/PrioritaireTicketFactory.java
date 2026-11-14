package ma.commune.files.pattern.factory;

import ma.commune.files.domain.Priorite;
import ma.commune.files.domain.Service;

/** Ticket prioritaire (personne âgée, handicapée, femme enceinte) : N-P001. Motif obligatoire. */
public class PrioritaireTicketFactory extends TicketFactory {
    @Override protected Priorite priorite() { return Priorite.PRIORITAIRE; }

    @Override protected boolean motifObligatoire() { return true; }

    @Override protected String formaterNumero(Service s, int sequence) {
        return String.format("%s-P%03d", s.getPrefixe(), sequence);
    }
}
