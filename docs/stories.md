# Story library and reader

The `/historias` route renders the story collection with the shared Mellow layout. The collection contains six stories from A1 to B1 and 20 chapter records. **A Rainy Morning** has three readable chapters. The other five stories offer outline previews. Each cover is an original SVG stored under `frontend/src/assets/stories/`. Covers are decorative because the title and description already identify each item.

## Content model

`frontend/src/types/story.ts` reuses the curriculum's CEFR codes and separates metadata, chapter outlines and readable chapters. Give each story a globally unique kebab-case ID and each chapter a stable ID within its story. Preserve existing IDs when publishing an outline. Use English titles, Brazilian Portuguese summaries and objectives, one or more genre tags, and an estimated duration for the reading experience. The library preserves the collection and chapter order in `frontend/src/data/stories.ts`.

A planned chapter has a title and summary. Available stories require at least one paragraph per chapter. Paragraphs have stable IDs, English text, and optional Portuguese translations, vocabulary references and narration sources. Put the vocabulary definitions in the chapter's vocabulary list. Give each entry a globally unique contextual ID so a different sense of the same word can be saved independently. A paragraph reference identifies an exact phrase in the English text and a vocabulary ID. References follow their appearance in the paragraph. Each entry has a phonetic transcription, Portuguese meaning, and a translated English example. Tests verify that references resolve while preserving the original English text. The chapter schema reserves comprehension exercises for a later stage.

## Library and reader behavior

Library filters combine title search, CEFR level and genre. An accessible result count and reset control support empty results. Native disclosures show chapter outlines. Available stories link to their reader. Planned stories stay preview-only.

`/historias/:storyId` opens the first chapter. An optional `:chapterId` opens a specific chapter, including when the page is refreshed or shared. One reader component handles every published story. The chapter counter describes position only. No reading completion is inferred or saved. Text size, translation visibility and narration speed are local UI state while moving between chapters in the same story. Translations start hidden on a fresh entry.

Contextual vocabulary opens a compact native modal. Keyboard users can close it with Escape or the close button and return to the selected phrase. Favorites use the existing `mellow:favorite-words` storage key and save contextual IDs. They do not update lesson progress or mark words as mastered.

## Audio

The reader uses the shared browser speech controller for chapter, paragraph and vocabulary playback. Chapter narration plays paragraphs in order and defaults to the authored English text in US English. Paragraph and chapter models can supply an explicit `AudioSource`. Normal speed is 1× and reduced speed is 0.75×. Starting a new audio action replaces the current one. Leaving a chapter or the reader cancels playback, and closing the vocabulary modal stops its pronunciation. Lack of synthesis support and playback failures are announced while the text remains available.

Automated audio tests mock Web Speech to verify API calls, rates and cancellation. These tests do not establish audible output or voice quality. Comprehension activities, reading completion and reading progress persistence are outside this implementation.
