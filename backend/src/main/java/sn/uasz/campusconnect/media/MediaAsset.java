package sn.uasz.campusconnect.media;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("media_assets")
public class MediaAsset {
    @Id private String id;
    private String originalName;
    private String contentType;
    private long size;
    private String uploadedBy;
    private String storageName;
    private Instant createdAt;

    protected MediaAsset() {}

    public MediaAsset(String id, String originalName, String contentType, long size, String uploadedBy, String storageName) {
        this.id = id;
        this.originalName = originalName;
        this.contentType = contentType;
        this.size = size;
        this.uploadedBy = uploadedBy;
        this.storageName = storageName;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getOriginalName() { return originalName; }
    public String getContentType() { return contentType; }
    public long getSize() { return size; }
    public String getUploadedBy() { return uploadedBy; }
    public String getStorageName() { return storageName; }
    public Instant getCreatedAt() { return createdAt; }
}
