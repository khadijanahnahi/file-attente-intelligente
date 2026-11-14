package ma.commune.files.pattern.factory;

import ma.commune.files.domain.Priorite;
import ma.commune.files.domain.Service;

/** Ticket normal : N-001, N-002... (préfixe du service + séquence sur 3 chiffres). */
public class NormalTicketFactory extends TicketFactory {
    @Override protected Priorite priorite() { return Priorite.NORMALE; }

    @Override protected String formaterNumero(Service s, int sequence) {
        return String.format("%s-%03d", s.getPrefixe(), sequence);
    }
}
