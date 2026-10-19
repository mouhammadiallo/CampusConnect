package sn.uasz.campusconnect.feed;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@RestController
@Validated
@RequestMapping("/api/posts")
public class FeedController {
    private final FeedService feedService;

    public FeedController(FeedService feedService) {
        this.feedService = feedService;
    }

    @PostMapping
    public PostResponse createPost(@Valid @RequestBody CreatePostRequest request, @AuthenticationPrincipal Jwt jwt) {
        return feedService.createPost(request, jwt);
    }

    @DeleteMapping("/{postId}")
    @org.springframework.web.bind.annotation.ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void deletePost(@PathVariable String postId, @AuthenticationPrincipal Jwt jwt) {
        feedService.deletePost(postId, jwt);
    }

    @GetMapping
    public Page<PostResponse> listPosts(@RequestParam(defaultValue = "0") @Min(0) int page,
                                       @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
                                       @AuthenticationPrincipal Jwt jwt) {
        return feedService.listPosts(page, size, jwt);
    }

    @PostMapping("/{postId}/comments")
    public CommentResponse addComment(@PathVariable String postId, @Valid @RequestBody CreateCommentRequest request,
                                      @AuthenticationPrincipal Jwt jwt) {
        return feedService.addComment(postId, request, jwt);
    }

    @GetMapping("/{postId}/comments")
    public List<CommentResponse> listComments(@PathVariable String postId,
                                             @RequestParam(defaultValue = "0") @Min(0) int page,
                                             @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size) {
        return feedService.listComments(postId, page, size);
    }

    @PostMapping("/{postId}/likes")
    public PostResponse like(@PathVariable String postId, @AuthenticationPrincipal Jwt jwt) {
        return feedService.like(postId, jwt);
    }

    @DeleteMapping("/{postId}/likes")
    public PostResponse unlike(@PathVariable String postId, @AuthenticationPrincipal Jwt jwt) {
        return feedService.unlike(postId, jwt);
    }
}
