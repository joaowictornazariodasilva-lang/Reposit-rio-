# Próximos Shorts do Pituco

Mesma fórmula, mesma identidade: **tudo desenhado na hora · problema em 2 s · contagem 1-2-3 com a criança ·
o brotinho se transforma · payoff colorido · "De novo?" + rebobinar**. Cada um varia *o que o brotinho
vira* e *o conceito que a criança pratica*, para não repetir a piada.

| # | Título | Problema (0–5 s) | Contagem → o brotinho vira… | Payoff / aprendizagem | Loop |
|---|---|---|---|---|---|
| 02 | **Cadê a bolinha vermelha?** | A bola some atrás de 3 arbustos desenhados. "Cadê?" | 1, 2, 3 → o brotinho espia atrás de cada arbusto (vazio, vazio… ACHEI!) | Esconde-esconde + cor vermelha | A bola rola e se esconde de novo |
| 03 | **Chuva, chuvinha!** | Começa a chover, o Pituco fica molhado e triste | 1, 2, 3 → as folhas crescem e viram um **guarda-chuva** | Clima; aparece um arco-íris colorido (nomeia 3 cores) | O arco-íris se desdesenha, pinga uma gota |
| 04 | **A ponte do riozinho** | Um rio separa o Pituco de uma florzinha | 1, 2, 3 → o brotinho se estica e vira **ponte** | Atravessa, dá a flor para a Estrelinha; noção "longe / perto" | A flor cai no rio e volta para o outro lado |
| 05 | **Quantas maçãs?** | Uma macieira alta, o Pituco com fome | 1, 2, 3 → o brotinho colhe uma maçã por número | Contagem com objetos (3 maçãs na cesta) + "hmm, que gostoso!" | A árvore desenha as maçãs de volta |
| 06 | **Pituco grandão, Pituco pequenininho** | Uma portinha de rato muito pequena | 1, 2, 3 → Pituco encolhe; 1, 2, 3 → cresce enorme | Opostos: grande / pequeno (narração pede para a criança dizer) | Volta ao tamanho normal com POP e a porta reaparece |
| 07 | **Qual é a cor do balão?** | Um balão branco escapa | 1, 2, 3 → o brotinho pega o balão; a cada número o balão muda de cor (azul, rosa, verde) | Cores + "Qual é a cor?" com pausa de 1 s para a criança responder | O balão estoura em confete e um novo balão branco surge |
| 08 | **A Gota está com sede?** (estreia da Gota) | Uma gotinha tímida cai no chão seco e a florzinha murcha | 1, 2, 3 → o brotinho vira **regador** em espiral | Plantas precisam de água; amizade nova | A flor abre e fecha piscando |
| 09 | **Boa noite, Estrelinha** (Short calmo, ótimo para a hora de dormir) | Escurece (o papel fica azul-noite), a Estrelinha não acha o caminho de casa | 1, 2, 3 (sussurrado) → o brotinho vira **escada** de folhas até a lua | Rotina de sono, voz baixa, música lenta (variação do tema a 96 BPM) | A lua boceja, o céu clareia e vira dia (início) |
| 10 | **Zuzu é muito rápida!** (estreia da Zuzu) | A joaninha Zuzu passa voando: VRUUUM. "Cadê a Zuzu?" | 1, 2, 3 → o brotinho vira **laço** e… erra! Na 2ª contagem (mais alto!) acerta | Persistência ("tenta de novo!"), rápido / devagar | Zuzu escapa e passa voando de novo |
| 11 | **Formas no céu** | Nuvens com formas (círculo, triângulo, quadrado) passam | Para cada forma, o brotinho desenha a forma igual — 1, 2, 3 formas | Formas geométricas; criança diz o nome | As nuvens se juntam e viram a primeira nuvem |

## Como produzir cada um com este projeto

1. Copie `src/timeline.js` → novo `episode`, ajuste `keys`, `narration` e `sfx`.
2. Reaproveite `draw.js` (traço, mola, keyframes) e as partes do Pituco em `scene.js`
   (corpo, olhos, boca, braços, brotinho); só o cenário e o "objeto do episódio" são novos.
3. `npm run voice && npm run audio && npm run render && npm test`.

## Ritmo de publicação sugerido

- **3 Shorts por semana** no início (série reconhecível vence frequência aleatória).
- A cada 5 Shorts, um **compilado de 3–5 min** (os mesmos episódios em sequência) para o feed longo —
  é onde a monetização por anúncios de vídeos longos acontece.
- Teste A/B do título e do 1º segundo (estrela já brilhando vs. Pituco já desenhado) usando a
  retenção dos 3 primeiros segundos como métrica principal.
- Canal marcado como **"conteúdo para crianças"** (exigência COPPA/YouTube): sem comentários,
  sem anúncios personalizados — conte com isso no planejamento de receita (marca e produtos
  pesam mais que RPM).
