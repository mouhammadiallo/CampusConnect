package sn.uasz.campusconnect.resources;

import java.time.Instant;
import sn.uasz.campusconnect.media.UploadedFileResponse;

public record ResourceResponse(String id, String title, String description, ResourceType type, String ufr,
                               String mention, String studyLevel, String url, UploadedFileResponse attachment, String authorId,
                               String authorName, Instant createdAt) {
    static ResourceResponse from(AcademicResource resource, UploadedFileResponse attachment) {
        return new ResourceResponse(resource.getId(), resource.getTitle(), resource.getDescription(), resource.getType(),
                resource.getUfr(), resource.getMention(), resource.getStudyLevel(), resource.getUrl(), attachment,
                resource.getAuthorId(), resource.getAuthorName(), resource.getCreatedAt());
    }
}
