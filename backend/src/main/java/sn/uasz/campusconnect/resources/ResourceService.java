package sn.uasz.campusconnect.resources;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import sn.uasz.campusconnect.identity.CampusUser;
import sn.uasz.campusconnect.identity.CampusUserRepository;
import sn.uasz.campusconnect.media.MediaService;
import sn.uasz.campusconnect.media.UploadedFileResponse;

@Service
public class ResourceService {
    private final ResourceRepository resources;
    private final CampusUserRepository users;
    private final MongoTemplate mongoTemplate;
    private final MediaService media;

    public ResourceService(ResourceRepository resources, CampusUserRepository users, MongoTemplate mongoTemplate, MediaService media) {
        this.resources = resources;
        this.users = users;
        this.mongoTemplate = mongoTemplate;
        this.media = media;
    }

    public ResourceResponse create(CreateResourceRequest request, Jwt jwt) {
        String url = clean(request.url());
        String attachmentId = clean(request.attachmentId());
        if ((url == null) == (attachmentId == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide either a web link or an uploaded PDF");
        }
        if (url != null) {
            try {
                URI parsed = URI.create(url);
                String scheme = parsed.getScheme();
                if (parsed.getHost() == null || scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                    throw new IllegalArgumentException("URL must be an absolute HTTP or HTTPS link");
                }
            } catch (IllegalArgumentException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL must be a valid HTTP or HTTPS link");
            }
        }

        CampusUser author = users.findById(jwt.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
        media.requireOwner(attachmentId, author.getId());
        AcademicResource resource = resources.save(new AcademicResource(request.title().trim(), clean(request.description()),
                request.type(), request.ufr().trim(), request.mention().trim(), request.studyLevel().trim(), url, attachmentId,
                author.getId(), author.getFullName()));
        return response(resource);
    }

    public void delete(String resourceId, Jwt jwt) {
        AcademicResource resource = resources.findById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
        if (!resource.getAuthorId().equals(jwt.getSubject())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the author can delete this resource");
        }
        resources.delete(resource);
    }

    public Page<ResourceResponse> search(String q, String ufr, String mention, String studyLevel, int page, int size) {
        List<Criteria> filters = new ArrayList<>();
        if (notBlank(q)) {
            String term = Pattern.quote(q.trim());
            filters.add(new Criteria().orOperator(Criteria.where("title").regex(term, "i"),
                    Criteria.where("description").regex(term, "i")));
        }
        addExactFilter(filters, "ufr", ufr);
        addExactFilter(filters, "mention", mention);
        addExactFilter(filters, "studyLevel", studyLevel);
        Criteria criteria = filters.isEmpty() ? null : new Criteria().andOperator(filters.toArray(Criteria[]::new));

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Query pageQuery = new Query();
        Query countQuery = new Query();
        if (criteria != null) {
            pageQuery.addCriteria(criteria);
            countQuery.addCriteria(criteria);
        }
        List<AcademicResource> found = mongoTemplate.find(pageQuery.with(pageable), AcademicResource.class);
        long total = mongoTemplate.count(countQuery, AcademicResource.class);
        return new PageImpl<>(found.stream().map(this::response).toList(), pageable, total);
    }

    private ResourceResponse response(AcademicResource resource) {
        UploadedFileResponse attachment = media.describe(resource.getAttachmentId());
        return ResourceResponse.from(resource, attachment);
    }

    private static void addExactFilter(List<Criteria> filters, String field, String value) {
        if (notBlank(value)) filters.add(Criteria.where(field).regex("^" + Pattern.quote(value.trim()) + "$", "i"));
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
