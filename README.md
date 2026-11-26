# Mellow

Plataforma web de aprendizado de idiomas, inicialmente voltada ao ensino de inglês para iniciantes. A interface usa português. O conteúdo de aprendizado é em inglês.

## Instalação e execução

Use Node.js 22.13 ou superior na linha 22, ou Node.js 24, com npm. Execute os comandos na raiz do repositório.

```bash
npm ci
npm run dev
```

Abra `http://localhost:5173` ou use o endereço exibido no terminal pelo Vite.

## Comandos

| Comando                | O que faz                                             |
| ---------------------- | ----------------------------------------------------- |
| `npm test`             | Executa a suíte automatizada do frontend.             |
| `npm run lint`         | Executa o ESLint.                                     |
| `npm run typecheck`    | Verifica os tipos do frontend e da configuração Vite. |
| `npm run format:check` | Verifica a formatação com Prettier.                   |
| `npm run format`       | Aplica a formatação.                                  |
| `npm run build`        | Gera a versão de produção em `frontend/dist/`.        |
| `npm run preview`      | Serve localmente o build de produção.                 |

## Estrutura

- `frontend/` contém o aplicativo React e é um workspace npm.
- `backend/` está reservado para Java, Spring Boot e PostgreSQL.
- `docs/` está reservado para documentação do projeto.

Em `frontend/src/`, `layouts` e `pages` contêm as telas e sua estrutura compartilhada. `components` contém os componentes reutilizáveis, incluindo `components/ui` para o shadcn/ui. `styles` concentra o tema. `assets`, `hooks`, `services`, `types` e `data` estão preparados para as próximas etapas.

## Rotas e tema

A rota `/` exibe a página inicial, `/aulas` exibe o catálogo do nível A1, `/historias` abre a biblioteca, `/jogos` abre a coleção de jogos e `/ingles-na-pratica` abre o catálogo de situações. As rotas `/meu-caderno`, `/meu-progresso`, `/perfil` e `/configuracoes` exibem páginas provisórias. Em telas estreitas, abra **Mais** na barra inferior para acessar todos os módulos. Use Tab para percorrer os controles, Enter para ativá-los e Esc para fechar o menu. Endereços desconhecidos exibem uma página com um link de retorno. Em hospedagem estática, configure o servidor para servir `index.html` nas rotas do aplicativo e entregar os arquivos estáticos normalmente.

O tema em `frontend/src/styles/globals.css` expõe a paleta da marca e tokens semânticos como `bg-background` e `text-foreground`. As famílias Lora, Nunito Sans e Caveat são distribuídas localmente pelo build. Use `font-handwritten` para detalhes manuscritos pontuais.

O arquivo `frontend/components.json` configura o shadcn/ui com o alias `@/` e com o tema do Mellow. Os componentes ficam no código do frontend.

## Dashboard

O Dashboard usa o progresso salvo neste navegador para mostrar aulas concluídas, dias de estudo da semana, tempo ativo e a próxima aula publicada. A semana começa na segunda-feira e usa a data local. A palavra do dia é fixa nesta etapa. Favoritos e palavras vistas em aulas não são tratados como domínio de vocabulário.

Salvar ou remover a palavra atualiza o `localStorage` do navegador na chave `mellow:favorite-words`. Os favoritos são locais a esse navegador e endereço do aplicativo.

## Currículo

Em `/aulas`, as quatro aulas da Unidade 01 já estão disponíveis. A unidade começa com cumprimentos e apresentações, avança para origens e nacionalidades e termina com uma conversa de revisão. Todas as aulas usam escuta com duas velocidades, alternativa em texto, exercícios interativos e prática de fala guiada. As demais unidades podem ser consultadas no catálogo como roteiros planejados.

Consulte a [documentação técnica do currículo](docs/curriculum.md) e o [guia de autoria](docs/content-authoring.md) para conhecer o modelo e o fluxo de publicação.

## Biblioteca de histórias

Em `/historias`, busque por título ou filtre por nível CEFR, gênero e estado da leitura. **A Rainy Morning** e **The First Trip** têm três capítulos em inglês A1, traduções sob demanda, narração, vocabulário e exercícios opcionais. As outras quatro histórias estão marcadas como **Em breve**.

