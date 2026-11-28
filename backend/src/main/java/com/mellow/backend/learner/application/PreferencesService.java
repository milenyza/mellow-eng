package com.mellow.backend.learner.application;

import com.mellow.backend.learner.api.PreferencesDto;
import com.mellow.backend.learner.persistence.LearnerPreferences;
import com.mellow.backend.learner.persistence.LearnerPreferences.ReadingFontSize;
import com.mellow.backend.learner.persistence.LearnerPreferencesRepository;
import com.mellow.backend.progress.api.ResourceRevision;
import com.mellow.backend.progress.api.ResourceRevision.Snapshot;
import com.mellow.backend.progress.api.TrustedLearner;
import com.mellow.backend.progress.application.ProgressSupport;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.mellow.backend.progress.application.ProgressSupport.invalid;

@Service
@Transactional(readOnly = true)
public class PreferencesService {

    private final LearnerPreferencesRepository preferences;
    private final ProgressSupport support;

    PreferencesService(LearnerPreferencesRepository preferences, ProgressSupport support) {
        this.preferences = preferences;
        this.support = support;
    }

    public Snapshot<PreferencesDto.View> get(TrustedLearner owner) {
        support.verifyOwner(owner.id());
        return snapshot(preferences.findByLearnerId(owner.id()).orElse(null));
    }

    @Transactional
    public Snapshot<PreferencesDto.View> edit(TrustedLearner owner, ResourceRevision match, PreferencesDto.Patch patch) {
        if (patch.hasNoChanges()) throw invalid("Supply at least one supported preference.");
        var learner = support.lockOwner(owner.id());
        var record = preferences.findByLearnerId(owner.id()).orElse(null);
        match.check(record == null ? null : record.revision());
        var currentSize = record == null ? ReadingFontSize.NORMAL : record.readingFontSize();
        boolean currentTranslations = record != null && record.showReadingTranslations();
        var size = patch.fontSizeOr(currentSize);
        boolean translations = patch.translationsOr(currentTranslations);
        var now = ProgressSupport.now();
        if (record == null) {
            record = preferences.save(new LearnerPreferences(learner, size, translations, now));
        } else if (size != currentSize || translations != currentTranslations) {
            record.edit(size, translations, now.isBefore(record.updatedAt()) ? record.updatedAt() : now);
        }
        return snapshot(record);
    }

    private static Snapshot<PreferencesDto.View> snapshot(LearnerPreferences record) {
        var view = record == null ? new PreferencesDto.View(PreferencesDto.FontSize.NORMAL, false, null)
                : new PreferencesDto.View(PreferencesDto.FontSize.valueOf(record.readingFontSize().name()),
                        record.showReadingTranslations(), record.updatedAt());
        return new Snapshot<>(view, record == null ? null : record.revision());
    }
}
