export async function buildSessionCatalog(server, course, stories) {
  const [
    { games },
    { wordMatchRoundCount },
    { sentenceChallenges },
    { prepareSentenceChallenge, hasPublishedSentenceReference },
    { simulationSummaries },
    { loadSimulation },
    { practicalSituations },
    { loadPhrasebook },
    { dailyWord },
    { getLessonVocabularyId },
    { getNotebookContentType },
    { collectGameVocabulary, uniqueVocabularyPairs },
  ] = await Promise.all(
    [
      'data/games',
      'services/word-match-content',
      'data/sentence-challenges',
      'services/sentence-challenges',
      'data/simulations/index',
      'data/simulations/load-simulation',
      'data/practical-english',
      'data/phrasebooks/load-phrasebook',
      'data/dashboard',
      'services/lesson-vocabulary-reference',
      'services/notebook-selectors',
      'services/game-vocabulary',
    ].map((path) => server.ssrLoadModule(`/src/${path}.ts`)),
  )

  const vocabulary = {}
  function addVocabulary(id, source, level, type, gameEligible) {
    if (Object.hasOwn(vocabulary, id))
      throw Error(`Duplicate vocabulary ID: ${id}`)
    vocabulary[id] = { source, level, type: type.toUpperCase(), gameEligible }
  }
  for (const level of course.levels) {
    for (const { lessons } of level.units) {
      for (const lesson of lessons.filter(
        ({ availability }) => availability === 'available',
      )) {
        for (const block of lesson.blocks.filter(
          ({ kind }) => kind === 'vocabulary',
        )) {
          for (const { id, expression } of block.entries) {
            addVocabulary(
              getLessonVocabularyId(course.id, lesson.id, block.id, id),
              'LESSON',
              level.code,
              getNotebookContentType(expression.text),
              true,
            )
          }
        }
      }
    }
  }
  for (const story of stories.filter(
    ({ publication }) => publication === 'available',
  )) {
    for (const chapter of story.chapters) {
      for (const entry of chapter.vocabulary ?? []) {
        addVocabulary(
          entry.id,
          'STORY',
          story.level,
          getNotebookContentType(entry.word),
          Boolean(entry.matchingTranslation),
        )
      }
    }
  }
  for (const situation of practicalSituations.filter(
    ({ phrasebook }) => phrasebook === 'available',
  )) {
    const { groups } = await loadPhrasebook(situation.id)
    for (const { expressions } of groups) {
      for (const { id } of expressions)
        addVocabulary(id, 'PRACTICAL', situation.level, 'phrase', false)
    }
  }
  addVocabulary(
    dailyWord.id,
    'DAILY',
    dailyWord.level,
    getNotebookContentType(dailyWord.word),
    true,
  )

  const matchingPairs = collectGameVocabulary(games[0], 'mixed', {
    course,
    stories,
    savedWordIds: [dailyWord.id],
    standaloneVocabulary: [dailyWord],
  })
  for (const [index, pair] of matchingPairs.entries()) {
    const conflicts = matchingPairs
      .slice(index + 1)
      .filter((other) => uniqueVocabularyPairs([pair, other]).length < 2)
      .map(({ id }) => id)
    if (conflicts.length) vocabulary[pair.id].conflicts = conflicts
  }

  const simulations = {}
  for (const { situationId, id } of simulationSummaries) {
    const { scenario } = await loadSimulation(situationId, id)
    if (!scenario)
      throw Error(`Invalid published simulation: ${situationId}/${id}`)
    simulations[situationId] ??= {}
    if (Object.hasOwn(simulations[situationId], id))
      throw Error(`Duplicate simulation: ${id}`)
    simulations[situationId][id] = {
      start: scenario.firstNodeId,
      nodes: Object.fromEntries(
        scenario.nodes.map((node) => [
          node.id,
          node.kind === 'success'
            ? { success: true, hint: false }
            : {
                success: false,
                hint: Boolean(node.hint),
                choices: Object.fromEntries(
                  node.choices.map(({ id, fit, nextNodeId }) => [
                    id,
                    { fit: fit.toUpperCase(), next: nextNodeId },
                  ]),
                ),
              },
        ]),
      ),
    }
  }

  const enumName = (name) => name.replaceAll('-', '_').toUpperCase()
  const sentences = Object.fromEntries(
    sentenceChallenges.map((challenge) => {
      const prepared = prepareSentenceChallenge(challenge)
      if (
        !prepared ||
        !hasPublishedSentenceReference(challenge, course, stories)
      )
        throw Error(`Invalid published sentence challenge: ${challenge.id}`)
      const { tiles, correctOrder, alternativeOrders } = prepared.exercise
      return [
        challenge.id,
        {
          difficulty: enumName(challenge.difficulty),
          topics: challenge.topics.map(enumName),
          reference: challenge.reference,
          hint: Boolean(challenge.hint),
          tiles: Object.fromEntries(tiles.map(({ id, text }) => [id, text])),
          orders: [correctOrder, ...alternativeOrders],
        },
      ]
    }),
  )
  if (Object.keys(sentences).length !== sentenceChallenges.length)
    throw Error('Duplicate sentence challenge IDs.')

  return {
    schema: 1,
    wordMatchRoundCount,
    games: Object.fromEntries(
      games
        .filter(({ publication }) => publication === 'available')
        .map(({ id, levels, difficulties }) => [
          enumName(id),
          {
            levels,
            lengths: Object.fromEntries(
              difficulties.map(({ id, roundSize }) => [
                enumName(id),
                roundSize,
              ]),
            ),
          },
        ]),
    ),
    vocabulary,
    sentences,
    simulations,
  }
}
