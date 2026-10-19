package sn.uasz.campusconnect.moderation;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface SanctionRepository extends MongoRepository<UserSanction, String> {}
