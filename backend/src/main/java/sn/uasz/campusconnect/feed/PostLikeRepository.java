package sn.uasz.campusconnect.feed;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface PostLikeRepository extends MongoRepository<PostLike, String> {
    boolean existsByPostIdAndUserId(String postId, String userId);
    long deleteByPostIdAndUserId(String postId, String userId);
    long deleteByPostId(String postId);
    long countByPostId(String postId);
}
