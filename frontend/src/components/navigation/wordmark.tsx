import { Link } from 'react-router'
import { home } from '@/data/navigation'

export function Wordmark() {
  return (
    <Link
      to={home.path}
      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-sm font-heading text-3xl leading-none font-semibold tracking-tight"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 28 28"
        fill="none"
        className="size-7 shrink-0"
      >
        <path
          d="M14 23c0-5 1-9 4-12M14 17C7 18 4 14 4 9c6 0 10 3 10 8ZM15 14c0-6 4-10 9-10 0 6-3 10-9 10Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 23c3 1 9 1 12 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      Mellow
    </Link>
  )
}
