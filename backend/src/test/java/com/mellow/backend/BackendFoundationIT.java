package com.mellow.backend;

import com.jayway.jsonpath.JsonPath;
import com.mellow.backend.progress.api.TrustedLearnerResolver;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BackendFoundationIT {

    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17.12-bookworm");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @LocalServerPort
    private int port;

    @Autowired
    private ApplicationContext context;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void initializesTheContextAndConnectsToPostgres() {
        assertThat(context.getBean(MellowApplication.class)).isNotNull();
        assertThat(jdbc.queryForObject("SELECT current_database()", String.class))
                .isEqualTo(postgres.getDatabaseName());
    }

    @Test
    void appliesMigrationsAndValidatesTheApplicationSchema() {
        assertThat(jdbc.queryForObject("SELECT to_regnamespace('mellow') IS NOT NULL", Boolean.class))
                .isTrue();
        assertThat(jdbc.queryForList(
                "SELECT version FROM public.flyway_schema_history WHERE success AND version IS NOT NULL ORDER BY installed_rank",
                String.class))
                .containsExactly("1", "2", "3", "4", "5");
        assertThat(jdbc.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'mellow'", String.class))
                .containsExactlyInAnyOrder("learner", "learner_preferences", "lesson_run", "lesson_activity",
                        "story_progress", "story_read_chapter", "reading_run", "reading_chapter", "exercise_result",
                        "exercise_submission", "game_session", "game_vocabulary", "game_sentence_challenge",
                        "simulation_session", "simulation_attempt", "vocabulary_favorite", "vocabulary_annotation",
                        "flashcard_session", "flashcard_recall", "legacy_import_receipt", "game_study_day", "simulation_study_day",
                        "flashcard_study_day", "combined_study_day");
        assertThat(context.getEnvironment().getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
    }

    @Test
    void exposesOnlyTheExpectedStatusAndHealthFields() throws Exception {
        var status = get("/api/v1/status");
        assertThat(status.statusCode()).isEqualTo(200);
        assertThat(json(status)).containsExactlyInAnyOrderEntriesOf(Map.of("status", "UP", "apiVersion", "v1"));

        var health = get("/actuator/health");
        assertThat(health.statusCode()).isEqualTo(200);
        assertThat(json(health)).containsExactlyEntriesOf(Map.of("status", "UP"));
    }

    @Test
    void hidesManagementEndpointsAndInternalErrorDetails() throws Exception {
        assertThat(get("/actuator").statusCode()).isEqualTo(404);
        var response = get("/actuator/env?trace=true&message=true");
        assertThat(response.statusCode()).isEqualTo(404);
        assertThat(json(response)).doesNotContainKeys("trace", "exception", "errors", "message");
    }

    @Test
    void progressEndpointsFailClosedWithoutAResolver() throws Exception {
        assertThat(context.getBeansOfType(TrustedLearnerResolver.class)).isEmpty();
        var basePaths = List.of("lesson-progress", "reading-progress", "game-sessions", "simulation-sessions",
                "flashcard-sessions", "favorites", "vocabulary-annotations", "preferences");
        try (var client = HttpClient.newHttpClient()) {
            for (String base : basePaths) assertUnauthorized(client, "GET", base);
            for (String base : List.of("lesson-progress", "reading-progress")) {
                assertUnauthorized(client, "GET", base + "/fixture");
                assertUnauthorized(client, "PUT", base + "/fixture/attempts/fixture");
            }
            for (String base : List.of("game-sessions", "simulation-sessions", "flashcard-sessions")) {
                assertUnauthorized(client, "GET", base + "/fixture");
                assertUnauthorized(client, "PUT", base + "/fixture");
            }
            for (String method : List.of("GET", "PUT", "DELETE")) assertUnauthorized(client, method, "favorites/item");
            for (String method : List.of("GET", "PATCH", "DELETE")) assertUnauthorized(client, method, "vocabulary-annotations/item");
            assertUnauthorized(client, "PATCH", "preferences");
            assertUnauthorized(client, "POST", "data-import/dry-run");
            assertUnauthorized(client, "PUT", "data-import/fixture");
            assertUnauthorized(client, "GET", "data-import/fixture");
        }
    }

    private void assertUnauthorized(HttpClient client, String method, String route) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/v1/" + route + "?learnerId=fixture&ref=fixture"))
                .timeout(Duration.ofSeconds(10))
                .header("X-Learner-Id", "fixture").header("X-Integration-Test-Identity", "fixture")
                .header("Content-Type", "application/json")
                .method(method, HttpRequest.BodyPublishers.ofString("{\"learnerId\":\"fixture\"}")).build();
        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as("%s %s", method, route).isEqualTo(401);
        assertThat(json(response)).containsEntry("status", 401).doesNotContainKeys("trace", "exception");
        assertThat(response.headers().firstValue("Cache-Control")).contains("no-store");
    }

    private HttpResponse<String> get(String path) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
                .timeout(Duration.ofSeconds(10))
                .header("Accept", "application/json")
                .GET()
                .build();
        try (HttpClient client = HttpClient.newHttpClient()) {
            return client.send(request, HttpResponse.BodyHandlers.ofString());
        }
    }

    private static Map<String, Object> json(HttpResponse<String> response) {
        return JsonPath.parse(response.body()).read("$");
    }
}
