package sn.uasz.campusconnect.moderation;

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
public class ModerationController {
    private final ModerationService moderationService;

    public ModerationController(ModerationService moderationService) {
        this.moderationService = moderationService;
    }

    @PostMapping("/api/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse report(@Valid @RequestBody CreateReportRequest request, @AuthenticationPrincipal Jwt jwt) {
        return moderationService.createReport(request, jwt);
    }

    @GetMapping("/api/moderation/reports")
    public Page<ReportResponse> reports(@RequestParam(defaultValue = "0") @Min(0) int page,
                                        @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size) {
        return moderationService.listOpenReports(page, size);
    }

    @PostMapping("/api/moderation/reports/{reportId}/resolve")
    public ReportResponse resolve(@PathVariable String reportId, @Valid @RequestBody ResolveReportRequest request,
                                  @AuthenticationPrincipal Jwt jwt) {
        return moderationService.resolve(reportId, request, jwt);
    }
}
