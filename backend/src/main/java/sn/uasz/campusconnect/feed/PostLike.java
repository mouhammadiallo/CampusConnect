package sn.uasz.campusconnect.feed;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("post_likes")
@CompoundIndex(name = "post_user_like_unique", def = "{'postId': 1, 'userId': 1}", unique = true)
public class PostLike {
    @Id
    private String id;
    private String postId;
    private String userId;
    private Instant createdAt;

    protected PostLike() {}

    public PostLike(String postId, String userId) {
        this.postId = postId;
        this.userId = userId;
        this.createdAt = Instant.now();
    }
}
