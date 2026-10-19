package sn.uasz.campusconnect.feed;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePostRequest(
        @NotBlank @Size(max = 3000) String content,
        @Size(max = 1000) String mediaUrl,
        @Size(max = 36) String attachmentId) {}
