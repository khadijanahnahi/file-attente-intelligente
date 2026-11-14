package ma.commune.files.pattern.factory;

public class SmsFactory extends NotificationFactory {
    @Override public CanalNotification creerCanal() { return new SmsCanal(); }
}
