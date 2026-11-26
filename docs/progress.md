# Learner progress architecture

The React progress provider exposes one repository snapshot to the Lesson Player, story reader, library, curriculum, games, simulations and Dashboard. The repository contract in `frontend/src/services/progress-repository.ts` offers a cached snapshot, subscriptions and synchronous state transitions. A backend adapter could preserve the cached contract and replace the persistence layer independently of curriculum data and UI.

The browser implementation writes a version 4 JSON envelope under `mellow:learner-progress`. The format validates nested records, timestamps, answer shapes, attempt statuses and schema versions on read. Version 1 lesson records and daily activity are accepted unchanged. Version 2 adds reading preferences and story records. Version 3 adds completed game sessions. Version 4 adds completed simulation sessions and accepts all three earlier versions. Malformed reading, game and simulation records are discarded individually while compatible lesson data is retained. Malformed or unsupported envelopes start a new record. Storage access or write failures keep the current session in memory and are reported in the lesson and story readers, game results, game history and simulation results. Browser storage events and a read before each update refresh other tabs' saved changes where available. Simultaneous edits of the same activity can still resolve to the last write. There is no synchronization across devices.

## Runs and completion

A lesson without a record is not started. Opening a published lesson creates an in-progress record with a timestamp, a stable block ID and its first visit. Activity positions use stable IDs. Drafts, submitted answers, per-submission correctness and modality, correction review timestamps, listening modes and active duration are saved independently of lesson publication. The first submission determines first-attempt accuracy. Restart clears the current run after confirmation and retains daily study time. For previously completed lessons, the original completion and its results remain immutable during replays.

Blocks and graded activities are required by default. Content authors can mark them optional with `requiredForCompletion: false`. A required block must be visited. Each required graded activity must have a correct submission or an explicitly reviewed correction. The player verifies eligibility again when the learner confirms completion. The same run cannot be finalized twice, and a replay cannot add another completed lesson to the catalog count. Guided speaking is a content visit only, without scored proficiency.

The result screen displays the original completion. Accuracy groups use the mode of each first submission. Listening with audio means the browser reported end of playback before submission. Text alternative and listening without confirmed full playback have separate rows. Browser events cannot verify whether the learner physically heard the audio. The Dashboard reports completed lessons, current-week study days and active study duration. It has no vocabulary mastery metric.

## Active time

The active Lesson Player or Story Reader owns the same study tracker. The library and result screen do not run it. Time accrues while the browser document is visible and focused. Reading contributes once to daily study activity and total study time. A separate reading subtotal describes the reading portion of that total. Entering or refocusing the lesson starts a fresh 60-second window. Pointer presses, key presses and wheel activity extend the inactivity deadline. Hidden, blurred or idle time is excluded. The tracker saves every five seconds and flushes on blur, visibility changes, navigation, restart and completion. Local-midnight boundaries split time between calendar days. Dashboard weeks start on Monday.

This is an engagement estimate. Reading or listening without interaction can exceed the idle window, and time up to the idle cutoff may include a short break. The browser may interrupt a final save on abrupt process termination, and changes to the device clock or time zone can affect day boundaries. Focus gating and a single route tracker avoid counting time separately for individual exercises and UI components.

## Reading records

Each story stores a current run, its last chapter and meaningful paragraph IDs, chapter practice sessions and explicit read timestamps. It also stores distinct lifetime chapter IDs and the first complete run. A restart replaces only the current run. Further readings can add active time, and repeated marks never add duplicate chapter or story counts. The Dashboard and library derive progress from these records.

The reader samples the last narrative paragraph visible above a line near the middle of the viewport. Scrolling outside the narrative retains the previous saved paragraph. If its ID no longer exists, the chapter opens without restoring an offset. The estimate does not indicate language mastery or verify that the reader read every line.

## Game sessions

Completed game records are keyed by unique session ID within the same progress envelope. Review recommendations and vocabulary favorites remain separate. In-progress and abandoned sessions are held only in the current view and are never part of recorded practice.

The shared clock measures focused and visible play with the same inactivity window as lessons and reading. It splits active intervals at local midnight and keeps the day totals in memory until the game is completed. A completed record holds the game's per-day contributions. The total and weekly activity selectors combine those contributions with the existing lesson and reading buckets at read time. The game record is the only stored source of its time, so replaying a completion event or opening a history page cannot add it twice. Game, lesson and reading completion are counted independently. Clearing browser storage or using another device makes the local history unavailable.

## Conversation simulation sessions

Each successful run records a unique session ID, scenario and situation IDs, start and completion timestamps, ordered attempts with authored response IDs and their classifications, and active time split by local day. History derives the latest completion and counts correct and incorrect submissions from those attempts. Correction review can complete a decision without creating another submission. Restarting or leaving a run preserves all older completed sessions. Partial answers and the conversation transcript are kept only in the running view.

The shared Dashboard selectors add simulation time from completed records, once per recorded session ID. A situation counts distinct completed published scenarios, so replaying a scenario adds another history entry and its own active time without increasing the number of distinct scenarios completed. The repository has the same browser-local storage and cross-device limitations as the other modules.

Cultural guidance is reference material. Opening an article, playing an example or reading all four entries does not create a simulation record or add study time. Saving a phrasebook example uses its existing vocabulary favorite ID. Completed simulations remain the source of Practical English time and activity on the Dashboard, and count practice sessions without assessing proficiency.
