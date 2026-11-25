import cornerBookshop from '@/assets/stories/corner-bookshop.svg'
import letterFromLondon from '@/assets/stories/letter-from-london.svg'
import newNeighbor from '@/assets/stories/new-neighbor.svg'
import weekendAway from '@/assets/stories/weekend-away.svg'
import type { Story, StoryGenre } from '@/types/story'
import { firstTripStory } from './stories/first-trip'
import { rainyMorningStory } from './stories/rainy-morning'

export const storyGenreLabels = {
  'everyday-life': 'Vida cotidiana',
  travel: 'Viagem',
  friendship: 'Amizade',
  'slice-of-life': 'Retrato do cotidiano',
  adventure: 'Aventura',
} satisfies Record<StoryGenre, string>

export const stories: readonly Story[] = [
  rainyMorningStory,
  firstTripStory,
  {
    id: 'the-new-neighbor',
    title: 'The New Neighbor',
    description:
      'Bia encontra um vizinho recém-chegado no corredor. Um cumprimento vira uma conversa sobre o bairro e, depois, um convite para um café.',
    level: 'A1',
    genres: ['friendship'],
    cover: newNeighbor,
    readingMinutes: 7,
    objectives: [
      'Identificar cumprimentos, nomes e apresentações em um diálogo.',
      'Reconhecer um convite simples e a resposta de quem o recebe.',
    ],
    publication: 'planned',
    chapters: [
      {
        id: 'boxes-in-the-hall',
        title: 'Boxes in the Hall',
        description:
          'Bia cumprimenta o vizinho enquanto ele leva as caixas para casa.',
      },
      {
        id: 'a-place-for-coffee',
        title: 'A Place for Coffee',
        description:
          'O vizinho pergunta onde pode tomar café e Bia indica um lugar perto dali.',
      },
      {
        id: 'see-you-on-saturday',
        title: 'See You on Saturday',
        description: 'Os dois combinam de se encontrar no café no sábado.',
      },
    ],
  },
  {
    id: 'a-letter-from-london',
    title: 'A Letter from London',
    description:
      'Uma carta de Londres chega à casa de Marina. A amiga conta como é sua rotina na cidade e inclui um pequeno mapa dos lugares que mais frequenta.',
    level: 'A2',
    genres: ['travel', 'everyday-life'],
    cover: letterFromLondon,
    readingMinutes: 10,
    objectives: [
      'Localizar informações sobre uma cidade e a rotina de quem escreve.',
      'Distinguir hábitos de acontecimentos pontuais em uma carta.',
    ],
    publication: 'planned',
    chapters: [
      {
        id: 'an-envelope-at-the-door',
        title: 'An Envelope at the Door',
        description: 'Marina recebe um envelope e reconhece o nome da amiga.',
      },
      {
        id: 'the-morning-bus',
        title: 'The Morning Bus',
        description:
          'A carta descreve o trajeto de ônibus que a amiga faz nos dias de trabalho.',
      },
      {
        id: 'a-saturday-at-the-market',
        title: 'A Saturday at the Market',
        description:
          'A amiga conta como descobriu uma feira no primeiro sábado na cidade.',
      },
      {
        id: 'a-letter-in-return',
        title: 'A Letter in Return',
        description:
          'Marina começa a resposta contando como é sua própria rotina.',
      },
    ],
  },
  {
    id: 'the-bookshop-on-the-corner',
    title: 'The Bookshop on the Corner',
    description:
      'Helena entra na livraria da esquina para comprar um presente. Uma recomendação da livreira faz com que ela volte para conversar sobre a leitura.',
    level: 'A2',
    genres: ['slice-of-life'],
    cover: cornerBookshop,
    readingMinutes: 9,
    objectives: [
      'Encontrar detalhes sobre gostos, sugestões e escolhas em uma conversa.',
      'Acompanhar a sequência de dois encontros no mesmo lugar.',
    ],
    publication: 'planned',
    chapters: [
      {
        id: 'a-gift-for-a-friend',
        title: 'A Gift for a Friend',
        description:
          'Helena explica que procura um livro para uma amiga que gosta de plantas.',
      },
      {
        id: 'the-second-book',
        title: 'The Second Book',
        description:
          'A livreira sugere um presente e mostra outro título que interessa à própria Helena.',
      },
      {
        id: 'back-at-the-bookshop',
        title: 'Back at the Bookshop',
        description:
          'Helena volta para contar o que achou do livro que levou para si.',
      },
    ],
  },
  {
    id: 'a-weekend-away',
    title: 'A Weekend Away',
    description:
      'Joana e André planejam um fim de semana na serra. Uma trilha fechada muda o roteiro e leva os dois a procurar outro caminho.',
    level: 'B1',
    genres: ['adventure'],
    cover: weekendAway,
    readingMinutes: 12,
    objectives: [
      'Acompanhar mudanças de plano e reconhecer suas causas.',
      'Distinguir as sugestões dos personagens da decisão que eles tomam.',
    ],
    publication: 'planned',
    chapters: [
      {
        id: 'the-plan-for-saturday',
        title: 'The Plan for Saturday',
        description:
          'Joana e André partem cedo para chegar a um mirante antes do almoço.',
      },
      {
        id: 'a-closed-trail',
        title: 'A Closed Trail',
        description:
          'Um aviso informa que a chuva fechou o caminho até o mirante.',
      },
      {
        id: 'another-way-up',
        title: 'Another Way Up',
        description:
          'Os dois comparam opções com uma guia e escolhem um trajeto mais curto.',
      },
      {
        id: 'the-view-from-the-hill',
        title: 'The View from the Hill',
        description:
          'No alto da colina, eles fazem uma pausa e comentam a mudança de planos.',
      },
    ],
  },
]
