import { defineGuidance } from './authoring'

const entry = defineGuidance('meeting-people')

export default [
  entry(
    'start-an-introduction',
    'context',
    'Começar uma apresentação',
    'Dizer seu nome é uma maneira simples de começar. “Nice to meet you” funciona quando você conhece alguém pela primeira vez.',
    'Se a pessoa disser isso primeiro, você pode acrescentar “too” ao responder.',
    ['name', 'nice-to-meet'],
    {
      expressions: ['your-name'],
      dialogue: 'first-english-class',
      simulation: 'meet-a-classmate',
    },
  ),
  entry(
    'greetings-and-register',
    'politeness',
    'Escolher entre “Hi” e “Hello”',
    '“Hi” costuma soar mais informal. “Hello” funciona quando você prefere uma saudação mais neutra.',
    'Em uma primeira conversa, uma saudação curta e seu nome já são suficientes.',
    [
      ['casual-hi', 'Hi, I’m Nina.', 'Oi, sou Nina.'],
      ['neutral-hello', 'Hello, my name is Nina.', 'Olá, meu nome é Nina.'],
    ],
    {
      expressions: ['name'],
      dialogue: 'first-english-class',
      simulation: 'meet-a-classmate',
    },
  ),
  entry(
    'keep-a-conversation-going',
    'clarification',
    'Devolver uma pergunta',
    'Quando alguém fizer uma pergunta simples, você pode responder e acrescentar “How about you?” para ouvir a outra pessoa.',
    'Use essa pergunta curta quando estiver claro qual assunto vocês estão retomando.',
    [
      [
        'origins-back',
        'I’m from Brazil. How about you?',
        'Sou do Brasil. E você?',
      ],
      'where-from',
    ],
    {
      expressions: ['from-brazil'],
      dialogue: 'where-we-are-from',
      simulation: 'talk-about-origins',
    },
  ),
  entry(
    'respect-conversation-boundaries',
    'context',
    'Escolher o que compartilhar',
    'Se preferir guardar um detalhe pessoal, você pode falar de outro assunto ou dizer que prefere não responder. Se a outra pessoa mudar de assunto, acompanhe a mudança.',
    'Uma pergunta sobre a aula ou o evento pode retomar a conversa.',
    [
      ['prefer-not', 'I’d rather not say.', 'Prefiro não dizer.'],
      'first-class',
    ],
    { dialogue: 'first-english-class', simulation: 'meet-a-classmate' },
  ),
] as const
