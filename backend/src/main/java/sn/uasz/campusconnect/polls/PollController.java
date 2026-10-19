package sn.uasz.campusconnect.polls;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
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
@RequestMapping("/api/polls")
public class PollController {
    private final PollService polls;

    public PollController(PollService polls) { this.polls = polls; }

    @GetMapping
    public List<PollResponse> list(@RequestParam(defaultValue = "0") @Min(0) int page,
                                   @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size,
                                   @AuthenticationPrincipal Jwt jwt) {
        return polls.list(page, size, jwt);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PollResponse create(@Valid @RequestBody CreatePollRequest request, @AuthenticationPrincipal Jwt jwt) {
        return polls.create(request, jwt);
    }

    @PostMapping("/{pollId}/votes")
    public PollResponse vote(@PathVariable String pollId, @Valid @RequestBody VotePollRequest request,
                             @AuthenticationPrincipal Jwt jwt) {
        return polls.vote(pollId, request, jwt);
    }

    @PostMapping("/{pollId}/close")
    public PollResponse close(@PathVariable String pollId, @AuthenticationPrincipal Jwt jwt) {
        return polls.close(pollId, jwt);
    }
}
