package com.mellow.backend.progress.api;

import com.mellow.backend.study.api.SessionController;
import com.mellow.backend.legacy.api.LegacyImportController;
import com.mellow.backend.legacy.api.ImportDto;
import com.mellow.backend.lesson.api.LessonProgressController;
import com.mellow.backend.lesson.api.LessonProgressDto;
import com.mellow.backend.reading.api.ReadingProgressController;
import com.mellow.backend.reading.api.ReadingProgressDto;
import com.mellow.backend.learner.api.PreferencesController;
import com.mellow.backend.vocabulary.api.VocabularyController;
import com.mellow.backend.study.api.SessionDto;
import com.mellow.backend.learner.api.PreferencesDto;
import com.mellow.backend.vocabulary.api.VocabularyDto;

import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;

@RestControllerAdvice(assignableTypes = {SessionController.class, VocabularyController.class, PreferencesController.class,
        LegacyImportController.class, LessonProgressController.class, ReadingProgressController.class})
class ProgressBodyLimit extends RequestBodyAdviceAdapter {

    private static final int MAX_BODY_BYTES = 256 * 1024;
    private static final int MAX_PROGRESS_BYTES = 2 * 1024 * 1024;

    @Override
    public boolean supports(MethodParameter parameter, Type targetType,
                            Class<? extends HttpMessageConverter<?>> converter) {
        return limit(parameter.getParameterType()) > 0;
    }

    @Override
    public HttpInputMessage beforeBodyRead(HttpInputMessage message, MethodParameter parameter, Type targetType,
                                           Class<? extends HttpMessageConverter<?>> converter) throws IOException {
        int maxBytes = limit(parameter.getParameterType());
        if (message.getHeaders().getContentLength() > maxBytes) throw tooLarge(maxBytes);
        byte[] body = message.getBody().readNBytes(maxBytes + 1);
        if (body.length > maxBytes) throw tooLarge(maxBytes);
        return new HttpInputMessage() {
            @Override
            public InputStream getBody() {
                return new ByteArrayInputStream(body);
            }

            @Override
            public HttpHeaders getHeaders() {
                return message.getHeaders();
            }
        };
    }

    private static int limit(Class<?> type) {
        if (type == ImportDto.Snapshot.class || type == ImportDto.Apply.class) return ImportDto.MAX_BYTES;
        if (type == LessonProgressDto.Write.class || type == ReadingProgressDto.Write.class) return MAX_PROGRESS_BYTES;
        if (SessionDto.Write.class.isAssignableFrom(type) || type == VocabularyDto.AnnotationPatch.class
                || type == PreferencesDto.Patch.class) return MAX_BODY_BYTES;
        return 0;
    }

    private static ResponseStatusException tooLarge(int maxBytes) {
        return new ResponseStatusException(HttpStatus.CONTENT_TOO_LARGE, "Payload exceeds " + maxBytes / 1024 + " KiB.");
    }
}
