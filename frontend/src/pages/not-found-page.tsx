import { Link } from 'react-router'
import { PageIntro } from '@/components/page-intro'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <>
      <title>Página não encontrada | Mellow</title>
      <PageIntro
        title="Página não encontrada"
        description="Confira o endereço ou volte ao início."
      >
        <Button asChild className="mt-6">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </PageIntro>
    </>
  )
}
