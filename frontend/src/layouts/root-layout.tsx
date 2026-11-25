import { useEffect, useRef } from 'react'
import { matchPath, Outlet, useLocation } from 'react-router'
import { DesktopSidebar } from '@/components/navigation/desktop-sidebar'
import { MobileNavigation } from '@/components/navigation/mobile-navigation'
import { cn } from '@/components/utils'
import { Wordmark } from '@/components/navigation/wordmark'
import { storiesPath } from '@/data/navigation'

export function RootLayout() {
  const main = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => {
      window.history.scrollRestoration = previousRestoration
    }
  }, [])

  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    main.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-30 focus:rounded-md focus:bg-background focus:p-3"
      >
        Ir para o conteúdo
      </a>
      <div className="min-h-dvh bg-background md:flex">
        <DesktopSidebar />
        <div className="min-w-0 flex-1">
          <header className="border-b border-plum/20 bg-lavender/40 px-5 py-3 md:hidden">
            <Wordmark />
          </header>
          <main
            id="conteudo"
            ref={main}
            tabIndex={-1}
            className={cn(
              'mx-auto px-5 pt-12 pb-[calc(6rem+env(safe-area-inset-bottom))] focus-visible:outline-offset-[-4px] sm:px-10 md:px-12 md:pt-18 md:pb-16',
              pathname === '/' || matchPath(storiesPath, pathname)
                ? 'max-w-7xl 2xl:px-16'
                : 'max-w-4xl lg:px-18',
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>
      <MobileNavigation />
    </>
  )
}
