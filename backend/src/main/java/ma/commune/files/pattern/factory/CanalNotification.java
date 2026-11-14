package ma.commune.files.pattern.factory;

import ma.commune.files.domain.Canal;

/** Produit de la fabrique de notifications. */
public interface CanalNotification {
    Canal type();
    void envoyer(String destinataire, String message);
}
