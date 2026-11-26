# Vocabulary Notebook

The lazy route at `/meu-caderno` shows favorites from the daily word, published lesson vocabulary, published story vocabulary, and Practical English phrasebooks. Related expressions saved from dialogues, simulation summaries and cultural guidance use their existing phrasebook IDs. The Notebook keeps word senses and contexts distinct by stable ID. It never adds an entry from passive exposure or game activity.

## Data and storage

- `types/notebook.ts` separates vocabulary projections from saved reference metadata. `services/notebook-content.ts` maps authored English, Brazilian Portuguese, examples, pronunciation, usage, level and source links into the same read model. It fetches lesson and story modules only for matching ID namespaces and imports only requested Practical English phrasebooks. The source links open the originating lesson, story chapter or phrasebook item.
- `services/word-favorites.ts` keeps `mellow:favorite-words` as the canonical JSON array. New additions store their timestamp in `mellow:favorite-words-saved-at`, an optional map keyed by the original ID. Legacy dates remain unknown. Removing a favorite removes its date. No educational text is stored with favorites.
- The shared React subscription responds to changes in the current tab and browser storage events from other tabs. Duplicate copies of one ID resolve to one entry. Equal spellings with different source IDs retain their context. Unavailable IDs remain saved until explicitly removed. A failed content load can be retried.
- Lesson favorites use the same `course/lesson/block/entry` reference already used by vocabulary games. The saved-game pool uses supported lesson, story and daily-word entries. Practical phrases remain reviewable in the Notebook. The learner progress repository and existing completion rules are independent of favorites.

## Review and playback

`services/notebook-selectors.ts` selects saved vocabulary and filters by source, content type, CEFR, familiarity and bilingual search. Alphabetical order breaks ties by translation and ID. Recent order puts dated records first and uses the alphabetical comparator for ties and older records without a date. The Notebook uses one instance of the shared speech hook for all cards. Starting another example, changing the view or leaving the route cancels playback. Voice availability depends on the browser and operating system.

## Personal study

The journal writes a version 1 JSON envelope to `mellow:vocabulary-annotations`. Each record is keyed by the original favorite ID and contains its creation and update timestamps, optional self-reported familiarity and optional plain-text note and English example. The educational record remains in its source module. Text is rendered literally, including accents and line breaks. Notes are limited to 1,200 characters and personal examples to 400 characters. Examples are learner-authored and have no automated correction.

The editor saves only on explicit submission. Cancel, Escape and in-app navigation request confirmation when edits are unsaved. Closing or refreshing the tab uses the browser's unsaved-changes prompt where supported. The other tab's edits become visible via storage events. If the same item changes while its editor is open, a conflicting save is refused and the draft remains in the editor. Empty fields and a cleared classification remove the metadata record when saved.

Missing educational content leaves personal study editable. When removing an annotated favorite from any supported interface, the learner confirms that the item will leave the Notebook while its personal study remains stored. Saving the same ID later makes the annotations visible again. To erase them, clear the fields and classification in the editor before removing the item. The stored text is local to the browser and app address.

The parser retains valid records when individual records are malformed. A damaged envelope can be replaced by a later successful save, while an unsupported version is left intact. Storage failures leave the editor open with the draft so the learner can retry or copy it. The favorites array and learner progress envelope keep their existing formats.

## Flashcard review

The lazy route at `/meu-caderno/cartoes` can start with all saved vocabulary or the Notebook's current filters. Source and familiarity narrow the requested IDs before the source modules load. Type, CEFR and bilingual search then use the Notebook selectors. Structured filters travel in route parameters. Free-text search travels through navigation state and stays out of the URL. Unavailable references remain in favorites but are excluded from review. The configuration offers 5, 10, 20 or all eligible cards, and all remains available for groups smaller than five.

`services/flashcards.ts` generates a deck keyed by stable vocabulary ID with the shared Fisher–Yates shuffle. It takes an injectable random function for deterministic tests. Mixed review shuffles a balanced allocation of directions and randomly assigns the extra direction for odd-sized decks. The state engine allows one observation per card after reveal. Returning to an earlier card preserves its reveal and observation. Ratings describe the learner's recollection.

The card front renders only the prompt, and offers pronunciation when the English expression is visible. The back shows the answer, educational context and separate personal annotations. The player uses the shared pronunciation hook and active study clock. Only visible, focused activity before the idle cutoff contributes to the estimated time. Restart and exit are confirmed during a session. A retry of difficult cards starts a fresh session ID and includes the cards rated as forgotten or recalled with effort.

Completed results are saved through the shared progress repository in version 5. The history at `/meu-caderno/revisoes` filters sessions by direction. Detail views request only the reviewed content, showing stable references and recorded ratings when content is no longer available. Unfavoriting preserves history and personal annotations. A replay from history starts a fresh session using only currently saved and resolvable items from that review. Interrupted sessions have no history record. See [Learner progress](progress.md) for the storage schema and active-time accounting.

## Suggested review

`services/review-recommendations.ts` derives evidence when the Notebook opens. It stores no recommendation records. Known vocabulary is grouped by its canonical ID, and sentences are grouped by challenge ID. Each entry can have more than one reason. Newer evidence comes first, followed by repeated evidence counts and a stable ID tie-breaker. Unavailable educational content is omitted from suggestions and remains visible as a reference in the history.

- Flashcards use the latest observation for each item. An easy recall removes the flashcard reason. Repeated difficulty counts stop at the last easy recall.
- Word Match uses recorded IDs from incorrect matching attempts as practice opportunities. Sentence Builder uses challenges with incorrect submissions or reviewed corrections and links to the authored examples' lessons or stories.
- Practical English separates choices outside the intended context from explicit correction review. It uses linked appropriate expressions from the relevant authored node. When the stored branch does not identify a correction exactly, only references shared by all compatible correct replies are used. Unresolvable attempts are skipped.
- Learner-assigned Learning and Reviewing levels are reported as personal choices. The annotation update timestamp is not used as the classification date. Incorrect Memory Game matches generate no recommendation.

A recommendation can open the source or a related simulation. Unsaved vocabulary appears separately and requires an explicit save. A suggested flashcard session includes only currently saved eligible recommendations matching the chosen source filter. The game links open the existing saved-vocabulary source and the game setup reports the actual minimum for its compatible pairs.

Recommendation and review observations remain separate from familiarity and proficiency. There is no automatic review schedule.
