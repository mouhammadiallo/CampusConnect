package sn.uasz.campusconnect.identity;

import java.util.Optional;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CampusUserRepository extends MongoRepository<CampusUser, String> {
    Optional<CampusUser> findByEmail(String email);
    List<CampusUser> findByEmailIn(Collection<String> emails);
    boolean existsByEmail(String email);
    List<CampusUser> findByFullNameContainingIgnoreCase(String fullName, Pageable pageable);
    List<CampusUser> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String fullName, String email, Pageable pageable);
}
