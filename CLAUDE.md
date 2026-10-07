# Repositório de trabalho — instruções para o Claude

Este repositório reúne referências de UI/UX e os projetos construídos com elas.
Leia isto antes de qualquer tarefa.

## O que existe aqui

| Pasta | O que é | Como usar |
|---|---|---|
| `.claude/skills/ui-ux-pro-max` | Skill ativa (copiada de `ui-ux-pro-max-skill/`) — design system por setor, 79 estilos, paletas, fontes, checklist | Carrega sozinha em tarefas de UI. Busca: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<produto> <setor> <palavras>" --design-system -p "Nome"` |
| `.claude/skills/libreuiux-brand-systems`, `libreuiux-design-principles` | Skills ativas (de `LibreUIUX-Claude-Code-main/plugins/design-mastery`) | Identidade de marca, princípios de composição |
| `LibreUIUX-Claude-Code-main/` | Kit completo LibreUIUX (71 plugins, agentes, comandos) | Consulte `plugins/<nome>/` sob demanda (ex.: `accessibility-compliance`, `frontend-mobile-development`, `design-mastery/commands/premium-landing.md`) |
| `ui-ux-pro-max-skill/` | Repositório original do UI UX Pro Max (dados em `src/ui-ux-pro-max/data/*.csv`) | Fonte da skill acima |
| `ruflo/` | Ruflo (orquestração multiagente / swarms, AgentDB, MCP) | **Não ativo por padrão.** Só para tarefas grandes que realmente se beneficiem de vários agentes: `cd ruflo && npx ruflo init` |
| `nazario-massas/` | E-commerce Nazário Massas (React + Hono) | Ver `nazario-massas/README.md` |
| `pituco/` | Série infantil animada (SVG + áudio sintetizado → MP4) | Ver `pituco/README.md`; `npm run render && npm test` |

## Regras para projetos de site/app

1. **Comece pelo design system**: rode o UI UX Pro Max com `--design-system`,
   avalie a recomendação de forma crítica (rejeite o que parecer template) e
   registre as decisões em `docs/DESIGN_SYSTEM.md` do projeto.
2. Tokens primeiro (cores com contraste ≥ 4,5:1 calculado, tipografia, raios,
   sombras), componentes reutilizáveis depois. Nada de estilos soltos.
3. Motion só com `transform`/`opacity`, respeitando `prefers-reduced-motion`.
4. Mobile-first; teste em 390 px e 1440 px com screenshots antes de concluir.
5. Segurança no servidor (preço, permissões, segredos); nunca chaves no frontend.
6. Não pare no "compilou": rode typecheck, testes unitários e E2E
   (`npm run test:e2e` no projeto) e corrija o que aparecer.

## Ambiente

- Chromium do Playwright: `/opt/pw-browsers/chromium` (`PW_CHROMIUM_PATH` nos testes E2E).
- 21st.dev: o registry exige chave de API (`Authentication required`); use como
  referência visual ou configure a chave antes de instalar componentes.
