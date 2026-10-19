package sn.uasz.campusconnect.quizzes;

import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import sn.uasz.campusconnect.identity.CampusUser;
import sn.uasz.campusconnect.identity.CampusUserRepository;

@Service
public class QuizService {
    private final CampusQuizRepository quizzes;
    private final CampusUserRepository users;

    public QuizService(CampusQuizRepository quizzes, CampusUserRepository users) {
        this.quizzes = quizzes;
        this.users = users;
    }

    public List<QuizResponse> list(int page, int size, Jwt jwt) {
        String userId = jwt.getSubject();
        return quizzes.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .stream().map(quiz -> QuizResponse.from(quiz, userId)).toList();
    }

    public QuizResponse create(CreateQuizRequest request, Jwt jwt) {
        CampusUser author = currentUser(jwt);
        List<String> options = request.options().stream().map(String::trim).toList();
        if (options.stream().map(value -> value.toLowerCase(Locale.ROOT)).distinct().count() != options.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz options must be unique");
        }
        int correctIndex = Integer.parseInt(request.correctOptionId());
        if (correctIndex >= options.size()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Correct answer must match one of the options");
        CampusQuiz quiz = quizzes.save(new CampusQuiz(request.question().trim(), options, request.correctOptionId(),
                clean(request.explanation()), author.getId(), author.getFullName()));
        return QuizResponse.from(quiz, author.getId());
    }

    public QuizResponse answer(String quizId, AnswerQuizRequest request, Jwt jwt) {
        CampusQuiz quiz = quizzes.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));
        String userId = currentUser(jwt).getId();
        if (quiz.getAnswers().containsKey(userId)) throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already answered this quiz");
        int optionIndex = Integer.parseInt(request.optionId());
        if (optionIndex >= quiz.getOptions().size()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid quiz option");
        quiz.addAnswer(userId, request.optionId());
        return QuizResponse.from(quizzes.save(quiz), userId);
    }

    private CampusUser currentUser(Jwt jwt) {
        return users.findById(jwt.getSubject()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
    }

    private static String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
