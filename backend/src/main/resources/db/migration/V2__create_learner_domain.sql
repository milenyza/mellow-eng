CREATE TABLE mellow.learner (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mellow.learner_preferences (
    learner_id uuid PRIMARY KEY REFERENCES mellow.learner(id),
    reading_font_size text NOT NULL DEFAULT 'NORMAL'
        CHECK (reading_font_size IN ('NORMAL', 'LARGE', 'EXTRA_LARGE')),
    show_reading_translations boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mellow.lesson_run (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL REFERENCES mellow.learner(id),
    lesson_ref text NOT NULL CHECK (btrim(lesson_ref) <> ''),
    run_ref text NOT NULL CHECK (btrim(run_ref) <> ''),
    current_run boolean NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    first_completion boolean NOT NULL DEFAULT false,
    started_at timestamptz,
    finished_at timestamptz,
    finished_on date,
    block_ref text NOT NULL CHECK (btrim(block_ref) <> ''),
    visited_block_refs text[] NOT NULL DEFAULT '{}' CHECK (array_position(visited_block_refs, NULL) IS NULL),
    active_ms bigint NOT NULL DEFAULT 0 CHECK (active_ms >= 0),
    UNIQUE (learner_id, lesson_ref, run_ref),
    CHECK (NOT first_completion OR completed),
    CHECK (num_nonnulls(finished_at, finished_on) <= 1),
    CHECK (completed OR num_nonnulls(finished_at, finished_on) = 0),
    CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at)
);

CREATE UNIQUE INDEX lesson_one_current ON mellow.lesson_run (learner_id, lesson_ref) WHERE current_run;
CREATE UNIQUE INDEX lesson_one_first_completion ON mellow.lesson_run (learner_id, lesson_ref) WHERE first_completion;

CREATE TABLE mellow.lesson_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id uuid NOT NULL REFERENCES mellow.lesson_run(id),
    block_ref text NOT NULL CHECK (btrim(block_ref) <> ''),
    activity_ref text NOT NULL CHECK (btrim(activity_ref) <> ''),
    finished boolean NOT NULL DEFAULT false,
    text_activity_refs text[] NOT NULL DEFAULT '{}' CHECK (array_position(text_activity_refs, NULL) IS NULL),
    heard_activity_refs text[] NOT NULL DEFAULT '{}' CHECK (array_position(heard_activity_refs, NULL) IS NULL),
    UNIQUE (run_id, block_ref)
);

CREATE TABLE mellow.story_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL REFERENCES mellow.learner(id),
    story_ref text NOT NULL CHECK (btrim(story_ref) <> ''),
    lifetime_active_ms bigint NOT NULL DEFAULT 0 CHECK (lifetime_active_ms >= 0),
    UNIQUE (learner_id, story_ref)
);

CREATE TABLE mellow.story_read_chapter (
    story_progress_id uuid NOT NULL REFERENCES mellow.story_progress(id),
    chapter_ref text NOT NULL CHECK (btrim(chapter_ref) <> ''),
    read_on date,
    PRIMARY KEY (story_progress_id, chapter_ref)
);

CREATE TABLE mellow.reading_run (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    story_progress_id uuid NOT NULL REFERENCES mellow.story_progress(id),
    run_ref text NOT NULL CHECK (btrim(run_ref) <> ''),
    current_run boolean NOT NULL,
    first_completion boolean NOT NULL DEFAULT false,
    completed_at timestamptz,
    completed_on date,
    started_at timestamptz,
    chapter_ref text NOT NULL CHECK (btrim(chapter_ref) <> ''),
    active_ms bigint NOT NULL DEFAULT 0 CHECK (active_ms >= 0),
    UNIQUE (story_progress_id, run_ref),
    CHECK (num_nonnulls(completed_at, completed_on) <= 1),
    CHECK (first_completion OR num_nonnulls(completed_at, completed_on) = 0),
    CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);

CREATE UNIQUE INDEX reading_one_current ON mellow.reading_run (story_progress_id) WHERE current_run;
CREATE UNIQUE INDEX reading_one_first_completion ON mellow.reading_run (story_progress_id) WHERE first_completion;

