import type { AudioSource, SpeechPart } from '@/types/audio'

function normalizeLocale(locale: string) {
  return locale.toLowerCase().replaceAll('_', '-')
}

function orderedLanguageVoices(
  voices: readonly SpeechSynthesisVoice[],
  language: string,
) {
  const locale = normalizeLocale(language)
  const base = locale.split('-')[0]
  const exact = voices.filter((voice) => normalizeLocale(voice.lang) === locale)
  const fallback = voices.filter((voice) => {
    const current = normalizeLocale(voice.lang)
    return current !== locale && current.split('-')[0] === base
  })
  const identities = new Set<string>()
  return [...exact, ...fallback].filter((voice) => {
    const id = voice.voiceURI || `${voice.name}:${voice.lang}`
    if (identities.has(id)) return false
    identities.add(id)
    return true
  })
}

export function supportsSpeechPause(synthesis?: SpeechSynthesis) {
  return (
    typeof synthesis?.pause === 'function' &&
    typeof synthesis.resume === 'function' &&
    typeof synthesis.paused === 'boolean'
  )
}

export function createAudioPlayback(
  source: AudioSource,
  rate: number,
  onFinish: (result: 'ended' | 'error') => void,
  onPartStart?: (part: SpeechPart) => void,
) {
  const synthesis = window.speechSynthesis
  let stopped = false
  let utterance: SpeechSynthesisUtterance | undefined

  function speakPart(index: number, voices: readonly SpeechSynthesisVoice[]) {
    if (stopped) return
    const part = source.parts[index]
    if (!part) {
      onFinish('ended')
      return
    }

    try {
      const participant = part.speakerId
        ? (source.speakerIds?.indexOf(part.speakerId) ?? -1)
        : -1
      const voice = voices[participant] ?? voices[0]
      const item = new SpeechSynthesisUtterance(part.text)
      utterance = item
      item.lang = voice?.lang ?? source.language
      item.rate = rate
      if (voice) item.voice = voice
      item.onstart = () => {
        if (!stopped && utterance === item) onPartStart?.(part)
      }
      item.onend = () => {
        if (stopped || utterance !== item) return
        utterance = undefined
        speakPart(index + 1, voices)
      }
      item.onerror = () => {
        if (stopped || utterance !== item) return
        utterance = undefined
        onFinish('error')
      }
      synthesis.speak(item)
    } catch {
      utterance = undefined
      onFinish('error')
    }
  }

  function setPaused(paused: boolean) {
    if (!utterance || stopped || !supportsSpeechPause(synthesis)) return false
    try {
      if (paused) synthesis.pause()
      else synthesis.resume()
      return synthesis.paused === paused
    } catch {
      return false
    }
  }

  return {
    start() {
      let voices: SpeechSynthesisVoice[] = []
      try {
        voices = synthesis.getVoices?.() ?? []
      } catch {
        // An unavailable voice list does not prevent default-voice playback.
      }
      speakPart(0, orderedLanguageVoices(voices, source.language))
    },
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    stop() {
      stopped = true
      if (utterance) {
        utterance = undefined
        synthesis.cancel()
        if (synthesis.paused && supportsSpeechPause(synthesis))
          synthesis.resume()
      }
    },
  }
}

let interruptActivePlayback: (() => void) | undefined

export function claimSpeechPlayback(interrupt: () => void) {
  interruptActivePlayback?.()
  interruptActivePlayback = interrupt
  return () => {
    if (interruptActivePlayback === interrupt)
      interruptActivePlayback = undefined
  }
}
