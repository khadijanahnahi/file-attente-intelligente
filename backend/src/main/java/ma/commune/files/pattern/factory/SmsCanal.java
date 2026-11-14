package ma.commune.files.pattern.factory;

import ma.commune.files.domain.Canal;

/** SMS SIMULÉ en MVP (écrit dans les logs). Brancher ici Twilio ou une passerelle marocaine plus tard. */
public class SmsCanal implements CanalNotification {
    private static final System.Logger LOG = System.getLogger(SmsCanal.class.getName());

    @Override public Canal type() { return Canal.SMS; }

    @Override public void envoyer(String destinataire, String message) {
        LOG.log(System.Logger.Level.INFO, "[SMS simulé] vers {0} : {1}", destinataire, message);
    }
}
