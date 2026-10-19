package sn.uasz.campusconnect.polls;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CampusPollRepository extends MongoRepository<CampusPoll, String> {
    List<CampusPoll> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
