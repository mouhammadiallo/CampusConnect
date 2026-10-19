package sn.uasz.campusconnect.resources;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("academic_resources")
public class AcademicResource {
    @Id
    private String id;
    private String title;
    private String description;
    private ResourceType type;
    @Indexed
    private String ufr;
    @Indexed
    private String mention;
    @Indexed
    private String studyLevel;
    private String url;
    private String attachmentId;
    private String authorId;
    private String authorName;
    @Indexed
    private Instant createdAt;

    protected AcademicResource() {}

    public AcademicResource(String title, String description, ResourceType type, String ufr, String mention,
                            String studyLevel, String url, String attachmentId, String authorId, String authorName) {
        this.title = title;
        this.description = description;
        this.type = type;
        this.ufr = ufr;
        this.mention = mention;
        this.studyLevel = studyLevel;
        this.url = url;
        this.attachmentId = attachmentId;
        this.authorId = authorId;
        this.authorName = authorName;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public ResourceType getType() { return type; }
    public String getUfr() { return ufr; }
    public String getMention() { return mention; }
    public String getStudyLevel() { return studyLevel; }
    public String getUrl() { return url; }
    public String getAttachmentId() { return attachmentId; }
    public String getAuthorId() { return authorId; }
    public String getAuthorName() { return authorName; }
    public Instant getCreatedAt() { return createdAt; }
}
