ALTER TABLE mellow.account
    ADD COLUMN security_revision bigint NOT NULL DEFAULT 0,
    ADD CONSTRAINT account_security_revision_nonnegative CHECK (security_revision >= 0);

CREATE TABLE mellow.password_reset_token (
    id uuid PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES mellow.account (id) ON DELETE CASCADE,
    token_digest varchar(64) NOT NULL UNIQUE,
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    superseded_at timestamptz,
    CONSTRAINT password_reset_digest CHECK (token_digest ~ '^[0-9a-f]{64}$'),
    CONSTRAINT password_reset_expiry CHECK (expires_at > created_at),
    CONSTRAINT password_reset_end_state CHECK (
        (consumed_at IS NULL OR consumed_at BETWEEN created_at AND expires_at)
        AND (superseded_at IS NULL OR superseded_at >= created_at)
        AND (consumed_at IS NULL OR superseded_at IS NULL)
    )
);

CREATE INDEX password_reset_by_account ON mellow.password_reset_token (account_id, created_at);
CREATE UNIQUE INDEX password_reset_one_open ON mellow.password_reset_token (account_id)
    WHERE consumed_at IS NULL AND superseded_at IS NULL;
