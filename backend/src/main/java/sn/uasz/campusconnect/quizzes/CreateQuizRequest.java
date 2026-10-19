package sn.uasz.campusconnect.quizzes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateQuizRequest(
        @NotBlank @Size(max = 240) String question,
        @NotEmpty @Size(min = 2, max = 6) List<@NotBlank @Size(max = 100) String> options,
        @NotBlank @Pattern(regexp = "[0-5]") String correctOptionId,
        @Size(max = 500) String explanation) {}
