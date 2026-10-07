# Episódio 01 — "Cadê a estrelinha?"

Formato: 1080×1920 (9:16) · 30 fps · 15,0 s · loop perfeito · música 128 BPM (8 compassos).
Todos os tempos abaixo saem de [`src/timeline.js`](../src/timeline.js) — é ele que a animação e o áudio leem.

## 3. Título do Short

**Pituco e a Estrelinha ⭐ Vamos contar 1, 2, 3?**
(alternativas para teste A/B: "Cadê a estrelinha? 🌟 Conta comigo!" · "O brotinho que cresce! 1, 2, 3 🌱")

## 4. Ideia central

Pituco vê uma estrelinha no céu e quer pegá-la. Pula, pula... não alcança.
A narradora chama a criança para contar **1, 2, 3** — a cada número o brotinho da
cabeça dele cresce, até alcançar a estrela e trazê-la para baixo. A estrela vira
"chapéu brilhante", eles comemoram, ela pisca o olho e volta para o céu... e o
desenho se "rebobina" para o começo. **De novo?**

Estrutura: problema (0–5 s) → tentativa (3–5 s) → ajuda da criança (5–10 s) → surpresa/payoff (10–13 s) → convite ao replay (13–15 s).

## 5. Roteiro completo (15 s)

| Tempo | Bloco | O que acontece |
|---|---|---|
| 0,0–2,0 | **HOOK** | A estrelinha já está no céu e brilha (PLIM). Uma linha de chão é riscada da esquerda para a direita, e em meio segundo um feijãozinho laranja é desenhado, ganha pés, olhos (POP) e um brotinho que dá mola (BOING). Ele olha para cima: "hm?" |
| 2,0–5,3 | **PROBLEMA** | Pituco estica os bracinhos. Pula uma vez, pula mais alto — não alcança. Murcha: boca triste, brotinho caído, olhar no chão. |
| 5,3–7,4 | **CONVITE** | O brotinho dá um BOING de volta, Pituco olha direto para a criança e balança no ritmo: "Vamos ajudar? Conta comigo!" |
| 7,5–9,9 | **DESENVOLVIMENTO** | "Um!" — o número 1 é desenhado, o brotinho cresce e solta uma folha. "Dois!" — 2, cresce mais. "Três!" — 3, dispara até a estrela e se enrola nela (PLIM + brilhos). |
| 9,9–11,1 | **SURPRESA** | "Uau!" Os números somem, o brotinho recolhe (WHOOSH) trazendo a estrela, que pousa na cabeça do Pituco como um chapéu brilhante. |
| 11,1–13,5 | **PAYOFF** | Explosão de estrelinhas coloridas, fanfarra, Pituco "Iiihuuu!" com olhos felizes, pula duas vezes de alegria. "Conseguiu! Que brilho!" Risadinha. |
| 13,5–15,0 | **LOOP** | "De novo?" A estrela pisca o olho, salta de volta para o mesmo lugar do céu, e o desenho todo se "desdesenha" ao contrário (zwiiip) até sobrar só o papel e a estrela — exatamente o primeiro quadro. |

## 6. Narração exata (24 palavras + vocalizações do Pituco)

| # | Início | Fim (medido) | Texto |
|---|---|---|---|
| n01 | 0,15 s | 1,64 s | **Olha! Uma estrelinha!** |
| n02 | 2,05 s | 3,29 s | **O Pituco quer pegar!** |
| n03 | 3,32 s | 3,67 s | **Pula!** (no 1º pulo) |
| n04 | 3,88 s | 4,23 s | **Pula!** (no 2º pulo) |
| n05 | 4,50 s | 5,29 s | **Não alcança!** |
| n06 | 5,40 s | 7,37 s | **Vamos ajudar? Conta comigo!** |
| n07 | 7,50 s | 7,85 s | **Um!** |
| n08 | 8,44 s | 8,92 s | **Dois!** |
| n09 | 9,38 s | 9,80 s | **Três!** |
| n10 | 9,95 s | 10,33 s | **Uau!** |
| n11 | 11,80 s | 13,35 s | **Conseguiu! Que brilho!** |
| n12 | 13,55 s | 14,16 s | **De novo?** |

Vocalizações do Pituco (sintetizadas, sem palavras): "hm?" (1,60 s) · "iiihuuu!" (11,15 s) · "hihihi" (12,95 s).

Voz: narradora feminina pt-BR, alegre, levemente aguda (edge-tts `pt-BR-FranciscaNeural`, +12 Hz).
Os tempos "Fim" são medidos do áudio real (`assets/audio/cues.json`). "Um / Dois / Três"
caem exatamente nos tempos 1 e 3 do compasso 5 e no tempo 1 do compasso 6 (128 BPM).
Para gravar com locutora humana: mesmas frases, mesmos ids, salve em `assets/voice/nXX.mp3` e rode `npm run audio`.

## 7. Timeline segundo a segundo

