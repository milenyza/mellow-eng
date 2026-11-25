import { Link } from 'react-router'
import { home } from '@/data/navigation'
import { MellowSprout } from './mellow-sprout'

export function Wordmark() {
  return (
    <Link
      to={home.path}
      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-sm font-heading text-3xl leading-none font-semibold tracking-tight"
    >
      <MellowSprout className="size-7 shrink-0" />
      Mellow
    </Link>
  )
}
