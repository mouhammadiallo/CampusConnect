package sn.uasz.campusconnect.feed;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("comments")
public class Comment {
    @Id
    private String id;
    @Indexed
    private String postId;
    private String authorId;
    private String authorName;
    private String content;
    private Instant createdAt;

    protected Comment() {}

    public Comment(String postId, String authorId, String authorName, String content) {
        this.postId = postId;
        this.authorId = authorId;
        this.authorName = authorName;
        this.content = content;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getPostId() { return postId; }
    public String getAuthorId() { return authorId; }
    public String getAuthorName() { return authorName; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
