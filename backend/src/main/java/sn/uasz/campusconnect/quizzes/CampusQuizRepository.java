package sn.uasz.campusconnect.quizzes;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CampusQuizRepository extends MongoRepository<CampusQuiz, String> {
    List<CampusQuiz> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
