package sn.uasz.campusconnect.moderation;

import java.time.Instant;

public record ReportResponse(String id, String reporterId, String reporterName, ReportedContentType contentType,
                             String contentId, String contentAuthorId, String contentAuthorName,
                             ReportReason reason, String details, ReportStatus status, Instant createdAt,
                             ResolutionAction resolution, String resolutionNote, Instant resolvedAt) {
    static ReportResponse from(ContentReport report) {
        return new ReportResponse(report.getId(), report.getReporterId(), report.getReporterName(), report.getContentType(),
                report.getContentId(), report.getContentAuthorId(), report.getContentAuthorName(), report.getReason(),
                report.getDetails(), report.getStatus(), report.getCreatedAt(), report.getResolution(),
                report.getResolutionNote(), report.getResolvedAt());
    }
}
