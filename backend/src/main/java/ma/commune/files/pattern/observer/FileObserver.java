package ma.commune.files.pattern.observer;

/** Pattern OBSERVER : destinataire des changements d'une File (écran, notifications, tableau de bord). */
public interface FileObserver {
    void mettreAJour(EvenementFile evenement);
}
