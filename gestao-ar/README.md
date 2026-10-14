# Brisa Gestão — sistema para empresas de ar condicionado

Painel administrativo para o dono e o escritório (e, depois, o técnico em campo):
clientes, ficha de cada aparelho com histórico, lembretes de limpeza com
WhatsApp pronto, cadastros de serviços/peças/kits e, nos próximos passos, OS,
agenda, orçamentos, estoque e financeiro.

**Entregue nesta etapa: Passo 1 (fundação) e Passo 2 (cadastros essenciais).**

## Rodar localmente

Requisitos: Node 20+. Nada mais — sem `DATABASE_URL` o sistema usa Postgres
embutido (PGlite) em `.data/` e cria os dados de demonstração na primeira vez.

```bash
npm install
npm run dev            # http://localhost:3000
```

Entre como (senha de todos: `brisa2026`) — a tela de login tem atalhos:

| Perfil | E-mail |
|---|---|
| Dono (Administrador) | dono@brisaclima.demo |
| Financeiro | financeiro@brisaclima.demo |
| Atendimento | atendimento@brisaclima.demo |
| Técnico | marcos@brisaclima.demo |

`npm run db:seed -- --reset` recria o banco de demonstração.

### Colocar no ar (Vercel)

1. Em vercel.com → **Add New… → Project** → importe este repositório.
2. Em **Root Directory** escolha `gestao-ar` (o framework Next.js é detectado sozinho).
3. Em **Storage → Create Database → Neon (Postgres)**, conecte ao projeto: isso cria a
   variável `DATABASE_URL`. Sem banco o site até abre, mas os dados se perdem a cada reinício.
4. **Deploy**. Na primeira visita o banco é criado com os dados de demonstração.

### Produção

1. Postgres (Supabase, Neon, RDS…): defina `DATABASE_URL` — as migrações rodam sozinhas.
2. `SESSION_SECRET` com 32+ caracteres (`openssl rand -base64 48`) e `DEMO_SEED=false`.
3. `npm run build && npm start`.

## O que já funciona

**Passo 1 — Fundação**
- Next.js 16 (App Router) + TypeScript estrito + Tailwind 4 + componentes próprios
  sobre Radix (mesma base do shadcn/ui), Drizzle ORM + Postgres.
- Tokens de design em um único arquivo, tema claro/escuro — ver `docs/DESIGN_SYSTEM.md`.
- Login com senha (scrypt), sessão em cookie httpOnly assinado (12 h), limite de
  5 tentativas/15 min, perfis **Administrador, Financeiro, Atendimento, Técnico**
  verificados no servidor em toda página e ação; o técnico não vê custos nem financeiro.
- Layout: menu lateral recolhível (lembra a escolha), cabeçalho com busca global
  **Ctrl/⌘+K**, botão **+** flutuante (OS, orçamento, cliente, equipamento),
  atalhos documentados (`?`), menu de celular.
- Registro de alterações (auditoria) de tudo que é criado, alterado ou excluído.
- Início ("Hoje"): onboarding de 5 passos, atendimentos do dia, faturamento do mês
  com comparação, limpezas vencidas e garantias vencendo com WhatsApp pronto.

**Passo 2 — Cadastros**
- Clientes PF/PJ: CNPJ preenche razão social e endereço (BrasilAPI), CEP preenche
  endereço (BrasilAPI/ViaCEP), vários locais (Maps/Waze) e contatos, etiquetas,
  notas, rascunho automático, busca por nome/telefone/documento/bairro, filtros,
  seleção em massa (etiqueta, exportar, excluir com desfazer), exportação CSV (Excel).
- Equipamentos: ficha completa (tipo, marca, modelo, BTUs, gás, tensão, inverter,
  série, ambiente, local, instalação, garantia), histórico de serviços, régua do
  ciclo de limpeza, convite de limpeza por WhatsApp em 1 clique.
- Tipos de serviço com preço por faixa de BTUs, duração, garantia e retorno sugerido;
  produtos/peças com SKU, código de barras, custo, preço e margem; kits; fornecedores.
- Importação de planilha (.xlsx/.csv) de clientes e produtos: reconhece colunas,
  prévia com erros destacados e correção na própria tabela, duplicados pulados.

Os demais módulos aparecem no menu com "em breve" e uma página explicando o que
vem em cada passo.

## Testes

```bash
npm run typecheck
npm test               # unitários + banco (isolamento entre empresas, filtros, senhas)
npm run test:e2e       # Playwright: build de produção, desktop 1440 px e celular 390 px, WCAG AA (axe) claro e escuro
```

No ambiente com Chromium do Playwright em outro caminho:
`PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e`.

## Estrutura

```
src/app/(app)/…        telas autenticadas (uma pasta por módulo)
src/app/login          login
src/app/api            busca global, CEP/CNPJ, exportação
src/components/ui      componentes base do design system
src/components/<mód.>  componentes de cada módulo
src/server/db          schema Drizzle, migrações, dados de demonstração
src/server/actions     ações do servidor (validação zod + permissão + auditoria)
src/server/queries     consultas (sempre filtradas pela empresa da sessão)
src/lib                formatação pt-BR, CPF/CNPJ, WhatsApp, permissões, importação
```
