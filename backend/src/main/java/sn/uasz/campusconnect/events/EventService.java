package sn.uasz.campusconnect.events;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import sn.uasz.campusconnect.identity.CampusUser;
import sn.uasz.campusconnect.identity.CampusUserRepository;

@Service
public class EventService {
    private final CampusEventRepository events;
    private final CampusUserRepository users;

    public EventService(CampusEventRepository events, CampusUserRepository users) {
        this.events = events;
        this.users = users;
    }

    public EventResponse create(CreateEventRequest request, Jwt jwt) {
        CampusUser author = currentUser(jwt);
        CampusEvent event = events.save(new CampusEvent(request.title().trim(), request.description().trim(),
                request.location().trim(), request.startsAt(), author.getId(), author.getFullName()));
        return EventResponse.from(event, author.getId());
    }

    public List<EventResponse> upcoming(int page, int size, Jwt jwt) {
        String userId = jwt.getSubject();
        return events.findByStartsAtAfterOrderByStartsAtAsc(Instant.now(), PageRequest.of(page, size))
                .stream().map(event -> EventResponse.from(event, userId)).toList();
    }

    public EventResponse rsvp(String eventId, Jwt jwt, boolean attending) {
        CampusEvent event = findEvent(eventId);
        String userId = currentUser(jwt).getId();
        if (attending) event.getAttendeeIds().add(userId);
        else event.getAttendeeIds().remove(userId);
        return EventResponse.from(events.save(event), userId);
    }

    private CampusUser currentUser(Jwt jwt) {
        return users.findById(jwt.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
    }

    private CampusEvent findEvent(String eventId) {
        return events.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
    }
}
