package ma.commune.files.service;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.EtatGuichet;
import ma.commune.files.domain.Guichet;
import ma.commune.files.domain.Ticket;
import ma.commune.files.repository.GuichetRepository;
import ma.commune.files.repository.TicketRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NettoyageService {

    private static final List<CodeEtat> ETATS_ACTIFS =
            List.of(CodeEtat.CREE, CodeEtat.EN_ATTENTE, CodeEtat.APPELE, CodeEtat.EN_TRAITEMENT);

    private final TicketRepository tickets;
    private final GuichetRepository guichets;
    private final StatistiqueService statistiques;

    public NettoyageService(TicketRepository tickets, GuichetRepository guichets,
                            StatistiqueService statistiques) {
        this.tickets = tickets;
        this.guichets = guichets;
        this.statistiques = statistiques;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void auDemarrage() {
        cloturerTicketsAvant(LocalDate.now().atStartOfDay());
    }

    @Scheduled(cron = "0 0 0 * * *", zone = "Africa/Casablanca")
    @Transactional
    public void cloturerLaJournee() {
        LocalDate hier = LocalDate.now().minusDays(1);
        cloturerTicketsAvant(LocalDate.now().atStartOfDay());
        for (Guichet guichet : guichets.findAll()) {
            guichet.setEtat(EtatGuichet.FERME);
        }
        statistiques.calculerEtEnregistrer(hier);
    }

    private void cloturerTicketsAvant(LocalDateTime limite) {
        for (Ticket ticket : tickets.findByEtatInAndHeureCreationLessThan(ETATS_ACTIFS, limite)) {
            switch (ticket.getEtat()) {
                case CREE -> {
                    ticket.setEtat(CodeEtat.ANNULE);
                    ticket.setHeureFin(LocalDateTime.now());
                }
                case EN_ATTENTE -> ticket.annuler();
                case APPELE -> {
                    if (ticket.getNbRappels() == 0) {
                        ticket.setNbRappels(1);
                    }
                    ticket.marquerAbsent();
                }
                case EN_TRAITEMENT -> ticket.terminer();
                default -> {
                    // La requête ne sélectionne que les états actifs.
                }
            }
        }
    }
}
