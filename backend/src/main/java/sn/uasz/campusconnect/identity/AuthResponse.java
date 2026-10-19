package sn.uasz.campusconnect.identity;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import sn.uasz.campusconnect.media.UploadedFileResponse;

public record AuthResponse(String accessToken, String tokenType, Instant expiresAt, UserProfile user) {
    public record UserProfile(String id, String email, String fullName, String department, String studyLevel,
                              UserRole role, String bio, String avatarUrl, UploadedFileResponse avatarAttachment, List<String> skills,
                              Map<String, String> socialLinks) {}
}
