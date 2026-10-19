package sn.uasz.campusconnect.quizzes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("campus_quizzes")
public class CampusQuiz {
    @Id private String id;
    private String question;
    private List<String> options = new ArrayList<>();
    private String correctOptionId;
    private String explanation;
    private String authorId;
    private String authorName;
    @Indexed private Instant createdAt;
    private Map<String, String> answers = new LinkedHashMap<>();

    protected CampusQuiz() {}

    public CampusQuiz(String question, List<String> options, String correctOptionId, String explanation,
                      String authorId, String authorName) {
        this.question = question;
        this.options = new ArrayList<>(options);
        this.correctOptionId = correctOptionId;
        this.explanation = explanation;
        this.authorId = authorId;
        this.authorName = authorName;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getQuestion() { return question; }
    public List<String> getOptions() { return List.copyOf(options); }
    public String getCorrectOptionId() { return correctOptionId; }
    public String getExplanation() { return explanation; }
    public String getAuthorId() { return authorId; }
    public String getAuthorName() { return authorName; }
    public Instant getCreatedAt() { return createdAt; }
    public Map<String, String> getAnswers() { return answers == null ? Map.of() : Map.copyOf(answers); }
    public void addAnswer(String userId, String optionId) {
        if (answers == null) answers = new LinkedHashMap<>();
        answers.put(userId, optionId);
    }
}
