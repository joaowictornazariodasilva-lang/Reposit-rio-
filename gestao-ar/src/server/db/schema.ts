import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/*
 * Modelo de dados — Passos 1 e 2 (fundação + cadastros) e a OS mínima que
 * alimenta o histórico dos aparelhos. Toda tabela de negócio tem empresa_id:
 * as consultas sempre filtram pela empresa da sessão (e, no Supabase, a mesma
 * coluna sustenta as políticas de RLS).
 */

const id = () => uuid("id").primaryKey().defaultRandom();
const criadoEm = () => timestamp("criado_em", { withTimezone: true }).notNull().defaultNow();
const atualizadoEm = () => timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow();
const dinheiro = (nome: string) => numeric(nome, { precision: 12, scale: 2, mode: "number" });

export const perfilEnum = pgEnum("perfil", ["admin", "financeiro", "atendimento", "tecnico"]);
export const tipoPessoaEnum = pgEnum("tipo_pessoa", ["pf", "pj"]);
export const tipoEquipamentoEnum = pgEnum("tipo_equipamento", [
  "split",
  "cassete",
  "piso_teto",
  "vrf",
  "janela",
  "multi_split",
  "portatil",
  "duto",
]);
export const categoriaServicoEnum = pgEnum("categoria_servico", [
  "instalacao",
  "desinstalacao",
  "preventiva",
  "corretiva",
  "higienizacao",
  "carga_gas",
  "visita_tecnica",
  "pmoc",
  "venda_equipamento",
  "outro",
]);
export const statusOsEnum = pgEnum("status_os", [
  "aberta",
  "agendada",
  "em_deslocamento",
  "em_execucao",
  "aguardando_peca",
  "aguardando_aprovacao",
  "concluida",
  "faturada",
  "cancelada",
]);

