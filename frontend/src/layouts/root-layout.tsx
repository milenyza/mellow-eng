import { BookOpen } from 'lucide-react'
import { Link, Outlet } from 'react-router'

export function RootLayout() {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-10 focus:rounded-md focus:bg-background focus:p-3"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-border bg-lavender">
        <div className="mx-auto flex max-w-5xl px-6 py-4">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm font-heading text-2xl font-semibold"
          >
            <BookOpen aria-hidden="true" className="size-5" />
            Mellow
          </Link>
        </div>
      </header>
      <main
        id="conteudo"
        tabIndex={-1}
        className="mx-auto max-w-5xl px-6 py-16 sm:py-24"
      >
        <Outlet />
      </main>
    </>
  )
}
