package ma.commune.files.repository;

import ma.commune.files.domain.Notification;
import ma.commune.files.domain.TypeNotification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    boolean existsByTicketIdAndType(Long ticketId, TypeNotification type);
}
