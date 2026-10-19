package sn.uasz.campusconnect.identity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) String fullName,
        @Size(max = 120) String department,
        @Size(max = 80) String studyLevel,
        @Size(max = 500) String bio,
        @Size(max = 500) String avatarUrl,
        @Size(max = 36) String avatarAttachmentId,
        @Size(max = 10) List<@Size(max = 50) String> skills,
        Map<String, String> socialLinks) {}