export const empresas = pgTable("empresas", {
  id: id(),
  nome: text("nome").notNull(),
  razaoSocial: text("razao_social"),
  cnpj: text("cnpj"),
  telefone: text("telefone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  endereco: text("endereco"),
  cidade: text("cidade"),
  uf: text("uf"),
  /** Logo em data URL (PNG/SVG/JPG até 200 KB) — vai para o bucket no Passo 7. */
  logo: text("logo"),
  fuso: text("fuso").notNull().default("America/Fortaleza"),
  /** Passos do onboarding já concluídos ou dispensados. */
  onboarding: jsonb("onboarding").$type<string[]>().notNull().default([]),
  criadoEm: criadoEm(),
});

export const usuarios = pgTable(
  "usuarios",
  {
    id: id(),
    empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    senhaHash: text("senha_hash").notNull(),
    perfil: perfilEnum("perfil").notNull(),
    telefone: text("telefone"),
    /** Cor do técnico na agenda. */
    cor: text("cor"),
    comissaoPct: numeric("comissao_pct", { precision: 5, scale: 2, mode: "number" }).notNull().default(0),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: criadoEm(),
  },
  (t) => [uniqueIndex("usuarios_email_uq").on(t.email)],
);

export const clientes = pgTable(
  "clientes",
  {
    id: id(),
    empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
    codigo: integer("codigo").notNull(),
    tipo: tipoPessoaEnum("tipo").notNull().default("pf"),
    nome: text("nome").notNull(),
    nomeFantasia: text("nome_fantasia"),
    documento: text("documento"),
    inscricaoEstadual: text("inscricao_estadual"),
    email: text("email"),
    telefone: text("telefone"),
    whatsapp: text("whatsapp"),
    origem: text("origem"),
    tags: text("tags").array().notNull().default([]),
    notas: text("notas"),
    criadoEm: criadoEm(),
    atualizadoEm: atualizadoEm(),
    excluidoEm: timestamp("excluido_em", { withTimezone: true }),
  },
  (t) => [
    index("clientes_empresa_idx").on(t.empresaId),
    uniqueIndex("clientes_codigo_uq").on(t.empresaId, t.codigo),
  ],
);

export const contatos = pgTable(
  "contatos",
  {
    id: id(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    cargo: text("cargo"),
    telefone: text("telefone"),
    whatsapp: text("whatsapp"),
    email: text("email"),
    principal: boolean("principal").notNull().default(false),
  },
  (t) => [index("contatos_cliente_idx").on(t.clienteId)],
);

export const locais = pgTable(
  "locais",
  {
    id: id(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    cep: text("cep"),
    logradouro: text("logradouro"),
    numero: text("numero"),
    complemento: text("complemento"),
    bairro: text("bairro"),
    cidade: text("cidade"),
    uf: text("uf"),
    referencia: text("referencia"),
    principal: boolean("principal").notNull().default(false),
  },
  (t) => [index("locais_cliente_idx").on(t.clienteId)],
);

export const equipamentos = pgTable(
  "equipamentos",
  {
    id: id(),
    empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    localId: uuid("local_id").references(() => locais.id, { onDelete: "set null" }),
    tipo: tipoEquipamentoEnum("tipo").notNull(),
    marca: text("marca").notNull(),
    modelo: text("modelo"),
    btus: integer("btus").notNull(),
    gas: text("gas"),
    tensao: text("tensao"),
    inverter: boolean("inverter").notNull().default(false),
    numeroSerie: text("numero_serie"),
    /** Cômodo / ambiente onde está instalado (ex.: "Quarto do casal"). */
    ambiente: text("ambiente"),
    dataInstalacao: date("data_instalacao"),
    garantiaAte: date("garantia_ate"),
    instaladoPorNos: boolean("instalado_por_nos").notNull().default(false),
    observacoes: text("observacoes"),
    criadoEm: criadoEm(),
    excluidoEm: timestamp("excluido_em", { withTimezone: true }),
  },
  (t) => [index("equipamentos_cliente_idx").on(t.clienteId), index("equipamentos_empresa_idx").on(t.empresaId)],
);

export type VariacaoPreco = { btusAte: number; preco: number };

export const tiposServico = pgTable("tipos_servico", {
  id: id(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  nome: text("nome").notNull(),
  categoria: categoriaServicoEnum("categoria").notNull(),
  descricao: text("descricao"),
  precoPadrao: dinheiro("preco_padrao").notNull().default(0),
  /** Preço por faixa de BTUs (ex.: limpeza até 12.000 / até 18.000 …). */
  variacoes: jsonb("variacoes").$type<VariacaoPreco[]>().notNull().default([]),
  duracaoMin: integer("duracao_min").notNull().default(60),
  garantiaDias: integer("garantia_dias").notNull().default(90),
  /** Sugere o próximo atendimento N meses depois (preventiva/limpeza). */
  recorrenciaMeses: integer("recorrencia_meses"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: criadoEm(),
});

export const categorias = pgTable("categorias", {
  id: id(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  nome: text("nome").notNull(),
});

export const fornecedores = pgTable("fornecedores", {
  id: id(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  nome: text("nome").notNull(),
  documento: text("documento"),
  contato: text("contato"),
  telefone: text("telefone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  prazoEntregaDias: integer("prazo_entrega_dias"),
  notas: text("notas"),
  criadoEm: criadoEm(),
  excluidoEm: timestamp("excluido_em", { withTimezone: true }),
});

export const produtos = pgTable(
  "produtos",
  {
    id: id(),
    empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
    categoriaId: uuid("categoria_id").references(() => categorias.id, { onDelete: "set null" }),
    fornecedorId: uuid("fornecedor_id").references(() => fornecedores.id, { onDelete: "set null" }),
    nome: text("nome").notNull(),
    sku: text("sku"),
    codigoBarras: text("codigo_barras"),
    unidade: text("unidade").notNull().default("un"),
    custo: dinheiro("custo").notNull().default(0),
    preco: dinheiro("preco").notNull().default(0),
    estoqueMinimo: numeric("estoque_minimo", { precision: 12, scale: 3, mode: "number" }).notNull().default(0),
    favorito: boolean("favorito").notNull().default(false),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: criadoEm(),
    excluidoEm: timestamp("excluido_em", { withTimezone: true }),
  },
  (t) => [index("produtos_empresa_idx").on(t.empresaId)],
);

export const kits = pgTable("kits", {
  id: id(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  favorito: boolean("favorito").notNull().default(true),
  criadoEm: criadoEm(),
  excluidoEm: timestamp("excluido_em", { withTimezone: true }),
});

export const kitItens = pgTable("kit_itens", {
  id: id(),
  kitId: uuid("kit_id")
    .notNull()
    .references(() => kits.id, { onDelete: "cascade" }),
  tipoServicoId: uuid("tipo_servico_id").references(() => tiposServico.id, { onDelete: "cascade" }),
  produtoId: uuid("produto_id").references(() => produtos.id, { onDelete: "cascade" }),
  quantidade: numeric("quantidade", { precision: 12, scale: 3, mode: "number" }).notNull().default(1),
  /** Preço no kit; nulo = usa o preço do cadastro. */
  precoUnitario: dinheiro("preco_unitario"),
});

/** OS mínima: base do histórico dos aparelhos. A tela completa chega no Passo 3. */
export const ordensServico = pgTable(
  "ordens_servico",
  {
    id: id(),
    empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
    numero: integer("numero").notNull(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clientes.id),
    localId: uuid("local_id").references(() => locais.id, { onDelete: "set null" }),
    equipamentoId: uuid("equipamento_id").references(() => equipamentos.id, { onDelete: "set null" }),
    tipoServicoId: uuid("tipo_servico_id").references(() => tiposServico.id, { onDelete: "set null" }),
    tecnicoId: uuid("tecnico_id").references(() => usuarios.id, { onDelete: "set null" }),
    status: statusOsEnum("status").notNull().default("aberta"),
    descricao: text("descricao"),
    abertaEm: timestamp("aberta_em", { withTimezone: true }).notNull().defaultNow(),
    agendadaPara: timestamp("agendada_para", { withTimezone: true }),
    concluidaEm: timestamp("concluida_em", { withTimezone: true }),
    valorTotal: dinheiro("valor_total").notNull().default(0),
    ehRetorno: boolean("eh_retorno").notNull().default(false),
  },
  (t) => [
    uniqueIndex("os_numero_uq").on(t.empresaId, t.numero),
    index("os_equipamento_idx").on(t.equipamentoId),
    index("os_cliente_idx").on(t.clienteId),
  ],
);

export const auditoria = pgTable(
  "auditoria",
  {
    id: id(),
    empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
    usuarioId: uuid("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
    entidade: text("entidade").notNull(),
    entidadeId: text("entidade_id"),
    acao: text("acao").notNull(),
    resumo: text("resumo"),
    dados: jsonb("dados"),
    criadoEm: criadoEm(),
  },
  (t) => [index("auditoria_empresa_idx").on(t.empresaId, t.criadoEm)],
);

/** Tentativas de login (limite por e-mail/IP). */
export const tentativasLogin = pgTable(
  "tentativas_login",
  {
    id: id(),
    chave: text("chave").notNull(),
    criadoEm: criadoEm(),
  },
  (t) => [index("tentativas_chave_idx").on(t.chave, t.criadoEm)],
);

export type Perfil = (typeof perfilEnum.enumValues)[number];
export type TipoEquipamento = (typeof tipoEquipamentoEnum.enumValues)[number];
export type CategoriaServico = (typeof categoriaServicoEnum.enumValues)[number];
export type StatusOs = (typeof statusOsEnum.enumValues)[number];
