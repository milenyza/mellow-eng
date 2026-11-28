import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { format, resolveConfig } from 'prettier'
import { buildSessionCatalog } from './session-catalog.mjs'

const frontend = fileURLToPath(new URL('../../frontend/', import.meta.url))
const server = await createServer({
  root: frontend,
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
})

function exercise({ id, kind, requiredForCompletion, ...source }) {
  const rule = { required: requiredForCompletion !== false, kind }
  switch (kind) {
    case 'multiple-choice':
      return [
        id,
        {
          ...rule,
          choices: source.options.map((option) => option.id),
          correctOptionId: source.correctOptionId,
        },
      ]
    case 'fill-in-the-blanks':
      return [
        id,
        {
          ...rule,
          accepted: Object.fromEntries(
            source.blanks.map(({ id, acceptedAnswers }) => [
              id,
              acceptedAnswers,
            ]),
          ),
        },
      ]
    case 'matching-pairs':
      return [
        id,
        {
          ...rule,
          choices: source.right.map((option) => option.id),
          pairs: source.correctPairs,
        },
      ]
    case 'sentence-builder':
      return [
        id,
        {
          ...rule,
          tiles: Object.fromEntries(
            source.tiles.map(({ id, text }) => [id, text]),
          ),
          orders: [source.correctOrder, ...(source.alternativeOrders ?? [])],
        },
      ]
    case 'sequence-ordering':
      return [
        id,
        {
          ...rule,
          choices: source.items.map((option) => option.id),
          orders: [source.correctOrder],
        },
      ]
    case 'true-or-false':
      return [id, { ...rule, correctValue: source.correctValue }]
    default:
      throw Error(`Unsupported exercise kind: ${kind}`)
  }
}

try {
  const { englishCourse } = await server.ssrLoadModule(
    '/src/data/curriculum/english-course.ts',
  )
  const { stories } = await server.ssrLoadModule('/src/data/stories.ts')
  const lessons = englishCourse.levels.flatMap(({ units }) =>
    units.flatMap(({ lessons }) => lessons),
  )
  const catalog = {
    revision: 1,
    lessons: Object.fromEntries(
      lessons
        .filter(({ availability }) => availability === 'available')
        .map(({ id, blocks }) => [
          id,
          Object.fromEntries(
            blocks.map((block) => [
              block.id,
              {
                required: block.requiredForCompletion !== false,
                listeningRefs:
                  block.kind === 'listening'
                    ? block.activities.map(({ exercise }) => exercise.id)
                    : [],
                exercises: Object.fromEntries(
                  (block.kind === 'listening'
                    ? block.activities.map(({ exercise }) => exercise)
                    : (block.exercises ?? [])
                  ).map(exercise),
                ),
              },
            ]),
          ),
        ]),
    ),
    stories: Object.fromEntries(
      stories
        .filter(({ publication }) => publication === 'available')
        .map(({ id, chapters }) => [
          id,
          Object.fromEntries(
            chapters.map((chapter) => [
              chapter.id,
              {
                paragraphs: chapter.paragraphs.map(({ id }) => id),
                exerciseOrder: (chapter.comprehension?.exercises ?? []).map(
                  ({ id }) => id,
                ),
                exercises: Object.fromEntries(
                  (chapter.comprehension?.exercises ?? []).map(exercise),
                ),
              },
            ]),
          ),
        ]),
    ),
  }
  const sessionCatalog = await buildSessionCatalog(
    server,
    englishCourse,
    stories,
  )
  for (const [filename, content] of [
    ['progress-v1.json', catalog],
    ['sessions-v1.json', sessionCatalog],
  ]) {
    const destination = fileURLToPath(
      new URL(`../src/main/resources/catalog/${filename}`, import.meta.url),
    )
    const rendered = await format(JSON.stringify(content), {
      ...(await resolveConfig(destination)),
      filepath: destination,
    })
    if (process.argv.includes('--check')) {
      if (rendered !== (await readFile(destination, 'utf8')))
        throw Error(`${filename} differs from published content.`)
    } else {
      await writeFile(destination, rendered)
    }
  }
} finally {
  await server.close()
}
