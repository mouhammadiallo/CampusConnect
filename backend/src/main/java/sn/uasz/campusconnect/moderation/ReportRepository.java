package sn.uasz.campusconnect.moderation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import sn.uasz.campusconnect.moderation.ReportedContentType;

public interface ReportRepository extends MongoRepository<ContentReport, String> {
    Page<ContentReport> findByStatusOrderByCreatedAtAsc(ReportStatus status, Pageable pageable);
    boolean existsByReporterIdAndContentTypeAndContentId(String reporterId, ReportedContentType contentType, String contentId);
}
