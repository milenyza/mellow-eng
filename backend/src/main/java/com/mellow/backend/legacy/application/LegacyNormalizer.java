package com.mellow.backend.legacy.application;

import com.mellow.backend.learner.persistence.LearnerPreferences.ReadingFontSize;
import com.mellow.backend.legacy.api.ImportDto.Category;
import com.mellow.backend.legacy.api.ImportDto.Outcome;
import com.mellow.backend.vocabulary.persistence.VocabularyAnnotation.Familiarity;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.BiFunction;

import static com.mellow.backend.legacy.application.LegacyValues.*;
import static com.mellow.backend.legacy.application.LegacySnapshotParser.*;
import static com.mellow.backend.progress.application.ProgressSupport.invalid;

@Component
class LegacyNormalizer {

    Normalized normalize(LegacySnapshotParser.Parsed parsed) {
        var output = new Collector();
        for (var version : parsed.versions()) {
            if (!version.status().equals("RECOGNIZED")) {
                output.issue(Category.STORAGE, version.key(), version.status(),
                        version.status().equals("UNSUPPORTED_STORAGE_VERSION") ? Outcome.UNSUPPORTED : Outcome.INVALID);
            }
        }
        var sources = parsed.payloads();
        if (sources.containsKey(PROGRESS)) output.run(Category.STORAGE, PROGRESS, () -> progress(sources.get(PROGRESS), output));
        if (sources.containsKey(ANNOTATIONS)) output.run(Category.STORAGE, ANNOTATIONS, () -> annotations(sources.get(ANNOTATIONS), output));
        if (sources.containsKey(FAVORITES) || sources.containsKey(FAVORITE_DATES)) {
            favorites(sources.get(FAVORITES), sources.get(FAVORITE_DATES),
                    parsed.versions().stream().anyMatch(value -> value.key().equals(FAVORITE_DATES)), output);
        }
        return new Normalized(List.copyOf(output.candidates), List.copyOf(output.issues), List.copyOf(output.warnings));
    }

    private static void progress(JsonNode raw, Collector out) {
        object(raw, "version", "data");
        int version = raw.path("version").intValue();
        var data = object(raw.path("data"), "lessons", "dailyStudyMs", "reading", "gameSessions", "simulationSessions", "flashcardSessions");
        out.map(Category.LESSON, data.path("lessons"), (ref, value) -> LegacyProgressMapping.lesson(id(ref), value));
        out.map(Category.STUDY_DAY, data.path("dailyStudyMs"), (ref, value) -> new StudyDay(day(ref), number(value)));
        var reading = data.path("reading");
        out.run(Category.READING, "reading", () -> {
            if (absent(reading)) return;
            if (version < 2) {
                out.issue(Category.READING, "reading", "CATEGORY_OUTSIDE_SOURCE_VERSION", Outcome.UNSUPPORTED);
                return;
            }
            object(reading, "stories", "preferences");
            if (!absent(reading.path("stories"))) {
                out.map(Category.READING, reading.path("stories"), (ref, value) -> LegacyProgressMapping.reading(id(ref), value));
            }
            var prefs = reading.path("preferences");
            if (!absent(prefs)) out.run(Category.PREFERENCES, "reading", () -> preferences(prefs, out));
        });
        out.module(Category.GAME, data.path("gameSessions"), version >= 3, LegacySessionMapping::game);
        out.module(Category.SIMULATION, data.path("simulationSessions"), version >= 4, LegacySessionMapping::simulation);
        out.module(Category.FLASHCARD, data.path("flashcardSessions"), version >= 5, LegacySessionMapping::flashcard);
        if (!absent(data.path("dailyStudyMs")) && !data.path("dailyStudyMs").isEmpty()) {
            out.warnings.add("COMBINED_LESSON_READING_TIME_CANNOT_BE_SPLIT");
        }
        if (!absent(reading)) out.warnings.add("READ_CHAPTER_IDS_ALONE_HAVE_NO_DATE");
    }

    private static void preferences(JsonNode prefs, Collector out) {
        object(prefs, "fontSize", "translations");
        var sizeField = prefs.path("fontSize");
        var translationField = prefs.path("translations");
        var size = absent(sizeField) ? ReadingFontSize.NORMAL : enumeration(ReadingFontSize.class, sizeField);
        boolean translations = !absent(translationField) && bool(translationField);
        if (size == ReadingFontSize.NORMAL && !translations) {
            out.warnings.add("BROWSER_DEFAULT_PREFERENCES_ARE_AMBIGUOUS");
            out.issue(Category.PREFERENCES, "reading", "BROWSER_DEFAULT_PREFERENCES_ARE_AMBIGUOUS", Outcome.UNSUPPORTED);
        } else {
            out.warnings.add("BROWSER_PREFERENCES_HAVE_NO_UPDATE_TIMESTAMP");
            out.add(Category.PREFERENCES, "reading", new Preferences(size, translations));
        }
    }

