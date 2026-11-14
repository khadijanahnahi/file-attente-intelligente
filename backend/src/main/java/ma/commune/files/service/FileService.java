package ma.commune.files.service;

import ma.commune.files.domain.CodeEtat;
import ma.commune.files.domain.CodePolitique;
import ma.commune.files.domain.EtatFile;
import ma.commune.files.domain.File;
import ma.commune.files.domain.Ticket;
import ma.commune.files.exception.RessourceIntrouvableException;
import ma.commune.files.pattern.observer.FileObserver;
import ma.commune.files.pattern.strategy.PolitiqueFile;
import ma.commune.files.repository.FileRepository;
import ma.commune.files.repository.TicketRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Accès aux files. Chaque File chargée est abonnée à tous les FileObserver (écran,
 * notifications, tableau de bord) : c'est ici que le pattern Observer est branché.
 */
@org.springframework.stereotype.Service
public class FileService {

    private final FileRepository files;
    private final TicketRepository tickets;
    private final List<FileObserver> observateurs;   // tous les beans FileObserver de Spring

    public FileService(FileRepository files, TicketRepository tickets, List<FileObserver> observateurs) {
        this.files = files;
        this.tickets = tickets;
        this.observateurs = observateurs;
    }

    public File fileDuService(Long serviceId) {
        File f = files.findByServiceId(serviceId)
                .orElseThrow(() -> new RessourceIntrouvableException("Aucune file pour le service " + serviceId));
        return avecObservateurs(f);
    }

    /** Même chose avec un verrou en écriture : à utiliser pour créer un ticket. */
    public File verrouillerFileDuService(Long serviceId) {
        File f = files.findByServiceIdForUpdate(serviceId)
                .orElseThrow(() -> new RessourceIntrouvableException("Aucune file pour le service " + serviceId));
        return avecObservateurs(f);
    }

    /** Abonne les observateurs à la file (sans doublon, donc appel répétable). */
    public File avecObservateurs(File file) {
        observateurs.forEach(file::abonner);
        return file;
    }

    public List<Ticket> enAttente(File file) {
        return tickets.findByFileIdAndEtatOrderByHeureCreationAsc(file.getId(), CodeEtat.EN_ATTENTE);
    }

    public int nbEnAttente(File file) {
        return (int) tickets.countByFileIdAndEtat(file.getId(), CodeEtat.EN_ATTENTE);
    }

    public boolean estSaturee(File file) {
        return file.getEtat() == EtatFile.SATUREE
                || nbEnAttente(file) >= file.getService().getCapaciteMax();
    }

    /**
     * Rang du ticket dans la file selon la politique en vigueur (1 = prochain à être appelé).
     * Retourne 0 si le ticket n'est pas en attente.
     */
    public int position(Ticket ticket) {
        if (ticket.getEtat() != CodeEtat.EN_ATTENTE) {
            return 0;
        }
        File file = ticket.getFile();
        PolitiqueFile politique = file.politiqueCourante();
        List<Ticket> restants = new ArrayList<>(enAttente(file));
        int rang = 1;
        while (!restants.isEmpty()) {
            Ticket suivant = politique.choisirSuivant(restants).orElseThrow();
            if (suivant.getId().equals(ticket.getId())) {
                return rang;
            }
            restants.remove(suivant);
            rang++;
        }
        return 0;
    }

    /** Le responsable change la règle de passage d'un service. */
    @Transactional
    public File changerPolitique(Long serviceId, CodePolitique politique) {
        File f = fileDuService(serviceId);
        f.changerPolitique(politique);
        return f;
    }
}
