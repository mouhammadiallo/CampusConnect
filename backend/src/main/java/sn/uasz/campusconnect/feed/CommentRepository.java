package sn.uasz.campusconnect.feed;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Pageable;

public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByPostIdOrderByCreatedAtAsc(String postId, Pageable pageable);
    long countByPostId(String postId);
    long deleteByPostId(String postId);
}
