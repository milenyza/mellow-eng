import memoryIllustration from '@/assets/games/memory-game.svg'
import sentenceBuilderIllustration from '@/assets/games/sentence-builder.svg'
import wordMatchIllustration from '@/assets/games/word-match.svg'
import { GameActivity } from '@/components/games/game-activity'
import { useProgress } from '@/hooks/use-progress'
import { selectGameHistory } from '@/services/game-history'
import { GameCard } from '@/components/games/game-card'
import { games } from '@/data/games'
import {
  memoryGamePath,
  sentenceBuilderPath,
  wordMatchPath,
} from '@/data/navigation'
import type { GameType } from '@/types/game'

const previews: Record<
  GameType,
  { illustration: string; instructions: readonly string[]; playPath?: string }
> = {
  'word-match': {
    illustration: wordMatchIllustration,
    playPath: wordMatchPath,
    instructions: [
      'Selecione um cartão em qualquer coluna.',
      'Escolha o cartão correspondente na outra coluna para conferir o par.',
    ],
  },
  'sentence-builder': {
    illustration: sentenceBuilderIllustration,
    playPath: sentenceBuilderPath,
    instructions: [
      'Leia a situação e observe as palavras disponíveis.',
      'Selecione as palavras na ordem em que devem aparecer na frase. Você poderá ajustar a ordem antes de conferir.',
    ],
  },
  memory: {
    illustration: memoryIllustration,
    playPath: memoryGamePath,
    instructions: [
      'Vire duas cartas para ver as palavras e os significados.',
      'Os pares encontrados ficam abertos. Se as cartas não formarem um par, leia as duas e vire-as antes de continuar.',
    ],
  },
}

export function GamesPage() {
  const { data, persistence } = useProgress()
  return (
    <>
      <title>Jogos | Mellow</title>
      <header className="border-t border-plum/20 pt-8 sm:pt-10">
        <h1 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
          Jogos para praticar inglês
        </h1>
        <p className="mt-4 max-w-[58ch] text-lg leading-relaxed">
          Uma pausa para brincar com palavras e frases. Pratique no seu ritmo e
          explore os próximos jogos.
        </p>
      </header>

      <ul className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
        {games.map((game) => (
          <li key={game.id} className="min-w-0 max-sm:[&_summary]:scroll-mb-28">
            <GameCard game={game} {...previews[game.type]} />
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <GameActivity
          history={selectGameHistory(data)}
          storageUnavailable={persistence === 'unavailable'}
        />
      </div>
    </>
  )
}
