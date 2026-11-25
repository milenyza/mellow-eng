import type { AudioSource } from '@/types/audio'

function selectVoice(
  voices: readonly SpeechSynthesisVoice[],
  language: string,
) {
  const locale = language.toLowerCase()
  const baseLanguage = locale.split('-')[0]
  const voiceLocale = (voice: SpeechSynthesisVoice) =>
    voice.lang.toLowerCase().replaceAll('_', '-')

  return (
    voices.find((voice) => voiceLocale(voice) === locale) ??
    voices.find((voice) => voiceLocale(voice).split('-')[0] === baseLanguage)
  )
}

export function createAudioPlayback(
  source: AudioSource,
  rate: number,
  onFinish: (result: 'ended' | 'error') => void,
) {
  const synthesis = window.speechSynthesis
  let stopped = false
  let utterance: SpeechSynthesisUtterance | undefined

  function speakPart(index: number, voice?: SpeechSynthesisVoice) {
    if (stopped) return
    if (index >= source.parts.length) {
      utterance = undefined
      onFinish('ended')
      return
    }

    try {
      utterance = new SpeechSynthesisUtterance(source.parts[index].text)
      utterance.lang = voice?.lang ?? source.language
      utterance.rate = rate
      if (voice) utterance.voice = voice
      utterance.onend = () => speakPart(index + 1, voice)
      utterance.onerror = () => {
        if (stopped) return
        utterance = undefined
        onFinish('error')
      }
      synthesis.speak(utterance)
    } catch {
      utterance = undefined
      onFinish('error')
    }
  }

  return {
    start() {
      const voices = synthesis.getVoices?.() ?? []
      speakPart(0, selectVoice(voices, source.language))
    },
    stop() {
      stopped = true
      if (utterance) {
        utterance = undefined
        synthesis.cancel()
      }
    },
  }
}
