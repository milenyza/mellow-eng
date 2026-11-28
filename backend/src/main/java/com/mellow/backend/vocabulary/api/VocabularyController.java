package com.mellow.backend.vocabulary.api;

import com.mellow.backend.flashcards.persistence.FlashcardSession.Source;
import com.mellow.backend.flashcards.persistence.FlashcardSession.VocabularyType;
import com.mellow.backend.progress.api.ResourceRevision;
import com.mellow.backend.progress.api.TrustedLearner;
import com.mellow.backend.vocabulary.application.AnnotationService;
import com.mellow.backend.vocabulary.application.FavoriteService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.mellow.backend.progress.api.ProgressBoundary.OWNER;
import static com.mellow.backend.vocabulary.api.VocabularyDto.MAX_REFERENCE;

@RestController
public class VocabularyController {

    public static final String FAVORITES = "/api/v1/favorites";
    public static final String ANNOTATIONS = "/api/v1/vocabulary-annotations";
    private static final String NO_NUL = "[^\\x00]+";

    private final FavoriteService favorites;
    private final AnnotationService annotations;

    VocabularyController(FavoriteService favorites, AnnotationService annotations) {
        this.favorites = favorites;
        this.annotations = annotations;
    }

    @GetMapping(FAVORITES)
    VocabularyDto.Page<VocabularyDto.Favorite> favorites(@RequestAttribute(OWNER) TrustedLearner owner,
            @RequestParam(required = false) Source source, @RequestParam(required = false) VocabularyType type,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return favorites.list(owner, source, type, page, size);
    }

    @GetMapping(FAVORITES + "/item")
    ResponseEntity<VocabularyDto.Favorite> favorite(@RequestAttribute(OWNER) TrustedLearner owner,
            @RequestParam @NotBlank @Size(max = MAX_REFERENCE) @Pattern(regexp = NO_NUL) String ref) {
        var snapshot = favorites.get(owner, ref);
        return ResponseEntity.ok().eTag(snapshot.etag()).body(snapshot.view());
    }

    @PutMapping(FAVORITES + "/item")
    ResponseEntity<VocabularyDto.Favorite> add(@RequestAttribute(OWNER) TrustedLearner owner,
            @RequestParam @NotBlank @Size(max = MAX_REFERENCE) @Pattern(regexp = NO_NUL) String ref,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String match) {
        var snapshot = favorites.setMembership(owner, ref, true, ResourceRevision.require(match));
        return ResponseEntity.ok().eTag(snapshot.etag()).body(snapshot.view());
    }

    @DeleteMapping(FAVORITES + "/item")
    ResponseEntity<Void> remove(@RequestAttribute(OWNER) TrustedLearner owner,
            @RequestParam @NotBlank @Size(max = MAX_REFERENCE) @Pattern(regexp = NO_NUL) String ref,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String match) {
        var snapshot = favorites.setMembership(owner, ref, false, ResourceRevision.require(match));
        return ResponseEntity.noContent().eTag(snapshot.etag()).build();
    }

    @GetMapping(ANNOTATIONS)
    VocabularyDto.Page<VocabularyDto.Annotation> annotations(@RequestAttribute(OWNER) TrustedLearner owner,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return annotations.list(owner, page, size);
    }

    @GetMapping(ANNOTATIONS + "/item")
    ResponseEntity<VocabularyDto.Annotation> annotation(@RequestAttribute(OWNER) TrustedLearner owner,
            @RequestParam @NotBlank @Size(max = MAX_REFERENCE) @Pattern(regexp = NO_NUL) String ref) {
        var snapshot = annotations.get(owner, ref);
        return ResponseEntity.ok().eTag(snapshot.etag()).body(snapshot.view());
    }

    @PatchMapping(path = ANNOTATIONS + "/item", consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<VocabularyDto.Annotation> annotate(@RequestAttribute(OWNER) TrustedLearner owner,
            @RequestParam @NotBlank @Size(max = MAX_REFERENCE) @Pattern(regexp = NO_NUL) String ref,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String match,
            @Valid @RequestBody VocabularyDto.AnnotationPatch patch) {
        var snapshot = annotations.edit(owner, ref, ResourceRevision.require(match), patch);
        return ResponseEntity.ok().eTag(snapshot.etag()).body(snapshot.view());
    }

    @DeleteMapping(ANNOTATIONS + "/item")
    ResponseEntity<Void> deleteAnnotation(@RequestAttribute(OWNER) TrustedLearner owner,
            @RequestParam @NotBlank @Size(max = MAX_REFERENCE) @Pattern(regexp = NO_NUL) String ref,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String match) {
        var snapshot = annotations.delete(owner, ref, ResourceRevision.require(match));
        return ResponseEntity.noContent().eTag(snapshot.etag()).build();
    }
}
