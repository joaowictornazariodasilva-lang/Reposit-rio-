"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/server/db";
import { exigirPermissao } from "@/server/auth/session";
import { registrar } from "@/server/audit";
import { documentoValido } from "@/lib/br";
import { soDigitos } from "@/lib/format";
import { errosDeCampo, falha, opcional, type Resultado } from "./resultado";

const digitos = z
  .string()
  .optional()
  .nullable()
  .transform((v) => soDigitos(v) || null);

const fone = digitos.refine((v) => !v || (v.length >= 10 && v.length <= 13), "Telefone com DDD (10 ou 11 dígitos).");

const localSchema = z.object({
  nome: z.string().trim().min(1, "Dê um nome ao local (ex.: Casa, Matriz).").max(80),
  cep: digitos.refine((v) => !v || v.length === 8, "CEP com 8 dígitos."),
  logradouro: opcional,
  numero: opcional,
  complemento: opcional,
  bairro: opcional,
  cidade: opcional,
  uf: opcional.refine((v) => !v || /^[A-Za-z]{2}$/.test(v), "UF com 2 letras."),
  referencia: opcional,
});

const contatoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do contato.").max(120),
  cargo: opcional,
  whatsapp: fone,
  telefone: fone,
  email: opcional.refine((v) => !v || z.email().safeParse(v).success, "E-mail inválido."),
});

const clienteSchema = z.object({
  tipo: z.enum(["pf", "pj"]),
  nome: z.string().trim().min(2, "Informe o nome do cliente.").max(160),
  nomeFantasia: opcional,
  documento: digitos.refine((v) => !v || documentoValido(v), "CPF/CNPJ inválido — confira os dígitos."),
  inscricaoEstadual: opcional,
  email: opcional.refine((v) => !v || z.email().safeParse(v).success, "E-mail inválido."),
  whatsapp: fone,
  telefone: fone,
  origem: opcional,
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      const arr = Array.isArray(v) ? v : (v ?? "").split(",");
      return [...new Set(arr.map((t) => t.trim()).filter(Boolean))].slice(0, 12);
    }),
  notas: z.string().trim().max(4000).optional().nullable().transform((v) => v || null),
});

const novoClienteSchema = clienteSchema.extend({
  local: localSchema.partial({ nome: true }).optional(),
  contato: contatoSchema.partial({ nome: true }).optional(),
});

export type NovoClienteInput = z.input<typeof novoClienteSchema>;

async function documentoDuplicado(empresaId: string, documento: string | null, ignorarId?: string) {
  if (!documento) return null;
  const db = await getDb();
  const c = schema.clientes;
  return db.query.clientes.findFirst({
    where: and(eq(c.empresaId, empresaId), eq(c.documento, documento), isNull(c.excluidoEm), ignorarId ? ne(c.id, ignorarId) : undefined),
    columns: { id: true, nome: true },
  });
}

export async function criarCliente(input: NovoClienteInput): Promise<Resultado<{ id: string }>> {
  try {
    const sessao = await exigirPermissao("clientes.editar");
    const p = novoClienteSchema.safeParse(input);
    if (!p.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosDeCampo(p.error) };
    const { local, contato, ...dados } = p.data;
    const dup = await documentoDuplicado(sessao.empresaId, dados.documento);
    if (dup) return { ok: false, erro: `Já existe um cliente com este documento: ${dup.nome}.`, campos: { documento: "Documento já cadastrado." } };

    const db = await getDb();
    const id = await db.transaction(async (tx) => {
      // Trava por empresa para o código sequencial não colidir em cadastros simultâneos.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"clientes:" + sessao.empresaId}))`);
      const [{ prox } = { prox: 1 }] = await tx
        .select({ prox: sql<number>`coalesce(max(${schema.clientes.codigo}), 0)::int + 1` })
        .from(schema.clientes)
        .where(eq(schema.clientes.empresaId, sessao.empresaId));
      const [c] = await tx.insert(schema.clientes).values({ ...dados, empresaId: sessao.empresaId, codigo: prox }).returning({ id: schema.clientes.id });
      const temLocal = local && (local.cep || local.logradouro || local.bairro || local.cidade);
      if (temLocal) {
        await tx.insert(schema.locais).values({ ...local, nome: local.nome || (dados.tipo === "pj" ? "Matriz" : "Principal"), clienteId: c!.id, principal: true });
      }
      if (dados.tipo === "pj" && contato?.nome) {
        await tx.insert(schema.contatos).values({ ...contato, nome: contato.nome, clienteId: c!.id, principal: true });
      } else if (dados.tipo === "pf") {
        await tx.insert(schema.contatos).values({ clienteId: c!.id, nome: dados.nome, whatsapp: dados.whatsapp, telefone: dados.telefone, email: dados.email, principal: true });
      }
      await registrar(tx, sessao, "cliente", c!.id, "criar", `Cliente ${dados.nome} cadastrado`);
      return c!.id;
    });
    revalidatePath("/clientes");
    revalidatePath("/");
    return { ok: true, id };
  } catch (e) {
    return falha(e);
  }
}

