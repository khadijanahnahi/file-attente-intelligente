package ma.commune.files.service;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.EtatGuichet;
import ma.commune.files.domain.Service;
import ma.commune.files.domain.Ticket;
import ma.commune.files.repository.GuichetRepository;
import ma.commune.files.repository.TicketRepository;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Estimation du temps d'attente :
 *     (tickets devant) x (durée moyenne) / (guichets ouverts)
 * La durée moyenne est mesurée sur les tickets terminés aujourd'hui quand il y en a assez
 * (MIN_ECHANTILLON), sinon on prend la durée moyenne théorique du service.
 */
@org.springframework.stereotype.Service
public class EstimationService {

    static final int MIN_ECHANTILLON = 3;

    private final GuichetRepository guichets;
    private final TicketRepository tickets;

    public EstimationService(GuichetRepository guichets, TicketRepository tickets) {
        this.guichets = guichets;
        this.tickets = tickets;
    }

    /** Attente estimée en minutes pour un ticket qui a ticketsDevant personnes devant lui. */
    public int estimerMinutes(Service service, int ticketsDevant) {
        int ouverts = (int) guichets.countByServiceIdAndEtat(service.getId(), EtatGuichet.OUVERT);
        return calculer(ticketsDevant, dureeMoyenneMin(service), ouverts);
    }

    /** Durée moyenne de traitement, réelle si possible, sinon théorique. */
    double dureeMoyenneMin(Service service) {
        LocalDateTime debutJournee = LocalDate.now().atStartOfDay();
        List<Ticket> termines = tickets.findByServiceIdAndEtatAndHeureFinGreaterThanEqual(
                service.getId(), CodeEtat.TERMINE, debutJournee);
        double[] minutes = termines.stream()
                .filter(t -> t.getHeureDebut() != null && t.getHeureFin() != null)
                .mapToDouble(t -> Duration.between(t.getHeureDebut(), t.getHeureFin()).toSeconds() / 60.0)
                .toArray();
        if (minutes.length < MIN_ECHANTILLON) {
            return service.getDureeMoyenneMin().doubleValue();
        }
        return java.util.Arrays.stream(minutes).average().orElse(service.getDureeMoyenneMin().doubleValue());
    }

    /** La formule, isolée pour être testée : arrondie à la minute supérieure. */
    static int calculer(int ticketsDevant, double dureeMoyenneMin, int guichetsOuverts) {
        if (ticketsDevant <= 0) {
            return 0;
        }
        int guichetsActifs = Math.max(1, guichetsOuverts);   // aucun guichet ouvert : on suppose 1 pour rester lisible
        return (int) Math.ceil(ticketsDevant * dureeMoyenneMin / guichetsActifs);
    }
}
