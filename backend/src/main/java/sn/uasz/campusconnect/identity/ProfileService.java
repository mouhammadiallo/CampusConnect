package sn.uasz.campusconnect.identity;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import sn.uasz.campusconnect.media.MediaService;
import sn.uasz.campusconnect.media.UploadedFileResponse;

@Service
public class ProfileService {
    private static final List<String> LINK_KEYS = List.of("website", "linkedin", "github", "instagram");
    private final CampusUserRepository users;
    private final MediaService media;

    public ProfileService(CampusUserRepository users, MediaService media) {
        this.users = users;
        this.media = media;
    }

    public AuthResponse.UserProfile get(Jwt jwt) { return profile(currentUser(jwt)); }

    public List<PublicProfileResponse> search(String query, Jwt jwt) {
        if (query == null || query.trim().length() < 2) return List.of();
        return users.findByFullNameContainingIgnoreCase(query.trim(), PageRequest.of(0, 30, Sort.by("fullName").ascending())).stream()
                .filter(user -> !user.getId().equals(jwt.getSubject()))
                .filter(user -> !user.isCurrentlySuspended(java.time.Instant.now()))
                .map(this::publicProfile).toList();
    }

    public PublicProfileResponse getPublic(String id) {
        CampusUser user = users.findById(id).filter(candidate -> !candidate.isCurrentlySuspended(java.time.Instant.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        return publicProfile(user);
    }

    public AuthResponse.UserProfile update(UpdateProfileRequest request, Jwt jwt) {
        CampusUser user = currentUser(jwt);
        List<String> skills = request.skills() == null ? List.of() : request.skills().stream()
                .filter(value -> value != null && !value.isBlank()).map(String::trim).distinct().limit(10).toList();
        Map<String, String> links = new LinkedHashMap<>();
        if (request.socialLinks() != null) {
            request.socialLinks().forEach((key, value) -> {
                if (!LINK_KEYS.contains(key)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported social link");
                String clean = clean(value);
                if (clean != null) links.put(key, validWebUrl(clean));
            });
        }
        String avatarUrl = clean(request.avatarUrl());
        String avatarAttachmentId = clean(request.avatarAttachmentId());
        if (avatarUrl != null && avatarAttachmentId != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a photo URL or an uploaded photo, not both");
        }
        if (avatarAttachmentId != null) {
            if (!media.find(avatarAttachmentId).getContentType().startsWith("image/")) {
                throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Profile photos must be JPEG or PNG images");
            }
            media.requireOwner(avatarAttachmentId, user.getId());
        }
        user.updateProfile(request.fullName().trim(), clean(request.department()), clean(request.studyLevel()),
                clean(request.bio()), avatarUrl == null ? null : validWebUrl(avatarUrl), avatarAttachmentId, skills, links);
        return profile(users.save(user));
    }

    private CampusUser currentUser(Jwt jwt) {
        return users.findById(jwt.getSubject()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private AuthResponse.UserProfile profile(CampusUser user) {
        return new AuthResponse.UserProfile(user.getId(), user.getEmail(), user.getFullName(), user.getDepartment(),
                user.getStudyLevel(), user.getRole(), user.getBio(), user.getAvatarUrl(), avatarAttachment(user), user.getSkills(), user.getSocialLinks());
    }

    private PublicProfileResponse publicProfile(CampusUser user) {
        return new PublicProfileResponse(user.getId(), user.getFullName(), user.getDepartment(), user.getStudyLevel(),
                user.getBio(), user.getAvatarUrl(), avatarAttachment(user), user.getSkills(), user.getSocialLinks());
    }

    private UploadedFileResponse avatarAttachment(CampusUser user) {
        return user.getAvatarAttachmentId() == null ? null : media.describe(user.getAvatarAttachmentId());
    }

    private static String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private static String validWebUrl(String value) {
        try {
            URI uri = URI.create(value);
            String scheme = uri.getScheme();
            if (uri.getHost() == null || scheme == null || !(scheme.toLowerCase(Locale.ROOT).equals("http") || scheme.toLowerCase(Locale.ROOT).equals("https"))) throw new IllegalArgumentException();
            return uri.toASCIIString();
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URLs must use HTTP or HTTPS");
        }
    }
}
