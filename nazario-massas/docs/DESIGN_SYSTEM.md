# Design System — "Forno & Farinha"

Direção visual da Nazário Massas. Todos os tokens vivem em
`apps/web/src/styles/index.css` (`@theme`) e viram classes Tailwind
(`bg-flour`, `text-ink-soft`, `rounded-[var(--radius-lg)]`…).

## Conceito

A identidade nasce de dois materiais: **farinha** (fundos creme, textura de
papel) e **forno a lenha** (seções escuras, brasa, vermelho de tomate San
Marzano). O símbolo da marca é a **boca arqueada do forno** emoldurando um
"N" — o mesmo arco aparece no recorte das fotos do hero e da seção de massas.

Origem das decisões (skills usadas):

- **UI UX Pro Max** — gerador de design system (`--design-system`) para
  "premium artisanal pizzeria". A recomendação automática ("Vibrant &
  Block-based", fundo rosa) foi **rejeitada** por parecer template de
  pizzaria; usamos da ferramenta: estilos *Nature Distilled* (terracota,
  creme, grão) + *Exaggerated Minimalism* (tipografia editorial grande),
  a lógica de paleta *Restaurant* (vermelho apetitoso + dourado) e *Luxury*
  (preto + dourado), e o checklist pré-entrega (contraste, foco visível,
  reduced-motion, 375/768/1024/1440 px).
- **LibreUIUX · design-mastery** (`brand-systems`, `design-principles`) —
  estrutura de marca (personalidade: sofisticada, artesanal, confiável),
  hierarquia, ritmo e restrição.
- **dataviz** — gráfico do painel (série única, colunas finas, tooltip,
  tabela acessível, paleta validada pelo script do skill).

## Cores (todas as combinações de texto ≥ 4,5:1)

| Token | Hex | Uso |
|---|---|---|
| `flour` | `#F5EFE4` | fundo da página |
| `flour-deep` | `#EDE4D3` | superfícies rebaixadas, skeletons |
| `paper` | `#FBF8F2` | cards, sheets, inputs |
| `line` / `line-strong` | `#DDD2BF` / `#C8BAA2` | divisórias |
| `ink` | `#1C1714` | texto principal (15,5:1) |
| `ink-soft` | `#4A3F37` | texto secundário (8,9:1) |
| `ink-muted` | `#6E6053` | legendas (5,3:1) |
| `tomato` / `tomato-deep` | `#B4321F` / `#9A2A19` | ação primária (branco 6,2:1) |
| `ember` | `#E0612F` | destaque sobre o escuro (5,3:1) |
| `basil` | `#3E5B3A` | vegetariano, sucesso |
| `olive` / `olive-ink` | `#C9A55A` / `#7A5812` | dourado no escuro / no claro |
| `oven` / `oven-raised` | `#16110E` / `#221A15` | seções escuras, toasts |
| `ash` | `#B9AC9C` | texto secundário no escuro (8,4:1) |

## Tipografia

- **Fraunces** (variável, eixos peso + SOFT) — títulos, preços em destaque,
  logotipo em itálico. Itálico usado com parcimônia ("48 horas de").
- **Instrument Sans** (variável) — interface e textos corridos.
- Rótulos "eyebrow": 12 px, 600, caixa alta, `letter-spacing: .16em`.
- Números sempre com `tabular-nums` (`.tabular`).
- Fontes servidas localmente (sem Google Fonts em runtime), só o subconjunto
  latino necessário é baixado pelo navegador.

## Espaçamento, forma e profundidade

- Escala Tailwind (4 px). Seções: 80–112 px verticais; cards: 20–28 px.
- Raios: `xs 6` · `sm 10` (inputs) · `md 14` · `lg 20` (cards) · `xl 28`
  (painéis/sheets) · botões em pílula.
- Sombras quentes: `shadow-soft` (repouso), `shadow-lift` (hover/flutuante),
  `shadow-sheet` (modais).
- Textura de grão SVG inline (1 KB) em seções escuras e no rodapé.

## Componentes (`apps/web/src/components/ui`)

| Componente | Notas |
|---|---|
| `Button`, `ButtonLink`, `IconButton` | variantes primary/secondary/ghost/light/outline-light/danger; `loading` |
| `Field`, `Input`, `Textarea`, `Select` | label + dica + erro ligados por `aria-describedby` |
| `RadioCards`, `CheckCard`, `Segmented`, `Switch` | inputs nativos estilizados (teclado funciona) |
| `Badge`, `ProductBadge` | selos sempre com ícone + texto |
| `Dialog` | modal/drawer/sheet: portal, foco preso, Esc, página `inert`, scroll travado |
| `Toaster` | região `aria-live`; no celular fica sob o cabeçalho, no desktop no canto inferior direito |
| `Skeleton`, `EmptyState`, `ErrorState` | estados de carregamento, vazio e erro |
| `QuantityStepper` | vira lixeira na quantidade mínima |
| `AnimatedText`, `CountUp` | contadores e preços animados |
| `Picture` | AVIF → WebP responsivo, espaço reservado (sem CLS), lazy |
| `Reveal`, `SplitWords` | entrada por scroll / título palavra a palavra |

Componentes de domínio: `ProductCard`, `ProductRow`, `DrinkRow`,
`ProductConfigurator`, `CartDrawer`, `FreeDeliveryMeter`, `PixPanel`,
`OrderTimeline`, e no admin `StatusBadge`, `PaymentBadge`, `Panel`,
`RevenueChart`.

## Movimento

Biblioteca: **Motion** (`motion/react`) via `LazyMotion` + componentes `m`
(o motor de animação carrega de forma assíncrona).

- Só `transform` e `opacity` — nada que cause reflow.
- Curva padrão `cubic-bezier(.22, 1, .36, 1)`; molas para feedback tátil.
- Entrada: títulos palavra a palavra, conteúdo em stagger de 80 ms.
- Scroll: reveal único (`once`), parallax moderado (±8–14 %).
- Produto: imagem acompanha o cursor (apenas mouse), botão “+” vira ✓.
- Carrinho: pulso no ícone, contador rolando, toast com atalho.
- Cenas de scroll na home (`features/home/Scenes.tsx`):
  - **Manifesto**: palavras acendem conforme a leitura.
  - **Anatomia da margherita** (seção fixada, 320 svh): a pizza recortada se
    divide em 8 fatias, os ingredientes aparecem com linhas-guia e ela se
    remonta no fim. Fatias = mesma imagem com `clip-path` estático; só
    `transform` anima.
  - **O forno em números**: 400 °C · 90 s · 48 h contando, texto vazado
    gigante deslizando com o scroll, foto com parallax.
  - Fotos editoriais entram com cortina (`scaleY`) + zoom suave.
- Produto: a pizza cresce com o tamanho (P/M/G) e mostra o diâmetro em cm.
- Adicionar: a foto “voa” até a sacola do cabeçalho (Web Animations API).
- Troca de página: fade-up de 0,5 s (pulado na primeira carga, não atrasa o LCP).
- Opacidade em faixas de scroll com várias paradas usa `useRamp` (cálculo na
  thread principal): o ScrollTimeline nativo do Motion mapeia errado essas
  faixas dentro de seções fixadas.
- `prefers-reduced-motion`: conteúdo aparece pronto, sem fade nem slide.

## Regra de ouro

> Se parecer template de restaurante ou site gerado por IA, refaça.

Sem gradientes roxos, sem glassmorphism decorativo, sem neon, sem emojis
como ícones (Lucide SVG), sem lorem ipsum.
