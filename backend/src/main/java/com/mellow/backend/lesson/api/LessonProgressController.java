package com.mellow.backend.lesson.api;

import com.mellow.backend.lesson.application.LessonProgressService;
import com.mellow.backend.progress.application.ProgressSupport;
import com.mellow.backend.progress.api.TrustedLearner;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.mellow.backend.progress.api.ProgressBoundary.OWNER;
import static com.mellow.backend.progress.application.ProgressSupport.REFERENCE;

@RestController
@RequestMapping("/api/v1/lesson-progress")
public class LessonProgressController {

    private final LessonProgressService service;
    private final ProgressSupport support;

    LessonProgressController(LessonProgressService service, ProgressSupport support) {
        this.service = service;
        this.support = support;
    }

    @GetMapping
    List<LessonProgressDto.View> list(@RequestAttribute(OWNER) TrustedLearner owner) {
        return service.list(owner);
    }

    @GetMapping("/{lessonRef}")
    ResponseEntity<LessonProgressDto.View> get(@RequestAttribute(OWNER) TrustedLearner owner,
            @PathVariable @Pattern(regexp = REFERENCE) String lessonRef) {
        return response(service.get(owner, lessonRef));
    }

    @PutMapping("/{lessonRef}/attempts/{runRef}")
    ResponseEntity<LessonProgressDto.View> put(@RequestAttribute(OWNER) TrustedLearner owner,
            @PathVariable @Pattern(regexp = REFERENCE) String lessonRef,
            @PathVariable @Pattern(regexp = REFERENCE) String runRef,
            @Valid @RequestBody LessonProgressDto.Write input,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String match,
            @RequestHeader(name = HttpHeaders.IF_NONE_MATCH, required = false) String noneMatch) {
        return response(service.put(owner, lessonRef, runRef, input, match, noneMatch));
    }

    private ResponseEntity<LessonProgressDto.View> response(LessonProgressDto.View value) {
        return ResponseEntity.ok().eTag(support.etag(value)).body(value);
    }
}
