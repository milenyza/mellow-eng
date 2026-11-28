ALTER TABLE mellow.vocabulary_favorite
    ADD COLUMN revision uuid NOT NULL DEFAULT gen_random_uuid(),
    ADD COLUMN previous_revision uuid,
    ADD COLUMN removed boolean NOT NULL DEFAULT false,
    ADD CONSTRAINT favorite_removed_dates CHECK (
        NOT removed OR num_nonnulls(saved_at, saved_on) = 0
    );

ALTER TABLE mellow.vocabulary_annotation
    DROP CONSTRAINT vocabulary_annotation_check1,
    ADD COLUMN revision uuid NOT NULL DEFAULT gen_random_uuid(),
    ADD COLUMN removed boolean NOT NULL DEFAULT false,
    ADD CONSTRAINT annotation_removal_state CHECK (
        removed = (num_nonnulls(note, personal_example, familiarity) = 0)
    );

ALTER TABLE mellow.learner_preferences
    ADD COLUMN revision uuid NOT NULL DEFAULT gen_random_uuid();

CREATE INDEX favorite_active_history ON mellow.vocabulary_favorite (learner_id, vocabulary_ref) WHERE NOT removed;
CREATE INDEX annotation_active_history ON mellow.vocabulary_annotation (learner_id, vocabulary_ref) WHERE NOT removed;
