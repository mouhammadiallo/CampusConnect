package sn.uasz.campusconnect.classifieds;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/classifieds")
public class ClassifiedController {
    private final ClassifiedService service;
    public ClassifiedController(ClassifiedService service) { this.service = service; }

    @GetMapping
    public Page<ClassifiedResponse> search(@RequestParam(required = false) String q,
                                           @RequestParam(required = false) ClassifiedCategory category,
                                           @RequestParam(defaultValue = "0") @Min(0) int page,
                                           @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.search(q, category, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClassifiedResponse create(@Valid @RequestBody CreateClassifiedRequest request, @AuthenticationPrincipal Jwt jwt) {
        return service.create(request, jwt);
    }

    @PostMapping("/{id}/close")
    public ClassifiedResponse close(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) { return service.close(id, jwt); }
}
