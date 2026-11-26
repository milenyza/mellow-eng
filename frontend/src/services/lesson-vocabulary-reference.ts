export const englishCourseId = 'english-for-pt-br'

export function getLessonVocabularyId(
  courseId: string,
  lessonId: string,
  blockId: string,
  entryId: string,
) {
  return [courseId, lessonId, blockId, entryId].join('/')
}
