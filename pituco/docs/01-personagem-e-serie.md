# Pituco — bíblia do personagem e da série

## 1. Nome do personagem

**Pituco** — um feijãozinho laranja, redondinho, com um **brotinho verde enrolado** no topo da cabeça.

"Pituco" é um apelido carinhoso brasileiro para criança pequena: três sílabas abertas
(pi-tu-co), fácil de falar com 2 anos, fácil de gritar junto, fácil de lembrar.

## 2. Conceito da série

> **"Pituco — um, dois, três... e cresce!"**
> Toda história é desenhada na frente da criança. O Pituco quer alguma coisa que
> não consegue sozinho. A criança conta **1, 2, 3** e o **brotinho mágico** da cabeça dele
> cresce, estica, vira escada, ponte, guarda-chuva, laço... e resolve o problema.

O brotinho é o **mecanismo de série** (como um bordão visual): todo episódio
tem um pequeno problema, a contagem com a criança e uma transformação do brotinho.
A criança aprende o ritual em um episódio e passa a antecipá-lo nos próximos —
isso é o que gera participação, replay e reconhecimento de marca.

### Por que o Pituco tem potencial de propriedade intelectual própria

| Critério | Como o Pituco atende |
|---|---|
| Silhueta reconhecível | Um "ovo de feijão" com um caracol verde no topo. Reconhecível em preto sólido, em 48 px (ícone do canal) e em pelúcia. |
| Fácil de animar | Corpo sem pescoço nem roupa; braços curtos atrás do corpo; emoção vem de olhos, boca e do brotinho (que murcha, dá mola, cresce). |
| Personalidade clara | Curioso, otimista, um pouco atrapalhado, **nunca desiste**. Fica triste só por um segundo. |
| Não fala palavras | Pituco "fala" com sons fofos (hm?, iiihuu!, hihi). Uma narradora conta a história → dublar para outros idiomas só exige trocar a narração. |
| Mecânica própria | O brotinho que cresce na contagem é original e rende centenas de situações sem repetir a piada. |
| Valor educativo natural | Contagem, cores, tamanhos, formas, emoções, natureza (plantas crescem!), cooperação. |
| Produtos | Pelúcia (forma simples), mordedor, copo, livro de colorir — o design já é "produto". |
| Não derivado | Não é animal antropomórfico clássico, não é bebê humano, não tem família/escola cliché, não usa melodia ou paleta de nenhuma marca existente. |

### Elenco de apoio (para episódios futuros, um por vez)

- **Estrelinha** — amiga brincalhona do céu, pisca o olho, é o primeiro "prêmio" do Pituco.
- **Gota** (futuro) — gotinha de chuva tímida que rega o brotinho.
- **Zuzu** (futuro) — joaninha veloz que sempre chega primeiro.

Regra: no máximo **2 personagens por Short**. Clareza > elenco.

## Identidade visual

**Estilo:** "desenho que acontece na hora" — traço de caneta com leve tremor
(line boil 8 quadros/s), contorno que passa um pouquinho do ponto inicial (gesto de
lápis), preenchimento levemente "fora de registro" (deslocado ~6 px, como impressão
artesanal), papel creme com textura sutil. Moderno e limpo, nada de "whiteboard
corporativo": não aparece mão, não aparece caneta, o desenho simplesmente nasce.

### Tokens

| Token | Cor | Uso | Contraste sobre o papel |
|---|---|---|---|
| `paper` | `#FFF6E6` | fundo | — |
| `ink` | `#2E2A47` | todo contorno e olho | **12,7 : 1** |
| `body` | `#FF8A4C` | corpo do Pituco | forma (sempre com contorno `ink`) |
| `belly` | `#FFB98A` | barriga | — |
| `foot` | `#E8622E` | pés | — |
| `cheek` | `#FF6B8B` | bochechas | — |
| `leaf` | `#5CC45E` | brotinho, folhas | forma com contorno |
| `star` | `#FFD23F` | Estrelinha | forma com contorno |
| `blue` / `pink` / `green` | `#3D8BFF` / `#FF4F9A` / `#2FB36B` | números contados | sempre sobre contorno `ink` de 46 px |

Contraste: toda forma colorida tem contorno `ink` (12,7:1 sobre o papel),
então a leitura nunca depende só da cor — funciona para daltonismo e em tela pequena.

### Traço e proporção

- Contorno principal: 10 px (× 1,45 de escala no Pituco ≈ 14,5 px) · secundário 8–9 px · pontas e junções arredondadas.
- Pituco ocupa ~22 % da altura do quadro; a ação principal fica entre y 380 e y 1420
  (fora das zonas cobertas pela interface do Shorts: 20 % inferiores e coluna direita).
- Olhos grandes (30×38 no desenho base), pupila com brilho; a direção do olhar
  sempre aponta para o que a criança deve olhar.

### Movimento

- Só `transform`/opacidade + desenho progressivo do traço.
- Squash & stretch em todo pulo (antecipação 0,1 s → estica → amassa ao cair).
- Mola amortecida no brotinho e na estrela (BOING visual = BOING sonoro).
- Ritmo amarrado à música (128 BPM): bob da estrela = 1 compasso, contagem cai nos tempos.

### Som

- Narradora alegre (pt-BR), frases de 1 a 4 palavras.
- Pituco: vocalizações sintetizadas, sem palavras (marca sonora própria).
- Efeitos curtos e suaves (POP, BOING, PLIM, WHOOSH), nunca mais altos que a voz.
- Tema musical original em Dó maior, 8 compassos, loop exato de 15 s.
