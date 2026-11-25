# Mellow

Plataforma web de aprendizado de idiomas, inicialmente voltada ao ensino de inglês para brasileiros iniciantes. A interface usa português brasileiro. O conteúdo de aprendizado será em inglês.

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

A rota `/` exibe a página inicial. As rotas `/aulas`, `/historias`, `/jogos`, `/ingles-na-pratica`, `/meu-caderno`, `/meu-progresso`, `/perfil` e `/configuracoes` exibem páginas provisórias. Em telas estreitas, abra **Mais** na barra inferior para acessar todos os módulos. Use Tab para percorrer os controles, Enter para ativá-los e Esc para fechar o menu. Endereços desconhecidos exibem uma página com um link de retorno. Em hospedagem estática, configure o servidor para servir `index.html` nas rotas do aplicativo e entregar os arquivos estáticos normalmente.

O tema em `frontend/src/styles/globals.css` expõe a paleta da marca e tokens semânticos como `bg-background` e `text-foreground`. As famílias Lora, Nunito Sans e Caveat são distribuídas localmente pelo build. Use `font-handwritten` para detalhes manuscritos pontuais.

O arquivo `frontend/components.json` configura o shadcn/ui com o alias `@/` e com o tema do Mellow. Os componentes ficam no código do frontend.

## Dashboard

Os dados em `frontend/src/data/dashboard.ts` são fictícios e provisórios, incluindo o nome Ana, a próxima aula, os dias de estudo, a palavra do dia e os totais. Os formatos TypeScript ficam em `frontend/src/types/dashboard.ts`. A saudação e o dia da semana usam o horário local do navegador. A semana começa na segunda-feira e o calendário exibe os registros simulados até o dia atual. A palavra é fixa nesta etapa.

Salvar ou remover a palavra atualiza o `localStorage` do navegador na chave `mellow:favorite-words`. Os favoritos são locais a esse navegador e endereço do aplicativo.
