import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

export function GameSessionConfirmation({
  action,
  onCancel,
  onConfirm,
  restartDescription,
}: {
  action: 'restart' | 'leave'
  onCancel: () => void
  onConfirm: () => void
  restartDescription?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const panel = dialog.current
    if (panel && !panel.open) panel.showModal()
    return () => panel?.close()
  }, [])

  const restart = action === 'restart'
  return (
    <dialog
      ref={dialog}
      aria-labelledby="game-session-confirm-title"
      aria-describedby="game-session-confirm-description"
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-md space-y-4 rounded-xl border border-border bg-cream p-5 text-plum backdrop:bg-plum/40"
    >
      <h2 id="game-session-confirm-title" className="text-2xl font-semibold">
        {restart ? 'Reiniciar a sessão?' : 'Sair da sessão?'}
      </h2>
      <p id="game-session-confirm-description">
        {restart
          ? restartDescription
          : 'O progresso desta sessão será descartado.'}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Continuar jogando
        </Button>
        <Button onClick={onConfirm}>
          {restart ? 'Confirmar reinício' : 'Sair da sessão'}
        </Button>
      </div>
    </dialog>
  )
}
