package com.mellow.backend.learner.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.mellow.backend.learner.persistence.LearnerPreferences.ReadingFontSize;

import java.time.Instant;

public final class PreferencesDto {

    private PreferencesDto() {
    }

    public enum FontSize {
        @JsonProperty("normal") NORMAL,
        @JsonProperty("large") LARGE,
        @JsonProperty("extra-large") EXTRA_LARGE;

        public ReadingFontSize stored() { return ReadingFontSize.valueOf(name()); }
    }

    public record View(FontSize fontSize, boolean translations, Instant updatedAt) {
    }

    public static class Patch {
        private FontSize fontSize;
        private Boolean translations;
        private boolean hasFontSize;
        private boolean hasTranslations;

        @JsonSetter("fontSize")
        public void setFontSize(FontSize value) {
            hasFontSize = true;
            fontSize = value;
        }

        @JsonSetter("translations")
        public void setTranslations(Boolean value) {
            hasTranslations = true;
            translations = value;
        }

        public ReadingFontSize fontSizeOr(ReadingFontSize current) {
            if (!hasFontSize) return current;
            return fontSize == null ? ReadingFontSize.NORMAL : fontSize.stored();
        }

        public boolean translationsOr(boolean current) {
            return hasTranslations ? Boolean.TRUE.equals(translations) : current;
        }

        public boolean hasNoChanges() { return !hasFontSize && !hasTranslations; }
    }
}
