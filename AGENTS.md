# Mellow project guidelines

## Stack and repository

- The monorepo uses npm workspaces. `frontend/` contains the React, TypeScript and Vite application. `backend/` is reserved for Java, Spring Boot and PostgreSQL. `docs/` holds project documentation.
- Use Tailwind CSS, shadcn/ui, React Router and Lucide React. Use ESLint and Prettier for code quality and formatting.
- Keep route entry points in `frontend/src/pages/`, shared page structure in `layouts/`, reusable UI in `components/` and shadcn/ui primitives in `components/ui/`. Place feature components together.
- Keep static content in `data/`, types in `types/`, side effects and integration boundaries in `services/`, reusable React hooks in `hooks/`, local artwork in `assets/` and theme tokens in `styles/`.

## Brand and interface

- Use the existing theme tokens for lavender `#E9E0F4`, cream `#F8F4EC`, sage `#DCE8D9`, soft terracotta `#D9A69C` and plum `#51465D`.
- Use Lora for headings, Nunito Sans for body text and controls, and Caveat sparingly for handwritten details.
- Preserve the warm study-notebook aesthetic, comfortable spacing and readable line lengths. Use subtle illustrations and meaningful icons.
- Write interface copy in Brazilian Portuguese (`pt-BR`). English is the primary learning language. Mark English passages with the appropriate HTML language attribute.
- Retain the desktop sidebar and mobile bottom navigation. Check layouts on narrow screens and desktop, including fixed navigation, text wrapping and keyboard focus.

## Implementation

- Use English for file names, identifiers, types, comments and technical documentation. Use descriptive names, small components and explicit types at data and integration boundaries.
- Reuse the existing components, routes and theme tokens when possible. Keep content independent of user state, identify demo data clearly and use stable identifiers.
- Use semantic elements, descriptive names for controls, visible focus and sufficient contrast. Support keyboard operation and communicate states through text or semantics as well as color. Hide purely decorative artwork from assistive technology.
- Preserve existing behavior outside the requested change. Keep the worktree intact and do not automatically commit or push.

## Validation and reporting

Run `npm run lint`, `npm run typecheck`, `npm run build`, `npm run format:check` and `npm test` from the repository root. For UI changes, verify desktop and mobile layouts and keyboard interaction.

Provide implementation reports in Brazilian Portuguese. Include validation results and any remaining limitations.
