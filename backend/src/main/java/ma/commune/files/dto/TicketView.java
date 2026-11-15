package ma.commune.files.dto;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.Priorite;
import ma.commune.files.domain.Ticket;

import java.time.LocalDateTime;

public record TicketView(Long id, String numero, String service, CodeEtat etat,
                         Priorite priorite, LocalDateTime heureCreation, Integer guichet,
                         int nbRappels) {
    public static TicketView de(Ticket ticket) {
        return new TicketView(
                ticket.getId(),
                ticket.getNumero(),
                ticket.getService().getNom(),
                ticket.getEtat(),
                ticket.getPriorite(),
                ticket.getHeureCreation(),
                ticket.getGuichet() == null ? null : ticket.getGuichet().getNumero(),
                ticket.getNbRappels());
    }
}
