package sn.uasz.campusconnect.feed;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("posts")
public class Post {
    @Id
    private String id;
    private String authorId;
    private String authorName;
    private String content;
    private String mediaUrl;
    private String attachmentId;
    @Indexed
    private Instant createdAt;
    private long likesCount;
    private long commentsCount;

    protected Post() {}

    public Post(String authorId, String authorName, String content, String mediaUrl, String attachmentId) {
        this.authorId = authorId;
        this.authorName = authorName;
        this.content = content;
        this.mediaUrl = mediaUrl;
        this.attachmentId = attachmentId;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getAuthorId() { return authorId; }
    public String getAuthorName() { return authorName; }
    public String getContent() { return content; }
    public String getMediaUrl() { return mediaUrl; }
    public String getAttachmentId() { return attachmentId; }
    public Instant getCreatedAt() { return createdAt; }
    public long getLikesCount() { return likesCount; }
    public long getCommentsCount() { return commentsCount; }
    public void setLikesCount(long likesCount) { this.likesCount = likesCount; }
    public void setCommentsCount(long commentsCount) { this.commentsCount = commentsCount; }
}
