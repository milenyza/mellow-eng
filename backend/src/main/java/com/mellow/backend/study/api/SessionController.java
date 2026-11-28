package com.mellow.backend.study.api;

import com.mellow.backend.flashcards.persistence.FlashcardSession.Direction;
import com.mellow.backend.games.persistence.GameSession.Difficulty;
import com.mellow.backend.games.persistence.GameSession.Kind;
import com.mellow.backend.progress.api.TrustedLearner;
import com.mellow.backend.study.application.SessionCatalog;
import com.mellow.backend.study.application.SessionService;
import com.mellow.backend.study.application.SessionService.Range;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

import static com.mellow.backend.progress.api.ProgressBoundary.OWNER;
import static com.mellow.backend.progress.application.ProgressSupport.REFERENCE;

@RestController
public class SessionController {

    public static final String GAMES = "/api/v1/game-sessions";
    public static final String SIMULATIONS = "/api/v1/simulation-sessions";
    public static final String FLASHCARDS = "/api/v1/flashcard-sessions";
    private static final String REVISION_HEADER = "Mellow-Catalog-Revision";
    private final SessionService service;
    private final SessionCatalog catalog;

    SessionController(SessionService service, SessionCatalog catalog) {
        this.service = service;
        this.catalog = catalog;
    }

    @GetMapping(GAMES)
    ResponseEntity<SessionDto.History> games(@RequestAttribute(OWNER) TrustedLearner owner,
            @RequestParam(required = false) Kind kind, @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String through,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return history(service.gameHistory(owner, kind, difficulty, Range.of(from, through, page, size)));
    }

    @GetMapping(SIMULATIONS)
    ResponseEntity<SessionDto.History> simulations(@RequestAttribute(OWNER) TrustedLearner owner,
            @RequestParam(required = false) @Pattern(regexp = REFERENCE) String situation,
            @RequestParam(required = false) @Pattern(regexp = REFERENCE) String scenario,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String through,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return history(service.simulationHistory(owner, situation, scenario, Range.of(from, through, page, size)));
    }

    @GetMapping(FLASHCARDS)
    ResponseEntity<SessionDto.History> flashcards(@RequestAttribute(OWNER) TrustedLearner owner,
            @RequestParam(required = false) Direction direction,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String through,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return history(service.flashcardHistory(owner, direction, Range.of(from, through, page, size)));
    }

    @GetMapping(GAMES + "/{ref}")
    SessionDto.GameView game(@RequestAttribute(OWNER) TrustedLearner owner,
                             @PathVariable @Pattern(regexp = REFERENCE) String ref) {
        return service.game(owner, ref);
    }

    @GetMapping(SIMULATIONS + "/{ref}")
    SessionDto.SimulationView simulation(@RequestAttribute(OWNER) TrustedLearner owner,
                                         @PathVariable @Pattern(regexp = REFERENCE) String ref) {
        return service.simulation(owner, ref);
    }

    @GetMapping(FLASHCARDS + "/{ref}")
    SessionDto.FlashcardView flashcard(@RequestAttribute(OWNER) TrustedLearner owner,
                                       @PathVariable @Pattern(regexp = REFERENCE) String ref) {
        return service.flashcard(owner, ref);
    }

    @PutMapping(path = GAMES + "/{ref}", consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<SessionDto.GameView> recordGame(@RequestAttribute(OWNER) TrustedLearner owner,
            @PathVariable @Pattern(regexp = REFERENCE) String ref, @Valid @RequestBody SessionDto.GameWrite input) {
        return write(GAMES, ref, service.recordGame(owner, ref, input));
    }

    @PutMapping(path = SIMULATIONS + "/{ref}", consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<SessionDto.SimulationView> recordSimulation(@RequestAttribute(OWNER) TrustedLearner owner,
            @PathVariable @Pattern(regexp = REFERENCE) String ref, @Valid @RequestBody SessionDto.SimulationWrite input) {
        return write(SIMULATIONS, ref, service.recordSimulation(owner, ref, input));
    }

    @PutMapping(path = FLASHCARDS + "/{ref}", consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<SessionDto.FlashcardView> recordFlashcard(@RequestAttribute(OWNER) TrustedLearner owner,
            @PathVariable @Pattern(regexp = REFERENCE) String ref, @Valid @RequestBody SessionDto.FlashcardWrite input) {
        return write(FLASHCARDS, ref, service.recordFlashcard(owner, ref, input));
    }

    private ResponseEntity<SessionDto.History> history(SessionDto.History response) {
        return ResponseEntity.ok().header(REVISION_HEADER, catalog.revision()).body(response);
    }

    private static <T> ResponseEntity<T> write(String base, String ref, SessionService.Stored<T> result) {
        return result.created() ? ResponseEntity.created(URI.create(base + "/" + ref)).body(result.view())
                : ResponseEntity.ok(result.view());
    }
}
