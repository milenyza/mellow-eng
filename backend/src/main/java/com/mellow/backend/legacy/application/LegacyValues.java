package com.mellow.backend.legacy.application;

import tools.jackson.databind.JsonNode;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;

final class LegacyValues {
    private static final long MAX = 8_640_000_000_000_000L;
    private static final Set<String> RESERVED = Set.of("__proto__", "constructor", "prototype");

    private LegacyValues() {}

    static void require(boolean allowed, String code) {
        if (!allowed) throw new Invalid(code);
    }

    static JsonNode object(JsonNode value, String... keys) {
        require(value.isObject(), "EXPECTED_OBJECT");
        if (keys.length > 0) {
            var allowed = Set.of(keys);
            require(value.properties().stream().allMatch(item -> allowed.contains(item.getKey())), "UNKNOWN_FIELD");
        }
        return value;
    }

    static <T> List<T> array(JsonNode value, Function<JsonNode, T> mapper) {
        require(value.isArray(), "EXPECTED_ARRAY");
        return value.values().stream().map(mapper).toList();
    }

    static <T> Map<String, T> entries(JsonNode value, Function<JsonNode, T> mapper) {
        object(value);
        var result = new TreeMap<String, T>();
        value.properties().forEach(entry -> result.put(id(entry.getKey()), mapper.apply(entry.getValue())));
        return result;
    }

    static boolean absent(JsonNode value) {
        return value.isMissingNode();
    }

    static String id(JsonNode value) {
        return id(string(value, 160));
    }

    static String id(String value) {
        require(value.matches("[A-Za-z0-9_-]{1,160}") && !RESERVED.contains(value), "INVALID_REFERENCE");
        return value;
    }

    static String vocabulary(JsonNode value) {
        String ref = string(value, 1024);
        require(!blank(ref), "INVALID_VOCABULARY_REFERENCE");
        return ref;
    }

    static String vocabularyId(JsonNode value) {
        String ref = vocabulary(value);
        for (String part : ref.split("/", -1)) id(part);
        return ref;
    }

    static boolean blank(String value) {
        return value.matches("[\\t\\n\\x0B\\f\\r\\x20\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF]*");
    }

    static String string(JsonNode value, int size) {
        require(value.isString(), "EXPECTED_STRING");
        String text = value.stringValue();
        require(text.length() <= size, "TEXT_LIMIT_EXCEEDED");
        require(text.indexOf(0) < 0 && StandardCharsets.UTF_8.newEncoder().canEncode(text), "INVALID_TEXT");
        return text;
    }

    static String optionalText(JsonNode value, int size) {
        return absent(value) ? null : string(value, size);
    }

    static boolean bool(JsonNode value) {
        require(value.isBoolean(), "EXPECTED_BOOLEAN");
        return value.booleanValue();
    }

    static long number(JsonNode value) {
        require(value.isIntegralNumber() && value.canConvertToLong(), "EXPECTED_MILLISECONDS_OR_COUNT");
        long number = value.longValue();
        require(number >= 0 && number <= MAX, "VALUE_OUT_OF_RANGE");
        return number;
    }

    static Instant instant(JsonNode value) {
        return Instant.ofEpochMilli(number(value));
    }

    static Instant optionalInstant(JsonNode value) {
        return absent(value) ? null : instant(value);
    }

    static void ordered(Instant earlier, Instant later) {
        require(later == null || !later.isBefore(earlier), "INVALID_TIME_ORDER");
    }

    static LocalDate day(String value) {
        require(value.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}") && !value.startsWith("0000"), "INVALID_CALENDAR_DATE");
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException invalid) {
            throw new Invalid("INVALID_CALENDAR_DATE");
        }
    }

    static Map<LocalDate, Long> sessionDays(JsonNode value, long total) {
        var buckets = new TreeMap<LocalDate, Long>();
        object(value).properties().forEach(entry -> buckets.put(day(entry.getKey()), number(entry.getValue())));
        long sum = 0;
        for (long ms : buckets.values()) {
            require(ms <= total - sum, "INCONSISTENT_DAY_TOTAL");
            sum += ms;
        }
        require(sum == total, "INCONSISTENT_DAY_TOTAL");
        return buckets;
    }

    static <T> List<T> unique(List<T> items) {
        require(new LinkedHashSet<>(items).size() == items.size(), "REPEATED_REFERENCE");
        return items;
    }

    static <E extends Enum<E>> E enumeration(Class<E> type, JsonNode value) {
        String name = string(value, 32);
        require(name.matches("[A-Za-z0-9_-]+"), "UNSUPPORTED_VALUE");
        try {
            return Enum.valueOf(type, name.replace('-', '_').toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException wrongValue) {
            throw new Invalid("UNSUPPORTED_VALUE");
        }
    }

    static final class Invalid extends RuntimeException {
        Invalid(String code) { super(code, null, false, false); }
    }
}
