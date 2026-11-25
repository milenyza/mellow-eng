import { accountPages, home, modules } from '@/data/navigation'
import { ModuleLink } from './module-link'
import { Wordmark } from './wordmark'

export function DesktopSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 self-start overflow-y-auto border-r border-plum/20 bg-lavender/40 md:flex md:flex-col lg:w-68">
      <div className="px-7 pt-7 pb-6">
        <Wordmark />
      </div>
      <nav aria-label="Navegação principal" className="px-4 pb-6">
        <ul className="space-y-1">
          {[home, ...modules].map((item) => (
            <li key={item.path}>
              <ModuleLink item={item} />
            </li>
          ))}
        </ul>
      </nav>
      <nav
        aria-label="Conta"
        className="mx-4 mt-auto border-t border-plum/20 py-4"
      >
        <ul className="space-y-1">
          {accountPages.map((item) => (
            <li key={item.path}>
              <ModuleLink item={item} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
