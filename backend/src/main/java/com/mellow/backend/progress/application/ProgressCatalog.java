package com.mellow.backend.progress.application;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static com.mellow.backend.progress.application.ProgressSupport.invalid;

@Component
public class ProgressCatalog {

    private final Catalog catalog;

    ProgressCatalog(JsonMapper json) throws IOException {
        try (var resource = new ClassPathResource("catalog/progress-v1.json").getInputStream()) {
            catalog = json.readValue(resource, Catalog.class);
        }
        if (catalog.revision() != 1) throw new IllegalStateException("Unsupported progress catalog revision");
    }

    public Map<String, Block> lesson(String reference) {
        return known(catalog.lessons(), reference);
    }

    public Map<String, Chapter> story(String reference) {
        return known(catalog.stories(), reference);
    }

    public static <T> T known(Map<String, T> entries, String reference) {
        var value = entries.get(reference);
        if (value == null) throw invalid("The referenced content does not belong to the published catalog.");
        return value;
    }

    public record Catalog(int revision, Map<String, Map<String, Block>> lessons,
                          Map<String, Map<String, Chapter>> stories) {
    }

    public record Block(boolean required, List<String> listeningRefs, Map<String, Rule> exercises) {
    }

    public record Chapter(List<String> paragraphs, List<String> exerciseOrder, Map<String, Rule> exercises) {
    }

    public record Rule(boolean required, String kind, List<String> choices, String correctOptionId,
                       Map<String, List<String>> accepted, Map<String, String> pairs, Map<String, String> tiles,
                       List<List<String>> orders, Boolean correctValue) {
    }
}
