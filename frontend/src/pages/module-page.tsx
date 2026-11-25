import { PageIntro } from '@/components/page-intro'

export function ModulePage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <>
      <title>{`${title} | Mellow`}</title>
      <PageIntro title={title} description={description} />
    </>
  )
}
