package ma.commune.files.service;

import ma.commune.files.domain.*;
import ma.commune.files.repository.*;

import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Faux repositories en mémoire (sans Mockito ni base de données).
 * repo(Interface.class, objet) crée un proxy qui appelle, par nom et nombre d'arguments,
 * la méthode correspondante de l'objet.
 */
public final class Fakes {
    private Fakes() {}

    @SuppressWarnings("unchecked")
    public static <R> R repo(Class<R> type, Object impl) {
        return (R) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (proxy, m, args) -> {
            if (m.getDeclaringClass() == Object.class) {
                return switch (m.getName()) {
                    case "toString" -> type.getSimpleName() + "Fake";
                    case "hashCode" -> System.identityHashCode(proxy);
                    default -> proxy == args[0];
                };
            }
            for (Method im : impl.getClass().getMethods()) {
                if (im.getName().equals(m.getName()) && im.getParameterCount() == m.getParameterCount()) {
                    try {
                        return im.invoke(impl, args);
                    } catch (InvocationTargetException e) {
                        throw e.getCause();
                    }
                }
            }
            throw new UnsupportedOperationException(m.toString());
        });
    }

    /** Faux encodeur : « h: » + mot de passe (le vrai BCrypt est branché par SecurityConfig). */
    public static class FauxEncodeur implements PasswordEncoder {
        @Override public String encode(CharSequence brut) { return "h:" + brut; }
        @Override public boolean matches(CharSequence brut, String encode) { return encode(brut).equals(encode); }
    }

    /** Stockage en mémoire : save, findById, findAll. */
    public static class Mem<T> {
        public final Map<Long, T> data = new LinkedHashMap<>();
        private long seq = 1;

        public Object save(Object e) {
            try {
                Long id = (Long) e.getClass().getMethod("getId").invoke(e);
                if (id == null) {
                    id = seq++;
                    e.getClass().getMethod("setId", Long.class).invoke(e, id);
                }
                data.put(id, (T) e);
                return e;
            } catch (ReflectiveOperationException ex) {
                throw new IllegalStateException(ex);
            }
        }
        public Optional<T> findById(Object id) { return Optional.ofNullable(data.get(id)); }
        public List<T> findAll() { return new ArrayList<>(data.values()); }
    }

    public static class Notifications extends Mem<Notification> {
        public boolean existsByTicketIdAndType(Long ticketId, TypeNotification type) {
            return data.values().stream().anyMatch(n -> n.getTicket().getId().equals(ticketId) && n.getType() == type);
        }
    }

    public static class Statistiques extends Mem<Statistique> {
        public Optional<Statistique> findByJourAndServiceId(java.time.LocalDate jour, Long serviceId) {
            return data.values().stream().filter(x -> x.getJour().equals(jour) && x.getService().getId().equals(serviceId)).findFirst();
        }
    }

    public static class Citoyens extends Mem<Citoyen> {
        public Optional<Citoyen> findFirstByEmail(String e) {
            return data.values().stream().filter(c -> e.equals(c.getEmail())).findFirst();
        }
        public Optional<Citoyen> findFirstByTelephone(String t) {
            return data.values().stream().filter(c -> t.equals(c.getTelephone())).findFirst();
        }
    }

    public static class Services extends Mem<Service> {
        public List<Service> findByActifTrue() { return data.values().stream().filter(Service::isActif).toList(); }
        public boolean existsByNomIgnoreCase(String n) { return data.values().stream().anyMatch(s -> s.getNom().equalsIgnoreCase(n)); }
        public boolean existsByPrefixeIgnoreCase(String p) { return data.values().stream().anyMatch(s -> s.getPrefixe().equalsIgnoreCase(p)); }
    }

    public static class Agents extends Mem<Agent> {
        public Optional<Agent> findByLogin(String login) {
            return data.values().stream().filter(a -> a.getLogin().equals(login)).findFirst();
        }
    }

    public static class Files extends Mem<File> {
        public Optional<File> findByServiceId(Long id) {
            return data.values().stream().filter(f -> f.getService().getId().equals(id)).findFirst();
        }
        public Optional<File> findByServiceIdForUpdate(Long id) { return findByServiceId(id); }
    }

    public static class Guichets extends Mem<Guichet> {
        public Optional<Guichet> findByAgentId(Long id) {
            return data.values().stream().filter(g -> g.getAgent() != null && g.getAgent().getId().equals(id)).findFirst();
        }
        public boolean existsByNumero(int numero) { return data.values().stream().anyMatch(g -> g.getNumero() == numero); }
        public boolean existsByAgentId(Long id) {
            return data.values().stream().anyMatch(g -> g.getAgent() != null && g.getAgent().getId().equals(id));
        }
        public long countByServiceIdAndEtat(Long serviceId, EtatGuichet etat) {
            return data.values().stream()
                    .filter(g -> g.getService() != null && g.getService().getId().equals(serviceId) && g.getEtat() == etat).count();
        }
    }

    public static class Tickets extends Mem<Ticket> {
        public List<Ticket> findByFileIdAndEtatOrderByHeureCreationAsc(Long fileId, CodeEtat etat) {
            return data.values().stream()
                    .filter(t -> t.getFile().getId().equals(fileId) && t.getEtat() == etat)
                    .sorted(Comparator.comparing(Ticket::getHeureCreation)).toList();
        }
        public long countByFileIdAndEtat(Long fileId, CodeEtat etat) {
            return findByFileIdAndEtatOrderByHeureCreationAsc(fileId, etat).size();
        }
        public Optional<Ticket> findFirstByCitoyenIdAndServiceIdAndEtatIn(Long citoyenId, Long serviceId, Collection<CodeEtat> etats) {
            return data.values().stream().filter(t -> t.getCitoyen().getId().equals(citoyenId)
                    && t.getService().getId().equals(serviceId) && etats.contains(t.getEtat())).findFirst();
        }
        public Optional<Ticket> findFirstByGuichetIdAndEtatIn(Long guichetId, Collection<CodeEtat> etats) {
            return data.values().stream().filter(t -> t.getGuichet() != null
                    && t.getGuichet().getId().equals(guichetId) && etats.contains(t.getEtat())).findFirst();
        }
        public List<Ticket> findByServiceIdAndEtatAndHeureFinGreaterThanEqual(Long serviceId, CodeEtat etat, LocalDateTime depuis) {
            return data.values().stream().filter(t -> t.getService().getId().equals(serviceId)
                    && t.getEtat() == etat && t.getHeureFin() != null && !t.getHeureFin().isBefore(depuis)).toList();
        }
        public List<Ticket> findByEtatInAndHeureCreationLessThan(Collection<CodeEtat> etats, LocalDateTime avant) {
            return data.values().stream().filter(t -> etats.contains(t.getEtat()) && t.getHeureCreation().isBefore(avant)).toList();
        }
        public List<Ticket> findByHeureCreationGreaterThanEqualAndHeureCreationLessThan(LocalDateTime d, LocalDateTime f) {
            return data.values().stream().filter(t -> !t.getHeureCreation().isBefore(d) && t.getHeureCreation().isBefore(f)).toList();
        }
        public long compterNumerotesEntre(String motif, LocalDateTime debut, LocalDateTime fin) {
            String prefixe = motif.replace("%", "");
            return data.values().stream().filter(t -> t.getNumero().startsWith(prefixe)
                    && !t.getHeureCreation().isBefore(debut) && t.getHeureCreation().isBefore(fin)).count();
        }
    }
}
