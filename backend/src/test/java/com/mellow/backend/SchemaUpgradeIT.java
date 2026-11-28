package com.mellow.backend;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
class SchemaUpgradeIT {

    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17.12-bookworm");

    @Test
    void upgradesAppliedMigrationsInPlaceAndPreservesHistoryAndData() {
        var dataSource = new DriverManagerDataSource(
                postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        var jdbc = new JdbcTemplate(dataSource);

        Flyway.configure().dataSource(dataSource).defaultSchema("public").target("1").load().migrate();
        var versionOne = jdbc.queryForMap("SELECT * FROM public.flyway_schema_history WHERE version = '1'");
        assertThat(jdbc.queryForObject("SELECT to_regclass('mellow.learner') IS NULL", Boolean.class)).isTrue();

        Flyway.configure().dataSource(dataSource).defaultSchema("public").target("2").load().migrate();
        var versionTwo = jdbc.queryForMap("SELECT * FROM public.flyway_schema_history WHERE version = '2'");
        var learner = jdbc.queryForObject("INSERT INTO mellow.learner DEFAULT VALUES RETURNING id", java.util.UUID.class);
        jdbc.update("""
                INSERT INTO mellow.flashcard_session
                    (learner_id, session_ref, started_at, completed_at, active_ms, direction, review_scope, used_search)
                VALUES (?, 'legacy-review', TIMESTAMPTZ '2025-01-02 14:00:00Z', TIMESTAMPTZ '2025-01-02 14:01:00Z',
                        1000, 'EN_PT', 'SAVED', FALSE)
                """, learner);
        jdbc.update("""
                INSERT INTO mellow.flashcard_recall (flashcard_session_id, position, vocabulary_ref, direction, rating)
                SELECT id, 0, 'retired-context', 'EN_PT', 'EFFORT' FROM mellow.flashcard_session
                WHERE learner_id = ?
                """, learner);

        jdbc.update("""
                INSERT INTO mellow.vocabulary_favorite (learner_id, vocabulary_ref)
                VALUES (?, 'retired-context')
                """, learner);
        jdbc.update("""
                INSERT INTO mellow.vocabulary_annotation (learner_id, vocabulary_ref, note, familiarity)
                VALUES (?, 'retired-context', 'Anotação anterior', 'REVIEWING')
                """, learner);
        jdbc.update("""
                INSERT INTO mellow.learner_preferences (learner_id, reading_font_size, show_reading_translations)
                VALUES (?, 'LARGE', TRUE)
                """, learner);
        Flyway.configure().dataSource(dataSource).defaultSchema("public").target("3").load().migrate();
        var versionThree = jdbc.queryForMap("SELECT * FROM public.flyway_schema_history WHERE version = '3'");

        Flyway.configure().dataSource(dataSource).defaultSchema("public").target("4").load().migrate();
        var versionFour = jdbc.queryForMap("SELECT * FROM public.flyway_schema_history WHERE version = '4'");
        Flyway.configure().dataSource(dataSource).defaultSchema("public").target("5").load().migrate();
        var versionFive = jdbc.queryForMap("SELECT * FROM public.flyway_schema_history WHERE version = '5'");
        jdbc.update("""
                INSERT INTO mellow.legacy_import_receipt (learner_id, request_ref, snapshot_fingerprint, imported_at, report)
                VALUES (?, 'historical-import', repeat('a', 64), CURRENT_TIMESTAMP, '{}'::jsonb)
                """, learner);
        var receipt = jdbc.queryForMap("SELECT * FROM mellow.legacy_import_receipt WHERE learner_id = ?", learner);
        var existingRevision = jdbc.queryForObject("SELECT revision FROM mellow.vocabulary_favorite WHERE learner_id = ?",
                java.util.UUID.class, learner);

        Flyway.configure().dataSource(dataSource).defaultSchema("public").target("6").load().migrate();
        var versionSix = jdbc.queryForMap("SELECT * FROM public.flyway_schema_history WHERE version = '6'");
        var account = java.util.UUID.randomUUID();
        jdbc.update("""
                INSERT INTO mellow.account (id, learner_id, email_original, email_canonical, password_hash, status,
                                            email_verified_at, created_at, updated_at)
                VALUES (?, ?, 'legacy@example.test', 'legacy@example.test', 'synthetic-hash', 'VERIFIED',
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, account, learner);
        var originalAccount = jdbc.queryForMap("SELECT * FROM mellow.account WHERE id = ?", account);

        try (var context = new SpringApplicationBuilder(MellowApplication.class)
                .web(WebApplicationType.NONE)
                .run("--spring.datasource.url=" + postgres.getJdbcUrl(),
                        "--spring.datasource.username=" + postgres.getUsername(),
                        "--spring.datasource.password=" + postgres.getPassword())) {
            assertThat(context.getEnvironment().getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
            assertThat(jdbc.queryForMap("SELECT * FROM public.flyway_schema_history WHERE version = '1'"))
                    .isEqualTo(versionOne);
            assertThat(jdbc.queryForMap("SELECT * FROM public.flyway_schema_history WHERE version = '2'"))
                    .isEqualTo(versionTwo);
            assertThat(jdbc.queryForMap("SELECT * FROM public.flyway_schema_history WHERE version = '3'"))
                    .isEqualTo(versionThree);
            assertThat(jdbc.queryForMap("SELECT * FROM public.flyway_schema_history WHERE version = '4'"))
                    .isEqualTo(versionFour);
            assertThat(jdbc.queryForMap("SELECT * FROM public.flyway_schema_history WHERE version = '5'"))
                    .isEqualTo(versionFive);
            assertThat(jdbc.queryForMap("SELECT * FROM public.flyway_schema_history WHERE version = '6'"))
                    .isEqualTo(versionSix);
            var migrated = jdbc.queryForMap("SELECT * FROM mellow.account WHERE id = ?", account);
            assertThat(migrated.remove("security_revision")).isEqualTo(0L);
            assertThat(migrated).isEqualTo(originalAccount);
            assertThat(jdbc.queryForMap("SELECT * FROM mellow.legacy_import_receipt WHERE learner_id = ?", learner))
                    .isEqualTo(receipt);
            assertThat(jdbc.queryForObject("SELECT revision FROM mellow.vocabulary_favorite WHERE learner_id = ?",
                    java.util.UUID.class, learner)).isEqualTo(existingRevision);
            assertThat(jdbc.queryForObject("SELECT legacy_imported FROM mellow.flashcard_session WHERE learner_id = ?",
                    Boolean.class, learner)).isFalse();
            assertThat(jdbc.queryForObject("""
                    SELECT revision IS NOT NULL AND NOT removed AND saved_at IS NULL AND saved_on IS NULL
                    FROM mellow.vocabulary_favorite WHERE learner_id = ?
                    """, Boolean.class, learner)).isTrue();
            assertThat(jdbc.queryForObject("""
                    SELECT revision IS NOT NULL AND NOT removed AND note = 'Anotação anterior' AND familiarity = 'REVIEWING'
                    FROM mellow.vocabulary_annotation WHERE learner_id = ?
                    """, Boolean.class, learner)).isTrue();
            assertThat(jdbc.queryForObject("""
                    SELECT revision IS NOT NULL AND reading_font_size = 'LARGE' AND show_reading_translations
                    FROM mellow.learner_preferences WHERE learner_id = ?
                    """, Boolean.class, learner)).isTrue();
            assertThat(jdbc.queryForObject("""
                    SELECT catalog_revision IS NULL AND request_digest IS NULL FROM mellow.flashcard_session
                    WHERE learner_id = ? AND session_ref = 'legacy-review'
                    """, Boolean.class, learner)).isTrue();
            assertThat(jdbc.queryForObject("SELECT vocabulary_ref FROM mellow.flashcard_recall", String.class))
                    .isEqualTo("retired-context");
            assertThat(jdbc.queryForList(
                    "SELECT version FROM public.flyway_schema_history WHERE success ORDER BY installed_rank",
                    String.class)).containsExactly("1", "2", "3", "4", "5", "6", "7");
            assertThat(jdbc.queryForList(
                    "SELECT indexname FROM pg_indexes WHERE schemaname = 'mellow' ORDER BY indexname",
                    String.class)).contains("lesson_one_current", "lesson_one_first_completion",
                    "reading_one_current", "reading_one_first_completion",
                    "game_history_by_learner", "simulation_history_by_learner", "flashcard_history_by_learner");
            var constraints = jdbc.queryForList("""
                    SELECT contype::text || ':' || count(*)
                    FROM pg_constraint
                    WHERE connamespace = 'mellow'::regnamespace AND contype IN ('p', 'f', 'u', 'c')
                    GROUP BY contype
                    """, String.class);
            assertThat(constraints).containsExactlyInAnyOrder("p:27", "f:27", "u:20", "c:118");
            assertThat(jdbc.queryForObject(
                    "SELECT count(*) FROM pg_indexes WHERE schemaname = 'mellow'", Long.class)).isEqualTo(61);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.learner", Long.class)).isEqualTo(1);
            assertThat(jdbc.queryForObject("SELECT display_name IS NULL FROM mellow.learner WHERE id = ?",
                    Boolean.class, learner)).isTrue();
            assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.account", Long.class)).isEqualTo(1);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.password_reset_token", Long.class)).isZero();
            assertThat(jdbc.queryForObject("SELECT count(*) FROM mellow.email_verification", Long.class)).isZero();
        }
    }
}
