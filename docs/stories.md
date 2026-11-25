# Story library and reader

The `/historias` route renders the story collection with the shared Mellow layout. The collection contains six stories from A1 to B1 and 20 chapter records. **A Rainy Morning** and **The First Trip** each have three readable A1 chapters. The other four stories offer outline previews. The second story follows Caio as he reads a departure time, asks for directions, and finds his seat. Each cover is an original SVG stored under `frontend/src/assets/stories/`. Covers are decorative because the title and description already identify each item.

## Content model

`frontend/src/types/story.ts` reuses the curriculum's CEFR codes and separates metadata, chapter outlines and readable chapters. Give each story a globally unique kebab-case ID and each chapter a stable ID within its story. Preserve existing IDs when publishing an outline. Use English titles, Brazilian Portuguese summaries and objectives, one or more genre tags, and an estimated duration for the reading experience. The library preserves the collection and chapter order in `frontend/src/data/stories.ts`.

A planned chapter has a title and summary. Available stories require at least one paragraph per chapter. Paragraphs have stable IDs, English text, and optional Portuguese translations, vocabulary references and narration sources. Put the vocabulary definitions in the chapter's vocabulary list. Give each entry a globally unique contextual ID so a different sense of the same word can be saved independently. A paragraph reference identifies an exact phrase in the English text and a vocabulary ID. References follow their appearance in the paragraph. Each entry has a phonetic transcription, Portuguese meaning, and a translated English example. Tests verify that references resolve while preserving the original English text. An optional comprehension block contains a stable ID, instructions and an ordered list of shared exercises. Each exercise can reference paragraph IDs within the current chapter.

## Library and reader behavior

Library filters combine title search, CEFR level, genre and personal reading status. Personal filters apply to published stories. The continue-reading shelf links to the last saved chapter for unfinished runs. An accessible result count and reset control support empty results. Native disclosures show chapter outlines. Available stories link to their reader. Planned stories stay preview-only.

`/historias/:storyId` resumes at the saved chapter or opens the first chapter for a new reader. An optional `:chapterId` opens a specific chapter, including when the page is refreshed or shared. One reader component handles every published story. The chapter counter describes position only. The reader tracks the last paragraph that reaches the upper portion of the viewport and restores it by ID on reopening or reloading. Chapter and paragraph IDs stay stable across edits. Text size and translation visibility are shared reading preferences saved locally. Translations are hidden by default. Narration speed remains a session setting.

Contextual vocabulary opens a compact native modal. Keyboard users can close it with Escape or the close button and return to the selected phrase. Favorites use the existing `mellow:favorite-words` storage key and save contextual IDs. They do not update lesson progress or mark words as mastered.

## Audio

The reader uses the shared browser speech controller for chapter, paragraph and vocabulary playback. Chapter narration plays paragraphs in order and defaults to the authored English text in US English. Paragraph and chapter models can supply an explicit `AudioSource`. Normal speed is 1× and reduced speed is 0.75×. Starting a new audio action replaces the current one. Leaving a chapter or the reader cancels playback, and closing the vocabulary modal stops its pronunciation. Lack of synthesis support and playback failures are announced while the text remains available.

Automated audio tests mock Web Speech to verify API calls, rates and cancellation. These tests do not establish audible output or voice quality. Reading progress and favored vocabulary remain separate from the authored content.

## Reading comprehension

**A Rainy Morning** includes five optional exercises per chapter. **The First Trip** includes four per chapter, covering departure times, platform directions, travel expressions and the window seat. The reader renders the same practice player used by lessons. All answers use the shared evaluator. The reusable `sequence-ordering` type compares selected event IDs in order and uses the same selection controls as sentence building. Each event appears once in a complete answer.

The comprehension panel comes after the narrative and has its own exercise indicator. Paragraph links let readers consult the relevant text. Submission is explicit, incorrect answers allow unlimited retries, and readers can acknowledge a correction before continuing. Chapters remain open regardless of exercise activity. Drafts, submissions and reviewed corrections are saved by chapter, independently of reading completion.

## Reading completion

Readers explicitly mark chapters as read in any order. A story completes when every published chapter in the current run has been marked. Exercises remain optional. Opening a chapter, scrolling and reaching the last paragraph do not mark it as read.

The result shows the chapters, active reading estimate, objectives and available exercise feedback metrics. A completed story can be reopened, and a confirmed restart clears current-run chapter and exercise state while retaining the first completion and lifetime chapter totals. The reading repository and clock are shared with the lesson infrastructure. See [progress architecture](progress.md).
