package sn.uasz.campusconnect.resources;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateResourceRequest(
        @NotBlank @Size(max = 160) String title,
        @Size(max = 2000) String description,
        @NotNull ResourceType type,
        @NotBlank @Size(max = 120) String ufr,
        @NotBlank @Size(max = 120) String mention,
        @NotBlank @Size(max = 80) String studyLevel,
        @Size(max = 1500) String url,
        @Size(max = 36) String attachmentId) {}
