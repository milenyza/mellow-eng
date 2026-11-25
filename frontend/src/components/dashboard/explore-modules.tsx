import { Link } from 'react-router'
import { modules } from '@/data/navigation'

const moduleDescriptions: Partial<Record<string, string>> = {
  '/historias': 'Leia pequenas histórias em inglês.',
  '/jogos': 'Pratique com desafios leves.',
  '/ingles-na-pratica': 'Ensaie conversas do dia a dia.',
  '/meu-caderno': 'Reúna palavras e expressões.',
}

const explorationLinks = modules.flatMap((module) => {
  const description = moduleDescriptions[module.path]
  return description ? [{ ...module, description }] : []
})

export function ExploreModules() {
  return (
    <section aria-labelledby="explore">
      <h2 id="explore" className="font-heading text-2xl font-semibold">
        Explore no seu ritmo
      </h2>
      <ul className="mt-3 divide-y divide-plum/15 border-y border-plum/15">
        {explorationLinks.map(({ path, title, description, icon: Icon }) => (
          <li key={path}>
            <Link
              to={path}
              className="flex items-center gap-3 rounded-sm px-2 py-2.5 hover:bg-lavender/60"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-lavender">
                <Icon aria-hidden="true" className="size-[1.125rem]" />
              </span>
              <span>
                <span className="block font-extrabold">{title}</span>
                <span className="block text-sm">{description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
