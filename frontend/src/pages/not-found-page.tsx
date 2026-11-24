import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <section>
      <h1 className="text-3xl font-semibold sm:text-4xl">
        Página não encontrada
      </h1>
      <p className="mt-3">Confira o endereço ou volte ao início.</p>
      <Button asChild className="mt-6">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
