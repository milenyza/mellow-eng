import { useEffect, useState } from 'react'
import { DailyWord } from '@/components/dashboard/daily-word'
import { ExploreModules } from '@/components/dashboard/explore-modules'
import { Greeting } from '@/components/dashboard/greeting'
import { LearningSummary } from '@/components/dashboard/learning-summary'
import { NextLesson } from '@/components/dashboard/next-lesson'
import { WeeklyProgress } from '@/components/dashboard/weekly-progress'
import { dashboardData } from '@/data/dashboard'

export function HomePage() {
  const [localTime, setLocalTime] = useState(() => new Date())
  const { learner, nextLesson, studiedWeekdays, dailyWord, summary } =
    dashboardData

  useEffect(() => {
    const timer = window.setInterval(() => setLocalTime(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      <title>Início | Mellow</title>
      <div className="space-y-8 sm:space-y-9 max-md:[&_a]:scroll-mb-24 max-md:[&_button]:scroll-mb-24">
        <Greeting firstName={learner.firstName} hour={localTime.getHours()} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(17rem,1fr)] xl:gap-7">
          <NextLesson lesson={nextLesson} />
          <WeeklyProgress
            studiedDays={studiedWeekdays}
            today={localTime.getDay()}
          />
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(17rem,1fr)] xl:gap-7">
          <ExploreModules />
          <DailyWord key={dailyWord.id} entry={dailyWord} />
        </div>
        <LearningSummary totals={summary} />
      </div>
    </>
  )
}
