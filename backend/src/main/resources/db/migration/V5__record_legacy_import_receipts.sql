CREATE TABLE mellow.legacy_import_receipt (
    learner_id uuid NOT NULL REFERENCES mellow.learner(id),
    request_ref text NOT NULL CHECK (request_ref ~ '^[A-Za-z0-9_-]{1,160}$'),
    snapshot_fingerprint text NOT NULL CHECK (snapshot_fingerprint ~ '^[a-f0-9]{64}$'),
    imported_at timestamptz NOT NULL,
    report jsonb NOT NULL CHECK (jsonb_typeof(report) = 'object'),
    PRIMARY KEY (learner_id, request_ref)
);
CREATE INDEX legacy_import_by_snapshot ON mellow.legacy_import_receipt (learner_id, snapshot_fingerprint);

ALTER TABLE mellow.game_session ADD COLUMN legacy_imported boolean NOT NULL DEFAULT false,
    ADD CHECK (NOT legacy_imported OR catalog_revision IS NULL);
ALTER TABLE mellow.simulation_session ADD COLUMN legacy_imported boolean NOT NULL DEFAULT false,
    ADD CHECK (NOT legacy_imported OR catalog_revision IS NULL);
ALTER TABLE mellow.flashcard_session ADD COLUMN legacy_imported boolean NOT NULL DEFAULT false,
    ADD CHECK (NOT legacy_imported OR catalog_revision IS NULL);

ALTER TABLE mellow.lesson_run ADD COLUMN legacy_first_snapshot jsonb,
    ADD CHECK (legacy_first_snapshot IS NULL OR (first_completion AND jsonb_typeof(legacy_first_snapshot) = 'object'));
ALTER TABLE mellow.reading_run ADD COLUMN legacy_first_snapshot jsonb,
    ADD CHECK (legacy_first_snapshot IS NULL OR (first_completion AND jsonb_typeof(legacy_first_snapshot) = 'object'));
