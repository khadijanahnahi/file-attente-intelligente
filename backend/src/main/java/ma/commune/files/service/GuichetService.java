package ma.commune.files.service;

import ma.commune.files.domain.Agent;
import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.EtatGuichet;
import ma.commune.files.domain.File;
import ma.commune.files.domain.Guichet;
import ma.commune.files.domain.Ticket;
import ma.commune.files.exception.RessourceIntrouvableException;
import ma.commune.files.pattern.command.AnnulerTicketCommande;
import ma.commune.files.pattern.command.AppelerCommande;
import ma.commune.files.pattern.command.InvocateurGuichet;
import ma.commune.files.pattern.command.JournalCommandes;
import ma.commune.files.pattern.observer.EvenementFile;
import ma.commune.files.pattern.observer.TypeEvenement;
import ma.commune.files.repository.GuichetRepository;
import ma.commune.files.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * CU2 : travail de l'agent de guichet. L'agent est identifié par son id (tiré du JWT à l'étape 8) ;
 * chaque agent tient un seul guichet.
 *
 * Les appels et annulations passent par un InvocateurGuichet (pattern Command), un par guichet,
 * qui garde l'historique pour annulerDernierAppel().
 */
@org.springframework.stereotype.Service
public class GuichetService {

    static final List<CodeEtat> EN_COURS = List.of(CodeEtat.APPELE, CodeEtat.EN_TRAITEMENT);

    private final GuichetRepository guichets;
    private final TicketRepository tickets;
    private final FileService fileService;
    private final JournalCommandes journal;
    private final long delaiAbsenceMin;
    private final Map<Long, InvocateurGuichet> invocateurs = new ConcurrentHashMap<>();

    public GuichetService(GuichetRepository guichets, TicketRepository tickets, FileService fileService,
                          JournalCommandes journal,
                          @Value("${files.delai-absence-minutes:2}") long delaiAbsenceMin) {
        this.guichets = guichets;
        this.tickets = tickets;
        this.fileService = fileService;
        this.journal = journal;
        this.delaiAbsenceMin = delaiAbsenceMin;
    }

    // ------------------------- état du guichet -------------------------

    @Transactional
    public Guichet ouvrir(Long agentId) {
        Guichet g = guichetDe(agentId);
        g.setEtat(EtatGuichet.OUVERT);
        return g;
    }

    @Transactional
    public Guichet mettreEnPause(Long agentId) {
        Guichet g = guichetDe(agentId);
        refuserSiTicketEnCours(g, "mettre le guichet en pause");
        g.setEtat(EtatGuichet.PAUSE);
        return g;
    }

    @Transactional
    public Guichet fermer(Long agentId) {
        Guichet g = guichetDe(agentId);
        refuserSiTicketEnCours(g, "fermer le guichet");
        g.setEtat(EtatGuichet.FERME);
        return g;
    }

    // ------------------------- CU2 -------------------------

    /**
     * Appelle le ticket suivant : la file choisit (Strategy), le ticket passe à « Appelé » (State),
     * l'écran et le citoyen sont prévenus (Observer).
     *
     * @throws ma.commune.files.pattern.command.FileVideException si personne n'attend
     */
    @Transactional
    public Ticket appelerSuivant(Long agentId) {
        Guichet g = guichetOuvertDe(agentId);
        refuserSiTicketEnCours(g, "appeler un autre ticket");
        File file = fileService.fileDuService(g.getService().getId());
        AppelerCommande commande = new AppelerCommande(file, g, fileService.enAttente(file));
        invocateur(g).executer(commande);
        return commande.ticket();
    }

    /** Nouveau rappel du ticket appelé : l'écran rejoue l'annonce. */
    @Transactional
    public Ticket rappeler(Long agentId) {
        Ticket t = ticketEnCours(guichetOuvertDe(agentId));
        t.rappeler();
        fileService.avecObservateurs(t.getFile()).notifier(EvenementFile.de(TypeEvenement.TICKET_APPELE, t));
        return t;
    }

    /** Le citoyen s'est présenté : « Appelé » -> « En traitement ». */
    @Transactional
    public Ticket commencerTraitement(Long agentId) {
        Ticket t = ticketEnCours(guichetOuvertDe(agentId));
        t.traiter();
        return t;
    }

    /** « En traitement » -> « Terminé ». */
    @Transactional
    public Ticket terminer(Long agentId) {
        Ticket t = ticketEnCours(guichetOuvertDe(agentId));
        t.terminer();
        fileService.avecObservateurs(t.getFile()).notifier(EvenementFile.de(TypeEvenement.TICKET_TERMINE, t));
        return t;
    }

    /**
     * Le citoyen ne se présente pas. Exige au moins un rappel (State) et que le délai
     * (files.delai-absence-minutes, 2 min par défaut) soit écoulé depuis l'appel.
     */
    @Transactional
    public Ticket marquerAbsent(Long agentId) {
        Ticket t = ticketEnCours(guichetOuvertDe(agentId));
        LocalDateTime appel = t.getHeureAppel();
        if (appel != null && Duration.between(appel, LocalDateTime.now()).toMinutes() < delaiAbsenceMin) {
            throw new IllegalStateException("Le délai d'attente de " + delaiAbsenceMin
                    + " min n'est pas écoulé : rappelez le citoyen d'abord.");
        }
        t.marquerAbsent();
        fileService.avecObservateurs(t.getFile()).notifier(EvenementFile.de(TypeEvenement.TICKET_ABSENT, t));
        return t;
    }

    /** Annule le dernier appel (mauvais ticket appelé) : le ticket retourne dans la file. */
    @Transactional
    public Optional<Ticket> annulerDernierAppel(Long agentId) {
        Guichet g = guichetDe(agentId);
        var annulee = invocateur(g).annulerDerniere();
        return Optional.ofNullable(annulee).map(c -> c.ticket());
    }

    /** L'agent annule un ticket précis (commande tracée dans le journal). */
    @Transactional
    public Ticket annulerTicket(Long agentId, Long ticketId) {
        Guichet g = guichetDe(agentId);
        Ticket t = tickets.findById(ticketId)
                .orElseThrow(() -> new RessourceIntrouvableException("Ticket inconnu : " + ticketId));
        File file = fileService.avecObservateurs(t.getFile());
        invocateur(g).executer(new AnnulerTicketCommande(file, t));
        return t;
    }

    @Transactional(readOnly = true)
    public Optional<Ticket> ticketEnCoursDe(Long agentId) {
        return tickets.findFirstByGuichetIdAndEtatIn(guichetDe(agentId).getId(), EN_COURS);
    }

    // ------------------------- outils -------------------------

    private Guichet guichetDe(Long agentId) {
        return guichets.findByAgentId(agentId)
                .orElseThrow(() -> new RessourceIntrouvableException("Aucun guichet n'est attribué à l'agent " + agentId));
    }

    private Guichet guichetOuvertDe(Long agentId) {
        Guichet g = guichetDe(agentId);
        if (g.getEtat() != EtatGuichet.OUVERT) {
            throw new IllegalStateException("Le guichet " + g.getNumero() + " n'est pas ouvert (état : " + g.getEtat() + ").");
        }
        if (g.getService() == null) {
            throw new IllegalStateException("Le guichet " + g.getNumero() + " n'est rattaché à aucun service.");
        }
        return g;
    }

    private Ticket ticketEnCours(Guichet g) {
        return tickets.findFirstByGuichetIdAndEtatIn(g.getId(), EN_COURS)
                .orElseThrow(() -> new IllegalStateException("Aucun ticket en cours au guichet " + g.getNumero() + "."));
    }

    private void refuserSiTicketEnCours(Guichet g, String action) {
        if (tickets.findFirstByGuichetIdAndEtatIn(g.getId(), EN_COURS).isPresent()) {
            throw new IllegalStateException("Impossible de " + action + " : un ticket est en cours au guichet " + g.getNumero() + ".");
        }
    }

    private InvocateurGuichet invocateur(Guichet g) {
        return invocateurs.computeIfAbsent(g.getId(), id -> {
            Agent agent = g.getAgent();
            return new InvocateurGuichet(agent, journal);
        });
    }
}
