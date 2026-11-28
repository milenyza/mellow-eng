package com.mellow.backend.progress.application;

import com.mellow.backend.exercise.persistence.ExerciseResult;
import com.mellow.backend.exercise.persistence.ExerciseResult.Mode;
import com.mellow.backend.progress.api.ExerciseSnapshots;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import static com.mellow.backend.progress.application.ProgressSupport.conflict;
import static com.mellow.backend.progress.application.ProgressSupport.invalid;
import static com.mellow.backend.progress.application.ProgressSupport.validateTime;

@Component
public class ExerciseProgress {

    private final JsonMapper json;

    ExerciseProgress(JsonMapper json) {
        this.json = json;
    }

    public ExerciseSnapshots.View read(ExerciseResult entity) {
        return new ExerciseSnapshots.View(parse(entity.draft()), entity.status(), entity.reviewedAt(),
                entity.submissions().stream().map(item -> new ExerciseSnapshots.SubmissionView(
                        parse(item.answer()), item.correct(), item.submittedAt(), item.mode())).toList());
    }

    public void write(ExerciseResult entity, ExerciseSnapshots.View view) {
        entity.update(serialize(view.draft()), view.status(), view.reviewedAt(),
                view.submissions().stream().map(item -> new ExerciseResult.Submission(
                        serialize(item.answer()), item.correct(), item.submittedAt(), item.mode())).toList());
    }

    private JsonNode parse(String value) {
        return value == null ? null : json.readTree(value);
    }

    private String serialize(JsonNode node) {
        return node == null ? null : json.writeValueAsString(node);
    }

    public ExerciseSnapshots.View validate(ExerciseSnapshots.Input input, ProgressCatalog.Rule rule,
                                           ExerciseSnapshots.View previous, Instant start, Instant now,
                                           boolean listening) {
        var draft = input.draft() == null || input.draft().isNull() ? null : input.draft();
        if (draft != null) evaluate(rule, draft, false);
        var submissions = new ArrayList<ExerciseSnapshots.SubmissionView>();
        Instant lastAt = start;
        boolean correct = false;
        for (var item : input.submissions()) {
            validateTime(item.submittedAt(), lastAt, now);
            if (correct || (listening ? item.mode() == Mode.PRACTICE : item.mode() != Mode.PRACTICE)) {
                throw invalid("The submission sequence or mode is invalid.");
            }
            correct = evaluate(rule, item.answer(), true);
            submissions.add(new ExerciseSnapshots.SubmissionView(item.answer(), correct, item.submittedAt(), item.mode()));
            lastAt = item.submittedAt();
        }
        var last = submissions.isEmpty() ? null : submissions.getLast();
        boolean reviewed = input.status() == ExerciseResult.Status.REVIEWED;
        if (reviewed) validateTime(input.reviewedAt(), lastAt, now);
        boolean valid = switch (input.status()) {
            case EDITING -> !correct;
            case CORRECT -> correct && Objects.equals(last.answer(), draft);
            case INCORRECT, REVIEWED -> !correct && last != null && Objects.equals(last.answer(), draft);
        };
        if (!valid || (input.reviewedAt() != null) != reviewed) {
            throw invalid("The exercise status does not match its submissions or review.");
        }
        var next = new ExerciseSnapshots.View(draft, input.status(), input.reviewedAt(), List.copyOf(submissions));
        if (previous != null) {
            int oldSize = previous.submissions().size();
            if (oldSize > submissions.size() || !submissions.subList(0, oldSize).equals(previous.submissions())
                    || (previous.resolved() && !previous.equals(next))) {
                throw conflict("A retained submission or resolved exercise cannot be rewritten.");
            }
        }
        return next;
    }

    public static boolean matches(Map<String, ExerciseSnapshots.Input> requested,
                                  Map<String, ExerciseSnapshots.View> retained) {
        return requested.keySet().equals(retained.keySet())
                && requested.entrySet().stream().allMatch(entry -> matches(entry.getValue(), retained.get(entry.getKey())));
    }

