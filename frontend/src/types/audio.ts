export interface SpeechPart {
  text: string
  id?: string
  speakerId?: string
}

export interface AudioSource {
  kind: 'speech'
  language: string
  parts: readonly SpeechPart[]
  /** Ordered roster keeps voice allocation consistent for single turns and full narration. */
  speakerIds?: readonly string[]
}
