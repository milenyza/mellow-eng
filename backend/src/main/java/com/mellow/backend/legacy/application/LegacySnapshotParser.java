package com.mellow.backend.legacy.application;

import com.mellow.backend.legacy.api.ImportDto.Snapshot;
import com.mellow.backend.legacy.api.ImportDto.StorageVersion;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.core.exc.StreamConstraintsException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import static com.mellow.backend.progress.application.ProgressSupport.invalid;

@Component
class LegacySnapshotParser {

    static final String PROGRESS = "mellow:learner-progress";
    static final String FAVORITES = "mellow:favorite-words";
    static final String FAVORITE_DATES = "mellow:favorite-words-saved-at";
    static final String ANNOTATIONS = "mellow:vocabulary-annotations";
    private static final Set<String> KEYS = Set.of(PROGRESS, FAVORITES, FAVORITE_DATES, ANNOTATIONS);

    private final JsonMapper json;

    LegacySnapshotParser(JsonMapper json) {
        this.json = json;
    }

    Parsed parse(Snapshot snapshot) {
        if (snapshot.formatVersion() != 1 || !KEYS.containsAll(snapshot.storage().keySet())) {
            throw invalid("Unsupported import envelope version or storage key.");
        }
        var payloads = new TreeMap<String, JsonNode>();
        var versions = new ArrayList<StorageVersion>();
        int[] remaining = { 60_000 };
        new TreeMap<>(snapshot.storage()).forEach((key, stored) -> {
            Integer declared = stored.schemaVersion();
            Integer detected = null;
            String status = "RECOGNIZED";
            try {
                JsonNode source = json.readTree(stored.raw());
                if (source == null || source.isMissingNode()) throw new LegacyValues.Invalid("INVALID_JSON");
                bound(source, 0, remaining);
                boolean versioned = key.equals(PROGRESS) || key.equals(ANNOTATIONS);
                if (versioned && source.path("version").isIntegralNumber() && source.path("version").canConvertToInt()) {
                    detected = source.path("version").intValue();
                }
                boolean supported = versioned ? detected != null && detected >= 1
                        && detected <= (key.equals(PROGRESS) ? 5 : 1) : declared == null;
                if (!supported) status = "UNSUPPORTED_STORAGE_VERSION";
                else if (declared != null && !declared.equals(detected)) status = "STORAGE_VERSION_MISMATCH";
                else payloads.put(key, source);
            } catch (StreamConstraintsException limit) {
                throw invalid("The snapshot exceeds the JSON parser limits.");
            } catch (JacksonException | LegacyValues.Invalid malformed) {
                status = "INVALID_STORAGE_JSON";
            }
            versions.add(new StorageVersion(key, declared, detected, status));
        });
        return new Parsed(payloads, versions);
    }

    private static void bound(JsonNode value, int level, int[] remaining) {
        if (level > 40 || --remaining[0] < 0 || value.size() > 4000) {
            throw invalid("The snapshot exceeds the import depth or collection limits.");
        }
        if (value.isArray() || value.isObject()) {
            for (var child : value) bound(child, level + 1, remaining);
        }
    }

    record Parsed(Map<String, JsonNode> payloads, List<StorageVersion> versions) {}
}
