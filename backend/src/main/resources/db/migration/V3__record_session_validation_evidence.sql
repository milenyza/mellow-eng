ALTER TABLE mellow.game_session
    ADD COLUMN catalog_revision text,
    ADD COLUMN request_digest text,
    ADD COLUMN session_evidence jsonb,
    ADD CHECK (
        (catalog_revision IS NULL AND request_digest IS NULL AND session_evidence IS NULL)
        OR (catalog_revision IS NOT NULL AND request_digest IS NOT NULL
            AND catalog_revision ~ '^[a-f0-9]{64}$' AND request_digest ~ '^[a-f0-9]{64}$'
            AND session_evidence IS NOT NULL AND jsonb_typeof(session_evidence) = 'object')
    );

ALTER TABLE mellow.simulation_session
    ADD COLUMN catalog_revision text,
    ADD COLUMN request_digest text,
    ADD COLUMN session_evidence jsonb,
    ADD CHECK (
        (catalog_revision IS NULL AND request_digest IS NULL AND session_evidence IS NULL)
        OR (catalog_revision IS NOT NULL AND request_digest IS NOT NULL
            AND catalog_revision ~ '^[a-f0-9]{64}$' AND request_digest ~ '^[a-f0-9]{64}$'
            AND session_evidence IS NOT NULL AND jsonb_typeof(session_evidence) = 'object')
    );

ALTER TABLE mellow.flashcard_session
    ADD COLUMN catalog_revision text,
    ADD COLUMN request_digest text,
    ADD CHECK (
        (catalog_revision IS NULL AND request_digest IS NULL)
        OR (catalog_revision IS NOT NULL AND request_digest IS NOT NULL
            AND catalog_revision ~ '^[a-f0-9]{64}$' AND request_digest ~ '^[a-f0-9]{64}$')
    );
