import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/components/utils'
import { gamesPath, lessonsPath, storiesPath } from '@/data/navigation'

export const mobileItemClass =
  'flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-0.5 py-1 text-center text-xs leading-tight hover:bg-lavender'

export function ModuleLink({
  item,
  compact = false,
  onClick,
}: {
  item: { path: string; title: string; icon: LucideIcon }
  compact?: boolean
  onClick?: () => void
}) {
  const { icon: Icon, path, title } = item
  return (
    <NavLink
      to={path}
      end={path !== lessonsPath && path !== storiesPath && path !== gamesPath}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          compact
            ? mobileItemClass
            : 'flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 hover:bg-lavender',
          isActive &&
            (compact
              ? 'bg-lavender font-extrabold'
              : 'bg-sage font-extrabold hover:bg-sage'),
        )
      }
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <span>{title}</span>
    </NavLink>
  )
}
