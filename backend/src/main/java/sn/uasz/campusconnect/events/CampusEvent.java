package sn.uasz.campusconnect.events;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("campus_events")
public class CampusEvent {
    @Id
    private String id;
    private String title;
    private String description;
    private String location;
    @Indexed
    private Instant startsAt;
    private String authorId;
    private String authorName;
    private Instant createdAt;
    private Set<String> attendeeIds = new HashSet<>();

    protected CampusEvent() {}

    public CampusEvent(String title, String description, String location, Instant startsAt, String authorId, String authorName) {
        this.title = title;
        this.description = description;
        this.location = location;
        this.startsAt = startsAt;
        this.authorId = authorId;
        this.authorName = authorName;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public Instant getStartsAt() { return startsAt; }
    public String getAuthorId() { return authorId; }
    public String getAuthorName() { return authorName; }
    public Instant getCreatedAt() { return createdAt; }
    public Set<String> getAttendeeIds() { return attendeeIds; }
}
