import { useEffect, useState } from 'react'
import { GameActivity } from '@/components/games/game-activity'
import { selectGameHistory } from '@/services/game-history'
import { DailyWord } from '@/components/dashboard/daily-word'
import { ExploreModules } from '@/components/dashboard/explore-modules'
import { Greeting } from '@/components/dashboard/greeting'
import { LearningSummary } from '@/components/dashboard/learning-summary'
import { NextLesson } from '@/components/dashboard/next-lesson'
import { WeeklyProgress } from '@/components/dashboard/weekly-progress'
import { englishA1 } from '@/data/curriculum/english-a1'
import { dailyWord } from '@/data/dashboard'
import { useProgress } from '@/hooks/use-progress'
import { getCurriculumOverview } from '@/services/curriculum'
import { readingTotals } from '@/services/reading-progress'
import {
  combinedDailyStudyMs,
  getWeeklyStudyDays,
  totalStudyMs,
} from '@/services/study-time'

export function HomePage() {
  const [localTime, setLocalTime] = useState(() => new Date())
  const { data } = useProgress()
  const { recommended, completedCount } = getCurriculumOverview(englishA1, data)
  const studiedWeekdays = getWeeklyStudyDays(
    combinedDailyStudyMs(data),
    localTime,
  )

  useEffect(() => {
    const timer = window.setInterval(() => setLocalTime(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      <title>Início | Mellow</title>
      <div className="space-y-8 sm:space-y-9 max-md:[&_a]:scroll-mb-24 max-md:[&_button]:scroll-mb-24">
        <Greeting hour={localTime.getHours()} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(17rem,1fr)] xl:gap-7">
          <NextLesson
            lesson={
              recommended && {
                id: recommended.lesson.id,
                title: recommended.lesson.title,
                description: recommended.lesson.description,
                unit: `Unidade ${recommended.unitNumber}`,
                durationMinutes: recommended.lesson.durationMinutes,
                status: recommended.status,
              }
            }
          />
          <WeeklyProgress
            studiedDays={studiedWeekdays}
            today={localTime.getDay()}
          />
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(17rem,1fr)] xl:gap-7">
          <ExploreModules />
          <DailyWord key={dailyWord.id} entry={dailyWord} />
        </div>
        <LearningSummary
          totals={{
            completedLessons: completedCount,
            studyMs: totalStudyMs(data),
            reading: readingTotals(data),
          }}
        />
        <GameActivity compact history={selectGameHistory(data)} />
      </div>
    </>
  )
}
