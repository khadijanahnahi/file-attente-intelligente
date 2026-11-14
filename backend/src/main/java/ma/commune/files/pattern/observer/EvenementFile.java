package ma.commune.files.pattern.observer;

import ma.commune.files.domain.Ticket;

import java.time.LocalDateTime;

/** Message transporté par le pattern Observer : type d'événement, ticket concerné, date. */
public record EvenementFile(TypeEvenement type, Ticket ticket, LocalDateTime date) {

    public static EvenementFile de(TypeEvenement type, Ticket ticket) {
        return new EvenementFile(type, ticket, LocalDateTime.now());
    }
}
