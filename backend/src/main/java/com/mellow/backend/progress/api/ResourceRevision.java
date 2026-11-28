package com.mellow.backend.progress.api;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

import static com.mellow.backend.progress.application.ProgressSupport.invalid;

/** An opaque write precondition, including the state before a resource has ever been stored. */
public record ResourceRevision(UUID value) {

    private static final String ABSENT = "\"missing\"";
    private static final Pattern STRONG = Pattern.compile(
            "\"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\"");

    public static ResourceRevision require(String match) {
        if (match == null) {
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED, "An If-Match revision is required.");
        }
        if (ABSENT.equals(match)) return new ResourceRevision(null);
        if (!STRONG.matcher(match).matches()) throw invalid("Supply one strong revision from the resource ETag.");
        return new ResourceRevision(UUID.fromString(match.substring(1, match.length() - 1)));
    }

    public static String etag(UUID revision) {
        return revision == null ? ABSENT : "\"" + revision + "\"";
    }

    public boolean matches(UUID current) {
        return Objects.equals(value, current);
    }

    public void check(UUID current) {
        if (!matches(current)) {
            throw new ResponseStatusException(HttpStatus.PRECONDITION_FAILED,
                    "This resource has changed. Retrieve its current state.");
        }
    }

    public record Snapshot<T>(T view, UUID revision) {
        public String etag() { return ResourceRevision.etag(revision); }
    }
}
