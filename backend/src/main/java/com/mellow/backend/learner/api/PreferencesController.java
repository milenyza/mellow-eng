package com.mellow.backend.learner.api;

import com.mellow.backend.learner.application.PreferencesService;
import com.mellow.backend.progress.api.ResourceRevision;
import com.mellow.backend.progress.api.TrustedLearner;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.mellow.backend.progress.api.ProgressBoundary.OWNER;

@RestController
@RequestMapping(PreferencesController.PATH)
public class PreferencesController {

    public static final String PATH = "/api/v1/preferences";

    private final PreferencesService preferences;

    PreferencesController(PreferencesService preferences) {
        this.preferences = preferences;
    }

    @GetMapping
    ResponseEntity<PreferencesDto.View> get(@RequestAttribute(OWNER) TrustedLearner owner) {
        var snapshot = preferences.get(owner);
        return ResponseEntity.ok().eTag(snapshot.etag()).body(snapshot.view());
    }

    @PatchMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<PreferencesDto.View> edit(@RequestAttribute(OWNER) TrustedLearner owner,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String match,
            @RequestBody PreferencesDto.Patch patch) {
        var snapshot = preferences.edit(owner, ResourceRevision.require(match), patch);
        return ResponseEntity.ok().eTag(snapshot.etag()).body(snapshot.view());
    }
}
