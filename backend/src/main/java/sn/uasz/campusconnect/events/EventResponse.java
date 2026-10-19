package sn.uasz.campusconnect.events;

import java.time.Instant;

public record EventResponse(String id, String title, String description, String location, Instant startsAt,
                            String authorId, String authorName, Instant createdAt, long attendeesCount, boolean attending) {
    static EventResponse from(CampusEvent event, String userId) {
        return new EventResponse(event.getId(), event.getTitle(), event.getDescription(), event.getLocation(),
                event.getStartsAt(), event.getAuthorId(), event.getAuthorName(), event.getCreatedAt(),
                event.getAttendeeIds().size(), event.getAttendeeIds().contains(userId));
    }
}
