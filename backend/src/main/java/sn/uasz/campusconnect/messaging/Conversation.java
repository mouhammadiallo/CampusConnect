package sn.uasz.campusconnect.messaging;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("conversations")
public class Conversation {
    @Id private String id;
    private String title;
    private boolean group;
    @Indexed private List<String> participantIds = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;

    protected Conversation() {}
    public Conversation(String title, boolean group, List<String> participantIds) {
        this.title = title;
        this.group = group;
        this.participantIds = new ArrayList<>(participantIds);
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }
    public String getId() { return id; }
    public String getTitle() { return title; }
    public boolean isGroup() { return group; }
    public List<String> getParticipantIds() { return List.copyOf(participantIds); }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void touch(Instant at) { updatedAt = at; }
}
