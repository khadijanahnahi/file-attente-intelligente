package ma.commune.files.controller;

import jakarta.validation.Valid;
import ma.commune.files.dto.ModifierServiceRequest;
import ma.commune.files.dto.PolitiqueRequest;
import ma.commune.files.dto.ServiceView;
import ma.commune.files.service.ServiceCatalogueService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ServiceController {

    private final ServiceCatalogueService catalogue;

    public ServiceController(ServiceCatalogueService catalogue) {
        this.catalogue = catalogue;
    }

    /** Public : le citoyen choisit son service en voyant l'affluence et l'attente. */
    @GetMapping("/services")
    public List<ServiceView> lister() {
        return catalogue.lister();
    }

    @GetMapping("/services/{id}")
    public ServiceView detail(@PathVariable Long id) {
        return catalogue.detail(id);
    }

    /** Responsable : horaires, durée moyenne, capacité, activation. */
    @PutMapping("/config/services/{id}")
    public ServiceView modifier(@PathVariable Long id, @Valid @RequestBody ModifierServiceRequest r) {
        return catalogue.modifier(id, r);
    }

    /** Responsable : change la règle de passage de la file (FIFO, PRIORITE, CHARGE_EQUILIBREE). */
    @PutMapping("/config/services/{id}/politique")
    public ServiceView politique(@PathVariable Long id, @Valid @RequestBody PolitiqueRequest r) {
        return catalogue.changerPolitique(id, r.politique());
    }
}
