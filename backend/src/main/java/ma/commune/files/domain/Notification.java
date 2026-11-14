package ma.commune.files.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Notification envoyée au citoyen (le canal est choisi par le pattern Factory Method). */
@Entity
@Table(name = "notification")
@Getter @Setter @NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 6)
    private Canal canal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private TypeNotification type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "envoye_le", nullable = false)
    private LocalDateTime envoyeLe = LocalDateTime.now();

    @Column(nullable = false)
    private boolean succes = true;
}
