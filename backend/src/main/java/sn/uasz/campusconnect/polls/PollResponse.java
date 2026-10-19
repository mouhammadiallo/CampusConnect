package sn.uasz.campusconnect.polls;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record PollResponse(String id, String question, List<OptionResult> options, String authorId,
                           String authorName, Instant createdAt, int totalVotes, String myVote, boolean closed) {
    public record OptionResult(String id, String text, int votes) {}

    static PollResponse from(CampusPoll poll, String userId) {
        Map<String, String> votes = poll.getVotes();
        List<OptionResult> results = java.util.stream.IntStream.range(0, poll.getOptions().size())
                .mapToObj(index -> new OptionResult(Integer.toString(index), poll.getOptions().get(index),
                        (int) votes.values().stream().filter(Integer.toString(index)::equals).count()))
                .toList();
        return new PollResponse(poll.getId(), poll.getQuestion(), results, poll.getAuthorId(), poll.getAuthorName(),
                poll.getCreatedAt(), votes.size(), votes.get(userId), poll.isClosed());
    }
}
