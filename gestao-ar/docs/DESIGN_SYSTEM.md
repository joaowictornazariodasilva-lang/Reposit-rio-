# Design System — "Termostato"

Direção visual do sistema de gestão. Todos os tokens vivem em
`src/app/globals.css` (variáveis CSS em `:root` / `.dark`, expostas ao Tailwind
via `@theme inline`) e viram classes (`bg-surface`, `text-fg-muted`,
`bg-primary-soft`, `rounded-lg`, `shadow-sm`…). Nenhum componente usa cor solta.

## Conceito

Empresa de climatização vive de **temperatura**: o aparelho recém-limpo está
"frio" e vai "esquentando" até a próxima limpeza. Isso virou a linguagem do
produto:

- **Frio (petróleo/ciano)** = em dia, confiável, navegação, ações comuns.
- **Quente (laranja)** = pede ação: limpeza atrasada, "Nova OS", botão "+".
- O **Termostato** (régua ciano → âmbar → laranja na ficha do aparelho) mostra
  onde o aparelho está no ciclo de 6 meses.
- A marca são três **linhas de fluxo de ar** saindo de uma aleta (sem floco de
  neve clichê); as mesmas linhas aparecem no painel do login.

Origem das decisões (skills usadas):

- **UI UX Pro Max** (`--design-system` para "field service management HVAC
  admin dashboard"): a recomendação automática (Glassmorphism + Fira Code/Sans,
  fundo escuro e verde) foi **rejeitada** — vidro fosco prejudica leitura em
  tabelas densas e Fira Code dá cara de ferramenta de programador. Aproveitamos
  o checklist pré-entrega (contraste, foco visível, reduced-motion, 375–1440 px,
  ícones SVG, cursor) e a lógica de painel operacional.
- **LibreUIUX · design-principles**: hierarquia por peso e tamanho (não por
  cor), agrupamento por proximidade (cards por assunto), contraste reservado para
  o que pede ação.
- **dataviz**: o único gráfico desta etapa (colunas do faturamento) é série
  única, sem legenda, com valores no hover e descrição para leitor de tela.

## Cores (contraste calculado, WCAG 2.1)

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `bg` | `#F4F7F8` | `#0A1215` | fundo da página |
| `surface` | `#FFFFFF` | `#111C20` | cards, painéis, campos |
| `surface-2` / `surface-3` | `#EEF3F4` / `#E4ECEE` | `#0D171A` / `#18262B` | cabeçalho de tabela, hover, skeleton |
| `border` / `border-strong` | `#DCE4E7` / `#C3D0D5` | `#22343B` / `#31474F` | divisórias |
| `fg` | `#0E1B21` (16,3:1) | `#E6EEF0` (16,1:1) | texto principal |
| `fg-muted` | `#4A5B63` (6,6:1) | `#9DB0B7` (7,7:1) | texto secundário |
| `fg-subtle` | `#5E6E75` (4,9:1 no bg) | `#869AA2` (5,9:1) | legendas, metadados |
| `primary` | `#0B5F6E` (7,3:1 c/ branco) | `#38BDD0` (8,3:1 c/ `#04161A`) | ações, links, ativo |
| `primary-soft` | `#E1F0F2` + texto `#0A4F5C` (7,9:1) | `#0F2E35` + `#7FD8E5` | item ativo, selos "frios" |
| `accent` | `#C4410F` (5,1:1 c/ branco) | `#FB8A3C` (8,1:1 c/ `#1A0A02`) | **só** ações-chave e "quente" |
| `success` / `warning` / `danger` / `info` | `#166534` / `#8A4B06` / `#B42318` / `#1E4E9C` sobre o `-soft` (5,8–6,9:1) | tons claros sobre fundos escuros (8,7–9,9:1) | estados — sempre com ícone + texto |

Regra: o laranja aparece no máximo em 2–3 lugares por tela (Nova OS, botão "+",
alertas de limpeza). Se tudo é urgente, nada é.

## Tipografia

**Geist Sans** (interface) e **Geist Mono** (nº de série, teclas). Pacote `geist`
servido pelo próprio Next (sem Google Fonts em tempo de execução). Escala 1,2:
12 · 13 · 14 (base) · 16 · 19 · 23 · 28 · 34 px. Métricas e tabelas usam
`font-variant-numeric: tabular-nums` (classe `.tabular`, automático em `table`).

## Forma, profundidade e espaço

- Raios: `sm 6` · `md 8` (campos, botões) · `lg 12` (cards) · `xl 16` (diálogos).
- Sombras frias e baixas (`xs` em repouso, `sm` no hover, `lg` em sobreposições).
- Espaçamento em múltiplos de 4 px; cards com 16 px (celular) / 20 px (desktop).
- Alvos de toque: botões `h-11` (44 px) no celular, `h-9` no desktop; checkbox
  tem área de toque expandida invisível.

## Motion

Só `transform`/`opacity`/cores, 150–220 ms, `ease-out` (`cubic-bezier(.22,1,.36,1)`):
painéis laterais deslizam, menus "pop", skeleton com brilho. Tudo cai para 1 ms
com `prefers-reduced-motion`.

## Componentes (src/components/ui)

`Button` (primary · accent · secondary · ghost · soft · danger · link),
`Input`/`Textarea`/`NativeSelect`/`Field` (rótulo, dica, erro com `role=alert`),
`InputMoeda`, `Badge` (tons semânticos), `Card`, `Sheet` (painel lateral de
criação/edição), `Dialog`, `DropdownMenu`, `Tooltip`, `Checkbox`, `Switch`,
`Skeleton`, `EmptyState` (sempre com próxima ação), `PageHeader`, `TabsNav`
(abas que são rotas), `Kbd`.

## Padrões de interação

- **Criar sem sair da tela**: `?novo=cliente` / `?novo=equipamento` abre o painel
  lateral de qualquer lugar (menu "+", Ctrl+K, atalhos `N C` / `N E`). O
  "voltar" do navegador fecha.
- **Rascunho automático** no cadastro de cliente (restaurado se o painel fechar).
- **Exclusão com "Desfazer"** no toast (8 s); remoções sem desfazer pedem
  confirmação.
- **Filtros na URL** (compartilháveis, o "voltar" funciona).
- **Busca global** Ctrl/⌘+K: clientes, aparelhos, produtos, nº de OS e ações.
