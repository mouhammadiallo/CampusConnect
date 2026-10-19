package sn.uasz.campusconnect.polls;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("campus_polls")
public class CampusPoll {
    @Id private String id;
    private String question;
    private List<String> options = new ArrayList<>();
    private String authorId;
    private String authorName;
    @Indexed private Instant createdAt;
    private boolean closed;
    private Map<String, String> votes = new LinkedHashMap<>();

    protected CampusPoll() {}

    public CampusPoll(String question, List<String> options, String authorId, String authorName) {
        this.question = question;
        this.options = new ArrayList<>(options);
        this.authorId = authorId;
        this.authorName = authorName;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getQuestion() { return question; }
    public List<String> getOptions() { return List.copyOf(options); }
    public String getAuthorId() { return authorId; }
    public String getAuthorName() { return authorName; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean isClosed() { return closed; }
    public Map<String, String> getVotes() { return votes == null ? Map.of() : Map.copyOf(votes); }
    public void addVote(String userId, String optionId) {
        if (votes == null) votes = new LinkedHashMap<>();
        votes.put(userId, optionId);
    }
    public void close() { closed = true; }
}
