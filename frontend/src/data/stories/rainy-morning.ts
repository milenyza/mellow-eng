import cover from '@/assets/stories/rainy-morning.svg'
import type { PublishedStory } from '@/types/story'
import { rainyMorningComprehension } from './rainy-morning-comprehension'

export const rainyMorningStory = {
  id: 'a-rainy-morning',
  title: 'A Rainy Morning',
  description:
    'A chuva muda os planos de Lia no caminho para o trabalho. Uma parada na padaria do bairro dá outro começo à manhã.',
  level: 'A1',
  genres: ['everyday-life'],
  cover,
  readingMinutes: 6,
  objectives: [
    'Reconhecer palavras sobre o clima e a rotina da manhã.',
    'Identificar a ordem das ações em uma situação cotidiana.',
  ],
  publication: 'available',
  chapters: [
    {
      id: 'rain-at-the-window',
      comprehension: rainyMorningComprehension.window,
      title: 'Rain at the Window',
      description:
        'Lia percebe que vai precisar mudar o caminho para o trabalho.',
      paragraphs: [
        {
          id: 'morning-rain',
          text: 'It is Monday morning. Lia looks out the window. It is raining. She usually walks to work, but today the street is full of water.',
          translation:
            'É segunda-feira de manhã. Lia olha pela janela. Está chovendo. Ela costuma ir a pé para o trabalho, mas hoje a rua está cheia de água.',
          vocabularyReferences: [
            { vocabularyId: 'story-rainy-morning-raining', phrase: 'raining' },
            {
              vocabularyId: 'story-rainy-morning-walk-to-work',
              phrase: 'walks to work',
            },
          ],
        },
        {
          id: 'another-street',
          text: 'Lia takes her umbrella and goes outside. She takes a different street. A little bakery is open on the corner. The lights are on, and Lia can smell fresh bread.',
          translation:
            'Lia pega o guarda-chuva e sai. Ela vai por outra rua. Uma pequena padaria está aberta na esquina. As luzes estão acesas, e Lia sente o cheiro de pão fresco.',
          vocabularyReferences: [
            {
              vocabularyId: 'story-rainy-morning-umbrella',
              phrase: 'umbrella',
            },
            {
              vocabularyId: 'story-rainy-morning-on-the-corner',
              phrase: 'on the corner',
            },
          ],
        },
        {
          id: 'open-door',
          text: 'The rain gets heavier. Lia looks at the bakery door. She has time for a coffee, so she goes in.',
          translation:
            'A chuva fica mais forte. Lia olha para a porta da padaria. Ela tem tempo para tomar um café, então entra.',
        },
      ],
      vocabulary: [
        {
          id: 'story-rainy-morning-raining',
          word: 'raining',
          pronunciation: '/ˈreɪ.nɪŋ/',
          meaning:
            'Chovendo. Em “It is raining”, descreve o tempo naquele momento.',
          example: {
            text: 'It is raining this morning.',
            translation: 'Está chovendo hoje de manhã.',
          },
        },
        {
          id: 'story-rainy-morning-walk-to-work',
          word: 'walk to work',
          pronunciation: '/wɔk tə wɝk/',
          meaning:
            'Ir a pé para o trabalho. “Walks to work” é a forma usada com “she”.',
          example: {
            text: 'I walk to work every day.',
            translation: 'Eu vou a pé para o trabalho todos os dias.',
          },
        },
        {
          id: 'story-rainy-morning-umbrella',
          word: 'umbrella',
          pronunciation: '/ʌmˈbrel.ə/',
          meaning: 'Guarda-chuva, usado para se proteger da chuva.',
          example: {
            text: 'I have an umbrella in my bag.',
            translation: 'Tenho um guarda-chuva na minha bolsa.',
          },
        },
        {
          id: 'story-rainy-morning-on-the-corner',
          word: 'on the corner',
          pronunciation: '/ɑn ðə ˈkɔr.nɚ/',
          meaning: 'Na esquina. Indica onde fica a padaria.',
          example: {
            text: 'The café is on the corner.',
            translation: 'O café fica na esquina.',
          },
        },
      ],
    },
    {
      id: 'inside-the-bakery',
      comprehension: rainyMorningComprehension.bakery,
      title: 'Inside the Bakery',
      description: 'Ela espera a chuva passar e pede um café na padaria.',
      paragraphs: [
        {
          id: 'ordering-coffee',
          text: 'Inside the bakery, it is warm. “A coffee, please,” Lia says. The woman at the counter gives her a cup of coffee. Lia sits by the window.',
          translation:
            'Dentro da padaria, está quentinho. “Um café, por favor”, diz Lia. A mulher no balcão entrega a ela uma xícara de café. Lia se senta junto à janela.',
          vocabularyReferences: [
            {
              vocabularyId: 'story-rainy-morning-at-the-counter',
              phrase: 'at the counter',
            },
            {
              vocabularyId: 'story-rainy-morning-a-cup-of-coffee',
              phrase: 'a cup of coffee',
            },
          ],
        },
        {
          id: 'sharing-table',
          text: 'A man comes in with a wet umbrella. “Is this seat free?” he asks. “Yes,” says Lia. They sit at the same table and watch the rain.',
          translation:
            'Um homem entra com o guarda-chuva molhado. “Este lugar está livre?”, ele pergunta. “Sim”, responde Lia. Eles se sentam à mesma mesa e observam a chuva.',
          vocabularyReferences: [
            { vocabularyId: 'story-rainy-morning-wet', phrase: 'wet' },
            {
              vocabularyId: 'story-rainy-morning-seat-free',
              phrase: 'Is this seat free?',
            },
          ],
        },
        {
          id: 'bread-for-later',
          text: 'The man points to the bread. “It is very good,” he says. Lia buys a small loaf for lunch. She puts it in her backpack and finishes her coffee.',
          translation:
            'O homem aponta para o pão. “É muito bom”, diz ele. Lia compra um pão pequeno para o almoço. Ela o guarda na mochila e termina o café.',
          vocabularyReferences: [
            { vocabularyId: 'story-rainy-morning-loaf', phrase: 'loaf' },
          ],
        },
      ],
      vocabulary: [
        {
          id: 'story-rainy-morning-at-the-counter',
          word: 'at the counter',
          pronunciation: '/æt ðə ˈkaʊn.tɚ/',
          meaning: 'No balcão. É onde Lia pede e recebe seu café.',
          example: {
            text: 'I pay at the counter.',
            translation: 'Eu pago no balcão.',
          },
        },
        {
          id: 'story-rainy-morning-a-cup-of-coffee',
          word: 'a cup of coffee',
          pronunciation: '/ə kʌp əv ˈkɑ.fi/',
          meaning: 'Uma xícara de café.',
          example: {
            text: 'I have a cup of coffee with breakfast.',
            translation: 'Tomo uma xícara de café no café da manhã.',
          },
        },
        {
          id: 'story-rainy-morning-wet',
          word: 'wet',
          pronunciation: '/wet/',
          meaning: 'Molhado. O guarda-chuva está molhado por causa da chuva.',
          example: {
            text: 'My shoes are wet.',
            translation: 'Meus sapatos estão molhados.',
          },
        },
        {
          id: 'story-rainy-morning-seat-free',
          word: 'Is this seat free?',
          pronunciation: '/ɪz ðɪs sit fri/',
          meaning: 'Este lugar está livre? Aqui, “free” quer dizer desocupado.',
          example: {
            text: 'Excuse me, is this seat free?',
            translation: 'Com licença, este lugar está livre?',
          },
        },
        {
          id: 'story-rainy-morning-loaf',
          word: 'loaf',
          pronunciation: '/loʊf/',
          meaning: 'Um pão inteiro. “A small loaf” é um pão pequeno.',
          example: {
            text: 'I buy a loaf of bread on Monday.',
            translation: 'Eu compro um pão na segunda-feira.',
          },
        },
      ],
    },
    {
      id: 'back-on-the-street',
      comprehension: rainyMorningComprehension.street,
      title: 'Back on the Street',
      description:
        'Quando a chuva dá uma trégua, Lia segue viagem com um pão na mochila.',
      paragraphs: [
        {
          id: 'the-rain-stops',
          text: 'Soon the rain stops. Lia closes her umbrella and puts on her backpack. “Have a nice day,” says the woman at the counter. “You too!” says Lia.',
          translation:
            'Logo a chuva para. Lia fecha o guarda-chuva e coloca a mochila nas costas. “Tenha um bom dia”, diz a mulher no balcão. “Para você também!”, diz Lia.',
          vocabularyReferences: [
            {
              vocabularyId: 'story-rainy-morning-rain-stops',
              phrase: 'the rain stops',
            },
            {
              vocabularyId: 'story-rainy-morning-nice-day',
              phrase: 'Have a nice day',
            },
          ],
        },
        {
          id: 'bakery-bread',
          text: 'Lia walks to work. When she gets there, her coworker asks about her morning. Lia takes the bread out of her backpack. “It is from the bakery on the corner,” she says.',
          translation:
            'Lia vai a pé para o trabalho. Quando chega, um colega pergunta como foi a manhã dela. Lia tira o pão da mochila. “É da padaria da esquina”, diz ela.',
          vocabularyReferences: [
            {
              vocabularyId: 'story-rainy-morning-coworker',
              phrase: 'coworker',
            },
            {
              vocabularyId: 'story-rainy-morning-backpack',
              phrase: 'backpack',
            },
          ],
        },
        {
          id: 'sharing-lunch',
          text: 'At lunch, Lia shares the bread with her coworker. “I know that bakery,” he says. “They make good coffee, too.” Lia smiles. “Yes, they do.”',
          translation:
            'Na hora do almoço, Lia divide o pão com o colega. “Conheço aquela padaria”, diz ele. “Eles fazem um café bom também.” Lia sorri. “Fazem mesmo.”',
        },
      ],
      vocabulary: [
        {
          id: 'story-rainy-morning-rain-stops',
          word: 'the rain stops',
          pronunciation: '/ðə reɪn stɑps/',
          meaning: 'A chuva para. É o momento em que Lia pode sair da padaria.',
          example: {
            text: 'We can go out when the rain stops.',
            translation: 'Podemos sair quando a chuva parar.',
          },
        },
        {
          id: 'story-rainy-morning-nice-day',
          word: 'Have a nice day',
          pronunciation: '/hæv ə naɪs deɪ/',
          meaning: 'Tenha um bom dia. É um desejo comum ao se despedir.',
          example: {
            text: 'Thanks for the coffee. Have a nice day!',
            translation: 'Valeu pelo café. Tenha um bom dia!',
          },
        },
        {
          id: 'story-rainy-morning-coworker',
          word: 'coworker',
          pronunciation: '/ˈkoʊˌwɝ.kɚ/',
          meaning: 'Colega de trabalho.',
          example: {
            text: 'My coworker brings lunch from home.',
            translation: 'Meu colega de trabalho traz o almoço de casa.',
          },
        },
        {
          id: 'story-rainy-morning-backpack',
          word: 'backpack',
          pronunciation: '/ˈbæk.pæk/',
          meaning: 'Mochila. Lia usa a dela para levar o pão.',
          example: {
            text: 'My lunch is in my backpack.',
            translation: 'Meu almoço está na minha mochila.',
          },
        },
      ],
    },
  ],
} satisfies PublishedStory
