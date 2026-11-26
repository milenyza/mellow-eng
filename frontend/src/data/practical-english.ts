import type {
  PracticalSituation,
  SituationCategory,
} from '@/types/practical-english'

export const situationCategories = [
  { id: 'airport', label: 'Aeroporto' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'food-and-drink', label: 'Restaurantes e cafeterias' },
  { id: 'shopping', label: 'Compras' },
  { id: 'transportation', label: 'Transporte' },
  { id: 'meeting-people', label: 'Apresentações' },
  { id: 'health-and-emergencies', label: 'Saúde e emergências' },
  { id: 'around-the-city', label: 'Pela cidade' },
] as const satisfies readonly SituationCategory[]

export const practicalSituations = [
  {
    id: 'at-the-airport',
    categoryId: 'airport',
    title: 'No aeroporto',
    englishTitle: 'At the airport',
    description:
      'Encontre seu portão e confirme as informações antes de embarcar.',
    keywords: [
      'embarque',
      'bagagem',
      'voo',
      'portão',
      'passaporte',
      'gate',
      'boarding',
    ],
    level: 'A1',
    estimatedMinutes: 10,
    publication: 'available',
    phrasebook: 'available',
    objectives: [
      'Pedir uma informação sobre o portão.',
      'Confirmar o horário de embarque.',
    ],
    references: [
      {
        kind: 'story',
        storyId: 'the-first-trip',
        chapterId: 'the-right-platform',
      },
    ],
    scenarios: [
      {
        id: 'find-the-gate',
        title: 'Em busca do portão',
        context: 'O número do portão mudou no painel.',
        goal: 'Perguntar onde fica o novo portão.',
      },
      {
        id: 'confirm-boarding',
        title: 'Antes de embarcar',
        context: 'Você está no portão e quer confirmar o horário.',
        goal: 'Fazer uma pergunta breve sobre o embarque.',
      },
    ],
  },
  {
    id: 'at-the-hotel',
    categoryId: 'hotel',
    title: 'No hotel',
    englishTitle: 'At the hotel',
    description:
      'Confirme uma reserva e peça as informações básicas na recepção.',
    keywords: [
      'recepção',
      'reserva',
      'check-in',
      'quarto',
      'chave',
      'breakfast',
      'booking',
    ],
    level: 'A1',
    estimatedMinutes: 8,
    publication: 'available',
    phrasebook: 'available',
    objectives: [
      'Informar o nome da reserva.',
      'Perguntar o horário do café da manhã.',
    ],
    scenarios: [
      {
        id: 'check-in-at-reception',
        title: 'Chegada à recepção',
        context: 'Você chega ao hotel com uma reserva.',
        goal: 'Apresentar-se e informar o nome da reserva.',
      },
      {
        id: 'check-breakfast-time',
        title: 'Horário do café da manhã',
        context: 'Você vai sair cedo no dia seguinte.',
        goal: 'Confirmar o horário do café da manhã.',
      },
    ],
  },
  {
    id: 'restaurants-and-coffee-shops',
    categoryId: 'food-and-drink',
    title: 'Restaurantes e cafeterias',
    englishTitle: 'Restaurants and coffee shops',
    description: 'Faça um pedido simples e peça a conta de forma cordial.',
    keywords: [
      'cardápio',
      'pedido',
      'conta',
      'café',
      'comida',
      'coffee',
      'menu',
      'bill',
    ],
    level: 'A1',
    estimatedMinutes: 10,
    publication: 'available',
    phrasebook: 'available',
    objectives: [
      'Pedir uma bebida ou um item do cardápio.',
      'Pedir a conta ao terminar.',
    ],
    references: [
      {
        kind: 'story',
        storyId: 'a-rainy-morning',
        chapterId: 'inside-the-bakery',
      },
    ],
    scenarios: [
      {
        id: 'order-at-the-counter',
        title: 'Um pedido no balcão',
        context: 'Você escolheu uma bebida no cardápio.',
        goal: 'Fazer o pedido e responder se é para levar.',
      },
      {
        id: 'ask-for-the-bill',
        title: 'Hora de pagar',
        context: 'Você terminou a refeição.',
        goal: 'Chamar o atendimento e pedir a conta.',
      },
    ],
  },
  {
    id: 'shopping',
    categoryId: 'shopping',
    title: 'Fazendo compras',
    englishTitle: 'Shopping',
    description: 'Pergunte o preço de um item e descubra se há outro tamanho.',
    keywords: [
      'loja',
      'roupa',
      'preço',
      'tamanho',
      'pagamento',
      'size',
      'price',
    ],
    level: 'A1',
    estimatedMinutes: 8,
    publication: 'available',
    phrasebook: 'available',
    objectives: [
      'Perguntar quanto custa um produto.',
      'Pedir outro tamanho de roupa.',
    ],
    scenarios: [
      {
        id: 'ask-the-price',
        title: 'Um produto sem etiqueta',
        context: 'Você encontra um item sem o preço à vista.',
        goal: 'Perguntar o preço.',
      },
      {
        id: 'ask-for-a-size',
        title: 'Outro tamanho',
        context: 'Uma peça chamou sua atenção, mas o tamanho não serve.',
        goal: 'Perguntar se há outro tamanho.',
      },
    ],
  },
  {
    id: 'getting-around',
    categoryId: 'transportation',
    title: 'Usando o transporte',
    englishTitle: 'Transportation',
    description:
      'Compre uma passagem e confirme onde pegar o trem ou o ônibus.',
    keywords: [
      'trem',
      'ônibus',
      'metrô',
      'passagem',
      'bilhete',
      'estação',
      'ticket',
      'train',
      'bus',
    ],
    level: 'A1',
    estimatedMinutes: 10,
    publication: 'available',
    phrasebook: 'available',
    objectives: [
      'Pedir uma passagem para um destino.',
      'Confirmar a plataforma ou o ponto de embarque.',
    ],
    references: [
      {
        kind: 'story',
        storyId: 'the-first-trip',
        chapterId: 'a-ticket-to-the-coast',
      },
    ],
    scenarios: [
      {
        id: 'buy-a-ticket',
        title: 'Na bilheteria',
        context: 'Você vai de trem para outra cidade.',
        goal: 'Informar o destino e pedir uma passagem.',
      },
      {
        id: 'confirm-the-stop',
        title: 'No ponto de ônibus',
        context: 'Duas linhas passam pelo mesmo ponto.',
        goal: 'Confirmar se o ônibus vai ao seu destino.',
      },
    ],
  },
  {
    id: 'meeting-people',
    categoryId: 'meeting-people',
    title: 'Conhecendo pessoas',
    englishTitle: 'Meeting people',
    description:
      'Inicie uma conversa, diga seu nome e troque informações simples.',
    keywords: [
      'saudação',
      'cumprimentos',
      'apresentação',
      'nome',
      'origem',
      'hello',
      'introductions',
    ],
    level: 'A1',
    estimatedMinutes: 8,
    publication: 'available',
    phrasebook: 'available',
    objectives: [
      'Cumprimentar e apresentar-se pelo nome.',
      'Perguntar de onde a outra pessoa é.',
    ],
    references: [
      {
        kind: 'lesson',
        lessonId: 'en-a1-introductions-hello',
        blockId: 'greetings',
      },
      { kind: 'lesson', lessonId: 'en-a1-introductions-from' },
    ],
    scenarios: [
      {
        id: 'meet-a-classmate',
        title: 'Uma nova colega de turma',
        context: 'Alguém senta ao seu lado antes da primeira aula.',
        goal: 'Cumprimentar, dizer seu nome e perguntar o dela.',
      },
      {
        id: 'talk-about-origins',
        title: 'De onde você é?',
        context:
          'Depois de se apresentar, você quer conhecer a origem da outra pessoa.',
        goal: 'Perguntar de onde ela é e responder à mesma pergunta.',
      },
    ],
  },
  {
    id: 'health-and-emergencies',
    categoryId: 'health-and-emergencies',
    title: 'Saúde e emergências',
    englishTitle: 'Health and emergencies',
    description:
      'Peça ajuda e informe onde você está ou como está se sentindo.',
    keywords: [
      'ajuda',
      'socorro',
      'farmácia',
      'mal-estar',
      'emergência',
      'help',
      'pharmacy',
    ],
    level: 'A1',
    estimatedMinutes: 8,
    publication: 'available',
    phrasebook: 'available',
    objectives: [
      'Dizer de forma simples como está se sentindo.',
      'Pedir ajuda e informar sua localização.',
    ],
    scenarios: [
      {
        id: 'say-how-you-feel',
        title: 'Comunicando um mal-estar',
        context: 'Você não está se sentindo bem em um espaço público.',
        goal: 'Comunicar o mal-estar e pedir ajuda a uma pessoa próxima.',
      },
      {
        id: 'give-your-location',
        title: 'Informando onde está',
        context: 'Alguém quer saber onde encontrar você.',
        goal: 'Informar o local ou um ponto de referência.',
      },
    ],
  },
  {
    id: 'around-the-city',
    categoryId: 'around-the-city',
    title: 'Pela cidade',
    englishTitle: 'Around the city',
    description:
      'Peça direções e reconheça pontos de referência ao andar pela cidade.',
    keywords: [
      'direções',
      'rua',
      'esquina',
      'mapa',
      'caminho',
      'museu',
      'directions',
      'map',
    ],
    level: 'A1',
    estimatedMinutes: 10,
    publication: 'available',
    phrasebook: 'available',
    objectives: [
      'Perguntar onde fica um lugar.',
      'Reconhecer instruções simples de direção.',
    ],
    scenarios: [
      {
        id: 'find-a-place',
        title: 'Procurando um endereço',
        context: 'Você está a algumas quadras de um museu.',
        goal: 'Perguntar onde fica o museu e identificar um ponto de referência.',
      },
      {
        id: 'confirm-a-direction',
        title: 'Na próxima esquina',
        context:
          'Você recebeu uma indicação, mas não entendeu para que lado virar.',
        goal: 'Confirmar se deve virar à esquerda ou à direita.',
      },
    ],
  },
] as const satisfies readonly PracticalSituation[]
