# Learner progress architecture

The React progress provider exposes one repository snapshot to the Lesson Player, curriculum and Dashboard. The repository contract in `frontend/src/services/progress-repository.ts` offers a cached snapshot, subscriptions and synchronous state transitions. A backend adapter could preserve the cached contract and replace the persistence layer independently of curriculum data and UI.

The browser implementation stores a version 1 JSON envelope under `mellow:learner-progress`. The format validates nested records, timestamps, answer shapes, attempt statuses and schema versions on read. Malformed or unsupported schemas start a new record. Storage access or write failures keep the current session in memory and are reported in the Lesson Player. Browser storage events and a read before each update refresh other tabs' saved changes where available. Simultaneous edits of the same activity can still resolve to the last write. There is no synchronization across devices.

## Runs and completion

A lesson without a record is not started. Opening a published lesson creates an in-progress record with a timestamp, a stable block ID and its first visit. Activity positions use stable IDs. Drafts, submitted answers, per-submission correctness and modality, correction review timestamps, listening modes and active duration are saved independently of lesson publication. The first submission determines first-attempt accuracy. Restart clears the current run after confirmation and retains daily study time. For previously completed lessons, the original completion and its results remain immutable during replays.

Blocks and graded activities are required by default. Content authors can mark them optional with `requiredForCompletion: false`. A required block must be visited. Each required graded activity must have a correct submission or an explicitly reviewed correction. The player verifies eligibility again when the learner confirms completion. The same run cannot be finalized twice, and a replay cannot add another completed lesson to the catalog count. Guided speaking is a content visit only, without scored proficiency.

The result screen displays the original completion. Accuracy groups use the mode of each first submission. Listening with audio means the browser reported end of playback before submission. Text alternative and listening without confirmed full playback have separate rows. Browser events cannot verify whether the learner physically heard the audio. The Dashboard reports completed lessons, current-week study days and active study duration. It has no vocabulary mastery metric.

## Active time

One tracker is owned by the active Lesson Player route. Time accrues while the browser document is visible and focused. Entering or refocusing the lesson starts a fresh 60-second window. Pointer presses, key presses and wheel activity extend the inactivity deadline. Hidden, blurred or idle time is excluded. The tracker saves every five seconds and flushes on blur, visibility changes, navigation, restart and completion. Local-midnight boundaries split time between calendar days. Dashboard weeks start on Monday.

This is an engagement estimate. Reading or listening without interaction can exceed the idle window, and time up to the idle cutoff may include a short break. The browser may interrupt a final save on abrupt process termination, and changes to the device clock or time zone can affect day boundaries. Focus gating and a single route tracker avoid counting time separately for individual exercises and UI components.