export async function atualizarCliente(id: string, input: z.input<typeof clienteSchema>): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("clientes.editar");
    const p = clienteSchema.safeParse(input);
    if (!p.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosDeCampo(p.error) };
    const dup = await documentoDuplicado(sessao.empresaId, p.data.documento, id);
    if (dup) return { ok: false, erro: `Já existe um cliente com este documento: ${dup.nome}.`, campos: { documento: "Documento já cadastrado." } };
    const db = await getDb();
    const c = schema.clientes;
    const r = await db
      .update(c)
      .set({ ...p.data, atualizadoEm: new Date() })
      .where(and(eq(c.id, id), eq(c.empresaId, sessao.empresaId)))
      .returning({ id: c.id });
    if (!r.length) return { ok: false, erro: "Cliente não encontrado." };
    await registrar(db, sessao, "cliente", id, "editar", `Cliente ${p.data.nome} atualizado`);
    revalidatePath(`/clientes/${id}`);
    revalidatePath("/clientes");
    return { ok: true, id };
  } catch (e) {
    return falha(e);
  }
}

/** Exclusão reversível: some das listas e pode ser desfeita pelo toast. */
export async function excluirClientes(ids: string[]): Promise<Resultado<{ quantidade: number }>> {
  try {
    const sessao = await exigirPermissao("clientes.excluir");
    if (!ids.length) return { ok: true, quantidade: 0 };
    const db = await getDb();
    const c = schema.clientes;
    const r = await db
      .update(c)
      .set({ excluidoEm: new Date() })
      .where(and(eq(c.empresaId, sessao.empresaId), inArray(c.id, ids.slice(0, 500)), isNull(c.excluidoEm)))
      .returning({ id: c.id, nome: c.nome });
    await registrar(db, sessao, "cliente", r.length === 1 ? r[0]!.id : null, "excluir", r.length === 1 ? `Cliente ${r[0]!.nome} excluído` : `${r.length} clientes excluídos`, { ids: r.map((x) => x.id) });
    revalidatePath("/clientes");
    return { ok: true, quantidade: r.length };
  } catch (e) {
    return falha(e);
  }
}

export async function restaurarClientes(ids: string[]): Promise<Resultado<{ quantidade: number }>> {
  try {
    const sessao = await exigirPermissao("clientes.excluir");
    const db = await getDb();
    const c = schema.clientes;
    const r = await db
      .update(c)
      .set({ excluidoEm: null })
      .where(and(eq(c.empresaId, sessao.empresaId), inArray(c.id, ids.slice(0, 500))))
      .returning({ id: c.id });
    await registrar(db, sessao, "cliente", null, "restaurar", `${r.length} cliente(s) restaurado(s)`, { ids });
    revalidatePath("/clientes");
    return { ok: true, quantidade: r.length };
  } catch (e) {
    return falha(e);
  }
}

export async function adicionarTag(ids: string[], tag: string): Promise<Resultado<{ quantidade: number }>> {
  try {
    const sessao = await exigirPermissao("clientes.editar");
    const t = tag.trim().slice(0, 40);
    if (!t) return { ok: false, erro: "Digite a etiqueta." };
    const db = await getDb();
    const c = schema.clientes;
    const r = await db
      .update(c)
      .set({ tags: sql`array(select distinct unnest(array_append(${c.tags}, ${t})))` })
      .where(and(eq(c.empresaId, sessao.empresaId), inArray(c.id, ids.slice(0, 500))))
      .returning({ id: c.id });
    await registrar(db, sessao, "cliente", null, "editar", `Etiqueta "${t}" adicionada a ${r.length} cliente(s)`);
    revalidatePath("/clientes");
    return { ok: true, quantidade: r.length };
  } catch (e) {
    return falha(e);
  }
}

async function clienteDaEmpresa(clienteId: string, empresaId: string) {
  const db = await getDb();
  return db.query.clientes.findFirst({ where: and(eq(schema.clientes.id, clienteId), eq(schema.clientes.empresaId, empresaId)), columns: { id: true, nome: true } });
}

