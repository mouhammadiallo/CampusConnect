package sn.uasz.campusconnect.identity;

import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profiles")
public class DirectoryController {
    private final ProfileService profiles;

    public DirectoryController(ProfileService profiles) { this.profiles = profiles; }

    @GetMapping
    public List<PublicProfileResponse> search(@RequestParam(defaultValue = "") String q,
                                              @AuthenticationPrincipal Jwt jwt) {
        return profiles.search(q, jwt);
    }

    @GetMapping("/{id}")
    public PublicProfileResponse get(@PathVariable String id) { return profiles.getPublic(id); }
}