| Segundo | Imagem | Som |
|---|---|---|
| 0 | Estrela brilhando; chão sendo riscado; contorno do Pituco nascendo | PLIM-plim (brilho), lápis |
| 1 | Corpo preenche, pés POP, olhos POP, boca, bochechas, brotinho com mola, grama e florzinha | POP, POP, BOING; "Olha! Uma estrelinha!" |
| 2 | Pituco olha para cima (pupilas sobem), braços aparecem e esticam; nuvem é desenhada | "hm?", PLIM; "O Pituco quer pegar!" |
| 3 | 1º pulo (120 px) com linhas de movimento | BOING; "Pula!" |
| 4 | 2º pulo (190 px), ainda longe; aterrissa e murcha | BOING; "Pula!"; apito descendo; "Não alcança!" |
| 5 | Brotinho volta com mola, olhar para a câmera, braços abertos | BOING; "Vamos ajudar?..." |
| 6 | Pituco balança no ritmo, olhando para a criança | "...Conta comigo!" |
| 7 | (7,5) número **1** azul desenhado + anel; brotinho cresce, folha | ziiip ↑, sino Dó; "Um!" |
| 8 | (8,44) número **2** rosa; cresce mais, folha | ziiip ↑↑, sino Mi; "Dois!" |
| 9 | (9,38) número **3** verde; dispara até a estrela; (9,85) toca, anel amarelo, estrela "ó" | rufo, ziiip ↑↑↑, sino Sol; "Três!"; PLIM + brilhos |
| 10 | "Uau!"; números somem; brotinho recolhe trazendo a estrela, linhas de velocidade | "Uau!"; WHOOSH |
| 11 | (11,1) estrela pousa na cabeça: anel rosa + 16 estrelinhas/pontos coloridos; olhos felizes ^^; pulo de alegria | POP, fanfarra, "iiihuuu!", BOING |
| 12 | 2º pulo de alegria, braços acenando | BOING; "Conseguiu! Que brilho!" |
| 13 | Risadinha (corpo treme), olha para a câmera; (13,55) estrela pisca o olho | "hihihi", plim; "De novo?" |
| 14 | (13,95–14,4) estrela salta em arco girando 360° de volta ao céu; (14,42–14,95) tudo se desdesenha em ordem inversa | BOING + whoosh; zwiiip (rebobinar) |
| 15 = 0 | Só papel + estrela no mesmo lugar → o vídeo recomeça | música fecha o 8º compasso e emenda no 1º |

## 8. Descrição de cada cena

1. **Céu vazio com estrela (0–0,4 s)** — papel creme, estrela amarela sorridente no alto à direita. Único ponto de cor: o olho da criança vai direto para ela.
2. **Nasce o Pituco (0,1–1,4 s)** — contorno desenhado de uma vez só (passa um pouco do ponto inicial), preenchimento laranja "fora de registro", detalhes surgem em sequência rápida. Composição: Pituco no centro-baixo, estrela no alto: a distância entre os dois *é* o problema.
3. **Querer (1,6–3,3 s)** — olhar para cima + braços esticados = desejo legível sem palavras.
4. **Tentar (3,3–4,4 s)** — dois pulos crescentes; o segundo maior cria a expectativa "agora vai!".
5. **Frustrar (4,45–5,3 s)** — 0,9 s de tristeza (curto: nada de choro). O brotinho caído é a assinatura emocional.
6. **Convidar (5,35–7,4 s)** — quebra da quarta parede: pupilas no centro, olhos maiores, balanço no ritmo.
7. **Contar (7,5–9,85 s)** — cada número desenhado na altura que o brotinho alcança, de baixo para cima: a criança *vê* que contar faz crescer.
8. **Alcançar (9,85–11,1 s)** — toque mágico e retorno rápido.
9. **Comemorar (11,1–13,5 s)** — a maior recompensa visual do vídeo (partículas, cores, fanfarra).
10. **Devolver e rebobinar (13,5–15 s)** — a estrela "quer brincar de novo", tudo volta ao começo.

## 9. Movimento de cada personagem

**Pituco**
- Entrada: desenhado (sem transform) → pés e olhos com *pop* elástico (overshoot).
- Olhar (pupilas): centro → cima-direita (1,6) → chão (4,45) → câmera (5,35) → cima (7,5) → semi-cima (11,1) → câmera (12,95) → cima (13,95).
- Olhos crescem 14 % ao ver a estrela, 10 % ao falar com a criança, 16 % no "Uau".
- Piscadas: 2,75 s · 6,45 s · 13,25 s (0,14 s cada).
- Boca: sorriso → "ó" → sorriso → "ó" pequeno (esforço) → triste → sorriso → "ó" → sorrisão com língua → "ó".
- Corpo: squash & stretch em todos os pulos; ponta dos pés 2,1–3,2 s; balanço no ritmo 5,35–7,4 s; "força" com mola em cada número; tremidinha da risada 12,95 s.
- Braços: repouso → esticados para cima → caídos (triste) → abertos (convite) → erguidos na contagem → acenando na comemoração → repouso → esticados para cima no final.
- Brotinho: mola ao nascer · balanço leve constante · murcha 1,25 rad na tristeza · mola de volta · cresce 105 → 250 → 390 → ~500 px · recolhe · mola em cada aterrissagem.

