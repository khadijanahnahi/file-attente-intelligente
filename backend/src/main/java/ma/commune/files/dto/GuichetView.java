package ma.commune.files.dto;

import ma.commune.files.domain.EtatGuichet;
import ma.commune.files.domain.Guichet;

public record GuichetView(Long id, int numero, EtatGuichet etat,
                          Long serviceId, String service, Long agentId, String agent) {
    public static GuichetView de(Guichet guichet) {
        return new GuichetView(
                guichet.getId(),
                guichet.getNumero(),
                guichet.getEtat(),
                guichet.getService() == null ? null : guichet.getService().getId(),
                guichet.getService() == null ? null : guichet.getService().getNom(),
                guichet.getAgent() == null ? null : guichet.getAgent().getId(),
                guichet.getAgent() == null ? null : guichet.getAgent().getNom());
    }
}
