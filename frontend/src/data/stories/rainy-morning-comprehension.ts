import type { ChapterComprehension } from '@/types/story'

export const rainyMorningComprehension = {
  window: {
    id: 'rain-at-the-window-comprehension',
    instructions:
      'Pratique o que você entendeu sobre a manhã de Lia. As atividades são opcionais e você pode reler o texto a qualquer momento.',
    exercises: [
      {
        id: 'rainy-morning-window-day',
        kind: 'multiple-choice',
        prompt: 'What day is it?',
        promptLanguage: 'en',
        instructions: 'Escolha o dia mencionado no começo do capítulo.',
        options: [
          { id: 'tuesday', text: 'Tuesday' },
          { id: 'monday', text: 'Monday' },
          { id: 'saturday', text: 'Saturday' },
        ],
        correctOptionId: 'monday',
        feedback:
          'A abertura diz “It is Monday morning”. Monday significa segunda-feira.',
        paragraphIds: ['morning-rain'],
      },
      {
        id: 'rainy-morning-window-umbrella',
        kind: 'fill-in-the-blanks',
        prompt: 'Complete a frase com o que Lia leva para sair na chuva.',
        instructions: 'Digite a palavra em inglês que aparece no texto.',
        blanks: [
          {
            id: 'object',
            before: 'Lia takes her',
            after: '.',
            acceptedAnswers: ['umbrella'],
          },
        ],
        feedback:
          'O texto diz “Lia takes her umbrella”. Umbrella significa guarda-chuva.',
        paragraphIds: ['another-street'],
      },
      {
        id: 'rainy-morning-window-bakery',
        kind: 'true-or-false',
        prompt: 'The bakery is closed.',
        promptLanguage: 'en',
        instructions:
          'A frase diz que a padaria está fechada. Isso corresponde ao texto?',
        correctValue: false,
        feedback:
          'A padaria está aberta. A frase “A little bakery is open” confirma isso.',
        paragraphIds: ['another-street'],
      },
      {
        id: 'rainy-morning-window-corner',
        kind: 'multiple-choice',
        prompt: 'O que “on the corner” informa sobre a padaria?',
        instructions: 'Escolha o sentido da expressão nesse trecho.',
        options: [
          {
            id: 'inside',
            text: 'Ela fica dentro de outro prédio.',
            language: 'pt-BR',
          },
          { id: 'far', text: 'Ela fica longe da rua.', language: 'pt-BR' },
          { id: 'corner', text: 'Ela fica na esquina.', language: 'pt-BR' },
        ],
        correctOptionId: 'corner',
        feedback:
          '“On the corner” significa “na esquina”. Aqui indica onde fica a padaria.',
        paragraphIds: ['another-street'],
      },
      {
        id: 'rainy-morning-window-sequence',
        kind: 'sequence-ordering',
        prompt: 'Em que ordem Lia faz essas coisas?',
        instructions:
          'Selecione cada acontecimento do primeiro ao último. Para retirar uma escolha, selecione-a novamente.',
        items: [
          { id: 'bakery', text: 'Lia goes into the bakery.' },
          { id: 'window', text: 'Lia looks out the window.' },
          { id: 'umbrella', text: 'Lia takes her umbrella.' },
        ],
        correctOrder: ['window', 'umbrella', 'bakery'],
        feedback:
          'Lia primeiro olha pela janela, depois pega o guarda-chuva e só então entra na padaria.',
        paragraphIds: ['morning-rain', 'another-street', 'open-door'],
      },
    ],
  },
  bakery: {
    id: 'inside-the-bakery-comprehension',
    instructions:
      'Confira os detalhes do encontro na padaria. Você pode pular as atividades e seguir para o próximo capítulo.',
    exercises: [
      {
        id: 'rainy-morning-bakery-drink',
        kind: 'multiple-choice',
        prompt: 'What does Lia ask for?',
        promptLanguage: 'en',
        instructions: 'Identifique o que Lia pede no balcão.',
        options: [
          { id: 'tea', text: 'Tea' },
          { id: 'coffee', text: 'Coffee' },
          { id: 'water', text: 'Water' },
        ],
        correctOptionId: 'coffee',
        feedback: 'Lia diz “A coffee, please”. Ela pede um café.',
        paragraphIds: ['ordering-coffee'],
      },
      {
        id: 'rainy-morning-bakery-seat',
        kind: 'multiple-choice',
        prompt: 'O que o homem quer saber com “Is this seat free?”',
        instructions: 'Escolha o sentido de free na pergunta.',
        options: [
          { id: 'price', text: 'Se o café é de graça.', language: 'pt-BR' },
          { id: 'time', text: 'Se Lia tem tempo livre.', language: 'pt-BR' },
          {
            id: 'seat',
            text: 'Se o lugar está desocupado.',
            language: 'pt-BR',
          },
        ],
        correctOptionId: 'seat',
        feedback:
          'O homem pergunta sobre “this seat”, o lugar à mesa. “Free” nesse contexto significa “livre” ou “desocupado”.',
        paragraphIds: ['sharing-table'],
      },
      {
        id: 'rainy-morning-bakery-vocabulary',
        kind: 'matching-pairs',
        prompt: 'Associe as expressões ao sentido que têm na padaria.',
        instructions: 'Escolha uma tradução para cada expressão.',
        left: [
          { id: 'counter', text: 'at the counter' },
          { id: 'cup', text: 'a cup of coffee' },
          { id: 'wet', text: 'wet' },
        ],
        right: [
          { id: 'moist', text: 'molhado' },
          { id: 'register', text: 'no balcão' },
          { id: 'drink', text: 'uma xícara de café' },
        ],
        correctPairs: { counter: 'register', cup: 'drink', wet: 'moist' },
        feedback:
          'O café é entregue no balcão em uma xícara. Wet descreve o guarda-chuva molhado do homem.',
        paragraphIds: ['ordering-coffee', 'sharing-table'],
      },
      {
        id: 'rainy-morning-bakery-lunch',
        kind: 'true-or-false',
        prompt: 'Lia buys bread for lunch.',
        promptLanguage: 'en',
        instructions:
          'A frase diz que Lia compra pão para o almoço. Isso acontece no capítulo?',
        correctValue: true,
        feedback:
          'Lia compra “a small loaf for lunch”, um pão pequeno para o almoço.',
        paragraphIds: ['bread-for-later'],
      },
      {
        id: 'rainy-morning-bakery-sequence',
        kind: 'sequence-ordering',
        prompt: 'Organize os três acontecimentos dentro da padaria.',
        instructions: 'Selecione os acontecimentos na ordem do texto.',
        items: [
          { id: 'bread', text: 'Lia buys bread.' },
          { id: 'coffee', text: 'Lia asks for coffee.' },
          { id: 'seat', text: 'The man asks about the seat.' },
        ],
        correctOrder: ['coffee', 'seat', 'bread'],
        feedback:
          'Lia pede café antes de se sentar. O homem chega e pergunta sobre o lugar. Depois, Lia compra o pão.',
        paragraphIds: ['ordering-coffee', 'sharing-table', 'bread-for-later'],
      },
    ],
  },
  street: {
    id: 'back-on-the-street-comprehension',
    instructions:
      'Revise o que acontece quando Lia volta à rua e chega ao trabalho. Você pode consultar o trecho junto de cada pergunta.',
    exercises: [
      {
        id: 'rainy-morning-street-weather',
        kind: 'true-or-false',
        prompt: 'The rain stops before Lia goes to work.',
        promptLanguage: 'en',
        instructions:
          'Verifique se a chuva para antes de Lia ir para o trabalho.',
        correctValue: true,
        feedback:
          'O capítulo começa com “Soon the rain stops”. Depois de fechar o guarda-chuva, Lia vai a pé ao trabalho.',
        paragraphIds: ['the-rain-stops', 'bakery-bread'],
      },
      {
        id: 'rainy-morning-street-bag',
        kind: 'fill-in-the-blanks',
        prompt: 'Complete com o objeto de onde Lia tira o pão.',
        instructions: 'Digite a palavra em inglês usada no capítulo.',
        blanks: [
          {
            id: 'bag',
            before: 'Lia takes the bread out of her',
            after: '.',
            acceptedAnswers: ['backpack'],
          },
        ],
        feedback:
          'O texto diz “out of her backpack”. Backpack significa mochila.',
        paragraphIds: ['bakery-bread'],
      },
      {
        id: 'rainy-morning-street-coworker',
        kind: 'multiple-choice',
        prompt: 'Who shares the bread with Lia?',
        promptLanguage: 'en',
        instructions: 'Escolha a pessoa que come o pão com Lia no almoço.',
        options: [
          { id: 'man', text: 'O homem da padaria.', language: 'pt-BR' },
          { id: 'coworker', text: 'O colega de trabalho.', language: 'pt-BR' },
          { id: 'woman', text: 'A mulher do balcão.', language: 'pt-BR' },
        ],
        correctOptionId: 'coworker',
        feedback:
          '“Her coworker” quer dizer “o colega de trabalho dela”. É com ele que Lia divide o pão no almoço.',
        paragraphIds: ['sharing-lunch'],
      },
      {
        id: 'rainy-morning-street-farewell',
        kind: 'matching-pairs',
        prompt: 'Associe as duas falas da despedida.',
        instructions: 'Escolha a tradução de cada fala.',
        left: [
          { id: 'day', text: 'Have a nice day' },
          { id: 'too', text: 'You too!' },
        ],
        right: [
          { id: 'reply', text: 'Para você também!' },
          { id: 'wish', text: 'Tenha um bom dia' },
        ],
        correctPairs: { day: 'wish', too: 'reply' },
        feedback:
          'A mulher deseja a Lia um bom dia. “You too!” é a resposta de Lia para retribuir o desejo.',
        paragraphIds: ['the-rain-stops'],
      },
      {
        id: 'rainy-morning-street-sequence',
        kind: 'sequence-ordering',
        prompt: 'Coloque os acontecimentos do último capítulo em ordem.',
        instructions: 'Selecione os acontecimentos do primeiro ao último.',
        items: [
          { id: 'lunch', text: 'Lia shares the bread.' },
          { id: 'walk', text: 'Lia walks to work.' },
          { id: 'rain', text: 'The rain stops.' },
        ],
        correctOrder: ['rain', 'walk', 'lunch'],
        feedback:
          'A chuva para primeiro. Lia vai ao trabalho e, mais tarde, divide o pão na hora do almoço.',
        paragraphIds: ['the-rain-stops', 'bakery-bread', 'sharing-lunch'],
      },
    ],
  },
} satisfies Record<string, ChapterComprehension>
