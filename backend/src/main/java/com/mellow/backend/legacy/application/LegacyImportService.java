package com.mellow.backend.legacy.application;

import com.mellow.backend.legacy.api.ImportDto;
import com.mellow.backend.legacy.api.ImportDto.Category;
import com.mellow.backend.legacy.api.ImportDto.Entry;
import com.mellow.backend.legacy.api.ImportDto.Outcome;
import com.mellow.backend.legacy.api.ImportDto.Report;
import com.mellow.backend.legacy.api.ImportDto.Snapshot;
import com.mellow.backend.legacy.api.ImportDto.Status;
import com.mellow.backend.legacy.persistence.ImportReceiptRepository;
import com.mellow.backend.progress.api.TrustedLearner;
import com.mellow.backend.progress.application.ProgressSupport;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import static com.mellow.backend.progress.application.ProgressSupport.*;

@Service
public class LegacyImportService {
    private final ProgressSupport support;
    private final LegacySnapshotParser parser;
    private final LegacyNormalizer normalizer;
    private final LegacyDomainReader reader;
    private final LegacyDomainWriter writer;
    private final ImportReceiptRepository receipts;
    private final EntityManager entities;

    LegacyImportService(ProgressSupport support, LegacySnapshotParser parser, LegacyNormalizer normalizer,
                        LegacyDomainReader reader, LegacyDomainWriter writer, ImportReceiptRepository receipts,
                        EntityManager entities) {
        this.support = support;
        this.parser = parser;
        this.normalizer = normalizer;
        this.reader = reader;
        this.writer = writer;
        this.receipts = receipts;
        this.entities = entities;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Report plan(TrustedLearner owner, Snapshot snapshot) {
        support.verifyOwner(owner.id());
        return prepare(owner, snapshot, fingerprint(snapshot)).report();
    }

    @Transactional
    public Report apply(TrustedLearner owner, String ref, ImportDto.Apply input) {
        var snapshot = input.snapshot();
        if (!ref.equals(snapshot.requestId())) throw invalid("The path and snapshot request identifier must agree.");
        var learner = support.lockOwner(owner.id());
        String fingerprint = fingerprint(snapshot);
        var retained = receipts.find(owner.id(), ref).orElse(null);
        if (retained != null) {
            if (!retained.snapshotFingerprint().equals(fingerprint)) {
                throw conflict("This import request identifier already refers to another snapshot.");
            }
            return retained;
        }
        var plan = prepare(owner, snapshot, fingerprint);
        if (!plan.report().planToken().equals(input.planToken())) {
            throw conflict("The import plan has changed. Generate and review another dry run.");
        }
        boolean skipped = plan.report().entries().stream().anyMatch(item ->
                item.outcome() == Outcome.CONFLICT || item.outcome() == Outcome.INVALID || item.outcome() == Outcome.UNSUPPORTED);
        if (skipped && !input.acceptSkipped()) {
            throw conflict("The plan contains records requiring acknowledgement before importing eligible items.");
        }
        Instant at = now();
        plan.eligible().forEach(record -> writer.insert(learner, record, at));
        entities.flush();
        var entries = plan.report().entries().stream().map(item -> item.outcome() == Outcome.ELIGIBLE
                ? new Entry(item.category(), item.locator(), Outcome.IMPORTED, "INSERTED") : item).toList();
        var report = report(snapshot, plan.report().snapshotFingerprint(), plan.report().planToken(),
                plan.report().previouslyImportedSnapshot(), at, skipped ? Status.APPLIED_WITH_SKIPS : Status.APPLIED,
                plan.report().storageVersions(), entries, plan.report().warnings());
        receipts.insert(owner.id(), report);
        return report;
    }

    @Transactional(readOnly = true)
    public Report get(TrustedLearner owner, String ref) {
        support.verifyOwner(owner.id());
        return receipts.find(owner.id(), ref).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Import was not found."));
    }

    private String fingerprint(Snapshot snapshot) {
        return support.fingerprint(List.of(snapshot.formatVersion(), snapshot.storage()));
    }

    private Plan prepare(TrustedLearner owner, Snapshot snapshot, String fingerprint) {
        var parsed = parser.parse(snapshot);
        var data = normalizer.normalize(parsed);
        var eligible = new ArrayList<LegacyNormalizer.Candidate>();
        var entries = new ArrayList<Entry>();
        var state = new ArrayList<String>();
        for (var record : data.candidates()) {
            var existing = reader.read(owner, record);
            var locator = locator(record.category(), record.reference());
            state.add(support.fingerprint(List.of(locator, record.value(), existing)));
            if (!existing.hasRecord()) {
                eligible.add(record);
                entries.add(new Entry(record.category(), locator, Outcome.ELIGIBLE, "INSERT"));
            } else if (existing.samePrecision() && record.value().equals(existing.comparison())) {
                entries.add(new Entry(record.category(), locator, Outcome.IDENTICAL, "ALREADY_PRESENT"));
            } else {
                entries.add(new Entry(record.category(), locator, Outcome.CONFLICT,
                        existing.removed() ? "SERVER_REMOVAL_RETAINED" : "SERVER_VALUE_RETAINED"));
            }
        }
        data.issues().forEach(issue -> entries.add(new Entry(issue.category(), locator(issue.category(), issue.reference()),
                issue.outcome(), issue.code())));
        boolean seen = receipts.hasFingerprint(owner.id(), fingerprint);
        String token = support.fingerprint(Arrays.asList("legacy-plan-v1", owner.id(), snapshot.requestId(),
                fingerprint, snapshot.exportedAt(), seen, state, entries, parsed.versions(), data.warnings()));
        return new Plan(report(snapshot, fingerprint, token, seen, null, Status.DRY_RUN, parsed.versions(), entries, data.warnings()),
                eligible);
    }

    private String locator(Category category, String ref) {
        return support.fingerprint(List.of(category, ref));
    }

    private static Report report(Snapshot snapshot, String fingerprint, String token, boolean seen, Instant importedAt,
                                 Status status, List<ImportDto.StorageVersion> versions, List<Entry> entries, List<String> warnings) {
        var counts = new EnumMap<Category, Map<Outcome, Long>>(Category.class);
        for (var entry : entries) {
            counts.computeIfAbsent(entry.category(), ignored -> new EnumMap<>(Outcome.class)).merge(entry.outcome(), 1L, Long::sum);
        }
        return new Report(snapshot.requestId(), status, fingerprint, token, seen, snapshot.exportedAt(), importedAt,
                versions, counts, entries, warnings);
    }

    private record Plan(Report report, List<LegacyNormalizer.Candidate> eligible) {}
}
