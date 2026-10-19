package sn.uasz.campusconnect.feed;

import java.time.Instant;

public record CommentResponse(String id, String postId, String authorId, String authorName, String content, Instant createdAt) {
    static CommentResponse from(Comment comment) {
        return new CommentResponse(comment.getId(), comment.getPostId(), comment.getAuthorId(),
                comment.getAuthorName(), comment.getContent(), comment.getCreatedAt());
    }
}