CREATE TABLE mellow.reading_chapter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id uuid NOT NULL REFERENCES mellow.reading_run(id),
    chapter_ref text NOT NULL CHECK (btrim(chapter_ref) <> ''),
    paragraph_ref text CHECK (btrim(paragraph_ref) <> ''),
    read_at timestamptz,
    practice_index bigint CHECK (practice_index >= 0),
    practice_finished boolean,
    UNIQUE (run_id, chapter_ref),
    CHECK ((practice_index IS NULL) = (practice_finished IS NULL))
);

-- Answer unions retain the original discriminator. Check structure before accepting JSONB.
CREATE FUNCTION mellow.valid_exercise_answer(answer jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
RETURN COALESCE(jsonb_typeof(answer) = 'object' AND CASE answer ->> 'kind'
    WHEN 'multiple-choice' THEN jsonb_typeof(answer -> 'optionId') = 'string'
         AND btrim(answer ->> 'optionId') <> ''
    WHEN 'fill-in-the-blanks' THEN jsonb_typeof(answer -> 'values') = 'object'
         AND NOT jsonb_path_exists(answer, '$.values.* ? (@.type() != "string")')
    WHEN 'matching-pairs' THEN jsonb_typeof(answer -> 'pairs') = 'object'
         AND NOT jsonb_path_exists(answer, '$.pairs.* ? (@.type() != "string")')
    WHEN 'sentence-builder' THEN jsonb_typeof(answer -> 'tileIds') = 'array'
         AND NOT jsonb_path_exists(answer, '$.tileIds[*] ? (@.type() != "string")')
    WHEN 'sequence-ordering' THEN jsonb_typeof(answer -> 'itemIds') = 'array'
         AND NOT jsonb_path_exists(answer, '$.itemIds[*] ? (@.type() != "string")')
    WHEN 'true-or-false' THEN jsonb_typeof(answer -> 'value') = 'boolean'
    ELSE false
END, false);

CREATE TABLE mellow.exercise_result (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_activity_id uuid REFERENCES mellow.lesson_activity(id),
    reading_chapter_id uuid REFERENCES mellow.reading_chapter(id),
    exercise_ref text NOT NULL CHECK (btrim(exercise_ref) <> ''),
    draft jsonb CHECK (mellow.valid_exercise_answer(draft)),
    result_status text NOT NULL CHECK (result_status IN ('EDITING', 'INCORRECT', 'CORRECT', 'REVIEWED')),
    reviewed_at timestamptz,
    UNIQUE (lesson_activity_id, exercise_ref),
    UNIQUE (reading_chapter_id, exercise_ref),
    CHECK (num_nonnulls(lesson_activity_id, reading_chapter_id) = 1),
    CHECK ((result_status = 'REVIEWED') = (reviewed_at IS NOT NULL)),
    CHECK (result_status = 'EDITING' OR draft IS NOT NULL)
);

CREATE TABLE mellow.exercise_submission (
    exercise_result_id uuid NOT NULL REFERENCES mellow.exercise_result(id),
    position integer NOT NULL CHECK (position >= 0),
    answer jsonb NOT NULL CHECK (mellow.valid_exercise_answer(answer)),
    correct boolean NOT NULL,
    submitted_at timestamptz NOT NULL,
    mode text NOT NULL CHECK (mode IN ('PRACTICE', 'LISTENING', 'TEXT_ALTERNATIVE', 'NO_AUDIO')),
    PRIMARY KEY (exercise_result_id, position)
);

CREATE TABLE mellow.game_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL REFERENCES mellow.learner(id),
    session_ref text NOT NULL CHECK (btrim(session_ref) <> ''),
    game_kind text NOT NULL CHECK (game_kind IN ('WORD_MATCH', 'SENTENCE_BUILDER', 'MEMORY_GAME')),
    level text NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    difficulty text NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'BASIC', 'INTERMEDIATE')),
    started_at timestamptz NOT NULL,
    completed_at timestamptz NOT NULL CHECK (completed_at >= started_at),
    active_ms bigint NOT NULL CHECK (active_ms >= 0),
    answered_count bigint NOT NULL CHECK (answered_count >= 0),
    correct_count bigint NOT NULL CHECK (correct_count BETWEEN 0 AND answered_count),
    vocabulary_source text CHECK (vocabulary_source IN ('LESSONS', 'STORIES', 'SAVED', 'MIXED')),
    first_attempt_correct bigint CHECK (first_attempt_correct BETWEEN 0 AND correct_count),
    rounds_completed bigint CHECK (rounds_completed > 0),
    sentence_topic text CHECK (sentence_topic IN ('MIXED', 'INTRODUCTIONS', 'PRONOUNS', 'TO_BE', 'ORIGINS', 'AFFIRMATIVE', 'NEGATIVE', 'QUESTIONS')),
    total_pairs bigint CHECK (total_pairs > 0 AND total_pairs = correct_count),
    incorrect_attempts bigint CHECK (incorrect_attempts = answered_count - correct_count),
    UNIQUE (learner_id, session_ref),
    CHECK (
        (game_kind = 'WORD_MATCH' AND vocabulary_source IS NOT NULL AND first_attempt_correct IS NOT NULL
            AND rounds_completed IS NOT NULL AND num_nonnulls(sentence_topic, total_pairs, incorrect_attempts) = 0)
        OR (game_kind = 'SENTENCE_BUILDER' AND sentence_topic IS NOT NULL AND first_attempt_correct IS NOT NULL
            AND num_nonnulls(vocabulary_source, rounds_completed, total_pairs, incorrect_attempts) = 0)
        OR (game_kind = 'MEMORY_GAME' AND vocabulary_source IS NOT NULL AND total_pairs IS NOT NULL
            AND incorrect_attempts IS NOT NULL AND num_nonnulls(first_attempt_correct, rounds_completed, sentence_topic) = 0)
    )
);

