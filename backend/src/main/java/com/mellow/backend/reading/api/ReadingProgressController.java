package com.mellow.backend.reading.api;

import com.mellow.backend.reading.application.ReadingProgressService;
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
@RequestMapping("/api/v1/reading-progress")
public class ReadingProgressController {

    private final ReadingProgressService service;
    private final ProgressSupport support;

    ReadingProgressController(ReadingProgressService service, ProgressSupport support) {
        this.service = service;
        this.support = support;
    }

    @GetMapping
    List<ReadingProgressDto.View> list(@RequestAttribute(OWNER) TrustedLearner owner) {
        return service.list(owner);
    }

    @GetMapping("/{storyRef}")
    ResponseEntity<ReadingProgressDto.View> get(@RequestAttribute(OWNER) TrustedLearner owner,
            @PathVariable @Pattern(regexp = REFERENCE) String storyRef) {
        return response(service.get(owner, storyRef));
    }

    @PutMapping("/{storyRef}/attempts/{runRef}")
    ResponseEntity<ReadingProgressDto.View> put(@RequestAttribute(OWNER) TrustedLearner owner,
            @PathVariable @Pattern(regexp = REFERENCE) String storyRef,
            @PathVariable @Pattern(regexp = REFERENCE) String runRef,
            @Valid @RequestBody ReadingProgressDto.Write input,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String match,
            @RequestHeader(name = HttpHeaders.IF_NONE_MATCH, required = false) String noneMatch) {
        return response(service.put(owner, storyRef, runRef, input, match, noneMatch));
    }

    private ResponseEntity<ReadingProgressDto.View> response(ReadingProgressDto.View value) {
        return ResponseEntity.ok().eTag(support.etag(value)).body(value);
    }
}
