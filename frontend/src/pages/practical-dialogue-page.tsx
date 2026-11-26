import { Link, useLoaderData } from 'react-router'
import { DialogueExpressions } from '@/components/practical-english/dialogue-expressions'
import { DialogueList } from '@/components/practical-english/dialogue-list'
import { DialogueReader } from '@/components/practical-english/dialogue-reader'
import {
  practicalEnglishPath,
  getPracticalSituationPath,
} from '@/data/navigation'
import type { loadPracticalDialogue } from '@/data/dialogues/load-dialogue'

const linkClass =
  'inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4'

export function PracticalDialoguePage() {
  const { situation, dialogue, choices, phrasebook } =
    useLoaderData<typeof loadPracticalDialogue>()
  const situationPath = situation
    ? getPracticalSituationPath(situation.id)
    : practicalEnglishPath

  return (
    <div className="space-y-6 max-md:[&_a]:scroll-mb-28 max-md:[&_button]:scroll-mb-28 max-md:[&_select]:scroll-mb-28">
      <title>{`${dialogue?.title ?? 'Diálogo não encontrado'} | Mellow`}</title>
      <nav
        className="flex flex-wrap gap-x-4"
        aria-label="Voltar à situação ou ao guia"
      >
        <Link className={linkClass} to={situationPath}>
          {situation ? 'Voltar à situação' : 'Voltar às situações'}
        </Link>
        {phrasebook && (
          <Link className={linkClass} to={`${situationPath}#expressoes`}>
            Voltar às expressões
          </Link>
        )}
      </nav>
      {dialogue && phrasebook ? (
        <>
          <header className="space-y-2 border-b border-plum/20 pb-5">
            <p className="text-sm font-bold">
              {situation?.title} · Nível {dialogue.level}
            </p>
            <h1 className="text-4xl leading-tight font-semibold">
              {dialogue.title}
            </h1>
            <p className="font-bold" lang="en">
              {dialogue.englishTitle}
            </p>
            <p className="max-w-prose leading-relaxed">{dialogue.context}</p>
            <ul
              aria-label="Objetivos de aprendizagem"
              className="list-disc space-y-1 pl-5"
            >
              {dialogue.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
            <a href="#expressoes-do-dialogo" className={linkClass}>
              Ir às expressões do diálogo
            </a>
          </header>
          <nav aria-label="Escolher diálogo">
            <DialogueList dialogues={choices} activeId={dialogue.id} />
          </nav>
          <DialogueReader key={`reader-${dialogue.id}`} dialogue={dialogue} />
          <section
            aria-labelledby="communication-notes"
            className="space-y-3 rounded-xl border-l-4 border-terracotta bg-cream p-4"
          >
            <h2 id="communication-notes" className="text-2xl font-semibold">
              Notas de comunicação
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              {dialogue.notes.map((note) => (
                <li key={note.id}>{note.text}</li>
              ))}
            </ul>
          </section>
          <DialogueExpressions
            key={`expressions-${dialogue.id}`}
            dialogue={dialogue}
            phrasebook={phrasebook}
          />
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold">Diálogo não encontrado</h1>
          <p>
            {choices.length
              ? 'Escolha um dos diálogos disponíveis nesta situação.'
              : 'Explore as situações para encontrar diálogos disponíveis.'}
          </p>
          {choices.length > 0 && <DialogueList dialogues={choices} />}
        </>
      )}
    </div>
  )
}