export async function salvarLocal(clienteId: string, localId: string | null, input: z.input<typeof localSchema>): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("clientes.editar");
    const p = localSchema.safeParse(input);
    if (!p.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosDeCampo(p.error) };
    if (!(await clienteDaEmpresa(clienteId, sessao.empresaId))) return { ok: false, erro: "Cliente não encontrado." };
    const db = await getDb();
    let id = localId;
    if (localId) {
      await db.update(schema.locais).set(p.data).where(and(eq(schema.locais.id, localId), eq(schema.locais.clienteId, clienteId)));
    } else {
      const existentes = await db.$count(schema.locais, eq(schema.locais.clienteId, clienteId));
      const [l] = await db.insert(schema.locais).values({ ...p.data, clienteId, principal: existentes === 0 }).returning({ id: schema.locais.id });
      id = l!.id;
    }
    await registrar(db, sessao, "local", id, localId ? "editar" : "criar", `Local "${p.data.nome}" ${localId ? "atualizado" : "adicionado"}`);
    revalidatePath(`/clientes/${clienteId}`);
    return { ok: true, id: id! };
  } catch (e) {
    return falha(e);
  }
}

export async function removerLocal(clienteId: string, localId: string): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("clientes.editar");
    if (!(await clienteDaEmpresa(clienteId, sessao.empresaId))) return { ok: false, erro: "Cliente não encontrado." };
    const db = await getDb();
    const emUso = await db.$count(schema.equipamentos, and(eq(schema.equipamentos.localId, localId), isNull(schema.equipamentos.excluidoEm)));
    if (emUso) return { ok: false, erro: `Este local tem ${emUso} aparelho(s). Mova-os para outro local antes de remover.` };
    await db.delete(schema.locais).where(and(eq(schema.locais.id, localId), eq(schema.locais.clienteId, clienteId)));
    await registrar(db, sessao, "local", localId, "excluir", "Local removido");
    revalidatePath(`/clientes/${clienteId}`);
    return { ok: true, id: localId };
  } catch (e) {
    return falha(e);
  }
}

export async function salvarContato(clienteId: string, contatoId: string | null, input: z.input<typeof contatoSchema>): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("clientes.editar");
    const p = contatoSchema.safeParse(input);
    if (!p.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosDeCampo(p.error) };
    if (!(await clienteDaEmpresa(clienteId, sessao.empresaId))) return { ok: false, erro: "Cliente não encontrado." };
    const db = await getDb();
    let id = contatoId;
    if (contatoId) await db.update(schema.contatos).set(p.data).where(and(eq(schema.contatos.id, contatoId), eq(schema.contatos.clienteId, clienteId)));
    else {
      const [c] = await db.insert(schema.contatos).values({ ...p.data, clienteId }).returning({ id: schema.contatos.id });
      id = c!.id;
    }
    await registrar(db, sessao, "contato", id, contatoId ? "editar" : "criar", `Contato ${p.data.nome} salvo`);
    revalidatePath(`/clientes/${clienteId}`);
    return { ok: true, id: id! };
  } catch (e) {
    return falha(e);
  }
}

export async function removerContato(clienteId: string, contatoId: string): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("clientes.editar");
    if (!(await clienteDaEmpresa(clienteId, sessao.empresaId))) return { ok: false, erro: "Cliente não encontrado." };
    const db = await getDb();
    await db.delete(schema.contatos).where(and(eq(schema.contatos.id, contatoId), eq(schema.contatos.clienteId, clienteId)));
    await registrar(db, sessao, "contato", contatoId, "excluir", "Contato removido");
    revalidatePath(`/clientes/${clienteId}`);
    return { ok: true, id: contatoId };
  } catch (e) {
    return falha(e);
  }
}

/** Locais de um cliente — usado pelo painel de novo equipamento. */
export async function locaisDoCliente(clienteId: string) {
  const sessao = await exigirPermissao("equipamentos.ver");
  if (!(await clienteDaEmpresa(clienteId, sessao.empresaId))) return [];
  const db = await getDb();
  return db
    .select({ id: schema.locais.id, nome: schema.locais.nome, bairro: schema.locais.bairro, logradouro: schema.locais.logradouro, numero: schema.locais.numero })
    .from(schema.locais)
    .where(eq(schema.locais.clienteId, clienteId))
    .orderBy(sql`${schema.locais.principal} desc`, schema.locais.nome);
}

export async function nomeDoCliente(clienteId: string): Promise<string | null> {
  const sessao = await exigirPermissao("equipamentos.ver");
  const db = await getDb();
  const c = await db.query.clientes.findFirst({ where: and(eq(schema.clientes.id, clienteId), eq(schema.clientes.empresaId, sessao.empresaId)), columns: { nome: true, nomeFantasia: true } });
  return c ? (c.nomeFantasia ?? c.nome) : null;
}
