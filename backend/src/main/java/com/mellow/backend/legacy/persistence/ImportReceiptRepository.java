package com.mellow.backend.legacy.persistence;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Timestamp;
import java.util.Optional;
import java.util.UUID;

import com.mellow.backend.legacy.api.ImportDto.Report;

@Repository
public class ImportReceiptRepository {
    private final JdbcTemplate jdbc;
    private final JsonMapper json;

    ImportReceiptRepository(JdbcTemplate jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public Optional<Report> find(UUID owner, String reference) {
        return jdbc.query("""
                SELECT report FROM mellow.legacy_import_receipt WHERE learner_id = ? AND request_ref = ?
                """, (row, index) -> json.readValue(row.getString(1), Report.class), owner, reference).stream().findFirst();
    }

    public boolean hasFingerprint(UUID owner, String fingerprint) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM mellow.legacy_import_receipt WHERE learner_id = ? AND snapshot_fingerprint = ?)
                """, Boolean.class, owner, fingerprint));
    }

    public void insert(UUID owner, Report report) {
        jdbc.update("""
                INSERT INTO mellow.legacy_import_receipt (learner_id, request_ref, snapshot_fingerprint, imported_at, report)
                VALUES (?, ?, ?, ?, CAST(? AS jsonb))
                """, owner, report.requestId(), report.snapshotFingerprint(), Timestamp.from(report.importedAt()),
                json.writeValueAsString(report));
    }
}
