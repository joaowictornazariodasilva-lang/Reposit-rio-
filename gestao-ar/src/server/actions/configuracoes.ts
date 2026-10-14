"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/server/db";
import { exigirPermissao } from "@/server/auth/session";
import { hashSenha } from "@/server/auth/password";
import { registrar } from "@/server/audit";
import { soDigitos } from "@/lib/format";
import { cnpjValido } from "@/lib/br";
import { errosDeCampo, falha, opcional, type Resultado } from "./resultado";

const empresaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da empresa.").max(80),
  razaoSocial: opcional,
  cnpj: z.string().optional().nullable().transform((v) => soDigitos(v) || null).refine((v) => !v || cnpjValido(v), "CNPJ inválido."),
  telefone: z.string().optional().nullable().transform((v) => soDigitos(v) || null),
  whatsapp: z.string().optional().nullable().transform((v) => soDigitos(v) || null),
  email: opcional.refine((v) => !v || z.email().safeParse(v).success, "E-mail inválido."),
  endereco: opcional,
  cidade: opcional,
  uf: opcional,
  logo: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || /^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(v), "Logo deve ser PNG, JPG, WEBP ou SVG.")
    .refine((v) => !v || v.length < 280_000, "Logo muito grande (máx. 200 KB)."),
});
export type EmpresaInput = z.input<typeof empresaSchema>;

export async function salvarEmpresa(input: EmpresaInput): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("empresa.configurar");
    const p = empresaSchema.safeParse(input);
    if (!p.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosDeCampo(p.error) };
    const db = await getDb();
    const atual = await db.query.empresas.findFirst({ where: eq(schema.empresas.id, sessao.empresaId) });
    const passos = new Set(atual?.onboarding ?? []);
    passos.add("empresa");
    if (p.data.logo) passos.add("logo");
    await db.update(schema.empresas).set({ ...p.data, onboarding: [...passos] }).where(eq(schema.empresas.id, sessao.empresaId));
    await registrar(db, sessao, "empresa", sessao.empresaId, "editar", "Dados da empresa atualizados");
    revalidatePath("/", "layout");
    return { ok: true, id: sessao.empresaId };
  } catch (e) {
    return falha(e);
  }
}

export async function marcarOnboarding(passo: string, feito = true): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("empresa.configurar");
    const db = await getDb();
    const atual = await db.query.empresas.findFirst({ where: eq(schema.empresas.id, sessao.empresaId) });
    const s = new Set(atual?.onboarding ?? []);
    if (feito) s.add(passo);
    else s.delete(passo);
    await db.update(schema.empresas).set({ onboarding: [...s] }).where(eq(schema.empresas.id, sessao.empresaId));
    revalidatePath("/");
    return { ok: true, id: passo };
  } catch (e) {
    return falha(e);
  }
}

const usuarioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido.")),
  perfil: z.enum(schema.perfilEnum.enumValues),
  telefone: z.string().optional().nullable().transform((v) => soDigitos(v) || null),
  comissaoPct: z.coerce.number().min(0).max(100).default(0),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  senha: z.string().optional().transform((v) => v || undefined).refine((v) => !v || v.length >= 8, "A senha precisa de ao menos 8 caracteres."),
  ativo: z.boolean().default(true),
});
export type UsuarioInput = z.input<typeof usuarioSchema>;

export async function salvarUsuario(id: string | null, input: UsuarioInput): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("equipe.gerenciar");
    const p = usuarioSchema.safeParse(input);
    if (!p.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosDeCampo(p.error) };
    const { senha, ...dados } = p.data;
    if (!id && !senha) return { ok: false, erro: "Defina uma senha inicial.", campos: { senha: "Obrigatória para novo usuário." } };
    if (id === sessao.usuarioId && (dados.perfil !== "admin" || !dados.ativo)) return { ok: false, erro: "Você não pode tirar seu próprio acesso de administrador." };
    const db = await getDb();
    const dono = await db.query.usuarios.findFirst({ where: and(eq(schema.usuarios.email, dados.email), id ? ne(schema.usuarios.id, id) : undefined), columns: { id: true } });
    if (dono) return { ok: false, erro: "Já existe um usuário com este e-mail.", campos: { email: "E-mail em uso." } };
    const valores = { ...dados, ...(senha ? { senhaHash: await hashSenha(senha) } : {}) };
    let novo = id;
    if (id) {
      const r = await db.update(schema.usuarios).set(valores).where(and(eq(schema.usuarios.id, id), eq(schema.usuarios.empresaId, sessao.empresaId))).returning({ id: schema.usuarios.id });
      if (!r.length) return { ok: false, erro: "Usuário não encontrado." };
    } else {
      const [u] = await db.insert(schema.usuarios).values({ ...valores, senhaHash: valores.senhaHash!, empresaId: sessao.empresaId }).returning({ id: schema.usuarios.id });
      novo = u!.id;
      await marcarOnboarding("equipe");
    }
    await registrar(db, sessao, "usuario", novo, id ? "editar" : "criar", `Usuário ${dados.nome} (${dados.perfil}) ${id ? "atualizado" : "criado"}`);
    revalidatePath("/configuracoes");
    return { ok: true, id: novo! };
  } catch (e) {
    return falha(e);
  }
}
