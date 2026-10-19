package sn.uasz.campusconnect.events;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CampusEventRepository extends MongoRepository<CampusEvent, String> {
    List<CampusEvent> findByStartsAtAfterOrderByStartsAtAsc(Instant after, Pageable pageable);
}
