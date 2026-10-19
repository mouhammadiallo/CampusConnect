package sn.uasz.campusconnect.quizzes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AnswerQuizRequest(@NotBlank @Pattern(regexp = "[0-5]") String optionId) {}
