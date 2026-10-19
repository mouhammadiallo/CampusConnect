package sn.uasz.campusconnect.classifieds;

import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("campus_classifieds")
public class CampusClassified {
    @Id private String id;
    private String title;
    private String description;
    @Indexed private ClassifiedCategory category;
    private BigDecimal price;
    private String location;
    private String authorId;
    private String authorName;
    @Indexed private ClassifiedStatus status;
    @Indexed private Instant createdAt;

    protected CampusClassified() {}
    public CampusClassified(String title, String description, ClassifiedCategory category, BigDecimal price,
                            String location, String authorId, String authorName) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.price = price;
        this.location = location;
        this.authorId = authorId;
        this.authorName = authorName;
        this.status = ClassifiedStatus.ACTIVE;
        this.createdAt = Instant.now();
    }
    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public ClassifiedCategory getCategory() { return category; }
    public BigDecimal getPrice() { return price; }
    public String getLocation() { return location; }
    public String getAuthorId() { return authorId; }
    public String getAuthorName() { return authorName; }
    public ClassifiedStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public void close() { this.status = ClassifiedStatus.CLOSED; }
}
