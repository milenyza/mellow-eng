import type { AudioSource } from '@/types/audio'
import type { CefrCode } from '@/types/curriculum'
import type { TranslatedExample } from '@/types/lesson-content'

export type SituationCategoryId =
  | 'airport'
  | 'hotel'
  | 'food-and-drink'
  | 'shopping'
  | 'transportation'
  | 'meeting-people'
  | 'health-and-emergencies'
  | 'around-the-city'

export interface SituationCategory {
  id: SituationCategoryId
  label: string
}

export type PracticalContentReference =
  | { kind: 'lesson'; lessonId: string; blockId?: string }
  | { kind: 'story'; storyId: string; chapterId?: string }
  | { kind: 'vocabulary'; vocabularyId: string }

export interface PracticalExpression extends TranslatedExample {
  id: string
  /** Communicative purpose used for grouping and phrase lookup. */
  intent: string
  pronunciation?: string
  example?: TranslatedExample
  usage: string
  formality: 'informal' | 'neutral' | 'formal'
  register?: string
  keywords?: readonly string[]
  relatedIds?: readonly string[]
  audio?: AudioSource
  references?: readonly PracticalContentReference[]
}

export interface DialogueParticipant {
  id: string
  role: string
}

export interface DialogueTurn {
  id: string
  participantId: string
  text: string
  translation?: string
  audio?: AudioSource
  expressionIds?: readonly string[]
  pronunciation?: string
}

export interface DialogueSummary {
  id: string
  situationId: PhrasebookSituationId
  title: string
  englishTitle: string
  context: string
  level: CefrCode
  scenarioId?: string
}

export interface PracticalDialogue extends DialogueSummary {
  objectives: readonly [string, ...string[]]
  participants: readonly [
    DialogueParticipant,
    DialogueParticipant,
    ...DialogueParticipant[],
  ]
  turns: readonly [
    DialogueTurn & { translation: string },
    ...(DialogueTurn & { translation: string })[],
  ]
  notes: readonly [CommunicationNote, ...CommunicationNote[]]
  audioLanguage?: string
}

export interface CommunicationNote {
  id: string
  text: string
  expressionIds?: readonly string[]
}

export interface ScenarioOutline {
  id: string
  title: string
  context: string
  goal: string
}

export type GuidanceCategory =
  'politeness' | 'clarification' | 'vocabulary' | 'context'

export type GuidanceExample = { id: string } & (
  | { kind: 'phrasebook'; expressionId: string }
  | ({ kind: 'example'; region?: 'en-US' | 'en-GB' } & TranslatedExample)
)

export interface CulturalGuidance {
  id: string
  situationId: PhrasebookSituationId
  category: GuidanceCategory
  title: string
  explanation: string
  usage: string
  examples: readonly [GuidanceExample, ...GuidanceExample[]]
  references: {
    expressionIds: readonly string[]
    dialogueIds?: readonly string[]
    simulationIds?: readonly string[]
  }
}

export type PhrasebookSituationId =
  | 'at-the-airport'
  | 'at-the-hotel'
  | 'restaurants-and-coffee-shops'
  | 'shopping'
  | 'getting-around'
  | 'meeting-people'
  | 'health-and-emergencies'
  | 'around-the-city'

export interface PhrasebookGroup {
  id: string
  title: string
  expressions: readonly [PracticalExpression, ...PracticalExpression[]]
}

export interface Phrasebook {
  situationId: PhrasebookSituationId
  groups: readonly [PhrasebookGroup, ...PhrasebookGroup[]]
}

interface SituationMetadata {
  id: string
  categoryId: SituationCategoryId
  title: string
  englishTitle: string
  description: string
  keywords: readonly [string, ...string[]]
  level: CefrCode
  estimatedMinutes: number
  objectives: readonly [string, ...string[]]
  references?: readonly PracticalContentReference[]
}

export type PracticalSituation = SituationMetadata &
  (
    | { phrasebook: 'available'; id: PhrasebookSituationId }
    | { phrasebook: 'planned' }
  ) & {
    publication: 'planned' | 'available'
    scenarios: readonly [ScenarioOutline, ...ScenarioOutline[]]
  }
