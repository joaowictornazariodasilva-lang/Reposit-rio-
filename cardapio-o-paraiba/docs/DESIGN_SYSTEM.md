# Design System — "Folheto de cordel"

Cardápio digital do Restaurante O Paraíba. Tokens em `src/styles/tokens.css`;
contraste verificado automaticamente em `src/lib/contraste.test.ts`.

## Conceito

O dono, Sebastião, veio de Esperança (PB) e a casa serve comida regional há
mais de 30 anos. A identidade nasce do **folheto de cordel**: papel cru, tinta
preta, ilustração em **xilogravura** (sol do sertão + mandacaru) e moldura de
fio duplo. Nada de foto de banco de imagens — as ilustrações são SVG próprios,
leves e nítidos em qualquer tela e na impressão do cartão de mesa.

## Origem das decisões (skills usadas)

- **UI UX Pro Max** (`--design-system -p "O Paraíba"`): a recomendação automática
  (Minimalism & Swiss, índigo `#6366F1` + verde, Outfit/Work Sans) foi
  **rejeitada** — é paleta de SaaS e não tem nada a ver com uma casa de panelada.
  Aproveitados da base da skill:
  - estilo **E-Ink / Paper** (fundo de papel, contraste alto, leitura em primeiro
    lugar, grão sutil) + **Editorial Grid** (capitular, citação, fio separador);
  - paleta **Nature Distilled** (terracota/argila/creme) como ponto de partida,
    deslocada para o urucum, o anil e o amarelo do sertão;
  - lógica de cor **Restaurant/Food Service** (vermelho apetitoso + dourado);
  - **Work Sans** (do par sugerido) mantida para o corpo; o título trocou Outfit
    por **Alfa Slab One**, que remete aos tipos de madeira dos folhetos;
  - checklist pré-entrega (contraste 4,5:1, foco visível, reduced-motion,
    sem emoji como ícone, 375–1440 px).
- **LibreUIUX · design-principles**: hierarquia (preço e nome em pesos
  opostos, descrição recuada em tom), proximidade (etiquetas coladas ao prato),
  restrição (uma cor de ação só).

## Cores (texto sempre ≥ 4,5:1)

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `paper` | `#F5EDDC` | fundo | — |
| `paper-raised` | `#FBF6EC` | capa, cartões, botões | — |
| `paper-deep` | `#EADFC8` | caixa "Regras da casa" | — |
| `ink` | `#1E1913` | texto, faixas de categoria | 14,98:1 |
| `ink-soft` | `#4A4034` | descrições | 8,69:1 |
| `ink-muted` | `#6B5D4C` | rótulos, rodapé | 5,47:1 (4,82 no deep) |
| `urucum` | `#A3341A` | preço, botão primário | 5,89:1 |
| `urucum-deep` | `#85290F` | hover do primário | 7,77:1 |
| `anil` | `#1F4468` | anel de foco | 8,65:1 |
| `sol` | `#E8B23A` | preenchimento ("O que pedir", "Mais pedido") | tinta sobre ele 9,02:1 |
| `mandacaru` | `#35583A` | ponto "aberto agora" | 6,91:1 |

Regra: **urucum nunca sobre sol** (≈ 3:1) — nos cartões amarelos o preço é tinta.
O teste falha se alguém mudar um token e quebrar um par.

## Tipografia

- **Alfa Slab One** — nome da casa, faixas de categoria, preços, citação.
- **Work Sans** (variável) — interface e textos. Nome do prato 18 px/700,
  descrição 15 px em `ink-soft`.
- Rótulos: 12 px, caixa alta, `letter-spacing` .06–.24em.
- Preços com `tabular-nums`; visualmente "R$ 35", leitor de tela ouve "R$ 35,00".
- Fontes servidas localmente (`@fontsource`), sem Google Fonts em runtime.

## Forma e profundidade

- Raio 2–4 px (xilogravura não tem canto macio). Borda de tinta 2 px.
- Sombra **carimbo**: `4px 4px 0` sem blur. Moldura com fio duplo (`::before`).
- Faixa de categoria preta com borda **serrilhada** (gradiente CSS, sem imagem).
- Pontilhado guia nome → preço, como no cardápio impresso.

## Componentes

`Capa` · `Status` (aberto/fechando/fechado no fuso de Fortaleza, atualiza a cada
minuto) · `OQuePedir` (carrossel com snap no celular, 3 colunas no desktop) ·
`NavCategorias` (sticky, scroll-spy, botão ativo centralizado) · `SecaoCategoria`
/ `LinhaItem` / `Preco` / etiquetas · `RegrasDaCasa` · `Historia` · `Info` ·
cartão de mesa com QR (`mesa.html`).

## Motion

Só `transform`/`opacity`: pulso do ponto "aberto", hover dos botões
(−1 px), realce do prato ao chegar por "O que pedir" (camada com opacidade).
Tudo desligado com `prefers-reduced-motion`; rolagem suave também.

## Layout

Mobile-first (390 px é o caso principal: QR na mesa). A partir de 1024 px, duas
colunas: capa fixa à esquerda, cardápio à direita. Alvos de toque ≥ 44 px.
