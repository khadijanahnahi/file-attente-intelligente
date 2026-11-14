package ma.commune.files.pattern.factory;

/**
 * Pattern FACTORY METHOD : création des canaux de notification (SMS, e-mail, push).
 * Ajouter un canal = ajouter une sous-classe, sans toucher à NotificationService.
 */
public abstract class NotificationFactory {
    public abstract CanalNotification creerCanal();
}
