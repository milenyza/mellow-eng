ALTER TABLE mellow.learner
    ADD COLUMN display_name varchar(80),
    ADD CONSTRAINT learner_display_name_nonempty CHECK (display_name IS NULL OR char_length(btrim(display_name)) > 0);

CREATE TABLE mellow.account (
    id uuid PRIMARY KEY,
    learner_id uuid NOT NULL UNIQUE REFERENCES mellow.learner (id),
    email_original varchar(254) NOT NULL,
    email_canonical varchar(254) COLLATE "C" NOT NULL,
    password_hash varchar(255) NOT NULL,
    status varchar(24) NOT NULL,
    email_verified_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT account_email_unique UNIQUE (email_canonical),
    CONSTRAINT account_email_canonical CHECK (
        email_canonical <> '' AND email_canonical = lower(email_original COLLATE "C")
    ),
    CONSTRAINT account_status_verification CHECK (
        (status = 'PENDING_VERIFICATION' AND email_verified_at IS NULL)
        OR (status = 'VERIFIED' AND email_verified_at BETWEEN created_at AND updated_at AND email_verified_at IS NOT NULL)
    ),
    CONSTRAINT account_update_time CHECK (updated_at >= created_at)
);

CREATE TABLE mellow.email_verification (
    id uuid PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES mellow.account (id) ON DELETE CASCADE,
    token_digest varchar(64) NOT NULL UNIQUE,
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    superseded_at timestamptz,
    CONSTRAINT email_verification_digest CHECK (token_digest ~ '^[0-9a-f]{64}$'),
    CONSTRAINT email_verification_expiry CHECK (expires_at > created_at),
    CONSTRAINT email_verification_end_state CHECK (
        (consumed_at IS NULL OR consumed_at BETWEEN created_at AND expires_at)
        AND (superseded_at IS NULL OR superseded_at >= created_at)
        AND (consumed_at IS NULL OR superseded_at IS NULL)
    )
);

CREATE INDEX email_verification_by_account ON mellow.email_verification (account_id, created_at);
CREATE UNIQUE INDEX email_verification_one_open ON mellow.email_verification (account_id)
    WHERE consumed_at IS NULL AND superseded_at IS NULL;
