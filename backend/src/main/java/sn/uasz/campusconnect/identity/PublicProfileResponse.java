package sn.uasz.campusconnect.identity;

import java.util.List;
import java.util.Map;
import sn.uasz.campusconnect.media.UploadedFileResponse;

public record PublicProfileResponse(String id, String fullName, String department, String studyLevel,
                                    String bio, String avatarUrl, UploadedFileResponse avatarAttachment, List<String> skills,
                                    Map<String, String> socialLinks) {}
