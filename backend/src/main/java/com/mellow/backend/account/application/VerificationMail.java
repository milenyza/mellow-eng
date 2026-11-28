package com.mellow.backend.account.application;

import java.net.URI;
import java.time.Instant;

@FunctionalInterface
public interface VerificationMail {

    void send(Message message);

    enum Purpose {
        EMAIL_VERIFICATION, PASSWORD_RESET
    }

    record Message(String recipient, URI link, Instant expiresAt, Purpose purpose) {
        public String subject() {
            return switch (purpose) {
                case EMAIL_VERIFICATION -> "Mellow — confirme seu e-mail";
                case PASSWORD_RESET -> "Mellow — redefina sua senha";
            };
        }

        public String text() {
            return switch (purpose) {
                case EMAIL_VERIFICATION -> """
                        Confirme seu e-mail para concluir o cadastro no Mellow.

                        Abra este link e use a senha que você escolheu no cadastro:
                        %s

                        O link expira em %s (UTC).
                        Se você não iniciou o cadastro, ignore esta mensagem. Não compartilhe o link.
                        """.formatted(link, expiresAt);
                case PASSWORD_RESET -> """
                        Redefina a senha da sua conta no Mellow.

                        Abra o link abaixo para escolher uma nova senha:
                        %s

                        O link expira em %s (UTC).
                        Se você não pediu a recuperação, ignore esta mensagem. Não compartilhe o link.
                        """.formatted(link, expiresAt);
            };
        }

        @Override
        public String toString() {
            return "[account email redacted]";
        }
    }
}
