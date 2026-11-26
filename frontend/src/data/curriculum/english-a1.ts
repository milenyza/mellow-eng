import { introducingAFriendLesson } from './introducing-a-friend-lesson'
import { originsLesson } from './origins-lesson'
import { personalIntroductionLesson } from './personal-introduction-lesson'
import { introductionsLesson } from './introductions-lesson'
import { introductoryUnit, plannedA1Units } from './english-a1-index'
import type { AvailableLesson, CefrLevel } from '@/types/curriculum'

const publishedIntroductoryLessons: Record<
  (typeof introductoryUnit.lessons)[number]['id'],
  AvailableLesson
> = {
  [introductionsLesson.id]: introductionsLesson,
  [originsLesson.id]: originsLesson,
  [introducingAFriendLesson.id]: introducingAFriendLesson,
  [personalIntroductionLesson.id]: personalIntroductionLesson,
}

export const englishA1: CefrLevel = {
  code: 'A1',
  units: [
    {
      ...introductoryUnit,
      lessons: introductoryUnit.lessons.map(
        ({ id }) => publishedIntroductoryLessons[id],
      ),
    },
    ...plannedA1Units,
  ],
}
