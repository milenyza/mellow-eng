package com.mellow.backend.account.application;

import java.util.Locale;
import java.util.regex.Pattern;

final class AccountInput {

    private static final String ATOM = "[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+";
    private static final Pattern LOCAL_PART = Pattern.compile(ATOM + "(?:\\." + ATOM + ")*");
    private static final String LABEL = "[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?";
    private static final Pattern DOMAIN = Pattern.compile(LABEL + "(?:\\." + LABEL + ")+");

    private AccountInput() {}

    static Email email(String input) {
        if (input == null) throw AccountRequestException.invalidInput();
        String original = input.strip();
        if (original.length() > 254) throw AccountRequestException.invalidInput();
        int separator = original.indexOf('@');
        if (separator < 1 || separator > 64
                || !LOCAL_PART.matcher(original.substring(0, separator)).matches()
                || !DOMAIN.matcher(original.substring(separator + 1)).matches()) {
            throw AccountRequestException.invalidInput();
        }
        return new Email(original, original.toLowerCase(Locale.ROOT));
    }

    static String displayName(String input) {
        if (input == null) throw AccountRequestException.invalidInput();
        String name = input.strip();
        if (name.isEmpty() || name.codePointCount(0, name.length()) > 80
                || name.codePoints().anyMatch(value -> Character.isISOControl(value) || isSurrogate(value))) {
            throw AccountRequestException.invalidInput();
        }
        return name;
    }

    static boolean validPassword(String password) {
        if (password == null || password.length() > 256) return false;
        int length = password.codePointCount(0, password.length());
        return length >= 15 && length <= 128 && password.codePoints().noneMatch(AccountInput::isSurrogate);
    }

    private static boolean isSurrogate(int value) {
        return value >= Character.MIN_SURROGATE && value <= Character.MAX_SURROGATE;
    }

    record Email(String original, String canonical) {
        @Override
        public String toString() {
            return "[email redacted]";
        }
    }
}
