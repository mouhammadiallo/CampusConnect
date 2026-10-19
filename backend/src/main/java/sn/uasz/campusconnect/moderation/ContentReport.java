package sn.uasz.campusconnect.moderation;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("content_reports")
@CompoundIndex(name = "reporter_content_unique", def = "{'reporterId': 1, 'contentType': 1, 'contentId': 1}", unique = true)
public class ContentReport {
    @Id
    private String id;
    private String reporterId;
    private String reporterName;
    private ReportedContentType contentType;
    private String contentId;
    private String contentAuthorId;
    private String contentAuthorName;
    private ReportReason reason;
    private String details;
    @Indexed
    private ReportStatus status = ReportStatus.OPEN;
    private Instant createdAt = Instant.now();
    private String moderatorId;
    private ResolutionAction resolution;
    private String resolutionNote;
    private Instant resolvedAt;

    protected ContentReport() {}

    public ContentReport(String reporterId, String reporterName, ReportedContentType contentType, String contentId,
                         String contentAuthorId, String contentAuthorName, ReportReason reason, String details) {
        this.reporterId = reporterId;
        this.reporterName = reporterName;
        this.contentType = contentType;
        this.contentId = contentId;
        this.contentAuthorId = contentAuthorId;
        this.contentAuthorName = contentAuthorName;
        this.reason = reason;
        this.details = details;
    }

    public String getId() { return id; }
    public String getReporterId() { return reporterId; }
    public String getReporterName() { return reporterName; }
    public ReportedContentType getContentType() { return contentType; }
    public String getContentId() { return contentId; }
    public String getContentAuthorId() { return contentAuthorId; }
    public String getContentAuthorName() { return contentAuthorName; }
    public ReportReason getReason() { return reason; }
    public String getDetails() { return details; }
    public ReportStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public String getModeratorId() { return moderatorId; }
    public ResolutionAction getResolution() { return resolution; }
    public String getResolutionNote() { return resolutionNote; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void resolve(String moderatorId, ResolutionAction resolution, String note) {
        this.moderatorId = moderatorId;
        this.resolution = resolution;
        this.resolutionNote = note;
        this.resolvedAt = Instant.now();
        this.status = resolution == ResolutionAction.DISMISS ? ReportStatus.DISMISSED : ReportStatus.ACTIONED;
    }
}
