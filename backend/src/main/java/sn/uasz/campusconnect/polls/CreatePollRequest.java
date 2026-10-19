package sn.uasz.campusconnect.polls;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreatePollRequest(
        @NotBlank @Size(max = 240) String question,
        @NotEmpty @Size(min = 2, max = 6) List<@NotBlank @Size(max = 100) String> options) {}
