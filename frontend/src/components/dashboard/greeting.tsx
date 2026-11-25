export function Greeting({
  firstName,
  hour,
}: {
  firstName: string
  hour: number
}) {
  const greeting =
    hour < 5 || hour >= 18
      ? 'Good evening'
      : hour < 12
        ? 'Good morning'
        : 'Good afternoon'

  return (
    <header className="border-t border-plum/20 pt-7 sm:pt-8">
      <p className="mb-2 font-handwritten text-2xl">Seu caderno de inglês</p>
      <h1
        lang="en"
        className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl"
      >
        {greeting}, {firstName}!
      </h1>
      <p className="mt-3 max-w-prose text-lg leading-relaxed">
        Uma palavra de cada vez, você vai ganhando confiança no inglês.
      </p>
    </header>
  )
}