CREATE TABLE mellow.game_vocabulary (
    game_session_id uuid NOT NULL REFERENCES mellow.game_session(id),
    position integer NOT NULL CHECK (position >= 0),
    vocabulary_ref text NOT NULL CHECK (btrim(vocabulary_ref) <> ''),
    review_position integer CHECK (review_position >= 0),
    PRIMARY KEY (game_session_id, position),
    UNIQUE (game_session_id, vocabulary_ref),
    UNIQUE (game_session_id, review_position)
);

CREATE TABLE mellow.game_sentence_challenge (
    game_session_id uuid NOT NULL REFERENCES mellow.game_session(id),
    position integer NOT NULL CHECK (position >= 0),
    challenge_ref text NOT NULL CHECK (btrim(challenge_ref) <> ''),
    reviewed boolean NOT NULL,
    incorrect_answers text[] NOT NULL DEFAULT '{}'
        CHECK (array_position(incorrect_answers, NULL) IS NULL),
    PRIMARY KEY (game_session_id, position),
    UNIQUE (game_session_id, challenge_ref),
    CHECK (NOT reviewed OR cardinality(incorrect_answers) > 0)
);

CREATE TABLE mellow.simulation_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL REFERENCES mellow.learner(id),
    session_ref text NOT NULL CHECK (btrim(session_ref) <> ''),
    situation_ref text NOT NULL CHECK (btrim(situation_ref) <> ''),
    scenario_ref text NOT NULL CHECK (btrim(scenario_ref) <> ''),
    started_at timestamptz NOT NULL,
    completed_at timestamptz NOT NULL CHECK (completed_at >= started_at),
    active_ms bigint NOT NULL CHECK (active_ms >= 0),
    decisions_completed bigint NOT NULL CHECK (decisions_completed > 0),
    reviewed_corrections bigint NOT NULL CHECK (reviewed_corrections BETWEEN 0 AND decisions_completed),
    UNIQUE (learner_id, session_ref)
);

CREATE TABLE mellow.simulation_attempt (
    simulation_session_id uuid NOT NULL REFERENCES mellow.simulation_session(id),
    position integer NOT NULL CHECK (position >= 0),
    node_ref text NOT NULL CHECK (btrim(node_ref) <> ''),
    choice_ref text NOT NULL CHECK (btrim(choice_ref) <> ''),
    fit text NOT NULL CHECK (fit IN ('APPROPRIATE', 'CONTEXT', 'LANGUAGE')),
    PRIMARY KEY (simulation_session_id, position)
);

CREATE TABLE mellow.vocabulary_favorite (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL REFERENCES mellow.learner(id),
    vocabulary_ref text NOT NULL CHECK (btrim(vocabulary_ref) <> ''),
    saved_at timestamptz,
    saved_on date,
    UNIQUE (learner_id, vocabulary_ref),
    CHECK (num_nonnulls(saved_at, saved_on) <= 1)
);

