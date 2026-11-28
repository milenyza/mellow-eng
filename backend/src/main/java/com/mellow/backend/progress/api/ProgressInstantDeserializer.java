package com.mellow.backend.progress.api;

import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;

import java.time.Instant;
import java.time.format.DateTimeParseException;

public class ProgressInstantDeserializer extends ValueDeserializer<Instant> {

    @Override
    public Instant deserialize(JsonParser parser, DeserializationContext context) {
        if (!parser.hasToken(JsonToken.VALUE_STRING)) {
            return context.reportInputMismatch(Instant.class, "A timestamp must be an ISO-8601 string.");
        }
        try {
            return Instant.parse(parser.getString());
        } catch (DateTimeParseException invalid) {
            return context.reportInputMismatch(Instant.class, "A timestamp must be an ISO-8601 instant.");
        }
    }
}
