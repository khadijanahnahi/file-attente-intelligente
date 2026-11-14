package ma.commune.files.service;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.Guichet;
import ma.commune.files.domain.Service;
import ma.commune.files.domain.Statistique;
import ma.commune.files.domain.Ticket;
import ma.commune.files.dto.ChargeGuichet;
import ma.commune.files.dto.IndicateursService;
import ma.commune.files.repository.GuichetRepository;
import ma.commune.files.repository.ServiceRepository;
import ma.commune.files.repository.StatistiqueRepository;
import ma.commune.files.repository.TicketRepository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;
import java.util.function.ToDoubleFunction;
import java.util.stream.Collectors;

/**
 * Tableau de bord : nombre de tickets, attente moyenne, taux d'abandon, charge par guichet.
 * Les tickets d'une journée sont lus puis agrégés en Java (quelques centaines de lignes par jour) ;
 * les fonctions d'agrégation sont statiques et testées sans base de données.
 */
@org.springframework.stereotype.Service
public class StatistiqueService {

    private final TicketRepository tickets;
    private final ServiceRepository services;
    private final GuichetRepository guichets;
    private final StatistiqueRepository statistiques;

    public StatistiqueService(TicketRepository tickets, ServiceRepository services,
                              GuichetRepository guichets, StatistiqueRepository statistiques) {
        this.tickets = tickets;
        this.services = services;
        this.guichets = guichets;
        this.statistiques = statistiques;
    }

    @Transactional(readOnly = true)
    public List<IndicateursService> indicateurs(LocalDate jour) {
        Map<Long, List<Ticket>> parService = ticketsDuJour(jour).stream()
                .collect(Collectors.groupingBy(t -> t.getService().getId()));
        return services.findAll().stream()
                .map(s -> agreger(s, parService.getOrDefault(s.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChargeGuichet> chargeParGuichet(LocalDate jour) {
        Map<Long, List<Ticket>> parGuichet = ticketsDuJour(jour).stream()
                .filter(t -> t.getGuichet() != null)
                .collect(Collectors.groupingBy(t -> t.getGuichet().getId()));
        return guichets.findAll().stream()
                .map(g -> charge(g, parGuichet.getOrDefault(g.getId(), List.of())))
                .toList();
    }

    /** Enregistre (ou met à jour) la table statistique pour la journée : à lancer chaque soir. */
    @Transactional
    public void calculerEtEnregistrer(LocalDate jour) {
        for (IndicateursService i : indicateurs(jour)) {
            Statistique s = statistiques.findByJourAndServiceId(jour, i.serviceId()).orElseGet(() -> {
                Statistique nouvelle = new Statistique();
                nouvelle.setJour(jour);
                nouvelle.setService(services.findById(i.serviceId()).orElseThrow());
                return nouvelle;
            });
            s.setNbTickets(i.nbTickets());
            s.setAttenteMoyMin(decimal(i.attenteMoyenneMin()));
            s.setTraitementMoyMin(decimal(i.traitementMoyenMin()));
            s.setTauxAbandon(BigDecimal.valueOf(i.tauxAbandonPct()));
            statistiques.save(s);
        }
    }

    // ------------------------- agrégation (testable sans base) -------------------------

    static IndicateursService agreger(Service service, List<Ticket> tickets) {
        int nb = tickets.size();
        int enAttente = (int) tickets.stream().filter(t -> t.getEtat() == CodeEtat.EN_ATTENTE).count();
        Double attente = moyenne(tickets,
                t -> t.getHeureAppel() != null,
                t -> minutes(t.getHeureCreation(), t.getHeureAppel()));
        Double traitement = moyenne(tickets,
                t -> t.getEtat() == CodeEtat.TERMINE && t.getHeureDebut() != null && t.getHeureFin() != null,
                t -> minutes(t.getHeureDebut(), t.getHeureFin()));
        long abandons = tickets.stream()
                .filter(t -> t.getEtat() == CodeEtat.ABSENT || t.getEtat() == CodeEtat.ANNULE).count();
        double taux = nb == 0 ? 0.0 : arrondi1(100.0 * abandons / nb);
        return new IndicateursService(service.getId(), service.getNom(), nb, enAttente, attente, traitement, taux);
    }

    static ChargeGuichet charge(Guichet guichet, List<Ticket> ticketsDuGuichet) {
        int traites = (int) ticketsDuGuichet.stream().filter(t -> t.getEtat() == CodeEtat.TERMINE).count();
        Double duree = moyenne(ticketsDuGuichet,
                t -> t.getEtat() == CodeEtat.TERMINE && t.getHeureDebut() != null && t.getHeureFin() != null,
                t -> minutes(t.getHeureDebut(), t.getHeureFin()));
        return new ChargeGuichet(guichet.getId(), guichet.getNumero(), guichet.getEtat(), traites, duree);
    }

    private static Double moyenne(List<Ticket> tickets,
                                  java.util.function.Predicate<Ticket> garde, ToDoubleFunction<Ticket> valeur) {
        OptionalDouble m = tickets.stream().filter(garde).mapToDouble(valeur).average();
        return m.isPresent() ? arrondi1(m.getAsDouble()) : null;
    }

    private static double minutes(LocalDateTime debut, LocalDateTime fin) {
        return Duration.between(debut, fin).toSeconds() / 60.0;
    }

    private static double arrondi1(double v) { return Math.round(v * 10.0) / 10.0; }

    private static BigDecimal decimal(Double v) { return v == null ? null : BigDecimal.valueOf(v); }

    private List<Ticket> ticketsDuJour(LocalDate jour) {
        LocalDateTime debut = jour.atStartOfDay();
        return tickets.findByHeureCreationGreaterThanEqualAndHeureCreationLessThan(debut, debut.plusDays(1));
    }
}
