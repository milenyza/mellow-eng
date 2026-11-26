const localDate = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function SessionDate({ timestamp }: { timestamp: number }) {
  const date = new Date(timestamp)
  return <time dateTime={date.toISOString()}>{localDate.format(date)}</time>
}
