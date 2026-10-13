# MR Perfumes — Plano do site (v1)

**Loja:** MR Perfumes — Atacado e Varejo · @mrperfumes.oficial
**Endereço:** Estação Fashion — Setor Laranja — Corredor G — Loja 25
**WhatsApp:** +55 11 91685-9507 (do link da bio — confirmar)
**Modelo:** catálogo com carrinho → pedido pronto no WhatsApp → **retirada na loja**.
Sem frete, sem pagamento online, sem cupom.

## 1. Páginas

1. **Abertura + Home**
   - Intro de névoa/partículas revelando o monograma MR.
   - Hero com frasco flutuante.
   - Faixa de categorias.
   - "Mais vendidos".
   - Body splash por R$ 20.
   - "Como comprar" (escolhe → manda no Whats → retira na loja).
   - Mapa/endereço.
2. **Catálogo (vitrine "cardápio")**
   - Filtros: Árabes · Franceses/Importados · Nacionais · Body Splash · Kits.
   - Mais filtros: feminino/masculino/unissex, família olfativa e faixa de preço.
   - Busca por nome.
3. **Produto**
   - Fotos.
   - Preço **varejo** e **atacado** (a loja já divulga os dois: R$ 20 / R$ 16).
   - Volume (ml).
   - Pirâmide olfativa animada.
   - Família, fixação, ocasião.
   - Botão "Adicionar à sacola".
4. **Sacola**
   - Itens e quantidades, nome do cliente e observação.
   - Botão **"Enviar pedido no WhatsApp"**, que abre a conversa com a mensagem pronta:
     > Olá, MR Perfumes! Quero retirar na loja:
     > • 1× Yara (Lattafa) 100 ml — R$ …
     > • 2× Body Splash J'adore — R$ 40,00
     > Total: R$ … · Nome: Ana
5. **Sobre / Loja física**: fotos da loja, horário, mapa, Instagram.

## 2. Painel admin (`/admin`, com login)

- Cadastrar/editar produto: nome, marca, categoria, gênero, ml, preço varejo, preço atacado, fotos, notas (topo/coração/fundo), família, descrição.
- **Botão "Esgotado / Ocultar"**: some do site na hora (ou aparece "esgotado", você escolhe).
- Marcar "destaque" (vai pra home) e "novidade".
- Categorias editáveis.
- Dados da loja: WhatsApp, horário, endereço.

## 3. Tecnologia

Reaproveitar a base já testada do `nazario-massas/` (React + Vite + Hono + Supabase).
Ela já tem catálogo, sacola, retirada no local, painel admin com login seguro,
"modo demo" sem servidor e testes E2E. O que muda: checkout vira mensagem de WhatsApp,
entram o visual MR e o motion (GSAP + ScrollTrigger + Lenis, Three.js só no hero).

Hospedagem: Vercel (grátis) + Supabase (grátis) para fotos e produtos.
Domínio depois (ex.: `mrperfumes.com.br`).

## 4. Fases

| Fase | Entrega | Pra quê |
|---|---|---|
| **1. Demo de venda** | Home animada + catálogo com ~15 produtos reais + sacola → WhatsApp + painel em modo demo, num link de prévia | Mostrar pro dono no celular e fechar |
| **2. Lançamento** | Banco real, painel com login, cadastro dos 100–200 produtos, domínio, SEO, Google Meu Negócio | Site no ar |
| **3. Evolução** | Entrega/frete, pagamento online (Pix/cartão), quiz "descubra seu perfume" | Quando a loja crescer |

## 5. Cuidados

- **Marcas de terceiros:** muitos itens são "inspirados em" (Brand Collection Nº 136 → Scandal).
  No site: escrever "inspirado em Scandal – Jean Paul Gaultier" no texto, mas **não usar foto
  nem logo oficial** do perfume original (os stories fazem isso; site público é mais visado).
- Fotos: as dos stories servem pra demo; pro lançamento, ideal fotos com fundo liso
  (dá pra recortar o fundo automaticamente).
- Preço só vale o que está no painel (o pedido no WhatsApp é conferido pela loja).

## 6. Pendências do cliente

- [ ] Confirmar WhatsApp que recebe pedidos e horário de funcionamento
- [ ] Cidade da Estação Fashion (pra mapa e SEO)
- [ ] Logo em PNG/SVG em alta (ou eu redesenho em vetor a partir da paleta)
- [ ] Lista de ~15 produtos pra demo: nome, marca, categoria, ml, preço varejo/atacado
- [ ] Mostrar atacado no site? (sugestão: sim, "a partir de X unidades")
- [ ] Fotos de produtos e da loja física
