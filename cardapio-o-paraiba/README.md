# Cardápio digital — Restaurante O Paraíba

Cardápio digital para o **Restaurante O Paraíba** (Rua Tenente Barbosa, 128 —
Alto da Balança, Fortaleza), casa de comida regional de Sebastião da Costa e
Maria do Socorro, aberta desde 1994. Antes deste projeto ela só existia no
Instagram (@restauranteoparaiba): sem site, sem cardápio digital, sem iFood.

- `/` — cardápio com **carrinho**: o cliente monta o pedido, informa nome e
  telefone e o pedido segue pronto para o **WhatsApp da casa** (feito para abrir
  pelo QR code da mesa)
- `/mesa.html` — cartão de mesa A6 com QR code, pronto para imprimir
  (`/mesa.html?url=https://endereco-final` para fixar o endereço do QR)

## Rodar

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm test             # unitários (horário/fuso, preços, contraste, dados)
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e   # 390 px e 1440 px + axe
npm run build        # site estático em dist/
npm run build:artefato   # um único HTML com tudo embutido (prévia no claude.ai)
```

Publicar na Vercel: importar o repositório com **Root Directory =
`cardapio-o-paraiba`** (o `vercel.json` desta pasta já configura o build).

## Como funciona o pedido

1. O cliente toca em **Adicionar** nos pratos (vira um seletor − 2 +).
2. A barra **Ver pedido** mostra itens e total; o painel permite ajustar
   quantidades e escrever observações.
3. Em **Seus dados**: nome, telefone (com máscara e validação de DDD), como
   quer receber (salão + mesa, retirada ou entrega + endereço), pagamento (Pix,
   cartão, dinheiro + troco).
4. **Enviar pedido no WhatsApp** abre a conversa com o número da casa e a
   mensagem já escrita; o cliente só toca em enviar. Nada é enviado sem ele.

Sem login e sem servidor: o carrinho e o nome/telefone ficam guardados no
aparelho do cliente (localStorage) para o próximo pedido. Os preços da mensagem
saem do cardápio, mas **quem confirma o valor é a casa** na conversa.

> **Número de teste:** `restaurante.whatsapp` está com **(85) 98705-4152**.
> Troque pelo WhatsApp do restaurante em `src/data/restaurante.ts` antes de
> publicar. Para a casa não fazer entrega, tire `'entrega'` de `modalidades`.

## Atualizar o cardápio

Tudo fica em dois arquivos, sem mexer em layout:

- `src/data/cardapio.ts` — categorias, pratos, preços (em centavos), etiquetas.
- `src/data/restaurante.ts` — endereço, horário, Instagram, WhatsApp, história.

## O que é real e o que falta confirmar com a casa

Verificado (matéria do Sabores da Cidade, 10/09/2026): endereço, horário (todo
dia 8h–15h), história, **panelada R$ 35**, **sarrabulho R$ 35**, **carne de sol
acebolada R$ 38**, **pudim R$ 7**, self-service **R$ 35–38**, acompanhamento
liberado e **taxa de R$ 5 por desperdício**.

Estimado para a prévia (`verificado: false`, aparece como "preço a confirmar"):
galinha caipira, bisteca, acompanhamentos extras e bebidas. O WhatsApp
configurado é o número de teste — falta o da casa.

Depois de validar com o Sebastião: marcar os itens como `verificado: true` e
trocar `MODO_PREVIA` para `false`.

Design: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

## Capturas

| Celular (390 px) | Desktop (1440 px) |
|---|---|
| ![](docs/screenshots/celular-390.png) | ![](docs/screenshots/desktop-1440.png) |

Cartão de mesa: ![](docs/screenshots/cartao-de-mesa.png)
