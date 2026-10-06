# Nazário Massas — e-commerce de pizzas, massas e bebidas

Loja virtual completa: vitrine, cardápio, personalização de produto, carrinho,
checkout (**retirada no local**; Pix, cartão, dinheiro), acompanhamento do pedido em
tempo real e painel administrativo com dashboard, gestão de pedidos, cardápio,
adicionais, categorias, cupons e configurações da loja.

## Rodar localmente

Requisitos: Node 20+.

```bash
npm install
npm run images        # baixa e otimiza as fotos (AVIF/WebP)
npm run seo-assets    # ícones, imagem de compartilhamento e sitemap
npm run dev           # API em :8787 + site em :5173
```

- Loja: <http://localhost:5173>
- Painel: <http://localhost:5173/admin> — **dev:** `admin@nazariomassas.com.br` / `nazario2026`
- Pagamento em modo **teste**: o Pix gerado é fictício; use “Simular pagamento”
  na tela do pedido para ver o fluxo completo.
- Cupons de exemplo: `BEMVINDO10` (10 % acima de R$ 60), `NAZARIO20` (R$ 20 acima de R$ 120).

## Retirada no local (padrão) e entregas

A loja trabalha **somente com retirada no balcão**: o checkout não pede
endereço, o site não fala em entrega e a API recusa pedidos de entrega. Para
passar a entregar no futuro, ligue **Painel → Loja → Fazer entregas**; taxas,
entrega grátis e tempo de entrega aparecem nessa mesma tela.

## Acesso ao painel

O painel fica em `/admin` e **não tem link na loja** — clientes não o veem.
Mesmo quem digitar o endereço só entra com e-mail e senha, verificados no
servidor (cookie httpOnly assinado, 5 tentativas a cada 15 min).

## Demonstração sem servidor

`npm run build:demo` gera `apps/web/dist-demo/`: o mesmo site com a API
simulada no navegador (mesmo código de pedidos, preços e validação), dados no
`localStorage` e pedidos de exemplo. O painel abre pelo link privado `…#admin`.

## Testes

```bash
npm run typecheck     # TypeScript em todos os pacotes
npm test              # unitários (preço, status) + API (segurança, fluxo de pedido)
npm run test:e2e      # Playwright: fluxos de cliente e admin em desktop e celular + auditoria WCAG AA (axe)
```

Resultado atual: 16 testes unitários/API e 36 testes E2E passando. Lighthouse
(build de produção): desktop 99 · mobile 83–90 · acessibilidade, boas práticas
e SEO 100.

## Arquitetura

```
packages/shared   Tipos, constantes, cálculo de preço e status (usados pelo site E pela API)
                  └─ /schemas  Validação zod (carregada só onde há formulário)
apps/api          Hono (Node) — catálogo, pedidos, pagamentos, autenticação, uploads
  ├─ repositories   Interfaces de persistência + JsonStore (troque por Supabase)
  ├─ payments       PaymentProvider: mock (Pix de teste) e Asaas (Pix real + webhook)
  ├─ services       Regras de pedido, transições de status, estatísticas
  └─ routes         public · admin (protegido) · webhooks
apps/web          React 19 + TypeScript + Vite + Tailwind 4 + Motion + React Router
  ├─ components/ui  Design system (ver docs/DESIGN_SYSTEM.md)
  ├─ features       catalog · cart · checkout · order · home · admin
  ├─ pages          rotas da loja (code splitting por rota)
  ├─ stores         zustand: carrinho (persistido), catálogo, UI, cliente
  └─ lib            api, formatação, imagens responsivas, SEO
supabase/schema.sql  Esquema PostgreSQL pronto para migração
e2e/                 Testes Playwright
```

**O preço é sempre calculado no servidor.** O site usa a mesma função
(`priceOrder` em `packages/shared`) só para exibir valores instantaneamente; o
pedido gravado é recalculado pela API a partir do catálogo, e campos extras
enviados pelo cliente são rejeitados.

## Segurança

- Painel protegido no **servidor**: cookie de sessão `httpOnly`, `SameSite=Strict`,
  assinado com HMAC; toda rota `/api/admin/*` verifica a sessão. A proteção no
  frontend é apenas visual.
- Senha do admin com **scrypt** (`npm run hash-password -- "senha"`), comparação
  em tempo constante, limite de 5 tentativas a cada 15 min por IP.
