import { useId, useRef } from 'react'
import { Button } from '@/components/ui/button'

export function RestartLesson({
  completed,
  onRestart,
}: {
  completed: boolean
  onRestart: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  return (
    <>
      <Button variant="secondary" onClick={() => dialog.current?.showModal()}>
        Reiniciar aula
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-border bg-background p-5 text-foreground backdrop:bg-plum/40"
      >
        <h2 id={titleId} className="text-xl font-semibold">
          Reiniciar esta aula?
        </h2>
        <p id={descriptionId} className="mt-3 leading-relaxed">
          {completed
            ? 'A aula volta à primeira etapa e descarta as respostas da tentativa atual. O registro da sua conclusão original será mantido.'
            : 'A aula volta à primeira etapa, e os rascunhos e respostas desta tentativa serão apagados. O tempo de estudo já registrado será mantido.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => dialog.current?.close()}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              dialog.current?.close()
              onRestart()
            }}
          >
            Confirmar reinício
          </Button>
        </div>
      </dialog>
    </>
  )
}
