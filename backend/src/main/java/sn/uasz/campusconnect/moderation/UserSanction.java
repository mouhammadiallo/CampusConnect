package sn.uasz.campusconnect.moderation;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("user_sanctions")
public class UserSanction {
    @Id
    private String id;
    @Indexed
    private String userId;
    private String moderatorId;
    private String reportId;
    private SanctionType type;
    private String note;
    private Instant issuedAt = Instant.now();
    private Instant expiresAt;

    protected UserSanction() {}

    public UserSanction(String userId, String moderatorId, String reportId, SanctionType type, String note, Instant expiresAt) {
        this.userId = userId;
        this.moderatorId = moderatorId;
        this.reportId = reportId;
        this.type = type;
        this.note = note;
        this.expiresAt = expiresAt;
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getModeratorId() { return moderatorId; }
    public String getReportId() { return reportId; }
    public SanctionType getType() { return type; }
    public String getNote() { return note; }
    public Instant getIssuedAt() { return issuedAt; }
    public Instant getExpiresAt() { return expiresAt; }
}
