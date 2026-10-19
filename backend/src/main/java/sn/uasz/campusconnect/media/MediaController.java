package sn.uasz.campusconnect.media;

import java.nio.charset.StandardCharsets;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/api/uploads")
public class MediaController {
    private final MediaService media;

    public MediaController(MediaService media) { this.media = media; }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadedFileResponse upload(@RequestParam("file") MultipartFile file, @AuthenticationPrincipal Jwt jwt) {
        return media.store(file, jwt.getSubject(), false);
    }

    @PostMapping(path = "/pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public UploadedFileResponse uploadPdf(@RequestParam("file") MultipartFile file, @AuthenticationPrincipal Jwt jwt) {
        return media.store(file, jwt.getSubject(), true);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        MediaAsset asset = media.find(id);
        Resource resource = new FileSystemResource(media.path(asset));
        boolean image = asset.getContentType().startsWith("image/");
        ContentDisposition disposition = (image ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(asset.getOriginalName(), StandardCharsets.UTF_8).build();
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(asset.getContentType())).contentLength(asset.getSize())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300").body(resource);
    }
}
