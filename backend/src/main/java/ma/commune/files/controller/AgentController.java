package ma.commune.files.controller;

import ma.commune.files.dto.GuichetView;
import ma.commune.files.dto.TicketView;
import ma.commune.files.exception.RessourceIntrouvableException;
import ma.commune.files.security.AgentPrincipal;
import ma.commune.files.service.GuichetService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** CU2 : tout ce que fait l'agent de guichet. Il agit toujours sur son propre guichet (tiré du jeton). */
@RestController
@RequestMapping("/api/guichet")
public class AgentController {

    private final GuichetService guichet;

    public AgentController(GuichetService guichet) {
        this.guichet = guichet;
    }

    /** Guichet de l'agent connecté (404 s'il n'en a pas). */
    @GetMapping("/moi")
    public GuichetView moi(@AuthenticationPrincipal AgentPrincipal a) {
        return GuichetView.de(guichet.monGuichet(a.id()));
    }

    @PostMapping("/ouvrir")
    public GuichetView ouvrir(@AuthenticationPrincipal AgentPrincipal a) {
        return GuichetView.de(guichet.ouvrir(a.id()));
    }

    @PostMapping("/pause")
    public GuichetView pause(@AuthenticationPrincipal AgentPrincipal a) {
        return GuichetView.de(guichet.mettreEnPause(a.id()));
    }

    @PostMapping("/fermer")
    public GuichetView fermer(@AuthenticationPrincipal AgentPrincipal a) {
        return GuichetView.de(guichet.fermer(a.id()));
    }

    /** « Appeler le suivant ». */
    @PostMapping("/appeler")
    public TicketView appeler(@AuthenticationPrincipal AgentPrincipal a) {
        return TicketView.de(guichet.appelerSuivant(a.id()));
    }

    @PostMapping("/rappeler")
    public TicketView rappeler(@AuthenticationPrincipal AgentPrincipal a) {
        return TicketView.de(guichet.rappeler(a.id()));
    }

    /** Le citoyen s'est présenté. */
    @PostMapping("/traiter")
    public TicketView traiter(@AuthenticationPrincipal AgentPrincipal a) {
        return TicketView.de(guichet.commencerTraitement(a.id()));
    }

    @PostMapping("/terminer")
    public TicketView terminer(@AuthenticationPrincipal AgentPrincipal a) {
        return TicketView.de(guichet.terminer(a.id()));
    }

    @PostMapping("/absent")
    public TicketView absent(@AuthenticationPrincipal AgentPrincipal a) {
        return TicketView.de(guichet.marquerAbsent(a.id()));
    }

    /** Annule le dernier appel : le ticket retourne dans la file. */
    @PostMapping("/annuler-appel")
    public TicketView annulerAppel(@AuthenticationPrincipal AgentPrincipal a) {
        return guichet.annulerDernierAppel(a.id()).map(TicketView::de)
                .orElseThrow(() -> new RessourceIntrouvableException("Aucun appel à annuler."));
    }

    @PostMapping("/tickets/{id}/annuler")
    public TicketView annulerTicket(@AuthenticationPrincipal AgentPrincipal a, @PathVariable Long id) {
        return TicketView.de(guichet.annulerTicket(a.id(), id));
    }

    /** Ticket actuellement appelé ou en traitement (404 s'il n'y en a pas). */
    @GetMapping("/en-cours")
    public TicketView enCours(@AuthenticationPrincipal AgentPrincipal a) {
        return guichet.ticketEnCoursDe(a.id()).map(TicketView::de)
                .orElseThrow(() -> new RessourceIntrouvableException("Aucun ticket en cours."));
    }

    /** Tickets en attente de son service, dans l'ordre d'appel. */
    @GetMapping("/file")
    public List<TicketView> file(@AuthenticationPrincipal AgentPrincipal a) {
        return guichet.fileDAttente(a.id()).stream().map(TicketView::de).toList();
    }
}