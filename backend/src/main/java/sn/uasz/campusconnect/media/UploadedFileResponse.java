package sn.uasz.campusconnect.media;

public record UploadedFileResponse(String id, String originalName, String contentType, long size) {
    static UploadedFileResponse from(MediaAsset asset) {
        return asset == null ? null : new UploadedFileResponse(asset.getId(), asset.getOriginalName(), asset.getContentType(), asset.getSize());
    }
}