- Checagem de origem nas mutações do painel (defesa extra contra CSRF).
- Cupons nunca são enviados à loja pública; o servidor os valida.
- Link de acompanhamento usa token aleatório (não dá para adivinhar pedidos alheios).
- Cabeçalhos: CSP estrita (scripts só do próprio domínio + hash do script inline),
  HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`.
- Uploads: só JPG/PNG/WebP/AVIF até 3 MB, nome aleatório.
- Nenhuma chave no frontend: `ASAAS_API_KEY`, `SESSION_SECRET` etc. ficam em
  variáveis de ambiente da API (ver `.env.example`).

## Pagamentos (Asaas)

1. Crie a conta e gere a chave de API (comece pelo **sandbox**).
2. Em `apps/api/.env`: `PAYMENT_PROVIDER=asaas`, `ASAAS_API_KEY`, `ASAAS_ENV`,
   `ASAAS_WEBHOOK_TOKEN`.
3. No painel do Asaas, cadastre o webhook `https://SEU_DOMINIO/api/webhooks/asaas`
   com o mesmo token e os eventos `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`,
   `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`.

Com o Asaas ativo, o checkout pede CPF para o Pix (exigência do banco), o QR
Code real aparece na tela do pedido e a confirmação chega pelo webhook,
mudando o pedido para “Confirmado” automaticamente. Cartão e dinheiro são
cobrados na entrega/retirada nesta versão; cartão online pode ser adicionado
implementando `createCharge` para `card` em `apps/api/src/payments/asaas.ts`,
sem tocar no checkout.

## Publicar na Vercel (demonstração: loja + painel)

O repositório já tem `vercel.json`. Na Vercel: **Add New → Project →** importe
este repositório → **Deploy** (não mude nada: instalação, build e pasta de saída
vêm do `vercel.json`). O build baixa e otimiza as fotos sozinho.

- Loja: `https://SEU-PROJETO.vercel.app/`
- Painel: `https://SEU-PROJETO.vercel.app/#admin` — `admin@nazariomassas.com.br` / `nazario2026`

Nessa versão a "API" roda no navegador: cada aparelho tem seus próprios
pedidos (para testar o fluxo). Para pedidos reais chegando de vários clientes
ao mesmo painel, use o deploy com servidor abaixo (ou migre para Supabase).

## Deploy (produção, com servidor)

Um único serviço Node serve a API e o site:

```bash
npm install && npm run images && npm run seo-assets && npm run build
cd apps/api && NODE_ENV=production node --env-file=.env dist/server.js
```

Configure `NODE_ENV=production`, `SESSION_SECRET`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD_HASH`, `WEB_DIST=../web/dist`, `PUBLIC_URL` e, atrás de proxy,
`TRUST_PROXY=1`. Funciona em Render, Railway, Fly.io, VPS etc. Use disco
persistente para `DATA_FILE` e `data/uploads` enquanto não migrar para o banco.

## Migrar para Supabase/PostgreSQL

1. Rode `supabase/schema.sql` no projeto Supabase.
2. Implemente `CatalogRepository` e `OrderRepository`
   (`apps/api/src/repositories/types.ts`) com o client do Supabase usando a
   *service role key* **apenas no servidor**.
3. Troque `JsonStore.open(...)` em `apps/api/src/server.ts` pela nova classe.
Rotas, regras de preço e frontend não mudam.

## Antes de publicar — revise o conteúdo

- **Endereço, telefone, WhatsApp e horário** são exemplos
  (`apps/api/src/data/seed.ts` e `apps/web/index.html`, no JSON-LD). Edite
  em `/admin/configuracoes` e no `index.html`.
- **Afirmações de marca** ("fermentação de 48 h", "forno a 400 °C",
  "entregadores próprios") são texto de exemplo: confirme se correspondem à
  operação real.
- **Fotos**: são do Unsplash (licença livre para uso comercial) e algumas
  apenas se aproximam do sabor. Substitua por fotos reais da casa
  (upload no editor de produto) assim que possível.
- Troque a senha do admin e o domínio `nazariomassas.com.br` (canonical,
  Open Graph, sitemap: `SITE_URL=https://seu-dominio npm run seo-assets`).

## Próximos passos sugeridos

- Pré-renderização (SSR/SSG) da home e do cardápio para melhorar a primeira
  pintura no celular e o SEO de páginas de produto.
- Cartão de crédito online (Asaas) e reembolso pelo painel.
- Área de raio/bairros com taxas de entrega diferentes.
- Notificações por WhatsApp a cada mudança de status.
