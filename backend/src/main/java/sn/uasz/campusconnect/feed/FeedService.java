package sn.uasz.campusconnect.feed;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;
import sn.uasz.campusconnect.identity.CampusUser;
import sn.uasz.campusconnect.identity.CampusUserRepository;
import sn.uasz.campusconnect.media.MediaService;
import sn.uasz.campusconnect.media.UploadedFileResponse;

@Service
public class FeedService {
    private final PostRepository posts;
    private final CommentRepository comments;
    private final PostLikeRepository likes;
    private final CampusUserRepository users;
    private final MediaService media;

    public FeedService(PostRepository posts, CommentRepository comments, PostLikeRepository likes, CampusUserRepository users, MediaService media) {
        this.posts = posts;
        this.comments = comments;
        this.likes = likes;
        this.users = users;
        this.media = media;
    }

    public PostResponse createPost(CreatePostRequest request, Jwt jwt) {
        CampusUser author = currentUser(jwt);
        String mediaUrl = clean(request.mediaUrl());
        String attachmentId = clean(request.attachmentId());
        if (mediaUrl != null && attachmentId != null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a link or an uploaded file, not both");
        media.requireOwner(attachmentId, author.getId());
        Post post = posts.save(new Post(author.getId(), author.getFullName(), request.content().trim(), mediaUrl, attachmentId));
        return response(post, jwt.getSubject());
    }

    public Page<PostResponse> listPosts(int page, int size, Jwt jwt) {
        PageRequest request = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return posts.findAllByOrderByCreatedAtDesc(request).map(post -> response(post, jwt.getSubject()));
    }

    public void deletePost(String postId, Jwt jwt) {
        Post post = findPost(postId);
        if (!post.getAuthorId().equals(jwt.getSubject())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the author can delete this post");
        }
        comments.deleteByPostId(postId);
        likes.deleteByPostId(postId);
        posts.delete(post);
    }

    public CommentResponse addComment(String postId, CreateCommentRequest request, Jwt jwt) {
        Post post = findPost(postId);
        CampusUser author = currentUser(jwt);
        Comment comment = comments.save(new Comment(postId, author.getId(), author.getFullName(), request.content().trim()));
        post.setCommentsCount(comments.countByPostId(postId));
        posts.save(post);
        return CommentResponse.from(comment);
    }

    public List<CommentResponse> listComments(String postId, int page, int size) {
        findPost(postId);
        return comments.findByPostIdOrderByCreatedAtAsc(postId, PageRequest.of(page, size))
                .stream().map(CommentResponse::from).toList();
    }

    public PostResponse like(String postId, Jwt jwt) {
        Post post = findPost(postId);
        String userId = jwt.getSubject();
        if (!likes.existsByPostIdAndUserId(postId, userId)) {
            likes.save(new PostLike(postId, userId));
        }
        post.setLikesCount(likes.countByPostId(postId));
        return response(posts.save(post), userId);
    }

    public PostResponse unlike(String postId, Jwt jwt) {
        Post post = findPost(postId);
        likes.deleteByPostIdAndUserId(postId, jwt.getSubject());
        post.setLikesCount(likes.countByPostId(postId));
        return response(posts.save(post), jwt.getSubject());
    }

    private PostResponse response(Post post, String userId) {
        UploadedFileResponse attachment = media.describe(post.getAttachmentId());
        return PostResponse.from(post, attachment, likes.existsByPostIdAndUserId(post.getId(), userId));
    }

    private CampusUser currentUser(Jwt jwt) {
        return users.findById(jwt.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
    }

    private Post findPost(String postId) {
        return posts.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