-- Browser and Java strings count supplementary characters as two UTF-16 code units.
CREATE FUNCTION mellow.utf16_length(value text) RETURNS bigint
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
RETURN char_length(value) + (
    SELECT count(*) FROM regexp_split_to_table(value, '') AS glyphs(glyph)
    WHERE octet_length(convert_to(glyph, 'UTF8')) = 4
);

CREATE TABLE mellow.vocabulary_annotation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL REFERENCES mellow.learner(id),
    vocabulary_ref text NOT NULL CHECK (btrim(vocabulary_ref) <> ''),
    note text CHECK (mellow.utf16_length(note) <= 1200),
    personal_example text CHECK (mellow.utf16_length(personal_example) <= 400),
    familiarity text CHECK (familiarity IN ('LEARNING', 'REVIEWING', 'FAMILIAR')),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP CHECK (updated_at >= created_at),
    UNIQUE (learner_id, vocabulary_ref),
    CHECK (num_nonnulls(note, personal_example, familiarity) > 0)
);

CREATE TABLE mellow.flashcard_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL REFERENCES mellow.learner(id),
    session_ref text NOT NULL CHECK (btrim(session_ref) <> ''),
    started_at timestamptz NOT NULL,
    completed_at timestamptz NOT NULL CHECK (completed_at >= started_at),
    active_ms bigint NOT NULL CHECK (active_ms >= 0),
    direction text NOT NULL CHECK (direction IN ('EN_PT', 'PT_EN', 'MIXED')),
    requested_length integer CHECK (requested_length IN (5, 10, 20)),
    review_scope text NOT NULL CHECK (review_scope IN ('SAVED', 'DIFFICULT', 'HISTORY', 'RECOMMENDED')),
    filter_source text CHECK (filter_source IN ('LESSON', 'STORY', 'PRACTICAL', 'DAILY')),
    filter_type text CHECK (filter_type IN ('WORD', 'EXPRESSION', 'PHRASE')),
    filter_level text CHECK (filter_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    filter_familiarity text CHECK (filter_familiarity IN ('LEARNING', 'REVIEWING', 'FAMILIAR', 'UNCLASSIFIED')),
    used_search boolean NOT NULL,
    UNIQUE (learner_id, session_ref)
);

CREATE TABLE mellow.flashcard_recall (
    flashcard_session_id uuid NOT NULL REFERENCES mellow.flashcard_session(id),
    position integer NOT NULL CHECK (position >= 0),
    vocabulary_ref text NOT NULL CHECK (btrim(vocabulary_ref) <> ''),
    direction text NOT NULL CHECK (direction IN ('EN_PT', 'PT_EN')),
    rating text NOT NULL CHECK (rating IN ('FORGOT', 'EFFORT', 'EASY')),
    PRIMARY KEY (flashcard_session_id, position),
    UNIQUE (flashcard_session_id, vocabulary_ref)
);

CREATE TABLE mellow.game_study_day (
    session_id uuid NOT NULL REFERENCES mellow.game_session(id),
    study_on date NOT NULL,
    active_ms bigint NOT NULL CHECK (active_ms >= 0),
    PRIMARY KEY (session_id, study_on)
);

CREATE TABLE mellow.simulation_study_day (
    session_id uuid NOT NULL REFERENCES mellow.simulation_session(id),
    study_on date NOT NULL,
    active_ms bigint NOT NULL CHECK (active_ms >= 0),
    PRIMARY KEY (session_id, study_on)
);

CREATE TABLE mellow.flashcard_study_day (
    session_id uuid NOT NULL REFERENCES mellow.flashcard_session(id),
    study_on date NOT NULL,
    active_ms bigint NOT NULL CHECK (active_ms >= 0),
    PRIMARY KEY (session_id, study_on)
);

CREATE TABLE mellow.combined_study_day (
    learner_id uuid NOT NULL REFERENCES mellow.learner(id),
    study_on date NOT NULL,
    active_ms bigint NOT NULL CHECK (active_ms >= 0),
    PRIMARY KEY (learner_id, study_on)
);

CREATE INDEX game_history_by_learner ON mellow.game_session (learner_id, completed_at DESC, id);
CREATE INDEX simulation_history_by_learner ON mellow.simulation_session (learner_id, completed_at DESC, id);
CREATE INDEX flashcard_history_by_learner ON mellow.flashcard_session (learner_id, completed_at DESC, id);
