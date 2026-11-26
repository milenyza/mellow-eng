import { Link } from 'react-router'
import { getPracticalDialoguePath } from '@/data/navigation'
import type { DialogueSummary } from '@/types/practical-english'

export function DialogueList({
  dialogues,
  activeId,
}: {
  dialogues: readonly DialogueSummary[]
  activeId?: string
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {dialogues.map((dialogue) => (
        <li key={dialogue.id}>
          <Link
            to={getPracticalDialoguePath(dialogue.situationId, dialogue.id)}
            aria-current={activeId === dialogue.id ? 'page' : undefined}
            className="block h-full min-h-11 space-y-1 rounded-lg border border-plum/20 bg-lavender/35 p-4 hover:bg-lavender aria-[current=page]:bg-sage"
          >
            <span className="block font-heading text-lg font-semibold underline underline-offset-4">
              {dialogue.title}
            </span>
            <span className="block text-sm" lang="en">
              {dialogue.englishTitle}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
