package sn.uasz.campusconnect.messaging;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import sn.uasz.campusconnect.identity.CampusUser;
import sn.uasz.campusconnect.identity.CampusUserRepository;

@Service
public class MessagingService {
    private final ConversationRepository conversations;
    private final ChatMessageRepository messages;
    private final CampusUserRepository users;

    public MessagingService(ConversationRepository conversations, ChatMessageRepository messages, CampusUserRepository users) {
        this.conversations = conversations;
        this.messages = messages;
        this.users = users;
    }

    public List<Conversation> conversationsFor(String userId) {
        return conversations.findByParticipantIdsContainingOrderByUpdatedAtDesc(userId);
    }

    public Conversation create(String creatorId, List<String> requestedIds, String title) {
        var ids = new LinkedHashSet<String>();
        ids.add(creatorId);
        if (requestedIds != null) ids.addAll(requestedIds);
        if (ids.size() < 2 || ids.size() > 50) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Une conversation doit réunir 2 à 50 personnes");
        var existing = users.findAllById(ids);
        if (existing.size() != ids.size() || existing.stream().anyMatch(user -> user.isCurrentlySuspended(Instant.now()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un participant est introuvable ou suspendu");
        }
        boolean group = ids.size() > 2;
        String safeTitle = group ? (title == null ? "" : title.trim()) : null;
        if (group && (safeTitle == null || safeTitle.isBlank() || safeTitle.length() > 100)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nom du groupe est obligatoire (100 caractères maximum)");
        }
        return conversations.save(new Conversation(safeTitle, group, new ArrayList<>(ids)));
    }

    public List<ChatMessage> history(String conversationId, String userId, int size) {
        requireMember(conversationId, userId);
        var page = PageRequest.of(0, Math.max(1, Math.min(size, 100)));
        var result = messages.findByConversationIdOrderByCreatedAtDesc(conversationId, page);
        java.util.Collections.reverse(result);
        return result;
    }

    public ChatMessage send(String conversationId, String senderId, String content) {
        Conversation conversation = requireMember(conversationId, senderId);
        String text = content == null ? "" : content.trim();
        if (text.isBlank() || text.length() > 4000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le message doit contenir entre 1 et 4 000 caractères");
        CampusUser sender = users.findById(senderId).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        var message = messages.save(new ChatMessage(conversationId, senderId, sender.getFullName(), text));
        conversation.touch(message.getCreatedAt());
        conversations.save(conversation);
        return message;
    }

    public Conversation requireMember(String conversationId, String userId) {
        return conversations.findById(conversationId)
                .filter(conversation -> conversation.getParticipantIds().contains(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation introuvable"));
    }
}
