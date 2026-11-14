package ma.commune.files.dto;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.Priorite;

/** Ce que voit le citoyen : numéro, position et temps d'attente estimé. */
public record TicketInfo(
        Long id,
        String numero,
        String service,
        CodeEtat etat,
        Priorite priorite,
        int position,              // 1 = prochain ; 0 si le ticket n'est plus en attente
        int ticketsDevant,
        int attenteEstimeeMin,
        Integer guichet,           // numéro du guichet une fois appelé, sinon null
        boolean dejaExistant) {    // true si le citoyen avait déjà un ticket actif (CU1 alternatif)
}
