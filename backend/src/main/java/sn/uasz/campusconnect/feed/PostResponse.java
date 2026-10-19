package sn.uasz.campusconnect.feed;

import java.time.Instant;
import sn.uasz.campusconnect.media.UploadedFileResponse;

public record PostResponse(String id, String authorId, String authorName, String content, String mediaUrl,
                           UploadedFileResponse attachment, Instant createdAt, long likesCount, long commentsCount,
                           boolean likedByCurrentUser) {
    static PostResponse from(Post post, UploadedFileResponse attachment, boolean likedByCurrentUser) {
        return new PostResponse(post.getId(), post.getAuthorId(), post.getAuthorName(), post.getContent(),
                post.getMediaUrl(), attachment, post.getCreatedAt(), post.getLikesCount(), post.getCommentsCount(), likedByCurrentUser);
    }
}
