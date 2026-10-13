# MR Perfumes — Design System (proposta v1)

> "Mais que perfumes, uma assinatura." — luxo **claro**, feminino, editorial.
> Fonte: paletas oficiais da marca (`referencias/paleta-clara.png`, `paleta-escura.png`)
> e a logo MR (monograma serifado rosé + "PERFUMES" espaçado + flor de lótus).

## Decisão sobre a recomendação automática

O UI UX Pro Max sugeriu "Minimalism & Swiss" com azul `#2563EB` e laranja.
**Rejeitado**: é paleta de SaaS e ignora a marca. Ficamos com a paleta que a loja já
usa; do Swiss só aproveitamos o grid limpo e o respiro.

## Cores (tokens)

Contraste calculado (WCAG) sobre o fundo off-white `#FFF7F5`.

| Token | Hex | Uso | Contraste no fundo |
|---|---|---|---|
| `--bg` | `#FFF7F5` | Fundo principal (off-white rosado) | — |
| `--bg-alt` | `#EFD7CF` | Faixas/seções alternadas (bege nude) | — |
| `--blush` | `#F8D7E1` | Cards de destaque, chips, fundo do carrinho | — |
| `--ink` | `#3B1D1D` | Texto principal (marrom profundo) | **14,4:1** ✅ |
| `--ink-soft` | `#5A0E26` | Títulos grandes (vinho escuro) | **13,0:1** ✅ |
| `--wine` | `#8B0D2E` | Botões, preço, links (vinho real) | **9,1:1** ✅ (branco sobre ele: 9,6:1) |
| `--rose` | `#D76B8A` | Destaques **decorativos** e texto ≥ 24 px | 3,1:1 ⚠️ só texto grande |
| `--rose-gold` | `#D4AF9F` | Filetes, bordas, brilho do monograma | 1,9:1 ❌ nunca em texto |
| `--gold` | `#C9A96A` | Detalhes "premium" (selo, ícone) | 2,1:1 ❌ nunca em texto |

Regras:
- Texto sempre `--ink`, `--ink-soft` ou `--wine`. Rosa/rosé/dourado só como ornamento.
- Botão principal: fundo `--wine` + texto branco. Secundário: contorno `--wine`.
- Botão do WhatsApp: **vinho**, não verde — o ícone do WhatsApp basta para reconhecer.
- Sem preto puro em lugar nenhum (pedido do cliente).

## Tipografia

- **Títulos:** *Cormorant Garamond* (serifa de alto contraste, conversa com o "MR" da logo).
- **Rótulos/categorias:** *Cormorant* em caixa-alta com `letter-spacing: .3em` (eco do "P E R F U M E S").
- **Texto, preço, botões:** *Jost* (geométrica limpa, ótima leitura no celular, números bonitos).
- Escala: 12 / 14 / 16 / 20 / 28 / 40 / 64 / 96 px. Corpo 16 px mínimo no mobile.

## Forma e superfície

- Raios: 4 px (inputs), 16 px (cards), 999 px (chips/botões pílula).
- Sombras suaves e quentes: `0 12px 40px -12px rgb(91 14 38 / .18)`.
- Ornamentos: filete fino rosé com a flor de lótus ao centro (como na logo) separando seções.
- Fotografia: fundo claro/nude; produtos recortados (PNG sem fundo) para o efeito do frasco flutuante.

## Motion (só `transform`/`opacity`, tudo desligado em `prefers-reduced-motion`)

| Momento | Efeito | Referência |
|---|---|---|
| Abertura (≤ 2,5 s, pulável) | Névoa/partículas rosé se dissipam e revelam o monograma MR, que "assina" a tela | partículas do vídeo GetLayers |
| Hero | Frasco grande flutuando; ao rolar ele gira, desce e "pousa" na vitrine | relógio Ultra |
| Tipografia gigante | Palavra enorme atrás do frasco (ex.: "ASSINATURA") com contadores e textos entrando em sequência | relógio Ultra ("ULTRA", "49", "100") |
| Vitrine "cardápio" | Categorias como abas; cards entram em cascata; hover inclina levemente o frasco | — |
| Produto | Notas olfativas (topo → coração → fundo) aparecem em camadas como uma pirâmide | — |
| Carrinho | Frasco "voa" até a sacola ao adicionar | — |
| Ambiente | Pétalas/bolhas suaves em parallax lento ao fundo (versão leve do aquário 3D) | Peachweb |

Ferramentas: GSAP + ScrollTrigger (scroll), Lenis (rolagem suave). 3D real (Three.js)
só no frasco do hero, e com fallback em imagem no celular fraco.
