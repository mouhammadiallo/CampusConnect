package sn.uasz.campusconnect.polls;

import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import sn.uasz.campusconnect.identity.CampusUser;
import sn.uasz.campusconnect.identity.CampusUserRepository;

@Service
public class PollService {
    private final CampusPollRepository polls;
    private final CampusUserRepository users;

    public PollService(CampusPollRepository polls, CampusUserRepository users) {
        this.polls = polls;
        this.users = users;
    }

    public List<PollResponse> list(int page, int size, Jwt jwt) {
        String userId = jwt.getSubject();
        return polls.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size)).stream()
                .map(poll -> PollResponse.from(poll, userId)).toList();
    }

    public PollResponse create(CreatePollRequest request, Jwt jwt) {
        CampusUser author = currentUser(jwt);
        List<String> options = request.options().stream().map(String::trim).toList();
        long uniqueOptions = options.stream().map(value -> value.toLowerCase(Locale.ROOT)).distinct().count();
        if (uniqueOptions != options.size()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Poll options must be unique");
        return PollResponse.from(polls.save(new CampusPoll(request.question().trim(), options, author.getId(), author.getFullName())), author.getId());
    }

    public PollResponse vote(String pollId, VotePollRequest request, Jwt jwt) {
        CampusPoll poll = findPoll(pollId);
        String userId = currentUser(jwt).getId();
        if (poll.isClosed()) throw new ResponseStatusException(HttpStatus.CONFLICT, "This poll is closed");
        if (poll.getVotes().containsKey(userId)) throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already voted in this poll");
        try {
            int optionIndex = Integer.parseInt(request.optionId());
            if (optionIndex < 0 || optionIndex >= poll.getOptions().size()) throw new NumberFormatException();
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid poll option");
        }
        poll.addVote(userId, request.optionId());
        return PollResponse.from(polls.save(poll), userId);
    }

    public PollResponse close(String pollId, Jwt jwt) {
        CampusPoll poll = findPoll(pollId);
        String userId = currentUser(jwt).getId();
        if (!poll.getAuthorId().equals(userId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the poll author can close it");
        poll.close();
        return PollResponse.from(polls.save(poll), userId);
    }

    private CampusPoll findPoll(String id) {
        return polls.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Poll not found"));
    }

    private CampusUser currentUser(Jwt jwt) {
        return users.findById(jwt.getSubject()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
    }
}
