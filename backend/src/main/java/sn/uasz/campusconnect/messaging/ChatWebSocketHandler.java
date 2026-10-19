package sn.uasz.campusconnect.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import sn.uasz.campusconnect.identity.CampusUserRepository;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {
    private final ObjectMapper json;
    private final JwtDecoder jwtDecoder;
    private final CampusUserRepository users;
    private final MessagingService messaging;
    private final Map<String, String> identities = new ConcurrentHashMap<>();
    private final Map<String, String> subscriptions = new ConcurrentHashMap<>();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(ObjectMapper json, JwtDecoder jwtDecoder, CampusUserRepository users, MessagingService messaging) {
        this.json = json;
        this.jwtDecoder = jwtDecoder;
        this.users = users;
        this.messaging = messaging;
    }
    @Override public void afterConnectionEstablished(WebSocketSession session) {
        session.setTextMessageSizeLimit(8192);
        sessions.put(session.getId(), session);
    }

    @Override protected void handleTextMessage(WebSocketSession session, TextMessage frame) throws Exception {
        try {
            JsonNode data = json.readTree(frame.getPayload());
            String type = data.path("type").asText();
            if ("AUTH".equals(type)) { authenticate(session, data.path("token").asText()); return; }
            String userId = identities.get(session.getId());
            if (userId == null) { error(session, "Authentifiez la connexion avant de continuer."); return; }
            boolean active = users.findById(userId).filter(user -> !user.isCurrentlySuspended(Instant.now())).isPresent();
            if (!active) { session.close(CloseStatus.POLICY_VIOLATION); return; }
            if ("SUBSCRIBE".equals(type)) {
                String conversationId = data.path("conversationId").asText();
                messaging.requireMember(conversationId, userId);
                subscriptions.put(session.getId(), conversationId);
                sendJson(session, Map.of("type", "SUBSCRIBED", "conversationId", conversationId));
            } else if ("SEND".equals(type)) {
                String conversationId = data.path("conversationId").asText();
                if (!conversationId.equals(subscriptions.get(session.getId()))) { error(session, "Abonnez-vous à cette conversation avant d’envoyer un message."); return; }
                ChatMessage message = messaging.send(conversationId, userId, data.path("content").asText(""));
                String payload = json.writeValueAsString(Map.of("type", "MESSAGE", "message", message));
                for (var entry : sessions.entrySet()) {
                    String recipientId = identities.get(entry.getKey());
                    boolean recipientActive = recipientId != null && users.findById(recipientId)
                            .filter(user -> !user.isCurrentlySuspended(Instant.now())).isPresent();
                    if (conversationId.equals(subscriptions.get(entry.getKey())) && entry.getValue().isOpen() && recipientActive) {
                        synchronized (entry.getValue()) { entry.getValue().sendMessage(new TextMessage(payload)); }
                    }
                }
            } else error(session, "Type de message inconnu.");
        } catch (Exception exception) {
            error(session, exception instanceof org.springframework.web.server.ResponseStatusException ? exception.getMessage() : "Message ou authentification invalide.");
        }
    }

    private void authenticate(WebSocketSession session, String token) throws IOException {
        try {
            String subject = jwtDecoder.decode(token).getSubject();
            boolean active = users.findById(subject).filter(user -> !user.isCurrentlySuspended(Instant.now())).isPresent();
            if (!active) throw new IllegalArgumentException("Compte inactif");
            identities.put(session.getId(), subject);
            sendJson(session, Map.of("type", "AUTHENTICATED"));
        } catch (Exception exception) {
            error(session, "Jeton invalide ou compte suspendu.");
            session.close(CloseStatus.POLICY_VIOLATION);
        }
    }
    private void error(WebSocketSession session, String message) throws IOException { sendJson(session, Map.of("type", "ERROR", "message", message)); }
    private void sendJson(WebSocketSession session, Object payload) throws IOException {
        synchronized (session) { if (session.isOpen()) session.sendMessage(new TextMessage(json.writeValueAsString(payload))); }
    }
    @Override public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        identities.remove(session.getId()); subscriptions.remove(session.getId()); sessions.remove(session.getId());
    }
}
