package sn.uasz.campusconnect.messaging;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("chat_messages")
public class ChatMessage {
    @Id private String id;
    @Indexed private String conversationId;
    private String senderId;
    private String senderName;
    private String content;
    private Instant createdAt;
    protected ChatMessage() {}
    public ChatMessage(String conversationId, String senderId, String senderName, String content) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.content = content;
        this.createdAt = Instant.now();
    }
    public String getId() { return id; }
    public String getConversationId() { return conversationId; }
    public String getSenderId() { return senderId; }
    public String getSenderName() { return senderName; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
