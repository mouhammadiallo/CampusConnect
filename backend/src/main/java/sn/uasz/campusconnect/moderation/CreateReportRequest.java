package sn.uasz.campusconnect.moderation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReportRequest(
        @NotNull ReportedContentType contentType,
        @NotBlank @Size(max = 100) String contentId,
        @NotNull ReportReason reason,
        @Size(max = 1000) String details) {}
