package com.mellow.backend.legacy.api;

import com.mellow.backend.progress.api.ProgressInstantDeserializer;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import tools.jackson.databind.annotation.JsonDeserialize;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static com.mellow.backend.progress.application.ProgressSupport.REFERENCE;

public final class ImportDto {

    public static final int MAX_BYTES = 2 * 1024 * 1024;
    public static final String FINGERPRINT = "[a-f0-9]{64}";

    private ImportDto() {
    }

    public record Snapshot(@NotNull Integer formatVersion, @NotNull @Pattern(regexp = REFERENCE) String requestId,
                           @JsonDeserialize(using = ProgressInstantDeserializer.class) Instant exportedAt,
                           @NotNull @Size(max = 4) Map<String, @NotNull @Valid StorageValue> storage) {
    }

    public record StorageValue(Integer schemaVersion, @NotNull @Size(max = MAX_BYTES) String raw) {
        @Override
        public String toString() { return "LegacyStorageValue"; }
    }

    public record Apply(@NotNull @Valid Snapshot snapshot, @NotNull @Pattern(regexp = FINGERPRINT) String planToken,
                        @NotNull Boolean acceptSkipped) {
    }

    public enum Category { LESSON, READING, STUDY_DAY, GAME, SIMULATION, FLASHCARD, FAVORITE, ANNOTATION, PREFERENCES, STORAGE }
    public enum Outcome { ELIGIBLE, IDENTICAL, CONFLICT, INVALID, UNSUPPORTED, IMPORTED }
    public enum Status { DRY_RUN, APPLIED, APPLIED_WITH_SKIPS }

    public record Entry(Category category, String locator, Outcome outcome, String code) {
    }

    public record StorageVersion(String key, Integer declaredVersion, Integer detectedVersion, String status) {
    }

    public record Report(String requestId, Status status, String snapshotFingerprint, String planToken,
                         boolean previouslyImportedSnapshot, Instant exportedAt, Instant importedAt,
                         List<StorageVersion> storageVersions, Map<Category, Map<Outcome, Long>> counts,
                         List<Entry> entries, List<String> warnings) {
    }
}
