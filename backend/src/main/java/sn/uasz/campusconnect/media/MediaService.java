package sn.uasz.campusconnect.media;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MediaService {
    public static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private final MediaAssetRepository assets;
    private final Path storageDirectory;

    public MediaService(MediaAssetRepository assets, @Value("${app.upload.directory:./uploads}") String directory) {
        this.assets = assets;
        this.storageDirectory = Path.of(directory).toAbsolutePath().normalize();
    }

    public UploadedFileResponse store(MultipartFile file, String userId, boolean pdfOnly) {
        if (file == null || file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a file to upload");
        if (file.getSize() > MAX_FILE_SIZE) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Files must be 10 MB or smaller");
        String originalName = cleanName(file.getOriginalFilename());
        String extension = extension(originalName);
        String contentType = allowedType(extension, pdfOnly);
        byte[] bytes;
        try { bytes = file.getBytes(); }
        catch (IOException exception) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded file"); }
        if (!hasValidSignature(bytes, contentType)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File content does not match its type");

        String id = UUID.randomUUID().toString();
        Path target = storageDirectory.resolve(id + extension).normalize();
        if (!target.startsWith(storageDirectory)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name");
        try {
            Files.createDirectories(storageDirectory);
            Files.write(target, bytes);
            try {
                MediaAsset asset = assets.save(new MediaAsset(id, originalName, contentType, bytes.length, userId, target.getFileName().toString()));
                return UploadedFileResponse.from(asset);
            } catch (RuntimeException exception) {
                Files.deleteIfExists(target);
                throw exception;
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store uploaded file");
        }
    }

    public MediaAsset find(String id) {
        return assets.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
    }

    public UploadedFileResponse describe(String id) {
        return id == null ? null : UploadedFileResponse.from(find(id));
    }

    public void requireOwner(String id, String userId) {
        if (id == null) return;
        if (!find(id).getUploadedBy().equals(userId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the uploader can attach this file");
    }

    public Path path(MediaAsset asset) {
        Path file = storageDirectory.resolve(asset.getStorageName()).normalize();
        if (!file.startsWith(storageDirectory) || !Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
        return file;
    }

    private static String cleanName(String name) {
        if (name == null || name.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File name is required");
        String baseName = name.replace('\\', '/');
        baseName = baseName.substring(baseName.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "_").trim();
        if (baseName.isBlank() || baseName.length() > 180) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File name must be at most 180 characters");
        return baseName;
    }

    private static String extension(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot).toLowerCase(Locale.ROOT);
    }

    private static String allowedType(String extension, boolean pdfOnly) {
        if (pdfOnly) {
            if (extension.equals(".pdf")) return "application/pdf";
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "This upload accepts PDF files only");
        }
        return switch (extension) {
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".png" -> "image/png";
            case ".pdf" -> "application/pdf";
            default -> throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Allowed files: JPEG, PNG, or PDF");
        };
    }

    private static boolean hasValidSignature(byte[] bytes, String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
            case "image/png" -> bytes.length >= 8 && (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47 && bytes[4] == 0x0d && bytes[5] == 0x0a && bytes[6] == 0x1a && bytes[7] == 0x0a;
            case "application/pdf" -> bytes.length >= 5 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F' && bytes[4] == '-';
            default -> false;
        };
    }
}
