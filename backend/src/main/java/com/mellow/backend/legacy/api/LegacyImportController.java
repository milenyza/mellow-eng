package com.mellow.backend.legacy.api;

import com.mellow.backend.legacy.application.LegacyImportService;
import com.mellow.backend.progress.api.TrustedLearner;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import static com.mellow.backend.progress.api.ProgressBoundary.OWNER;
import static com.mellow.backend.progress.application.ProgressSupport.REFERENCE;

@RestController
@RequestMapping(LegacyImportController.PATH)
public class LegacyImportController {

    public static final String PATH = "/api/v1/data-import";

    private final LegacyImportService imports;

    LegacyImportController(LegacyImportService imports) {
        this.imports = imports;
    }

    @PostMapping(path = "/dry-run", consumes = MediaType.APPLICATION_JSON_VALUE)
    ImportDto.Report plan(@RequestAttribute(OWNER) TrustedLearner owner, @Valid @RequestBody ImportDto.Snapshot snapshot) {
        return imports.plan(owner, snapshot);
    }

    @PutMapping(path = "/{ref}", consumes = MediaType.APPLICATION_JSON_VALUE)
    ImportDto.Report apply(@RequestAttribute(OWNER) TrustedLearner owner, @PathVariable @Pattern(regexp = REFERENCE) String ref,
                            @Valid @RequestBody ImportDto.Apply input) {
        return imports.apply(owner, ref, input);
    }

    @GetMapping("/{ref}")
    ImportDto.Report get(@RequestAttribute(OWNER) TrustedLearner owner, @PathVariable @Pattern(regexp = REFERENCE) String ref) {
        return imports.get(owner, ref);
    }
}
