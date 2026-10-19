package sn.uasz.campusconnect.classifieds;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ClassifiedRepository extends MongoRepository<CampusClassified, String> {
    Optional<CampusClassified> findByIdAndAuthorId(String id, String authorId);
}
