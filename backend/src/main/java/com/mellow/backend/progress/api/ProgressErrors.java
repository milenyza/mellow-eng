package com.mellow.backend.progress.api;

import com.mellow.backend.lesson.api.LessonProgressController;
import com.mellow.backend.reading.api.ReadingProgressController;
import com.mellow.backend.study.api.SessionController;
import com.mellow.backend.legacy.api.LegacyImportController;
import com.mellow.backend.learner.api.PreferencesController;
import com.mellow.backend.vocabulary.api.VocabularyController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice(assignableTypes = {LessonProgressController.class, ReadingProgressController.class, SessionController.class,
        VocabularyController.class, PreferencesController.class, LegacyImportController.class})
class ProgressErrors {

    private static final Logger LOGGER = LoggerFactory.getLogger(ProgressErrors.class);

    @ExceptionHandler(ResponseStatusException.class)
    ProblemDetail domain(ResponseStatusException error) {
        return error.getBody();
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentNotValidException.class,
            HandlerMethodValidationException.class, MethodArgumentTypeMismatchException.class})
    ProblemDetail malformed() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "The progress request has invalid fields.");
    }

    @ExceptionHandler(RuntimeException.class)
    ProblemDetail unexpected(RuntimeException error) {
        LOGGER.error("Progress request failed: {}", error.getClass().getSimpleName());
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Progress could not be processed.");
    }
}
