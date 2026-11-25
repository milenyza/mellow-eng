# Play & Learn

The existing `/jogos` route hosts the game collection inside the shared layout. The playable routes are `/jogos/word-match`, `/jogos/sentence-builder` and `/jogos/memory-game`. Each card shows its CEFR level, learning objectives, estimated duration and difficulties.

## Word Match

Learners choose published lessons, published stories, saved vocabulary or a mix. Each session has three rounds at A1. Easy, medium and hard use four, six and eight simultaneous pairs. A source must have at least one full round of distinct eligible pairs for the chosen difficulty. Smaller pools can reuse pairs across rounds after the available vocabulary has been used. The session has no time limit.

Learners can start a match in either column with a mouse, touch or keyboard. Completed pairs share a number and cannot be selected again. Incorrect attempts allow unlimited retries. Review after a correct match is optional, and narration uses the shared browser speech playback on demand. Restarting and leaving an active session require confirmation.

The result reports rounds, matched pairs, attempts, active time and vocabulary. A pair counts as a first-attempt match when neither side appeared in an earlier attempt in the same round. Both vocabulary items involved in a mismatch are suggested for review. A repeated pair counts separately in each round, while the vocabulary review lists each entry once. The clock reuses the study time calculation for a visible and focused document with a 60-second inactivity window. The result is recorded when the final pair of the final round is matched. A successful match is practice evidence and does not establish mastery.

## Configuration, content and session boundaries

- `frontend/src/types/game.ts` defines shared configuration, content references and the session result contract. `frontend/src/types/word-match.ts` defines round vocabulary and the Word Match result.
- `frontend/src/data/games.ts` sets publication and difficulty. `frontend/src/services/game-content.ts` limits authored candidates to the configured sources, publication state and CEFR level. A caller can also limit grammar candidates to explicitly introduced lessons. Word Match and Memory Game read the existing favorite IDs without writing to their storage.
- `frontend/src/services/game-vocabulary.ts` projects the selected content into shared vocabulary pairs. Lesson vocabulary uses authored entry IDs scoped by course, lesson and block. Story entries reuse the existing favorite IDs and add a short authored matching translation alongside their contextual meaning. Standalone vocabulary uses its existing ID. Preserve these IDs when editing learner-facing text.
- Pair selection excludes duplicate IDs, equivalent normalized labels, overlapping slash-separated translations and authored synonym groups. Authors can use `matchGroup` on lesson entries that share a plausible meaning even when their translations differ. The selector keeps the first eligible instance of each conflict. This is an authoring aid and does not infer semantic equivalence. Review new vocabulary for ambiguities before publication.
- Round generation shuffles with Fisher–Yates, prefers the least-used entries and shuffles each column independently. The injectable random function makes tests reproducible. `frontend/src/services/word-match-session.ts` handles pair selection, attempt tracking and result aggregation independently of React.
- `frontend/src/pages/word-match-page.tsx` ties setup, player and result components together. A future adapter can supply eligible content or store a result through the same contracts.

## Sentence Builder

The challenge catalog in `frontend/src/data/sentence-challenges.ts` has 48 A1 prompts based on published introductory lessons and _A Rainy Morning_. Each challenge carries a stable ID, topics, difficulty, contextual Portuguese prompt, English model, explanatory feedback and a lesson block or story paragraph reference. The setup removes challenges whose source is unavailable. Each topic offers only sessions with enough distinct content. Easy uses five challenges of 3–5 words, medium eight of 5–8 words, and hard ten of 6–10 words plus distractors.

`frontend/src/services/sentence-challenges.ts` prepares the shared sentence exercise. Each word instance has its own ID, including repeated words. The tile bank omits punctuation so it can represent explicitly accepted alternative orders. Write each alternative using the same words and contractions as the main model. Teach punctuation in the complete sentence shown after submission. Add distractors only when they cannot form another appropriate response to the prompt. The service validates tiles and accepted orders, deduplicates prompts by stable ID and accepted sentence, and shuffles with the same Fisher–Yates helper as Word Match. If the initial shuffled prefix is an accepted answer, it finds a different visible arrangement when possible.

The game uses the shared Practice Player and sentence evaluator for submission, retries and explicit correction review. Tile editing adds undo, clear and move controls. Pronunciation is on demand after a correct answer or explicit correction review, and it stops when the player advances or unmounts. The result counts all submissions, first-attempt successes and completed challenges, including reviewed corrections. It displays the attempted orders, corrected sentences and topics to revisit. The game records completion when its last challenge is answered correctly or explicitly reviewed. History distinguishes independent answers from reviewed corrections.

## Memory Game

The setup uses the same A1 vocabulary sources and ambiguity checks as Word Match. Easy, medium and hard use one board of four, six or eight pairs. `frontend/src/services/memory-board.ts` samples and shuffles with Fisher–Yates and assigns each card an ID composed of its language and stable vocabulary ID. Each pair has one English card and one Portuguese card.

`frontend/src/services/memory-session.ts` counts an attempt when the second distinct eligible card is revealed. It locks further reveals after a mismatch until the learner explicitly turns the cards back. Matched pairs stay visible and carry a text label. The card component keeps vocabulary out of the rendered content and accessible name while face down. Native controls support keyboard, touch and pointer input without timed reveals.

The result extends the shared game result with the vocabulary source, board size, incorrect attempt count and practiced entries. It shows completed pairs, total attempts and estimated active time. The shared clock counts focused, visible time within the inactivity window. Vocabulary review is optional during play and from the result, with context, examples and phonetics when authored. Speech is on demand and stops when the review closes or unmounts.

The result is recorded when the final pair is matched. Memory matching offers recall practice and does not establish vocabulary mastery. A mismatch increases the attempt count without generating a vocabulary review recommendation.

## Session history and review

`GameSessionResult` is a discriminated union with common timing and attempt fields. The compact `CompletedGameSession` union keeps game-specific metrics and references. `recordGameSession` projects and validates the result, then inserts it once by session ID. Completion events run from learner interactions. Opening the summary, re-rendering, and React Strict Mode do not write a second record. Replays create new IDs. Abandoned games leave no record.

Open `/jogos/historico` to filter completed sessions by game and difficulty. Each detail route resolves vocabulary IDs and challenge IDs against the current content catalog. The stored history retains reference IDs, completion and review flags, and distinct incorrect sentence attempts. It does not store the authored translations, examples or feedback. A missing reference displays an unavailable-entry message. Unique vocabulary counts distinct authored IDs from Word Match and Memory Game. It does not count sentence tokens or measure mastery.

`selectGameHistory`, `selectGameTotals` and `selectGameReview` provide reusable data for future progress views. Review recommendations include Word Match mismatch vocabulary, Sentence Builder topics with incorrect attempts, and explicitly reviewed sentences with their educational references. Favorites remain learner controlled. The Dashboard and weekly study view use completed game time. See [progress architecture](progress.md).
