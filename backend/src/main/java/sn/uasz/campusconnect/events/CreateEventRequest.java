package sn.uasz.campusconnect.events;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record CreateEventRequest(
        @NotBlank @Size(max = 160) String title,
        @NotBlank @Size(max = 3000) String description,
        @NotBlank @Size(max = 200) String location,
        @NotNull @Future Instant startsAt) {}
