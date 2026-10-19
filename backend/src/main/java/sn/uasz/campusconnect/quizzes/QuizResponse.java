package sn.uasz.campusconnect.quizzes;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record QuizResponse(String id, String question, List<QuizOption> options, String authorId,
                           String authorName, Instant createdAt, int attempts, String myAnswer,
                           Boolean myCorrect, String correctOptionId, String explanation) {
    public record QuizOption(String id, String text) {}

    static QuizResponse from(CampusQuiz quiz, String userId) {
        Map<String, String> answers = quiz.getAnswers();
        String answer = answers.get(userId);
        boolean answered = answer != null;
        List<QuizOption> options = java.util.stream.IntStream.range(0, quiz.getOptions().size())
                .mapToObj(index -> new QuizOption(Integer.toString(index), quiz.getOptions().get(index))).toList();
        return new QuizResponse(quiz.getId(), quiz.getQuestion(), options, quiz.getAuthorId(), quiz.getAuthorName(),
                quiz.getCreatedAt(), answers.size(), answer,
                answered ? quiz.getCorrectOptionId().equals(answer) : null,
                answered ? quiz.getCorrectOptionId() : null, answered ? quiz.getExplanation() : null);
    }
}