**Estrelinha**
- Flutua 7 px no ritmo de 1 compasso, gira ±6° em 2 compassos, "respira" 4 % a cada 2 tempos.
- 9,375 s rosto de surpresa → 9,85 s presa no caracol do brotinho, mola de alegria.
- Viaja grudada na ponta do brotinho; pousa com mola (11,1).
- 13,55 s pisca o olho direito. 13,95–14,4 s salta em arco com giro de 360° e volta exatamente à posição inicial.

## 10. Efeitos sonoros

| Tempo | Efeito | Sincroniza com |
|---|---|---|
| 0,00 | brilho (4 sininhos agudos) | brilhos ao redor da estrela |
| 0,00 / 0,12 | lápis riscando | chão / contorno do Pituco |
| 0,62 | POP grave | pés |
| 0,76 | POP agudo | olhos |
| 0,98 | BOING curto | brotinho |
| 1,60 | "hm?" do Pituco | olhar para cima |
| 1,75 | PLIM | brilho da estrela |
| 2,30 | lápis curto | nuvem |
| 3,30 / 3,90 | BOING / BOING mais agudo | pulos |
| 4,45 | apito descendente | murchar |
| 5,35 | BOING agudo | brotinho de volta |
| 7,5 / 8,44 / 9,38 | ziiip subindo + sino Dó / Mi / Sol | crescimento + números |
| 8,88–9,38 | rufo crescente | antecipação do "Três!" |
| 9,85 | PLIM agudo + cascata de brilhos | toque na estrela |
| 10,35 | WHOOSH | brotinho recolhendo |
| 11,10 | POP + fanfarra (Dó-Mi-Sol-Dó) + "iiihuuu!" | estrela pousa + explosão |
| 11,20 / 12,10 | BOING | pulos de alegria |
| 12,95 | "hihihi" | risadinha |
| 13,55 | plim | piscadinha |
| 13,95 | BOING + whoosh | estrela volta ao céu |
| 14,42 | zwiiip (rebobinar) | desdesenho |

Todos sintetizados em [`scripts/audio.py`](../scripts/audio.py) — nada de samples de terceiros.

## 11. Quando cada elemento é desenhado

| Elemento | Começa | Termina | Como |
|---|---|---|---|
| Estrela | já existe (0) | — | brilha |
| Linha do chão | 0,00 | 0,40 | traço da esquerda para a direita |
| Contorno do Pituco | 0,12 | 0,60 | traço contínuo, começa no alto à esquerda |
| Preenchimento + barriga | 0,48 | 0,73 | cresce de 80 % a 100 % e aparece |
| Brilho do corpo | 0,63 | 0,83 | traço branco |
| Pés | 0,62 / 0,68 | +0,28 | pop elástico |
| Olhos | 0,76 / 0,81 | +0,30 | pop elástico |
| Boca (sorriso) | 0,92 | 1,07 | traço |
| Brotinho | 0,98 | 1,28 | traço da base para a ponta + mola |
| Bochechas | 1,02 / 1,07 | +0,28 | pop |
| Folhinhas | 1,23 / 1,31 | +0,28 | pop |
| Gramas | 1,12 / 1,20 / 1,28 | +0,15 | traço |
| Florzinha | 1,37 | 1,65 | pop |
| Braços | 1,90 | 2,12 | traço do ombro para a mão |
| Nuvem | 2,30 | 2,65 | contorno + recheio branco |
| Número 1 / 2 / 3 | 7,50 / 8,44 / 9,38 | +0,24 | traço colorido sobre contorno + anel |
| Folhas do caule | 7,62 / 8,56 / 9,56 | +0,28 | pop quando o caule passa da altura |
| **Desdesenho** | 14,42 | 14,95 | ordem inversa: braços → boca/bochechas → olhos → brotinho → nuvem → corpo → pés/sombra → grama → chão |

## 12. Estratégia de loop

1. **Quadro final = quadro inicial.** Aos 14,95 s só restam o papel e a estrela, na mesma posição,
   tamanho e fase de flutuação do quadro 0 (todas as oscilações têm período que divide 15 s:
   1, 2, 4 e 8 tempos de 128 BPM). Verificado automaticamente: SSIM entre o 1º e o último quadro > 0,98.
2. **O "rebobinar" é parte da piada.** O desenho se desfaz ao contrário com um "zwiiip" — a
   criança entende que a história vai recomeçar e fica para ver de novo.
3. **Convite explícito:** "De novo?" logo antes do rebobinar.
4. **Música em loop exato:** 8 compassos a 128 BPM = 15,000 s; a mixagem é circular (caudas
   de som que passariam de 15 s entram no começo), então a emenda não tem clique nem silêncio.
5. **O começo responde ao fim:** o último gesto é a estrela voltando ao céu; o primeiro
   quadro é a estrela no céu brilhando. Quem viu o final reconhece o início e "quer ajudar de novo" —
   e na 2ª vez a criança já conta junto *antes* da narradora (efeito de antecipação).
