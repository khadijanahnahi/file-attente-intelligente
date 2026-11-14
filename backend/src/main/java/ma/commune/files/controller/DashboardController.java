package ma.commune.files.controller;

import ma.commune.files.dto.ChargeGuichet;
import ma.commune.files.dto.IndicateursService;
import ma.commune.files.service.StatistiqueService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Tableau de bord du responsable. Le paramètre jour (AAAA-MM-JJ) vaut aujourd'hui s'il est absent. */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final StatistiqueService statistiques;

    public DashboardController(StatistiqueService statistiques) {
        this.statistiques = statistiques;
    }

    /** Par service : nombre de tickets, en attente, attente moyenne, traitement moyen, taux d'abandon. */
    @GetMapping("/indicateurs")
    public List<IndicateursService> indicateurs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate jour) {
        return statistiques.indicateurs(jour != null ? jour : LocalDate.now());
    }

    /** Charge par guichet. */
    @GetMapping("/guichets")
    public List<ChargeGuichet> guichets(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate jour) {
        return statistiques.chargeParGuichet(jour != null ? jour : LocalDate.now());
    }

    /** Fige les indicateurs du jour dans la table statistique (à lancer en fin de journée). */
    @PostMapping("/calculer")
    public List<IndicateursService> calculer(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate jour) {
        LocalDate j = jour != null ? jour : LocalDate.now();
        statistiques.calculerEtEnregistrer(j);
        return statistiques.indicateurs(j);
    }
}
