package ma.commune.files.service;

import ma.commune.files.domain.CodePolitique;
import ma.commune.files.domain.EtatFile;
import ma.commune.files.domain.File;
import ma.commune.files.domain.Service;
import ma.commune.files.domain.Ticket;
import ma.commune.files.dto.CreerServiceRequest;
import ma.commune.files.dto.ModifierServiceRequest;
import ma.commune.files.dto.ServiceView;
import ma.commune.files.exception.RessourceIntrouvableException;
import ma.commune.files.repository.FileRepository;
import ma.commune.files.repository.ServiceRepository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@org.springframework.stereotype.Service
public class ServiceCatalogueService {

    private final ServiceRepository services;
    private final FileRepository files;
    private final FileService fileService;
    private final EstimationService estimation;
    public ServiceCatalogueService(ServiceRepository services, FileRepository files,
                                   FileService fileService, EstimationService estimation) {
        this.services = services;
        this.files = files;
        this.fileService = fileService;
        this.estimation = estimation;
    }

    @Transactional
    public ServiceView creer(CreerServiceRequest requete) {
        String nom = requete.nom().trim();
        String prefixe = requete.prefixe().trim().toUpperCase(java.util.Locale.ROOT);
        verifierNomEtPrefixe(nom, prefixe);
        BigDecimal duree = requete.dureeMoyenneMin() == null ? BigDecimal.TEN : requete.dureeMoyenneMin();
        int capacite = requete.capaciteMax() == null ? 200 : requete.capaciteMax();
        LocalTime ouverture = requete.heureOuverture() == null ? LocalTime.of(8, 30) : requete.heureOuverture();
        LocalTime fermeture = requete.heureFermeture() == null ? LocalTime.of(16, 0) : requete.heureFermeture();
        verifierHoraires(ouverture, fermeture);
        if (duree.signum() <= 0 || capacite <= 0) {
            throw new IllegalArgumentException("La durée moyenne et la capacité doivent être positives.");
        }

        Service service = new Service();
        service.setNom(nom);
        service.setPrefixe(prefixe);
        service.setDureeMoyenneMin(duree);
        service.setCapaciteMax(capacite);
        service.setHeureOuverture(ouverture);
        service.setHeureFermeture(fermeture);
        service.setActif(true);
        services.save(service);

        File file = new File();
        file.setService(service);
        file.setPolitique(CodePolitique.PRIORITE);
        file.setEtat(EtatFile.OUVERTE);
        files.save(file);
        return vue(service);
    }

    @Transactional(readOnly = true)
    public List<ServiceView> lister() {
        return services.findByActifTrue().stream().map(this::vue).toList();
    }

    @Transactional(readOnly = true)
    public ServiceView detail(Long id) {
        return vue(trouver(id));
    }

    @Transactional
    public ServiceView modifier(Long id, ModifierServiceRequest requete) {
        Service service = trouver(id);
        if (requete.nom() != null) {
            String nom = requete.nom().trim();
            if (!nom.equalsIgnoreCase(service.getNom()) && services.existsByNomIgnoreCase(nom)) {
                throw new IllegalStateException("Un service porte déjà ce nom.");
            }
            if (nom.isBlank()) {
                throw new IllegalArgumentException("Le nom du service est obligatoire.");
            }
            service.setNom(nom);
        }
        if (requete.dureeMoyenneMin() != null) {
            if (requete.dureeMoyenneMin().signum() <= 0) {
                throw new IllegalArgumentException("La durée moyenne doit être positive.");
            }
            service.setDureeMoyenneMin(requete.dureeMoyenneMin());
        }
        if (requete.capaciteMax() != null) {
            if (requete.capaciteMax() <= 0) {
                throw new IllegalArgumentException("La capacité doit être positive.");
            }
            service.setCapaciteMax(requete.capaciteMax());
        }
        LocalTime ouverture = requete.heureOuverture() == null
                ? service.getHeureOuverture() : requete.heureOuverture();
        LocalTime fermeture = requete.heureFermeture() == null
                ? service.getHeureFermeture() : requete.heureFermeture();
        verifierHoraires(ouverture, fermeture);
        service.setHeureOuverture(ouverture);
        service.setHeureFermeture(fermeture);
        if (requete.actif() != null) {
            service.setActif(requete.actif());
        }
        return vue(service);
    }

    @Transactional
    public ServiceView changerPolitique(Long id, CodePolitique politique) {
        fileService.changerPolitique(id, politique);
        return detail(id);
    }

    private Service trouver(Long id) {
        return services.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Service inconnu : " + id));
    }

    private void verifierNomEtPrefixe(String nom, String prefixe) {
        if (nom.isBlank() || prefixe.isBlank() || prefixe.length() > 3) {
            throw new IllegalArgumentException("Le nom est obligatoire et le préfixe doit contenir 1 à 3 caractères.");
        }
        if (services.existsByNomIgnoreCase(nom)) {
            throw new IllegalStateException("Un service porte déjà ce nom.");
        }
        if (services.existsByPrefixeIgnoreCase(prefixe)) {
            throw new IllegalStateException("Ce préfixe est déjà utilisé.");
        }
    }

    private static void verifierHoraires(LocalTime ouverture, LocalTime fermeture) {
        if (ouverture == null || fermeture == null || !ouverture.isBefore(fermeture)) {
            throw new IllegalArgumentException("L'heure d'ouverture doit précéder l'heure de fermeture.");
        }
    }

    private ServiceView vue(Service service) {
        File file = fileService.fileDuService(service.getId());
        int attente = fileService.nbEnAttente(file);
        return ServiceView.de(service, file.getPolitique(), attente,
                estimation.estimerMinutes(service, attente));
    }
}
