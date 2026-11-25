import type { AudioSource } from '@/types/audio'
import type { StoryParagraph } from '@/types/story'

type Segment = { offset: number; text: string; vocabularyId?: string }

export function getStorySegments(paragraph: StoryParagraph): Segment[] {
  let offset = 0
  const segments: Segment[] = []
  for (const { phrase, vocabularyId } of paragraph.vocabularyReferences ?? []) {
    const start = paragraph.text.indexOf(phrase, offset)
    if (start < 0 || !phrase) continue
    if (start > offset)
      segments.push({ offset, text: paragraph.text.slice(offset, start) })
    segments.push({ offset: start, text: phrase, vocabularyId })
    offset = start + phrase.length
  }
  if (offset < paragraph.text.length)
    segments.push({ offset, text: paragraph.text.slice(offset) })
  return segments
}

export function storySpeechSource(
  paragraphs: readonly StoryParagraph[],
): AudioSource {
  return {
    kind: 'speech',
    language: 'en-US',
    parts: paragraphs.map(({ text }) => ({ text })),
  }
}

export function storyParagraphAnchor(id: string) {
  return `story-paragraph-${id}`
}
