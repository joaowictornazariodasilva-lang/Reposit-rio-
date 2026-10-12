# Space Pizza: design system

Ponto de partida: `ui-ux-pro-max --design-system` ("pizzaria delivery menu").

**Aceito:** vermelho de apetite com dourado quente, tipografia de restaurante
(serifada no display, sem serifa no texto), checklist de acessibilidade.

**Rejeitado:**
- fundo rosado `#FEF2F2`, trocado por creme `#FFF7EC`, que lembra massa e não fica com cara de template;
- Playfair Display SC, trocada por Fraunces 800, mais calorosa e legível em telas pequenas;
- padrão "funil em 3 passos" de landing page. Aqui o modelo é app de delivery
  (abas fixas, cards, sacola fixa, bottom sheet).

## Tokens

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--tomato` | `#B91C1C` | CTA, aba ativa, sacola | branco 6,5:1 |
| `--gold` | `#F2B33D` | selos, faixa da promoção | `--ink` 9,2:1 |
| `--cream` | `#FFF7EC` | fundo | — |
| `--ink` | `#2B1710` | texto | sobre creme 16:1 |
| `--muted` | `#6E5346` | descrições | sobre creme 6,6:1 / branco 7,0:1 |
| `--basil` | `#1F6B37` | "aberto agora", botão WhatsApp | branco 6,5:1 |
| `--crust` | `#1E0F0A` | hero, rodapé | `#F6E3CF` 14,9:1 |

Raios 10/16/22 px e pílula. Três níveis de sombra quente (`--shadow-sm/md/lg`).
Tipografia: Fraunces 700–800 (títulos) e DM Sans 400–700 (texto), embutidas.

## Regras

- Foto real em todo produto, sem emoji nem ícone no lugar da comida.
- Ícones em SVG inline (traço 2 px, estilo Lucide).
- Alvos de toque ≥ 44 px e foco visível (anel dourado).
- Motion só com `transform`/`opacity`, desligado em `prefers-reduced-motion`.
- Mobile-first: 1 coluna em 390 px, 2 a partir de 640 px, 3 a partir de 960 px.
  Bebidas em 2 colunas no celular.
