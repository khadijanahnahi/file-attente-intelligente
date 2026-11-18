package ma.commune.files.controller;

import jakarta.validation.Valid;
import ma.commune.files.dto.AnnulationCitoyenRequest;
import ma.commune.files.dto.PriseTicketRequest;
import ma.commune.files.dto.TicketInfo;
import ma.commune.files.security.AgentPrincipal;
import ma.commune.files.service.TicketService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Côté citoyen (public) et côté agent d'accueil. */
@RestController
@RequestMapping("/api")
public class TicketController {

    private final TicketService tickets;

    public TicketController(TicketService tickets) {
        this.tickets = tickets;
    }

    /** CU1 : le citoyen prend un ticket (QR code, borne, web ou mobile). */
    @PostMapping("/tickets")
    public TicketInfo prendre(@Valid @RequestBody PriseTicketRequest r) {
        // un client public ne peut pas se faire passer pour un agent d'accueil
        return tickets.prendreTicket(avecAgent(r, null));
    }

    /** Position et temps d'attente estimé (le frontend rappelle cette route à chaque message WebSocket). */
    @GetMapping("/tickets/{id}")
    public TicketInfo suivre(@PathVariable Long id) {
        return tickets.suivre(id);
    }

    @PostMapping("/tickets/{id}/annuler")
    public TicketInfo annuler(@PathVariable Long id) {
        return tickets.annuler(id);
    }

    /** Le citoyen annule son ticket : son contact (téléphone ou e-mail) sert de preuve. */
    @PostMapping("/tickets/{id}/annuler-citoyen")
    public TicketInfo annulerParCitoyen(@PathVariable Long id, @Valid @RequestBody AnnulationCitoyenRequest r) {
        return tickets.annulerParCitoyen(id, r.contact());
    }

    /** L'agent d'accueil crée un ticket à la place d'un citoyen sans smartphone. */
    @PostMapping("/accueil/tickets")
    public TicketInfo prendrePourCitoyen(@AuthenticationPrincipal AgentPrincipal agent,
                                         @Valid @RequestBody PriseTicketRequest r) {
        return tickets.prendreTicket(avecAgent(r, agent.id()));
    }

    private static PriseTicketRequest avecAgent(PriseTicketRequest r, Long agentId) {
        return new PriseTicketRequest(r.serviceId(), r.nom(), r.telephone(), r.email(), r.langue(),
                r.priorite(), r.motif(), agentId);
    }
}