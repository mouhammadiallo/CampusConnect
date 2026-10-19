package sn.uasz.campusconnect.messaging;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ConversationRepository extends MongoRepository<Conversation, String> {
    List<Conversation> findByParticipantIdsContainingOrderByUpdatedAtDesc(String userId);
}
