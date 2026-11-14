package ma.commune.files.pattern.factory;

import ma.commune.files.domain.Canal;

/**
 * E-mail : pour l'instant écrit dans les logs. Pour un vrai envoi, ajouter
 * spring-boot-starter-mail dans le pom.xml et utiliser JavaMailSender ici.
 */
public class EmailCanal implements CanalNotification {
    private static final System.Logger LOG = System.getLogger(EmailCanal.class.getName());

    @Override public Canal type() { return Canal.EMAIL; }

    @Override public void envoyer(String destinataire, String message) {
        LOG.log(System.Logger.Level.INFO, "[E-mail] vers {0} : {1}", destinataire, message);
    }
}
