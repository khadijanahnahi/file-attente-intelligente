package ma.commune.files.pattern.factory;

import ma.commune.files.domain.Priorite;
import ma.commune.files.domain.Service;

/** Ticket urgent : N-U001. */
public class UrgentTicketFactory extends TicketFactory {
    @Override protected Priorite priorite() { return Priorite.URGENTE; }

    @Override protected String formaterNumero(Service s, int sequence) {
        return String.format("%s-U%03d", s.getPrefixe(), sequence);
    }
}
