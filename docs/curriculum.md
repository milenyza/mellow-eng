# Curriculum foundation

The curriculum follows Course → CEFR Level → Unit → Lesson → Learning Activity. `frontend/src/types/curriculum.ts` defines the data contract. Each course identifies its target and interface languages with BCP 47 language tags. Unit and lesson IDs are stable strings independent of translated titles and display order. Course level order and unit order come from the catalog arrays.

The English course for Brazilian Portuguese speakers declares A1 through C2. A1 contains 12 units and 48 lesson records: four published Unit 01 lessons and 44 planned outlines. A2 through C2 are empty. Activity collections are reserved for future content and are empty. English titles identify the learning topics, and the catalog presents outline descriptions and objectives in Brazilian Portuguese.

Learner progress lives separately from course content. The catalog computes completion against all A1 outlines. The four Unit 01 lessons display availability, in-progress or completed status according to the saved learner record. The other 44 lessons remain planned and their outlines can be previewed. Recommendations prefer in-progress published lessons and then unstarted published lessons in curriculum order. The Dashboard and catalog share the same derivations; see [learner progress](progress.md).

The Dashboard and lesson catalog import `english-a1-index.ts`, which contains outline metadata and publication status. The lazy Lesson Player and modules that reuse educational content import the full `english-course.ts`. Unit 01 metadata is shared between both views, keeping recommendations and published lessons in sync without loading activity blocks on the Dashboard.

## Unit 01 progression

1. **Hello, nice to meet you!** introduces greetings, names and the forms `I am` and `you are`.
2. **Where are you from?** moves from names to origin, cities, countries and nationalities. It includes a short model for correcting an assumption with `I’m not from`.
3. **This is my friend** uses `this is` to introduce someone and `he`, `she` and `they` with `is` and `are` to talk about other people.
4. **A little about me** brings those exchanges together and practices short yes/no answers as a cumulative review.

Each record keeps the original lesson ID, title, objectives and duration. The three additional lessons use the existing player, assessment, audio and storage models. See [content authoring](content-authoring.md) for the data formats and publication workflow.

## Lesson player

The route `/aulas/:lessonId` resolves a stable lesson ID in the course catalog. An available lesson must contain at least one ordered, typed block. A planned lesson has outline metadata only and resolves to an upcoming-lesson message. An unknown ID resolves to a separate fallback. The first available record is `frontend/src/data/curriculum/introductions-lesson.ts`.

`frontend/src/types/lesson-content.ts` defines the discriminated block union. The player uses a shared stage shell for navigation, progress, and focus management. The block renderer dispatches by kind, so new lessons reuse the same page and rendering components. The first lesson uses two vocabulary stages and one stage for each other block kind. Stage position is restored when the player reopens. Reaching review alone does not mark the lesson complete. Practice evaluates structured responses locally. Speaking prompts do not capture or assess speech.

The Dashboard and the lesson player share the Web Speech API hook and pronunciation controls. English playback prefers a US English voice, falls back to another English voice when available, and otherwise requests English from the browser. Voice availability depends on the browser and operating system. Switching stages or leaving the lesson cancels playback. Vocabulary, examples and dialogue retain their visible English text and Portuguese translations when audio is unavailable. The player does not request microphone access.

## Interactive practice

A Practice block contains an ordered, nonempty list of exercises. The discriminated union in `frontend/src/types/exercise.ts` supports multiple choice, fill in the blanks, sentence builder, sequence ordering, matching pairs, and true or false. Each exercise defines a stable ID, prompt, instructions, expected answer, feedback in Brazilian Portuguese, and an optional hint.

`frontend/src/services/exercise-evaluation.ts` evaluates responses independently of React. Fill-in-the-blanks answers normalize case and whitespace, and only explicitly listed alternatives are accepted. Sentence builders compare ordered tile IDs and matching exercises require a unique choice for each row. Hints are disclosed on request. An incorrect submission explains the expected answer and lets the learner retry or explicitly review the correction before advancing within the practice block.

The Lesson Player saves practice sessions by block ID and attempts by exercise ID in the local progress repository. Drafts, feedback and exercise position survive stage navigation and reload. Exercise progression is separate from lesson navigation and does not mark the lesson complete. The first A1 lesson includes ten exercises authored in `frontend/src/data/curriculum/introductions-exercises.ts`.

Run `npm test` from the repository root to execute the Vitest suite. It includes pure evaluation tests, React Testing Library interaction tests, and a Lesson Player integration test.

## Listening comprehension

A Listening block holds an ordered list of activities defined in `frontend/src/types/listening.ts`. The listening activity couples a source and a reading alternative to a question from the existing exercise union. Listen-and-choose uses multiple choice, listen-and-write uses fill in the blanks, and dialogue comprehension uses multiple choice or true/false. Corrections, retries, hints and advancement use the same exercise player and evaluator. The first lesson contains two activities of each format in `frontend/src/data/curriculum/introductions-listening.ts`.

The listening controls use the shared playback hook and its `AudioSource` contract. The adapter in `frontend/src/services/audio-playback.ts` currently synthesizes ordered segments. A prerecorded source can extend the contract and provide playback through the adapter without replacing the activity UI. Learners may play, stop and replay at 1× or 0.75×. Dialogues play their lines in order with a single browser voice. The adapter cancels playback when the activity or lesson stage is left.

Before submission the original script is absent from the rendered activity. After submission an optional disclosure shows the script and its Portuguese translation. The reading alternative is explicitly selected and uses a separate Portuguese cue in place of the original transcript. It is available even if sound output cannot be used. Answers, feedback, activity position and reading mode are restored from local storage. Finishing the listening activities does not mark the lesson complete.

Automated tests stub Web Speech to verify rates, voice selection, cancellation and error handling. These tests validate controls and browser API calls. They do not assess the audible output or the pronunciation quality of a device's voice.
