export interface AudioSource {
  kind: 'speech'
  language: string
  parts: readonly { text: string }[]
}
