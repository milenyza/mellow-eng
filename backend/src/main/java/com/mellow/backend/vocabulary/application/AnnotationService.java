package com.mellow.backend.vocabulary.application;

import com.mellow.backend.progress.api.ResourceRevision;
import com.mellow.backend.progress.api.ResourceRevision.Snapshot;
import com.mellow.backend.progress.api.TrustedLearner;
import com.mellow.backend.progress.application.ProgressSupport;
import com.mellow.backend.study.application.SessionCatalog;
import com.mellow.backend.vocabulary.api.VocabularyDto.Annotation;
import com.mellow.backend.vocabulary.api.VocabularyDto.AnnotationPatch;
import com.mellow.backend.vocabulary.api.VocabularyDto.FamiliarityValue;
import com.mellow.backend.vocabulary.api.VocabularyDto.Page;
import com.mellow.backend.vocabulary.persistence.VocabularyAnnotation;
import com.mellow.backend.vocabulary.persistence.VocabularyAnnotationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Objects;
import java.util.regex.Pattern;

import static com.mellow.backend.progress.application.ProgressSupport.invalid;

@Service
@Transactional(readOnly = true)
public class AnnotationService {

    private static final Pattern BLANK = Pattern.compile(
            "[\\t\\n\\x0B\\f\\r\\x20\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF]*");
    private final VocabularyAnnotationRepository annotations;
    private final SessionCatalog catalog;
    private final ProgressSupport support;

    AnnotationService(VocabularyAnnotationRepository annotations, SessionCatalog catalog, ProgressSupport support) {
        this.annotations = annotations;
        this.catalog = catalog;
        this.support = support;
    }

    public Page<Annotation> list(TrustedLearner owner, int page, int size) {
        support.verifyOwner(owner.id());
        return Page.from(annotations.findByLearner_IdAndRemovedFalse(owner.id(), Page.request(page, size))
                .map(record -> view(record.vocabularyRef(), record)));
    }

    public Snapshot<Annotation> get(TrustedLearner owner, String ref) {
        support.verifyOwner(owner.id());
        return snapshot(ref, annotations.findByLearner_IdAndVocabularyRef(owner.id(), ref).orElse(null));
    }

    @Transactional
    public Snapshot<Annotation> edit(TrustedLearner owner, String ref, ResourceRevision match, AnnotationPatch patch) {
        if (patch.hasNoChanges()) throw invalid("Supply at least one annotation field.");
        return change(owner, ref, match, patch);
    }

    @Transactional
    public Snapshot<Annotation> delete(TrustedLearner owner, String ref, ResourceRevision match) {
        return change(owner, ref, match, null);
    }

    private Snapshot<Annotation> change(TrustedLearner owner, String ref, ResourceRevision match, AnnotationPatch patch) {
        var learner = support.lockOwner(owner.id());
        var record = annotations.findByLearner_IdAndVocabularyRef(owner.id(), ref).orElse(null);
        match.check(record == null ? null : record.revision());
        boolean available = catalog.describeVocabulary(ref).isPresent();
        String oldNote = record == null ? null : record.note();
        String oldExample = record == null ? null : record.personalExample();
        var oldFamiliarity = record == null ? null : record.familiarity();

        String note = patch == null ? null : patch.noteOr(oldNote, AnnotationService::text);
        String example = patch == null ? null : patch.exampleOr(oldExample, AnnotationService::text);
        var familiarity = patch == null ? null : patch.familiarityOr(oldFamiliarity);
        boolean empty = note == null && example == null && familiarity == null;
        Instant now = ProgressSupport.now();
        if (record == null) {
            if (!available) {
                if (patch != null) throw invalid("The vocabulary reference is not currently available.");
                return snapshot(ref, null);
            }
            if (empty && patch != null) return snapshot(ref, null);
            record = new VocabularyAnnotation(learner, ref, note, example, familiarity, now, now);
            if (empty) record.edit(null, null, null, now);
            return snapshot(ref, annotations.save(record));
        }
        if (record.removed() && !empty && !available) {
            throw invalid("The vocabulary reference is not currently available.");
        }
        if (!Objects.equals(note, oldNote) || !Objects.equals(example, oldExample) || familiarity != oldFamiliarity) {
            record.edit(note, example, familiarity, now.isBefore(record.updatedAt()) ? record.updatedAt() : now);
        }
        return snapshot(ref, record);
    }

    private static String text(String value) {
        if (value == null || BLANK.matcher(value).matches()) return null;
        if (value.indexOf(0) >= 0 || !StandardCharsets.UTF_8.newEncoder().canEncode(value)) {
            throw invalid("Annotation text contains an unsupported character.");
        }
        return value;
    }

    private Snapshot<Annotation> snapshot(String ref, VocabularyAnnotation record) {
        return new Snapshot<>(view(ref, record), record == null ? null : record.revision());
    }

    private Annotation view(String ref, VocabularyAnnotation record) {
        boolean available = catalog.describeVocabulary(ref).isPresent();
        if (record == null || record.removed()) return new Annotation(ref, available, null, null, null, null, null);
        return new Annotation(ref, available, record.note(), record.personalExample(),
                FamiliarityValue.from(record.familiarity()), record.createdAt(), record.updatedAt());
    }
}