    private static boolean matches(ExerciseSnapshots.Input requested, ExerciseSnapshots.View retained) {
        JsonNode draft = requested.draft();
        if (draft != null && draft.isNull()) draft = null;
        if (!Objects.equals(draft, retained.draft()) || requested.status() != retained.status()
                || !Objects.equals(requested.reviewedAt(), retained.reviewedAt())
                || requested.submissions().size() != retained.submissions().size()) return false;
        for (int index = 0; index < requested.submissions().size(); index++) {
            var submitted = requested.submissions().get(index);
            var stored = retained.submissions().get(index);
            if (!Objects.equals(submitted.answer(), stored.answer()) || submitted.mode() != stored.mode()
                    || !Objects.equals(submitted.submittedAt(), stored.submittedAt())) return false;
        }
        return true;
    }

    public boolean evaluate(ProgressCatalog.Rule rule, JsonNode answer, boolean submitted) {
        if (!answer.isObject() || !answer.path("kind").isString()
                || !rule.kind().equals(answer.path("kind").stringValue()) || answer.size() != 2) {
            throw invalid("The answer must match the exercise shape.");
        }
        return switch (rule.kind()) {
            case "multiple-choice" -> rule.correctOptionId().equals(choice(answer.path("optionId"), rule.choices()));
            case "true-or-false" -> {
                var value = answer.path("value");
                if (!value.isBoolean()) throw invalid("A boolean answer is required.");
                yield value.booleanValue() == rule.correctValue();
            }
            case "fill-in-the-blanks" -> {
                var values = answer.path("values");
                validateMap(values, rule.accepted().keySet(), submitted);
                boolean matches = true;
                for (var entry : rule.accepted().entrySet()) {
                    var text = values.path(entry.getKey());
                    String raw = text.isMissingNode() ? "" : text.stringValue();
                    if (raw.indexOf(0) >= 0 || !StandardCharsets.UTF_8.newEncoder().canEncode(raw)) {
                        throw invalid("An exercise answer contains an unsupported text character.");
                    }
                    String selected = normalize(raw);
                    if (submitted && selected.isEmpty()) throw invalid("Complete every blank before submitting.");
                    matches &= entry.getValue().stream().map(ExerciseProgress::normalize).anyMatch(selected::equals);
                }
                yield matches;
            }
            case "matching-pairs" -> {
                var values = answer.path("pairs");
                validateMap(values, rule.pairs().keySet(), submitted);
                var seen = new HashSet<String>();
                boolean matches = true;
                for (var entry : values.properties()) {
                    String value = entry.getValue().stringValue();
                    if (!(value.isEmpty() && !submitted) && (!rule.choices().contains(value) || !seen.add(value))) {
                        throw invalid("A matching choice is unavailable or repeated.");
                    }
                    matches &= rule.pairs().get(entry.getKey()).equals(value);
                }
                yield matches && values.size() == rule.pairs().size();
            }
            case "sequence-ordering", "sentence-builder" -> {
                boolean sentence = rule.tiles() != null;
                var values = answer.path(sentence ? "tileIds" : "itemIds");
                var options = sentence ? rule.tiles().keySet() : rule.choices();
                int length = rule.orders().getFirst().size();
                if (!values.isArray() || values.size() > length || (submitted && values.size() != length)) {
                    throw invalid("The answer order is incomplete or invalid.");
                }
                var selected = new ArrayList<String>();
                for (var value : values) selected.add(choice(value, options));
                if (new HashSet<>(selected).size() != selected.size()) throw invalid("An answer item is repeated.");
                yield sentence
                        ? rule.orders().stream().anyMatch(order -> order.stream().map(rule.tiles()::get).toList()
                                .equals(selected.stream().map(rule.tiles()::get).toList()))
                        : rule.orders().contains(selected);
            }
            default -> throw new IllegalStateException("Unsupported exercise");
        };
    }

    private static String choice(JsonNode value, java.util.Collection<String> choices) {
        if (!value.isString() || !choices.contains(value.stringValue())) {
            throw invalid("An answer choice is unavailable.");
        }
        return value.stringValue();
    }

    private static void validateMap(JsonNode values, Set<String> fields, boolean submitted) {
        if (!values.isObject() || (submitted && values.size() != fields.size())
                || values.properties().stream().anyMatch(item -> !fields.contains(item.getKey()) || !item.getValue().isString())) {
            throw invalid("The answer contains missing or invalid fields.");
        }
    }

    private static String normalize(String text) {
        return text.replaceAll("[\\t\\n\\x0B\\f\\r\\x20\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF]+", " ")
                .replaceAll("^ | $", "").toLowerCase(java.util.Locale.ROOT);
    }
}
