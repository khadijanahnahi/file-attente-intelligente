package ma.commune.files.dto;

import ma.commune.files.domain.CodePolitique;
import ma.commune.files.domain.Service;

import java.math.BigDecimal;
import java.time.LocalTime;

public record ServiceView(
        Long id,
        String nom,
        String prefixe,
        BigDecimal dureeMoyenneMin,
        int capaciteMax,
        LocalTime heureOuverture,
        LocalTime heureFermeture,
        boolean actif,
        boolean ouvert,
        CodePolitique politique,
        int nbEnAttente,
        int attenteEstimeeMin) {

    public static ServiceView de(Service service, CodePolitique politique,
                                 int nbEnAttente, int attenteEstimeeMin) {
        return new ServiceView(service.getId(), service.getNom(), service.getPrefixe(),
                service.getDureeMoyenneMin(), service.getCapaciteMax(),
                service.getHeureOuverture(), service.getHeureFermeture(),
                service.isActif(), service.estOuvertA(LocalTime.now()),
                politique, nbEnAttente, attenteEstimeeMin);
    }
}
