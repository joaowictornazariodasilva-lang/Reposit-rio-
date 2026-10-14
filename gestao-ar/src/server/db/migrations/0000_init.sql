CREATE TYPE "public"."categoria_servico" AS ENUM('instalacao', 'desinstalacao', 'preventiva', 'corretiva', 'higienizacao', 'carga_gas', 'visita_tecnica', 'pmoc', 'venda_equipamento', 'outro');--> statement-breakpoint
CREATE TYPE "public"."perfil" AS ENUM('admin', 'financeiro', 'atendimento', 'tecnico');--> statement-breakpoint
CREATE TYPE "public"."status_os" AS ENUM('aberta', 'agendada', 'em_deslocamento', 'em_execucao', 'aguardando_peca', 'aguardando_aprovacao', 'concluida', 'faturada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."tipo_equipamento" AS ENUM('split', 'cassete', 'piso_teto', 'vrf', 'janela', 'multi_split', 'portatil', 'duto');--> statement-breakpoint
CREATE TYPE "public"."tipo_pessoa" AS ENUM('pf', 'pj');--> statement-breakpoint
CREATE TABLE "auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"usuario_id" uuid,
	"entidade" text NOT NULL,
	"entidade_id" text,
	"acao" text NOT NULL,
	"resumo" text,
	"dados" jsonb,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nome" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"codigo" integer NOT NULL,
	"tipo" "tipo_pessoa" DEFAULT 'pf' NOT NULL,
	"nome" text NOT NULL,
	"nome_fantasia" text,
	"documento" text,
	"inscricao_estadual" text,
	"email" text,
	"telefone" text,
	"whatsapp" text,
	"origem" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"notas" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"excluido_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contatos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"cargo" text,
	"telefone" text,
	"whatsapp" text,
	"email" text,
	"principal" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "empresas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"razao_social" text,
	"cnpj" text,
	"telefone" text,
	"whatsapp" text,
	"email" text,
	"endereco" text,
	"cidade" text,
	"uf" text,
	"logo" text,
	"fuso" text DEFAULT 'America/Fortaleza' NOT NULL,
	"onboarding" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"local_id" uuid,
	"tipo" "tipo_equipamento" NOT NULL,
	"marca" text NOT NULL,
	"modelo" text,
	"btus" integer NOT NULL,
	"gas" text,
	"tensao" text,
	"inverter" boolean DEFAULT false NOT NULL,
	"numero_serie" text,
	"ambiente" text,
	"data_instalacao" date,
	"garantia_ate" date,
	"instalado_por_nos" boolean DEFAULT false NOT NULL,
	"observacoes" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"excluido_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fornecedores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"documento" text,
	"contato" text,
	"telefone" text,
	"whatsapp" text,
	"email" text,
	"prazo_entrega_dias" integer,
	"notas" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"excluido_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "kit_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kit_id" uuid NOT NULL,
	"tipo_servico_id" uuid,
	"produto_id" uuid,
	"quantidade" numeric(12, 3) DEFAULT 1 NOT NULL,
	"preco_unitario" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "kits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"favorito" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"excluido_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "locais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"cep" text,
	"logradouro" text,
	"numero" text,
	"complemento" text,
	"bairro" text,
	"cidade" text,
	"uf" text,
	"referencia" text,
	"principal" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ordens_servico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"numero" integer NOT NULL,
	"cliente_id" uuid NOT NULL,
	"local_id" uuid,
	"equipamento_id" uuid,
	"tipo_servico_id" uuid,
	"tecnico_id" uuid,
	"status" "status_os" DEFAULT 'aberta' NOT NULL,
	"descricao" text,
	"aberta_em" timestamp with time zone DEFAULT now() NOT NULL,
	"agendada_para" timestamp with time zone,
	"concluida_em" timestamp with time zone,
	"valor_total" numeric(12, 2) DEFAULT 0 NOT NULL,
	"eh_retorno" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"categoria_id" uuid,
	"fornecedor_id" uuid,
	"nome" text NOT NULL,
	"sku" text,
	"codigo_barras" text,
	"unidade" text DEFAULT 'un' NOT NULL,
	"custo" numeric(12, 2) DEFAULT 0 NOT NULL,
	"preco" numeric(12, 2) DEFAULT 0 NOT NULL,
	"estoque_minimo" numeric(12, 3) DEFAULT 0 NOT NULL,
	"favorito" boolean DEFAULT false NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"excluido_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tentativas_login" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chave" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tipos_servico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"categoria" "categoria_servico" NOT NULL,
	"descricao" text,
	"preco_padrao" numeric(12, 2) DEFAULT 0 NOT NULL,
	"variacoes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"duracao_min" integer DEFAULT 60 NOT NULL,
	"garantia_dias" integer DEFAULT 90 NOT NULL,
	"recorrencia_meses" integer,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"perfil" "perfil" NOT NULL,
	"telefone" text,
	"cor" text,
	"comissao_pct" numeric(5, 2) DEFAULT 0 NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contatos" ADD CONSTRAINT "contatos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_local_id_locais_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."locais"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kit_itens" ADD CONSTRAINT "kit_itens_kit_id_kits_id_fk" FOREIGN KEY ("kit_id") REFERENCES "public"."kits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kit_itens" ADD CONSTRAINT "kit_itens_tipo_servico_id_tipos_servico_id_fk" FOREIGN KEY ("tipo_servico_id") REFERENCES "public"."tipos_servico"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kit_itens" ADD CONSTRAINT "kit_itens_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kits" ADD CONSTRAINT "kits_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locais" ADD CONSTRAINT "locais_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_local_id_locais_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."locais"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_equipamento_id_equipamentos_id_fk" FOREIGN KEY ("equipamento_id") REFERENCES "public"."equipamentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_tipo_servico_id_tipos_servico_id_fk" FOREIGN KEY ("tipo_servico_id") REFERENCES "public"."tipos_servico"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_tecnico_id_usuarios_id_fk" FOREIGN KEY ("tecnico_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tipos_servico" ADD CONSTRAINT "tipos_servico_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auditoria_empresa_idx" ON "auditoria" USING btree ("empresa_id","criado_em");--> statement-breakpoint
CREATE INDEX "clientes_empresa_idx" ON "clientes" USING btree ("empresa_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clientes_codigo_uq" ON "clientes" USING btree ("empresa_id","codigo");--> statement-breakpoint
CREATE INDEX "contatos_cliente_idx" ON "contatos" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "equipamentos_cliente_idx" ON "equipamentos" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "equipamentos_empresa_idx" ON "equipamentos" USING btree ("empresa_id");--> statement-breakpoint
CREATE INDEX "locais_cliente_idx" ON "locais" USING btree ("cliente_id");--> statement-breakpoint
CREATE UNIQUE INDEX "os_numero_uq" ON "ordens_servico" USING btree ("empresa_id","numero");--> statement-breakpoint
CREATE INDEX "os_equipamento_idx" ON "ordens_servico" USING btree ("equipamento_id");--> statement-breakpoint
CREATE INDEX "os_cliente_idx" ON "ordens_servico" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "produtos_empresa_idx" ON "produtos" USING btree ("empresa_id");--> statement-breakpoint
CREATE INDEX "tentativas_chave_idx" ON "tentativas_login" USING btree ("chave","criado_em");--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_email_uq" ON "usuarios" USING btree ("email");