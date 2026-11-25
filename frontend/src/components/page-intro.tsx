import type { ReactNode } from 'react'

export function PageIntro({
  title,
  description,
  note,
  children,
}: {
  title: string
  description: string
  note?: string
  children?: ReactNode
}) {
  return (
    <section
      aria-labelledby="titulo-pagina"
      className="border-t border-plum/20 pt-8 sm:pt-10"
    >
      {note && <p className="mb-3 font-handwritten text-2xl">{note}</p>}
      <h1
        id="titulo-pagina"
        className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl lg:text-6xl"
      >
        {title}
      </h1>
      <p className="mt-5 max-w-prose text-lg leading-relaxed">{description}</p>
      {children}
      <div aria-hidden="true" className="mt-10 space-y-3">
        <div className="border-t border-plum/15" />
        <div className="border-t border-plum/15" />
      </div>
    </section>
  )
}
