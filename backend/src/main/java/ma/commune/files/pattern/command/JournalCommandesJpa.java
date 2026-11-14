package ma.commune.files.pattern.command;

import ma.commune.files.domain.Agent;
import ma.commune.files.domain.JournalCommande;
import ma.commune.files.repository.JournalCommandeRepository;
import org.springframework.stereotype.Component;

/** Implémentation du journal dans la table journal_commande. */
@Component
public class JournalCommandesJpa implements JournalCommandes {

    private final JournalCommandeRepository repository;

    public JournalCommandesJpa(JournalCommandeRepository repository) {
        this.repository = repository;
    }

    @Override
    public void enregistrer(Commande c, Agent agent, boolean annulee) {
        JournalCommande j = new JournalCommande();
        j.setType(c.type());
        j.setAgent(agent);
        j.setTicket(c.ticket());
        j.setEtatAvant(c.etatAvant());
        j.setEtatApres(c.etatApres());
        j.setAnnulee(annulee);
        repository.save(j);
    }
}
