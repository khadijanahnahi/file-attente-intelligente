package ma.commune.files.dto;

import java.time.Instant;

/** Format d'erreur stable renvoyé par l'API. */
public record ErreurApi(int statut, String message, Instant date) {
}
