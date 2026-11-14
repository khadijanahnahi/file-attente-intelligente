package ma.commune.files.pattern.factory;

public class EmailFactory extends NotificationFactory {
    @Override public CanalNotification creerCanal() { return new EmailCanal(); }
}
