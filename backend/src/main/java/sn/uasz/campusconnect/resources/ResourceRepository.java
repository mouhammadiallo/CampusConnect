package sn.uasz.campusconnect.resources;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface ResourceRepository extends MongoRepository<AcademicResource, String> {}