    private static void annotations(JsonNode root, Collector out) {
        object(root, "version", "records");
        out.map(Category.ANNOTATION, root.path("records"), (ref, value) -> {
            object(value, "vocabularyId", "note", "personalExample", "familiarity", "createdAt", "updatedAt");
            require(ref.equals(vocabulary(value.path("vocabularyId"))), "ANNOTATION_KEY_MISMATCH");
            String note = optionalText(value.path("note"), 1200);
            String example = optionalText(value.path("personalExample"), 400);
            var level = value.path("familiarity");
            var familiarity = absent(level) ? null : enumeration(Familiarity.class, level);
            require(note != null || example != null || familiarity != null, "EMPTY_LEGACY_ANNOTATION");
            var created = instant(value.path("createdAt"));
            var updated = instant(value.path("updatedAt"));
            ordered(created, updated);
            return new Annotation(ref, note, example, familiarity, created, updated);
        });
    }

    private static void favorites(JsonNode raw, JsonNode dates, boolean datesDeclared, Collector out) {
        var refs = new LinkedHashSet<String>();
        if (raw != null) out.run(Category.STORAGE, FAVORITES, () -> {
            require(raw.isArray(), "EXPECTED_ARRAY");
            int index = 0;
            for (var item : raw) {
                int position = index++;
                out.run(Category.FAVORITE, "#" + position, () -> {
                    if (!refs.add(vocabulary(item))) out.warnings.add("DUPLICATE_FAVORITE_REFERENCES_COLLAPSED");
                });
            }
        });
        if (datesDeclared && (dates == null || !dates.isObject())) {
            if (dates != null) out.issue(Category.STORAGE, FAVORITE_DATES, "EXPECTED_OBJECT", Outcome.INVALID);
            for (var ref : refs) out.issue(Category.FAVORITE, ref, "SAVED_DATE_SOURCE_UNREADABLE", Outcome.UNSUPPORTED);
            return;
        }
        for (var ref : refs.stream().sorted().toList()) {
            out.run(Category.FAVORITE, ref, () -> {
                var time = dates == null ? null : optionalInstant(dates.path(ref));
                require(time == null || time.isAfter(Instant.EPOCH), "INVALID_SAVED_TIMESTAMP");
                if (time == null) out.warnings.add("SOME_FAVORITES_HAVE_NO_SAVED_TIMESTAMP");
                out.add(Category.FAVORITE, ref, new Favorite(ref, time));
            });
        }
        if (dates != null) for (var item : dates.properties()) {
            if (!refs.contains(item.getKey())) {
                out.issue(Category.FAVORITE, item.getKey(), "ORPHAN_SAVED_TIMESTAMP", Outcome.UNSUPPORTED);
            }
        }
    }

    record Candidate(Category category, String reference, Object value) {}
    record Issue(Category category, String reference, Outcome outcome, String code) {}
    record Normalized(List<Candidate> candidates, List<Issue> issues, List<String> warnings) {}
    record StudyDay(LocalDate day, long activeMs) {}
    record Preferences(ReadingFontSize fontSize, boolean translations) {}
    record Favorite(String reference, Instant savedAt) {}
    record Annotation(String reference, String note, String example, Familiarity familiarity, Instant createdAt, Instant updatedAt) {}

    private static final class Collector {
        private final List<Candidate> candidates = new ArrayList<>();
        private final List<Issue> issues = new ArrayList<>();
        private final Set<String> warnings = new LinkedHashSet<>();

        void add(Category category, String reference, Object value) {
            candidates.add(new Candidate(category, reference, value));
            if (category == Category.GAME || category == Category.SIMULATION || category == Category.FLASHCARD) {
                warnings.add("LEGACY_SESSIONS_STORE_RECORDED_OBSERVATIONS_ONLY");
            }
            bound();
        }

        void issue(Category category, String ref, String code, Outcome status) {
            issues.add(new Issue(category, ref, status, code));
            bound();
        }

        void run(Category category, String ref, Runnable work) {
            try {
                work.run();
            } catch (Invalid error) {
                var code = error.getMessage();
                var unsupported = code.startsWith("UNSUPPORTED_") || code.equals("UNKNOWN_FIELD");
                issue(category, ref, code, unsupported ? Outcome.UNSUPPORTED : Outcome.INVALID);
            }
        }

        void map(Category category, JsonNode node, BiFunction<String, JsonNode, Object> mapper) {
            run(category, "$", () -> {
                var properties = object(node).properties().stream().sorted(java.util.Map.Entry.comparingByKey()).toList();
                for (var entry : properties) run(category, entry.getKey(),
                        () -> add(category, entry.getKey(), mapper.apply(entry.getKey(), entry.getValue())));
            });
        }

        void module(Category category, JsonNode node, boolean supported, BiFunction<String, JsonNode, Object> mapper) {
            if (absent(node)) return;
            if (!supported) {
                issue(category, "$", "CATEGORY_OUTSIDE_SOURCE_VERSION", Outcome.UNSUPPORTED);
                return;
            }
            map(category, node, (ref, item) -> mapper.apply(id(ref), item));
        }

        private void bound() {
            if (candidates.size() + issues.size() > 2500) throw invalid("The snapshot exceeds 2500 record entries.");
        }
    }
}
