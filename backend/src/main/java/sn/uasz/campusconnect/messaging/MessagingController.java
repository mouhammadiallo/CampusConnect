package sn.uasz.campusconnect.messaging;

import java.security.Principal;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import sn.uasz.campusconnect.identity.CampusUserRepository;

@RestController
@RequestMapping("/api/conversations")
public class MessagingController {
    private final MessagingService messaging;
    private final CampusUserRepository users;
    private final ChatMessageRepository messages;
    public MessagingController(MessagingService messaging, CampusUserRepository users, ChatMessageRepository messages) {
        this.messaging = messaging;
        this.users = users;
        this.messages = messages;
    }
    @GetMapping
    public List<Conversation> list(Principal principal) { return messaging.conversationsFor(principal.getName()); }
    @GetMapping("/contacts")
    public List<ContactResponse> contacts(@RequestParam(defaultValue = "") String q, Principal principal) {
        String query = q.trim();
        if (query.length() < 2) return List.of();
        return users.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query, PageRequest.of(0, 20)).stream()
                .filter(user -> !user.getId().equals(principal.getName()) && !user.isCurrentlySuspended(java.time.Instant.now()))
                .map(user -> new ContactResponse(user.getId(), user.getFullName(), user.getEmail())).toList();
    }
    @PostMapping
    public Conversation create(@RequestBody CreateConversationRequest request, Principal principal) {
        return messaging.create(principal.getName(), request.participantIds(), request.title());
    }
    @GetMapping("/{conversationId}/messages")
    public List<ChatMessage> history(@PathVariable String conversationId, @RequestParam(defaultValue = "50") int size, Principal principal) {
        return messaging.history(conversationId, principal.getName(), size);
    }
    public record CreateConversationRequest(List<String> participantIds, String title) {}
    public record ContactResponse(String id, String fullName, String email) {}
}
