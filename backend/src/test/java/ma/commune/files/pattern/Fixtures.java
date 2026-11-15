package ma.commune.files.pattern;

import ma.commune.files.domain.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Objets de test simples (sans base de données). */
public final class Fixtures {
    private Fixtures() {}

    private static long compteur = 1;

    public static Service service() {
        Service s = new Service();
        s.setId(1L);
        s.setNom("Acte de naissance");
        s.setPrefixe("N");
        s.setDureeMoyenneMin(new BigDecimal("8"));
        return s;
    }

    public static File file(Service s) {
        File f = new File();
        f.setId(1L);
        f.setService(s);
        return f;
    }

    public static Guichet guichet() {
        Guichet g = new Guichet();
        g.setId(1L);
        g.setNumero(3);
        g.setEtat(EtatGuichet.OUVERT);
        return g;
    }

    public static Agent agent() {
        Agent a = new Agent();
        a.setId(1L);
        a.setLogin("guichet1");
        a.setRole(RoleAgent.GUICHET);
        return a;
    }

    /** Ticket EN_ATTENTE créé il y a minutesAttente minutes. */
    public static Ticket ticket(Service s, File f, Priorite p, int minutesAttente) {
        Ticket t = new Ticket();
        t.setId(compteur++);
        t.setService(s);
        t.setFile(f);
        t.setCitoyen(new Citoyen());
        t.setPriorite(p);
        t.setNumero("N-" + t.getId());
        t.setHeureCreation(LocalDateTime.now().minusMinutes(minutesAttente));
        t.setEtat(CodeEtat.EN_ATTENTE);
        return t;
    }
}
