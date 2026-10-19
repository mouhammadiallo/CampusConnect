package sn.uasz.campusconnect.identity;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IdentityService {
    private final CampusUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final long tokenLifetimeMinutes;

    public IdentityService(CampusUserRepository users, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder,
                           @Value("${app.security.jwt.expiration-minutes:720}") long tokenLifetimeMinutes) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.tokenLifetimeMinutes = tokenLifetimeMinutes;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        CampusUser user = users.save(new CampusUser(email, request.fullName().trim(),
                passwordEncoder.encode(request.password()), clean(request.department()), clean(request.studyLevel())));
        return issueToken(user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        CampusUser user = users.findByEmail(email)
                .filter(candidate -> !candidate.isCurrentlySuspended(Instant.now()))
                .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return issueToken(user);
    }

    private AuthResponse issueToken(CampusUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(tokenLifetimeMinutes, ChronoUnit.MINUTES);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("campusconnect-api")
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("roles", user.getRole().name())
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new AuthResponse(token, "Bearer", expiresAt,
                new AuthResponse.UserProfile(user.getId(), user.getEmail(), user.getFullName(),
                        user.getDepartment(), user.getStudyLevel(), user.getRole(), user.getBio(),
                        user.getAvatarUrl(), null, user.getSkills(), user.getSocialLinks()));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
