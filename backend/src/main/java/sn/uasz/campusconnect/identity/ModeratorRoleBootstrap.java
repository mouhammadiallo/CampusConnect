package sn.uasz.campusconnect.identity;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ModeratorRoleBootstrap implements CommandLineRunner {
    private final CampusUserRepository users;
    private final String moderatorEmails;
    private final String adminEmails;

    public ModeratorRoleBootstrap(CampusUserRepository users,
                                  @Value("${app.security.moderator-emails:}") String moderatorEmails,
                                  @Value("${app.security.admin-emails:}") String adminEmails) {
        this.users = users;
        this.moderatorEmails = moderatorEmails;
        this.adminEmails = adminEmails;
    }

    @Override
    public void run(String... args) {
        Map<String, UserRole> configuredRoles = emails(moderatorEmails).stream()
                .collect(Collectors.toMap(Function.identity(), email -> UserRole.MODERATOR, (first, second) -> first));
        emails(adminEmails).forEach(email -> configuredRoles.put(email, UserRole.ADMIN));
        if (configuredRoles.isEmpty()) return;

        List<CampusUser> configuredUsers = users.findByEmailIn(configuredRoles.keySet());
        for (CampusUser user : configuredUsers) {
            UserRole configuredRole = configuredRoles.get(user.getEmail());
            if (configuredRole != null && user.getRole() != configuredRole) {
                user.setRole(configuredRole);
                users.save(user);
            }
        }
    }

    private static List<String> emails(String raw) {
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(email -> !email.isEmpty())
                .map(email -> email.toLowerCase(Locale.ROOT))
                .toList();
    }
}
