package com.mellow.backend.progress.application;

import com.mellow.backend.learner.persistence.Learner;
import com.mellow.backend.learner.persistence.LearnerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.Comparator;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.UUID;

@Component
public class ProgressSupport {

    public static final String REFERENCE = "[A-Za-z0-9_-]{1,160}";
    public static final long MAX_MS = 9_007_199_254_740_991L;

    private final LearnerRepository learners;
    private final JsonMapper json;

    ProgressSupport(LearnerRepository learners, JsonMapper json) {
        this.learners = learners;
        this.json = json;
    }

    public void verifyOwner(UUID owner) {
        learners.findById(owner).orElseThrow(ProgressSupport::forbidden);
    }

    public Learner lockOwner(UUID owner) {
        return learners.findForProgressUpdate(owner).orElseThrow(ProgressSupport::forbidden);
    }

    public String etag(Object value) {
        return "\"" + fingerprint(value) + "\"";
    }

    public String fingerprint(Object value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(json.writeValueAsBytes(ordered(json.valueToTree(value)))));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    private JsonNode ordered(JsonNode node) {
        if (node.isObject()) {
            var object = json.createObjectNode();
            node.properties().stream().sorted(Comparator.comparing(java.util.Map.Entry::getKey))
                    .forEach(entry -> object.set(entry.getKey(), ordered(entry.getValue())));
            return object;
        }
        if (node.isArray()) {
            var array = json.createArrayNode();
            for (var item : node) array.add(ordered(item));
            return array;
        }
        return node;
    }

    public void requirePrecondition(Object previous, String match, String noneMatch) {
        if (match != null && noneMatch != null) {
            throw invalid("Supply only one write precondition.");
        }
        if (match == null && noneMatch == null) {
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED, "A write precondition is required.");
        }
        if (noneMatch != null && !noneMatch.equals("*")) {
            throw invalid("If-None-Match must be *.");
        }
        if (previous == null ? noneMatch == null : match == null || !etag(previous).equals(match)) {
            throw new ResponseStatusException(HttpStatus.PRECONDITION_FAILED, "Progress was changed. Retrieve its current state.");
        }
    }

    public static void validateReferences(Collection<String> values, Collection<String> allowed) {
        if (!allowed.containsAll(values) || new HashSet<>(values).size() != values.size()) {
            throw invalid("A progress reference is unknown or repeated.");
        }
    }

    public static Instant now() {
        return Instant.now().truncatedTo(ChronoUnit.MILLIS);
    }

    public static void validateTime(Instant value, Instant start, Instant now) {
        if (value == null || value.isAfter(now) || (start != null && value.isBefore(start))
                || value.getNano() % 1_000_000 != 0 || value.isBefore(Instant.EPOCH)) {
            throw invalid("The timestamp must be an ordered, non-future millisecond instant.");
        }
    }

    public static ResponseStatusException invalid(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    public static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    public static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Progress was not found.");
    }

    private static ResponseStatusException forbidden() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "Learner access is unavailable.");
    }
}
