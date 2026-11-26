# Frontend MVP readiness

This review covers the browser application and its current local persistence. Backend, account management and production deployment are future work. `backend/` has only its placeholder. The validation below is evidence for the tested flows and environments.

## Feature and content inventory

| Area                | Implemented and published                                                                                                                                          | Planned or deferred                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Home and navigation | Dashboard with real local activity, daily word and favorite, responsive sidebar and bottom navigation.                                                             | Profile and settings routes are placeholders.                                              |
| Lessons             | A1 catalog and four lessons in Unit 01. Reusable player, listening with text alternative, exercises, resume, explicit completion and replay.                       | Forty-four outlines across the remaining 11 A1 units. A2–C2 level definitions are present. |
| Stories             | Two A1 stories with three readable chapters each, adjustable reading, optional translations, narration, vocabulary, comprehension and explicit reading completion. | Four preview-only stories.                                                                 |
| Games               | Word Match, Sentence Builder and Memory Game, completed-session history and optional review.                                                                       | Additional games and server synchronization.                                               |
| Practical English   | Eight A1 situations, 111 phrasebook expressions, 16 interactive dialogues, 16 branching simulations and 32 cultural guidance entries.                              | Additional content and levels.                                                             |
| Meu caderno         | Favorites, personal notes and examples, familiarity, flashcards, history and evidence-based review suggestions.                                                    | Account-backed synchronization.                                                            |
| Meu progresso       | Overview, curriculum journey, charts, calendar, module reports and paginated unified activity timeline.                                                            | Cross-device reporting and recovery.                                                       |

## Architecture and findings

- Educational definitions in `data/` are separate from learner state in `types/progress.ts` and the local repositories. Shared deterministic evaluators power lessons, listening, reading comprehension and Sentence Builder. Games and guided conversations also have independent transition services. Analytics and the timeline are read-only projections.
- The former milestone composition in progress analytics now delegates to the activity selector shared with history. The compact list and timeline use the same publication-aware link resolver. This fixes links that could point at unpublished or missing lessons or chapters.
- Module navigation previously handled nested routes through partial path exceptions. Desktop and mobile now use the same rule for all module subroutes, including the new history and Notebook subpages.
- Independent speech hooks could retain separate controllers for the shared browser synthesis queue. The shared owner now cancels the preceding controller before cross-control playback. An automated test observes cancellation before the next utterance and again when the active control unmounts.
- Confirmed debt includes synchronous whole-snapshot local writes with cross-tab races, separate non-atomic favorite/date keys, recovery behavior for invalid or future-version progress, and content-backed suggestions that need some authored detail chunks to resolve references. There is no app-specific root fallback for an unexpected lazy import/render failure. Invalid content IDs, navigation loading and local-storage failures have their own routes or messages. Plan an authenticated repository, explicit import/recovery UX, and production error handling and monitoring before rollout.

## Security and privacy

The review inspected production source, manifest dependencies and storage boundaries. Learner notes and examples render as React text. A notebook regression test verifies that a markup-like note is retained as text and creates no image element. Searches found no production use of `dangerouslySetInnerHTML`, direct fetch or XMLHttpRequest, external script tags or hardcoded credentials in the inspected app source. The “Wi-Fi password” occurrences are authored teaching examples. During the browser review, sampled routes loaded application resources from the local origin. Audio is requested from the browser's speech engine. Depending on device and voice, the platform can use a remote speech service outside the application's network layer.

The npm registry audit of the current lockfile reported zero known advisories at review time. This is a dependency snapshot, with the usual limits of registry coverage. No dependency upgrades were performed. Browser storage is readable to scripts on the same origin and is not a security boundary. Future deployment should use HTTPS, an intentional origin and security headers, validated writes, authenticated data isolation and privacy-aware telemetry. See [Backend readiness](backend-readiness.md).

## Visual and accessibility verification

The independent final `npm test` run passed 241 tests in 51 files. Coverage includes content integrity, learner persistence and supported storage versions, answer evaluation, reading and lesson completion, per-game and simulation session semantics, flashcard recommendations, analytics and the history interaction. The final run reported no timeouts.

Representative routes were checked for responsive layout and overflow at 320, 820 and 1440 pixels. Checks cover the global navigation and mobile More dialog, page headings, selected states, history filters and pagination, keyboard activation and focus, touch emulation, and representative educational screen links and controls. Automated tests cover the accessible names and form feedback of the history and existing lesson and Notebook flows. Shared styling uses the existing palette and locally bundled fonts. These checks do not amount to a full contrast or accessibility audit.

Manual checks remaining include VoiceOver/Safari and NVDA/Firefox announcements and reading order, keyboard-only walkthroughs of every exercisable format, physical-device target size and dialog focus, 200–400% zoom and forced colors. Also exercise reduced-motion preference across routes, loading/error recovery on poor connections, and verify that hidden translations, corrections and game tiles stay out of the corresponding reading order until revealed. The existing test suite includes keyboard workflows, hidden-answer behavior, form results and native-control labels. Browser and DOM checks during the review did not use a dedicated screen reader.

## Audio verification

The shared Web Speech adapter prefers matching locale voices, falls back to another voice in the same language or the browser default, and advances narration on utterance completion. Playback speed is supplied by the calling feature. Lesson listening and Practical English offer normal and reduced modes. Voice lists and pause/resume support can vary by browser. Tests simulate voice selection, events, narration, cancellation and unavailable-audio alternatives. Simulated speech and browser checks do not establish audible playback.

Physical desktop and mobile checklist:

1. In Chrome and Safari on desktop and in Safari/iOS and Chrome/Android, play a word and an English line. Check audible English output and the announced playback status. Try a device with a different installed English voice or the default fallback.
2. Play a dialogue or story passage at normal and reduced speed. Check that turns follow in order and that the active turn follows what is heard.
3. Start a second control during narration, change chapter or route, and use Stop. Confirm the previous voice stops, the active control state clears and the previous narration does not continue.
4. Check pause/resume where supported, an unavailable speech configuration, and the lesson listening text alternative. Try after a fresh page load and with audio restrictions or an interrupted tab. Record device, browser, version and voice.

## Performance and deployment

The production entry loads the application shell, Home and shared dependencies. Feature routes use dynamic imports. History resolves titles and links using existing catalog metadata. Detailed lesson, story, simulation and recommendation chunks remain demand-loaded. Timeline pagination keeps rendered groups bounded to 12 records per page. Timestamp and group projections still process the local activity list in memory. If data moves to a server, measure long histories and keep pagination and filters at the appropriate boundary. Vite's warning threshold is unchanged.

The Vite production build reported 437.62 kB of initial JavaScript before this change and 438.26 kB after (139.49 kB and 139.63 kB gzip). The My Progress route file changed from 47.39 kB to 41.81 kB (14.64 kB to 12.64 kB gzip) as shared code moved to a separate chunk. The history route file is 5.59 kB (2.34 kB gzip). The shared filter and activity chunk is 8.25 kB (3.50 kB gzip). These are per-file measurements. The existing font families ship locale subsets as local WOFF2 assets. The largest emitted font file was 77.22 kB. A SHA-256 comparison found 109 unique emitted assets and no byte-identical files in the output asset directory.

Use Node versions supported by the root package, the committed lockfile and a reproducible build. Serve `frontend/dist` with an SPA fallback for deep routes such as `/meu-progresso/historico`, while serving actual assets with the proper MIME type. Review immutable caching for hashed assets and short caching for the entry HTML so that a second deployment does not strand open tabs on retired chunks. Check HTTPS, CSP, reloads, offline/error states, mobile browsers and data recovery on an environment representative of the eventual deployment.
