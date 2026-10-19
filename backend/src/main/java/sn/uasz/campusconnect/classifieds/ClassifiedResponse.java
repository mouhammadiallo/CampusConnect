package sn.uasz.campusconnect.classifieds;

import java.math.BigDecimal;
import java.time.Instant;

public record ClassifiedResponse(String id, String title, String description, ClassifiedCategory category,
                                 BigDecimal price, String location, String authorId, String authorName,
                                 ClassifiedStatus status, Instant createdAt) {
    static ClassifiedResponse from(CampusClassified classified) {
        return new ClassifiedResponse(classified.getId(), classified.getTitle(), classified.getDescription(),
                classified.getCategory(), classified.getPrice(), classified.getLocation(), classified.getAuthorId(),
                classified.getAuthorName(), classified.getStatus(), classified.getCreatedAt());
    }
}