Use **Continuar lendo** para voltar ao último capítulo e parágrafo registrados. O navegador guarda suas preferências, rascunhos e respostas. Marque cada capítulo como lido para concluir a história. O Dashboard mostra histórias concluídas, capítulos lidos e tempo ativo de leitura. O tempo de leitura também compõe a atividade semanal e o total de estudo.

Consulte a [documentação de histórias](docs/stories.md) e a [documentação de progresso](docs/progress.md).

## Jogos

Em `/jogos`, selecione **Jogar Word Match** para praticar vocabulário A1. Escolha entre aulas publicadas, histórias publicadas, favoritos e vocabulário misto. São três rodadas, com quatro, seis ou oito pares por rodada. As dificuldades disponíveis dependem da quantidade de pares distintos na fonte escolhida. Selecione um cartão em qualquer coluna e depois seu par na outra. O resultado é registrado ao concluir a última rodada.

Em **Sentence Builder**, escolha um tema de gramática e organize palavras para montar frases A1. Há sessões de cinco, oito ou dez desafios, conforme a dificuldade e o conteúdo disponível. Você pode ajustar a frase, pedir uma dica quando disponível e ouvir a frase correta depois de acertar ou revisar a correção. A sessão concluída aparece no histórico.

Em **Memory Game**, encontre os pares de inglês e português em um único tabuleiro de 8, 12 ou 16 cartas. Escolha a fonte de vocabulário. Quando duas cartas não formam um par, elas ficam abertas até você escolher **Virar cartas e continuar**. Você pode revisar o vocabulário e ouvir a pronúncia sob demanda. A sessão concluída aparece no histórico.

Em **Ver histórico de jogos**, filtre as sessões concluídas por jogo e dificuldade e abra os detalhes para rever pares, frases ou correções. Jogos concluídos contribuem para o tempo ativo total e a atividade semanal. O histórico fica no armazenamento deste navegador. Partidas interrompidas não são retomadas.

Consulte a [documentação técnica de jogos](docs/games.md) e a [documentação de progresso](docs/progress.md).

## Inglês na prática

Em `/ingles-na-pratica`, busque situações pelo título em português ou inglês ou por palavras-chave. Use **Categoria** para refinar os resultados e **Ver prévia** para conhecer os objetivos e roteiros. Os oito guias A1 oferecem 111 expressões ao todo. Abra **Consultar expressões** para buscar em português ou inglês, filtrar por objetivo, ouvir em velocidade normal ou reduzida e salvar frases nos favoritos. Cada situação oferece dois diálogos A1 com tradução sob demanda, áudio por fala ou da conversa inteira e notas de comunicação. Também há duas simulações por situação, com caminhos diferentes conforme as respostas. Cada prática tem áudio sob demanda, dicas, revisão de correções e um resumo ao final. As sessões concluídas ficam salvas neste navegador. A seção **Simulações de conversa** mostra quantas práticas diferentes você concluiu na situação. Reabra uma simulação para ver a data da última realização, o histórico de tentativas, acertos e erros, ou para praticar de novo. O tempo ativo das sessões concluídas também entra no resumo de estudo e na atividade semanal do Início. As expressões salvas aparecem nos favoritos já existentes. As oito situações também oferecem **Orientações culturais**, com quatro fichas por situação. Consulte exemplos em inglês com tradução, áudio, dicas de comunicação e links para os guias, diálogos e simulações.

Consulte a [documentação de Inglês na prática](docs/practical-english.md) para conhecer a proposta de aprendizagem, o modelo de conteúdo e o roteiro de publicação.

## Retomada e conclusão

Abra uma aula já iniciada para retomar a última etapa. **Reiniciar aula** pede confirmação antes de descartar a tentativa atual e preserva a primeira conclusão. Para concluir, visite todas as etapas obrigatórias, responda ou revise a correção das atividades obrigatórias e selecione **Confirmar conclusão**.

O tempo ativo é estimado enquanto a página da aula está visível, em foco e dentro da janela de 60 segundos após a última interação. O progresso fica no armazenamento local deste navegador. Consulte a [documentação de progresso](docs/progress.md) para detalhes e limitações.
