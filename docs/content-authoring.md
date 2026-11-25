# Authoring Mellow lessons

## Start with the outline

1. Locate the planned record in `frontend/src/data/curriculum/english-a1.ts`. Preserve its ID, title, objectives, estimated duration and position in the unit.
2. Create an English-named `*-lesson.ts` module alongside the outline. Export a record checked with `satisfies AvailableLesson`. Keep educational data outside UI components and learner progress.
3. Plan a practical adult conversation. Introduce each target before assessing it. Reuse vocabulary from earlier lessons and introduce only enough new material to serve the objectives.
4. Validate the content while the planned record is still in the catalog. Then import the validated module and replace that record in place. The existing player, recommendation and completion links pick up the available lesson.

## Content blocks

| Kind           | Main fields                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `introduction` | `paragraphs` situate the conversation. The lesson's `objectives` appear in this block.                                                 |
| `vocabulary`   | `entries` pair each English `expression` and `example` with a Portuguese `translation`. Add `usage` where useful.                      |
| `grammar`      | `explanation` and `patterns` explain how the form serves a communicative purpose. Each pattern includes a note and translated example. |
| `dialogue`     | `context` and ordered translated `lines` with speaker names.                                                                           |
| `listening`    | `instructions` and ordered `activities` with script, reading alternative and exercise.                                                 |
| `practice`     | `instructions` and ordered graded `exercises`.                                                                                         |
| `speaking`     | `instructions` and `prompts` with translated models to say aloud. This block is guided practice.                                       |
| `review`       | `reminders` and translated `examples` recap the lesson.                                                                                |

Each block has an ID, a title and a kind. Blocks and graded activities are required by default. Only set `requiredForCompletion: false` for intentional enrichment.

## Exercises and listening

Every exercise has an ID, instructions, a prompt, and explanatory feedback in Brazilian Portuguese. A hint is optional. The kind determines the answer configuration.

| Exercise kind        | Answer configuration                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `multiple-choice`    | An options array and one `correctOptionId`. Use the option's `language` field when its text is in a different language from the lesson target.                                             |
| `fill-in-the-blanks` | One or more blanks with stable IDs, `before`, `after` and `acceptedAnswers`. The evaluator ignores case and repeated whitespace. List valid punctuation or apostrophe variants explicitly. |
| `sentence-builder`   | Identified `tiles` and a `correctOrder` array containing the intended tile IDs.                                                                                                            |
| `matching-pairs`     | `left`, `right` and one-to-one `correctPairs` keyed by left option ID.                                                                                                                     |
| `true-or-false`      | A boolean `correctValue`.                                                                                                                                                                  |

A listening activity adds a `format`, a `source` and a `textAlternative`. The source uses browser speech with `kind: 'speech'`, `language: 'en-US'` and ordered `parts` containing an ID, English text, Portuguese translation and an optional speaker. Use a multiple-choice exercise for `listen-and-choose`, fill-in-the-blanks for `listen-and-write`, and multiple choice or true/false for `dialogue-comprehension`. Write a separate Portuguese cue for the reading alternative. The player only offers the original transcript for review after submission.

## Identifiers and quality

Use lowercase ASCII kebab-case. Keep lesson and exercise IDs globally unique, prefixing exercise IDs with their lesson ID. Block IDs are unique within a lesson. Option, blank and audio-part IDs are scoped to their exercise or script. Published IDs are persistence keys. Preserve them when editing wording, and avoid changing an existing exercise's answer format or meaning under the same ID.

Write lesson explanations, instructions and feedback in Brazilian Portuguese. Use natural English and translate meaning in context. For A1, favor short adult scenarios, manageable vocabulary sets and a progression from models to guided use. Check that each answer has already been taught, each distractor is clearly unsuitable in context, and feedback explains the reason. For dictation, compare every accepted answer to the exact spoken wording. Use the course's US English conventions.

## Practical example

This excerpt from the origins lesson illustrates a listening activity using the existing exercise evaluator. An available lesson also needs lesson metadata and its ordered `blocks` array. See [the full origins lesson](../frontend/src/data/curriculum/origins-lesson.ts) for the surrounding vocabulary, grammar and practice.

```ts
import type { ListeningActivity } from '@/types/listening'

const originsDictation = {
  format: 'listen-and-write',
  source: {
    kind: 'speech',
    language: 'en-US',
    parts: [
      {
        id: 'line-1',
        text: 'I’m from Recife.',
        translation: 'Eu sou de Recife.',
      },
    ],
  },
  textAlternative:
    'Uma pessoa responde “Sou de Recife”. Escreva a resposta em inglês usando I’m.',
  exercise: {
    id: 'en-a1-introductions-from-listening-city',
    kind: 'fill-in-the-blanks',
    prompt: 'Como a pessoa diz de onde é?',
    instructions: 'Digite a frase com I’m. O ponto final é opcional.',
    blanks: [
      {
        id: 'response',
        before: '',
        after: '',
        acceptedAnswers: [
          'I’m from Recife.',
          'I’m from Recife',
          "I'm from Recife.",
          "I'm from Recife",
        ],
      },
    ],
    feedback:
      'I’m from seguido de Recife informa a cidade de origem. O apóstrofo faz parte de I’m.',
  },
} satisfies ListeningActivity
```

## Validation checklist

- Check publication scope, preserved outline metadata, unique IDs, block order and exercise answer configurations.
- Read the English examples, audio scripts and Portuguese translations together. Check explanations, alternatives and feedback by answering as a beginner.
- Verify listening review, the reading alternative, and the learner's path from a correct answer or reviewed correction to explicit completion.
- Test narrow mobile and desktop screens, keyboard interaction, refresh and resume, and the next published lesson link.
- Run `npm run lint`, `npm run typecheck`, `npm run build`, `npm run format:check` and `npm test` from the repository root.
