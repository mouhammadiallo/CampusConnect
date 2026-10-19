package sn.uasz.campusconnect.polls;

import jakarta.validation.constraints.NotBlank;

public record VotePollRequest(@NotBlank String optionId) {}
