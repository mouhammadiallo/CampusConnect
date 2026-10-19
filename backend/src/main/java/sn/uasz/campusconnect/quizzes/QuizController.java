package sn.uasz.campusconnect.quizzes;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/quizzes")
public class QuizController {
    private final QuizService quizzes;

    public QuizController(QuizService quizzes) { this.quizzes = quizzes; }

    @GetMapping
    public List<QuizResponse> list(@RequestParam(defaultValue = "0") @Min(0) int page,
                                   @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size,
                                   @AuthenticationPrincipal Jwt jwt) {
        return quizzes.list(page, size, jwt);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuizResponse create(@Valid @RequestBody CreateQuizRequest request, @AuthenticationPrincipal Jwt jwt) {
        return quizzes.create(request, jwt);
    }

    @PostMapping("/{quizId}/answers")
    public QuizResponse answer(@PathVariable String quizId, @Valid @RequestBody AnswerQuizRequest request,
                               @AuthenticationPrincipal Jwt jwt) {
        return quizzes.answer(quizId, request, jwt);
    }
}
