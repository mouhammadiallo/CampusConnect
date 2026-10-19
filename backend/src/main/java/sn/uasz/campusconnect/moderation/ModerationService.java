package sn.uasz.campusconnect.moderation;

import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import sn.uasz.campusconnect.classifieds.ClassifiedRepository;
import sn.uasz.campusconnect.events.CampusEventRepository;
import sn.uasz.campusconnect.feed.CommentRepository;
import sn.uasz.campusconnect.feed.PostRepository;
import sn.uasz.campusconnect.identity.CampusUser;
import sn.uasz.campusconnect.identity.CampusUserRepository;
import sn.uasz.campusconnect.resources.ResourceRepository;

@Service
public class ModerationService {
    private final ReportRepository reports;
    private final SanctionRepository sanctions;
    private final CampusUserRepository users;
    private final PostRepository posts;
    private final CommentRepository comments;
    private final ResourceRepository resources;
    private final CampusEventRepository events;
    private final ClassifiedRepository classifieds;

    public ModerationService(ReportRepository reports, SanctionRepository sanctions, CampusUserRepository users,
                             PostRepository posts, CommentRepository comments, ResourceRepository resources,
                             CampusEventRepository events, ClassifiedRepository classifieds) {
        this.reports = reports;
        this.sanctions = sanctions;
        this.users = users;
        this.posts = posts;
        this.comments = comments;
        this.resources = resources;
        this.events = events;
        this.classifieds = classifieds;
    }

    public ReportResponse createReport(CreateReportRequest request, Jwt jwt) {
        CampusUser reporter = currentUser(jwt.getSubject());
        ContentOwner owner = findContentOwner(request.contentType(), request.contentId());
        if (owner.id().equals(reporter.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot report your own content");
        }
        if (reports.existsByReporterIdAndContentTypeAndContentId(reporter.getId(), request.contentType(), request.contentId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already reported this content");
        }
        ContentReport report = reports.save(new ContentReport(reporter.getId(), reporter.getFullName(),
                request.contentType(), request.contentId(), owner.id(), owner.name(), request.reason(), clean(request.details())));
        return ReportResponse.from(report);
    }

    public Page<ReportResponse> listOpenReports(int page, int size) {
        return reports.findByStatusOrderByCreatedAtAsc(ReportStatus.OPEN, PageRequest.of(page, size))
                .map(ReportResponse::from);
    }

    public ReportResponse resolve(String reportId, ResolveReportRequest request, Jwt jwt) {
        ContentReport report = reports.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        if (report.getStatus() != ReportStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Report has already been resolved");
        }

        if (request.action() != ResolutionAction.DISMISS) {
            CampusUser target = currentUser(report.getContentAuthorId());
            Instant expiresAt = null;
            SanctionType sanctionType;
            if (request.action() == ResolutionAction.SUSPEND) {
                if (request.suspensionHours() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a suspension duration in hours");
                }
                expiresAt = Instant.now().plusSeconds(request.suspensionHours() * 3600L);
                target.suspendUntil(expiresAt);
                sanctionType = SanctionType.SUSPENSION;
                users.save(target);
            } else {
                sanctionType = SanctionType.WARNING;
            }
            sanctions.save(new UserSanction(target.getId(), jwt.getSubject(), report.getId(), sanctionType,
                    clean(request.note()), expiresAt));
        }

        report.resolve(jwt.getSubject(), request.action(), clean(request.note()));
        return ReportResponse.from(reports.save(report));
    }

    private ContentOwner findContentOwner(ReportedContentType type, String id) {
        var owner = switch (type) {
            case POST -> posts.findById(id).map(post -> new ContentOwner(post.getAuthorId(), post.getAuthorName()));
            case COMMENT -> comments.findById(id).map(comment -> new ContentOwner(comment.getAuthorId(), comment.getAuthorName()));
            case RESOURCE -> resources.findById(id).map(resource -> new ContentOwner(resource.getAuthorId(), resource.getAuthorName()));
            case EVENT -> events.findById(id).map(event -> new ContentOwner(event.getAuthorId(), event.getAuthorName()));
            case CLASSIFIED -> classifieds.findById(id).map(classified -> new ContentOwner(classified.getAuthorId(), classified.getAuthorName()));
        };
        return owner.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Content not found"));
    }

    private CampusUser currentUser(String userId) {
        return users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record ContentOwner(String id, String name) {}
}
