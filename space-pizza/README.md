# Space Pizza: cardápio digital (demonstração)

**`index.html` é o entregável.** É um arquivo único com fotos e fontes embutidas em
base64. Funciona offline e abre em qualquer navegador (inclusive direto do
WhatsApp, do e-mail ou de um pendrive). Tamanho: ~1,2 MB.

## Editar preços, sabores e configurações

Abra `index.html` em qualquer editor de texto. Logo no começo do `<script>`
fica o bloco **DADOS DO CARDÁPIO**:

| Variável | O que muda |
|---|---|
| `DEMO` | `true` mostra a faixa "Demonstração · preços de exemplo"; `false` esconde |
| `LOJA` | nome, WhatsApp, endereço, horário (`abre`/`fecha`) e `taxaEntrega` (`null` = "a combinar") |
| `PIZZAS`, `DOCES`, `BEBIDAS` | nome, descrição, preço, foto e selo ("Mais pedida", "Picante", "Da casa") |
| `BORDAS` | bordas recheadas e preço adicional |
| `PROMO` | preço da promoção e dias válidos (0 = domingo … 6 = sábado) |

Fora dos dias da promoção, o cartão continua visível com o aviso "Só de sexta a
domingo". Com `DEMO = false`, o botão de adicionar a promoção fica bloqueado
nesses dias.

## Regerar o arquivo a partir do código-fonte

Para trocar fotos ou mexer no layout, edite `src/index.template.html` ou
substitua um JPG em `src/fotos/` (mesmo nome, até 700 px no lado maior). Depois rode:

```bash
python3 build.py          # gera index.html
```

## Teste (offline, 390 px)

```bash
PLAYWRIGHT_MODULE=/opt/node-tools/node_modules/playwright \
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium node tests/teste-offline.cjs
```

O teste bloqueia toda a rede, confere se as 17 fotos carregaram e se as fontes
estão ativas, valida os campos obrigatórios e o troco menor que o total, faz um
pedido completo e imprime a mensagem do WhatsApp. O `window.open` é
interceptado, então **nada é enviado**. Os prints ficam em `prints/`.

## Créditos das fotos (fotos ilustrativas, licença Pexels: uso comercial livre)

| Arquivo | Foto no Pexels |
|---|---|
| hero | https://www.pexels.com/photo/1878346/ |
| promo | https://www.pexels.com/photo/6068717/ |
| mussarela | https://www.pexels.com/photo/20115306/ |
| calabresa | https://www.pexels.com/photo/31094832/ |
| calabresa_req | https://www.pexels.com/photo/2741457/ |
| frango | https://www.pexels.com/photo/11176613/ |
| mista | https://www.pexels.com/photo/27024683/ |
| portuguesa | https://www.pexels.com/photo/845812/ |
| marguerita | https://www.pexels.com/photo/31596394/ |
| baiana | https://www.pexels.com/photo/6147837/ |
| alema | https://www.pexels.com/photo/19297799/ |
| saborosa | https://www.pexels.com/photo/6493570/ |
| bananita | https://www.pexels.com/photo/28358400/ |
| refri1 | https://www.pexels.com/photo/8879617/ |
| refri2 | https://www.pexels.com/photo/8880742/ |
| lata | https://www.pexels.com/photo/6920721/ |
| agua | https://www.pexels.com/photo/1540235/ |

Fontes: Fraunces e DM Sans (SIL Open Font License), subconjunto latino.

> Quando a pizzaria tiver fotos próprias, basta substituí-las em `src/fotos/`
> e rodar `python3 build.py`. Foto real do produto vende mais que banco de imagens.
