package sn.uasz.campusconnect.classifieds;

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

@Service
public class ClassifiedService {
    private final ClassifiedRepository classifieds;
    private final CampusUserRepository users;
    private final MongoTemplate mongoTemplate;

    public ClassifiedService(ClassifiedRepository classifieds, CampusUserRepository users, MongoTemplate mongoTemplate) {
        this.classifieds = classifieds;
        this.users = users;
        this.mongoTemplate = mongoTemplate;
    }

    public Page<ClassifiedResponse> search(String q, ClassifiedCategory category, int page, int size) {
        List<Criteria> filters = new ArrayList<>();
        filters.add(Criteria.where("status").is(ClassifiedStatus.ACTIVE));
        if (category != null) filters.add(Criteria.where("category").is(category));
        if (q != null && !q.isBlank()) {
            String term = Pattern.quote(q.trim());
            filters.add(new Criteria().orOperator(Criteria.where("title").regex(term, "i"),
                    Criteria.where("description").regex(term, "i"), Criteria.where("location").regex(term, "i")));
        }
        Criteria criteria = new Criteria().andOperator(filters.toArray(Criteria[]::new));
        Query pageQuery = new Query(criteria);
        Query countQuery = new Query(criteria);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<ClassifiedResponse> found = mongoTemplate.find(pageQuery.with(pageable), CampusClassified.class)
                .stream().map(ClassifiedResponse::from).toList();
        long total = mongoTemplate.count(countQuery, CampusClassified.class);
        return new PageImpl<>(found, pageable, total);
    }

    public ClassifiedResponse create(CreateClassifiedRequest request, Jwt jwt) {
        if (request.price() != null && request.category() != ClassifiedCategory.SALE && request.category() != ClassifiedCategory.HOUSING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A price is only supported for sales and housing listings");
        }
        CampusUser author = users.findById(jwt.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
        var created = classifieds.save(new CampusClassified(request.title().trim(), request.description().trim(),
                request.category(), request.price(), clean(request.location()), author.getId(), author.getFullName()));
        return ClassifiedResponse.from(created);
    }

    public ClassifiedResponse close(String id, Jwt jwt) {
        CampusClassified classified = classifieds.findByIdAndAuthorId(id, jwt.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classified not found"));
        classified.close();
        return ClassifiedResponse.from(classifieds.save(classified));
    }

    private static String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
