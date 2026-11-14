package ma.commune.files.service;

import ma.commune.files.domain.Agent;
import ma.commune.files.domain.Citoyen;
import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.EtatFile;
import ma.commune.files.domain.File;
import ma.commune.files.domain.Priorite;
import ma.commune.files.domain.Service;
import ma.commune.files.domain.Ticket;
import ma.commune.files.dto.PriseTicketRequest;
import ma.commune.files.dto.TicketInfo;
import ma.commune.files.exception.FileSatureeException;
import ma.commune.files.exception.RessourceIntrouvableException;
import ma.commune.files.exception.ServiceFermeException;
import ma.commune.files.pattern.factory.TicketFactory;
import ma.commune.files.pattern.observer.EvenementFile;
import ma.commune.files.pattern.observer.TypeEvenement;
import ma.commune.files.repository.AgentRepository;
import ma.commune.files.repository.CitoyenRepository;
import ma.commune.files.repository.ServiceRepository;
import ma.commune.files.repository.TicketRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/** CU1 : prendre un ticket, suivre sa position, annuler. */
@org.springframework.stereotype.Service
public class TicketService {

    /** États dans lesquels un ticket est « actif » (le citoyen ne peut pas en prendre un second). */
    static final List<CodeEtat> ACTIFS =
            List.of(CodeEtat.CREE, CodeEtat.EN_ATTENTE, CodeEtat.APPELE, CodeEtat.EN_TRAITEMENT);

    private final ServiceRepository services;
    private final CitoyenRepository citoyens;
    private final TicketRepository tickets;
    private final AgentRepository agents;
    private final FileService fileService;
    private final EstimationService estimation;

    public TicketService(ServiceRepository services, CitoyenRepository citoyens, TicketRepository tickets,
                         AgentRepository agents, FileService fileService, EstimationService estimation) {
        this.services = services;
        this.citoyens = citoyens;
        this.tickets = tickets;
        this.agents = agents;
        this.fileService = fileService;
        this.estimation = estimation;
    }

    /**
     * CU1, scénario nominal : choix du service, priorité, création du ticket (Factory Method),
     * placement dans la file (State), annonce aux observateurs (Observer), puis position et
     * attente estimée.
     *
     * Scénarios alternatifs : service fermé ou file saturée -> exception ;
     * ticket déjà actif pour ce service -> on renvoie le ticket existant.
     */
    @Transactional
    public TicketInfo prendreTicket(PriseTicketRequest requete) {
        Service service = services.findById(requete.serviceId())
                .orElseThrow(() -> new RessourceIntrouvableException("Service inconnu : " + requete.serviceId()));
        verifierOuvert(service);

        File file = fileService.verrouillerFileDuService(service.getId());
        if (file.getEtat() == EtatFile.FERMEE) {
            throw new ServiceFermeException("La file « " + service.getNom() + " » est fermée. Choisissez un autre service.");
        }

        Citoyen citoyen = trouverOuCreerCitoyen(requete);

        Optional<Ticket> existant = tickets.findFirstByCitoyenIdAndServiceIdAndEtatIn(
                citoyen.getId(), service.getId(), ACTIFS);
        if (existant.isPresent()) {
            return info(existant.get(), true);
        }

        if (fileService.estSaturee(file)) {
            throw new FileSatureeException("La file « " + service.getNom() + " » est saturée. "
                    + "Choisissez un autre service ou revenez plus tard.");
        }

        Priorite priorite = requete.priorite() != null ? requete.priorite() : Priorite.NORMALE;
        int sequence = prochaineSequence(service);
        Ticket ticket = TicketFactory.pour(priorite).creerTicket(service, file, citoyen, sequence, requete.motif());
        if (requete.agentAccueilId() != null) {
            Agent agent = agents.findById(requete.agentAccueilId())
                    .orElseThrow(() -> new RessourceIntrouvableException("Agent inconnu : " + requete.agentAccueilId()));
            ticket.setCreeParAgent(agent);
        }
        ticket.placerEnFile();
        tickets.save(ticket);

        file.notifier(EvenementFile.de(TypeEvenement.TICKET_CREE, ticket));
        return info(ticket, false);
    }

    /** Position et attente estimée, à tout moment (le frontend l'appelle aussi à chaque message WebSocket). */
    @Transactional(readOnly = true)
    public TicketInfo suivre(Long ticketId) {
        return info(chercher(ticketId), false);
    }

    /** Le citoyen annule son ticket (évolution) : possible seulement tant qu'il est en attente. */
    @Transactional
    public TicketInfo annuler(Long ticketId) {
        Ticket ticket = chercher(ticketId);
        ticket.annuler();   // TransitionInterditeException si le ticket est déjà appelé ou terminé
        fileService.avecObservateurs(ticket.getFile())
                .notifier(EvenementFile.de(TypeEvenement.TICKET_ANNULE, ticket));
        return info(ticket, false);
    }

    // ------------------------------------------------------------------

    private void verifierOuvert(Service service) {
        if (!service.estOuvertA(LocalTime.now())) {
            throw new ServiceFermeException("Le service « " + service.getNom() + " » est fermé. Ouverture de "
                    + service.getHeureOuverture() + " à " + service.getHeureFermeture()
                    + ". Choisissez un autre service ou un autre horaire.");
        }
    }

    private Citoyen trouverOuCreerCitoyen(PriseTicketRequest r) {
        boolean aEmail = r.email() != null && !r.email().isBlank();
        boolean aTel = r.telephone() != null && !r.telephone().isBlank();
        if (!aEmail && !aTel) {
            throw new IllegalArgumentException("Un numéro de téléphone ou une adresse e-mail est obligatoire pour être prévenu.");
        }
        Optional<Citoyen> trouve = aEmail ? citoyens.findFirstByEmail(r.email()) : Optional.empty();
        if (trouve.isEmpty() && aTel) {
            trouve = citoyens.findFirstByTelephone(r.telephone());
        }
        if (trouve.isPresent()) {
            return trouve.get();
        }
        Citoyen c = new Citoyen();
        c.setNom(r.nom());
        c.setEmail(aEmail ? r.email() : null);
        c.setTelephone(aTel ? r.telephone() : null);
        if (r.langue() != null && !r.langue().isBlank()) {
            c.setLangue(r.langue());
        }
        return citoyens.save(c);
    }

    /** Rang du prochain numéro du jour pour ce préfixe de service. */
    private int prochaineSequence(Service service) {
        LocalDateTime debut = LocalDate.now().atStartOfDay();
        long dejaCrees = tickets.compterNumerotesEntre(service.getPrefixe() + "-%", debut, debut.plusDays(1));
        return (int) dejaCrees + 1;
    }

    private Ticket chercher(Long ticketId) {
        return tickets.findById(ticketId)
                .orElseThrow(() -> new RessourceIntrouvableException("Ticket inconnu : " + ticketId));
    }

    private TicketInfo info(Ticket t, boolean dejaExistant) {
        int position = fileService.position(t);
        int devant = Math.max(0, position - 1);
        int attente = position == 0 ? 0 : estimation.estimerMinutes(t.getService(), devant);
        Integer guichet = t.getGuichet() != null ? t.getGuichet().getNumero() : null;
        return new TicketInfo(t.getId(), t.getNumero(), t.getService().getNom(), t.getEtat(), t.getPriorite(),
                position, devant, attente, guichet, dejaExistant);
    }
}
