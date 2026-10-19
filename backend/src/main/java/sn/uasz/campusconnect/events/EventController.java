package sn.uasz.campusconnect.events;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/events")
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<EventResponse> upcoming(@RequestParam(defaultValue = "0") @Min(0) int page,
                                        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
                                        @AuthenticationPrincipal Jwt jwt) {
        return eventService.upcoming(page, size, jwt);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse create(@Valid @RequestBody CreateEventRequest request, @AuthenticationPrincipal Jwt jwt) {
        return eventService.create(request, jwt);
    }

    @PostMapping("/{eventId}/rsvp")
    public EventResponse rsvp(@PathVariable String eventId, @AuthenticationPrincipal Jwt jwt) {
        return eventService.rsvp(eventId, jwt, true);
    }

    @DeleteMapping("/{eventId}/rsvp")
    public EventResponse cancelRsvp(@PathVariable String eventId, @AuthenticationPrincipal Jwt jwt) {
        return eventService.rsvp(eventId, jwt, false);
    }
}
