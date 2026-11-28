package com.mellow.backend.vocabulary.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.mellow.backend.flashcards.persistence.FlashcardSession.Source;
import com.mellow.backend.flashcards.persistence.FlashcardSession.VocabularyType;
import com.mellow.backend.vocabulary.persistence.VocabularyAnnotation.Familiarity;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.function.UnaryOperator;

import static com.mellow.backend.progress.application.ProgressSupport.invalid;

public final class VocabularyDto {

    public static final int MAX_REFERENCE = 1024;

    private VocabularyDto() {
    }

    public record Favorite(String vocabularyRef, boolean saved, Instant savedAt, LocalDate savedOn,
                           boolean available, Source source, VocabularyType type) {
    }

    public record Annotation(String vocabularyRef, boolean available, String note, String personalExample,
                             FamiliarityValue familiarity, Instant createdAt, Instant updatedAt) {
        @Override
        public String toString() {
            return "VocabularyAnnotationView";
        }
    }

    public enum FamiliarityValue {
        @JsonProperty("learning") LEARNING,
        @JsonProperty("reviewing") REVIEWING,
        @JsonProperty("familiar") FAMILIAR;

        public Familiarity stored() { return Familiarity.valueOf(name()); }

        public static FamiliarityValue from(Familiarity value) {
            return value == null ? null : valueOf(value.name());
        }
    }

    public static class AnnotationPatch {
        @Size(max = 1200)
        private String note;
        @Size(max = 400)
        private String personalExample;
        private FamiliarityValue familiarity;
        private boolean hasNote;
        private boolean hasExample;
        private boolean hasFamiliarity;

        @JsonSetter("note")
        public void setNote(String value) {
            hasNote = true;
            note = value;
        }

        @JsonSetter("personalExample")
        public void setPersonalExample(String value) {
            hasExample = true;
            personalExample = value;
        }

        @JsonSetter("familiarity")
        public void setFamiliarity(FamiliarityValue value) {
            hasFamiliarity = true;
            familiarity = value;
        }

        public String noteOr(String current, UnaryOperator<String> clean) { return hasNote ? clean.apply(note) : current; }
        public String exampleOr(String current, UnaryOperator<String> clean) { return hasExample ? clean.apply(personalExample) : current; }
        public Familiarity familiarityOr(Familiarity current) {
            return hasFamiliarity ? (familiarity == null ? null : familiarity.stored()) : current;
        }
        public boolean hasNoChanges() { return !hasNote && !hasExample && !hasFamiliarity; }
    }

    public record Page<T>(List<T> items, int page, int size, boolean hasNext) {
        public static PageRequest request(int page, int size) {
            if (page < 0 || page > 1000 || size < 1 || size > 100) {
                throw invalid("Page must be between 0 and 1000 and size between 1 and 100.");
            }
            return PageRequest.of(page, size, Sort.by("vocabularyRef"));
        }

        public static <T> Page<T> from(Slice<T> slice) {
            return new Page<>(slice.getContent(), slice.getNumber(), slice.getSize(), slice.hasNext());
        }
    }
}
