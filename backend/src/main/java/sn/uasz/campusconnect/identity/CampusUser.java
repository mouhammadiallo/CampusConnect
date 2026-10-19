package sn.uasz.campusconnect.identity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("users")
public class CampusUser {
    @Id
    private String id;
    @Indexed(unique = true)
    private String email;
    private String fullName;
    private String passwordHash;
    private String department;
    private String studyLevel;
    private String bio;
    private String avatarUrl;
    private String avatarAttachmentId;
    private List<String> skills = new ArrayList<>();
    private Map<String, String> socialLinks = new LinkedHashMap<>();
    private UserRole role;
    private AccountStatus status = AccountStatus.ACTIVE;
    private Instant suspendedUntil;
    private Instant createdAt;

    protected CampusUser() {}

    public CampusUser(String email, String fullName, String passwordHash, String department, String studyLevel) {
        this.email = email;
        this.fullName = fullName;
        this.passwordHash = passwordHash;
        this.department = department;
        this.studyLevel = studyLevel;
        this.role = UserRole.STUDENT;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getPasswordHash() { return passwordHash; }
    public String getDepartment() { return department; }
    public String getStudyLevel() { return studyLevel; }
    public String getBio() { return bio; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getAvatarAttachmentId() { return avatarAttachmentId; }
    public List<String> getSkills() { return skills == null ? List.of() : List.copyOf(skills); }
    public Map<String, String> getSocialLinks() { return socialLinks == null ? Map.of() : Map.copyOf(socialLinks); }
    public UserRole getRole() { return role; }
    public Instant getCreatedAt() { return createdAt; }
    public AccountStatus getStatus() { return status; }
    public Instant getSuspendedUntil() { return suspendedUntil; }
    public void setRole(UserRole role) { this.role = role; }
    public void updateProfile(String fullName, String department, String studyLevel, String bio,
                              String avatarUrl, String avatarAttachmentId, List<String> skills, Map<String, String> socialLinks) {
        this.fullName = fullName;
        this.department = department;
        this.studyLevel = studyLevel;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
        this.avatarAttachmentId = avatarAttachmentId;
        this.skills = new ArrayList<>(skills);
        this.socialLinks = new LinkedHashMap<>(socialLinks);
    }
    public void suspendUntil(Instant until) { this.status = AccountStatus.SUSPENDED; this.suspendedUntil = until; }
    public boolean isCurrentlySuspended(Instant now) {
        return status == AccountStatus.SUSPENDED && (suspendedUntil == null || suspendedUntil.isAfter(now));
    }
}
