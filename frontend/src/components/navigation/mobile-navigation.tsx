import { Ellipsis, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { matchPath, useLocation } from 'react-router'
import { cn } from '@/components/utils'
import {
  moreNavigation,
  practicalEnglishPath,
  primaryNavigation,
} from '@/data/navigation'
import { mobileItemClass, ModuleLink } from './module-link'

export function MobileNavigation() {
  const dialog = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useLocation()
  const isMoreActive = moreNavigation.some(({ path }) =>
    matchPath({ path, end: path !== practicalEnglishPath }, pathname),
  )

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 48rem)')
    const closeOnDesktop = () => {
      if (desktop.matches) dialog.current?.close()
    }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-plum/20 bg-background px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] md:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {primaryNavigation.map((item) => (
            <li key={item.path} className="min-w-0">
              <ModuleLink item={item} compact />
            </li>
          ))}
          <li className="min-w-0">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-controls="mais-modulos"
              aria-expanded={isOpen}
              className={cn(
                mobileItemClass,
                'w-full cursor-pointer',
                (isMoreActive || isOpen) && 'bg-lavender font-extrabold',
              )}
              onClick={() => {
                dialog.current?.showModal()
                setIsOpen(true)
              }}
            >
              <Ellipsis aria-hidden="true" className="size-5" />
              Mais
            </button>
          </li>
        </ul>
      </nav>
      <dialog
        id="mais-modulos"
        ref={dialog}
        aria-labelledby="mais-modulos-titulo"
        onClose={() => setIsOpen(false)}
        className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto w-full max-w-lg max-h-[85dvh] overflow-y-auto rounded-t-xl border border-plum/20 bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-foreground backdrop:bg-plum/40"
      >
        <div className="mb-2 flex items-center justify-between gap-3 px-3">
          <h2 id="mais-modulos-titulo" className="text-xl font-semibold">
            Mais
          </h2>
          <button
            type="button"
            aria-label="Fechar menu Mais"
            onClick={() => dialog.current?.close()}
            className="grid size-11 cursor-pointer place-items-center rounded-lg hover:bg-lavender"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <nav aria-label="Mais módulos">
          <ul className="space-y-1">
            {moreNavigation.map((item) => (
              <li key={item.path}>
                <ModuleLink
                  item={item}
                  onClick={() => dialog.current?.close()}
                />
              </li>
            ))}
          </ul>
        </nav>
      </dialog>
    </>
  )
}
