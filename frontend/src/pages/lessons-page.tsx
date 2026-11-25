import { useRef } from 'react'
import { CurriculumOverview } from '@/components/curriculum/curriculum-overview'
import { UnitDisclosure } from '@/components/curriculum/unit-disclosure'
import { englishA1 } from '@/data/curriculum/english-a1'
import { englishCourse } from '@/data/curriculum/english-course'
import { useProgress } from '@/hooks/use-progress'
import { getCurriculumOverview } from '@/services/curriculum'

export function LessonsPage() {
  const { data } = useProgress()
  const overview = getCurriculumOverview(englishA1, data)
  const recommendedUnit = useRef<HTMLDetailsElement>(null)

  function showRecommendedUnit() {
    const unit = recommendedUnit.current
    if (!unit) return
    unit.open = true
    unit.querySelector('summary')?.focus({ preventScroll: true })
    unit.scrollIntoView({ block: 'start' })
  }

  return (
    <>
      <title>Aulas | Mellow</title>
      <div className="space-y-7 max-md:[&_summary]:scroll-mb-28">
        <header className="border-t border-plum/20 pt-7">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Aulas
          </h1>
          <p className="mt-3 max-w-prose text-lg leading-relaxed">
            Explore o roteiro de inglês para iniciantes. Você pode abrir
            qualquer unidade para conhecer os temas e objetivos. As quatro aulas
            da Unidade 01 já estão disponíveis.
          </p>
        </header>
        <CurriculumOverview
          level={englishA1.code}
          language={englishCourse.targetLanguage}
          overview={overview}
          onShowUnit={showRecommendedUnit}
        />
        <section aria-labelledby="unidades">
          <h2 id="unidades" className="font-heading text-2xl font-semibold">
            Unidades do nível A1
          </h2>
          <ol className="mt-3 border-t border-plum/20">
            {englishA1.units.map((unit, index) => (
              <li key={unit.id} className="[&>details]:scroll-mt-4">
                <UnitDisclosure
                  unit={unit}
                  number={index + 1}
                  language={englishCourse.targetLanguage}
                  lessonProgress={data.lessons}
                  ref={
                    unit.id === overview.recommended?.unit.id
                      ? recommendedUnit
                      : undefined
                  }
                />
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  )
}
