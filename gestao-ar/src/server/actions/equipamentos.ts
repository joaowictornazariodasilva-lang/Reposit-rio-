"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/server/db";
import { exigirPermissao } from "@/server/auth/session";
import { registrar } from "@/server/audit";
import { errosDeCampo, falha, opcional, type Resultado } from "./resultado";

const dataOpcional = z
  .string()
  .optional()
  .nullable()
  .transform((v) => v || null)
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data inválida.");

const equipamentoSchema = z
  .object({
    clienteId: z.uuid("Escolha o cliente."),
    localId: z.uuid().optional().nullable().or(z.literal("")).transform((v) => v || null),
    tipo: z.enum(schema.tipoEquipamentoEnum.enumValues, { message: "Escolha o tipo." }),
    marca: z.string().trim().min(1, "Informe a marca.").max(60),
    modelo: opcional,
    btus: z.coerce.number({ message: "Informe os BTUs." }).int().min(5000, "BTUs entre 5.000 e 500.000.").max(500000, "BTUs entre 5.000 e 500.000."),
    gas: opcional,
    tensao: opcional,
    inverter: z.boolean().default(false),
    numeroSerie: opcional,
    ambiente: opcional,
    dataInstalacao: dataOpcional,
    garantiaAte: dataOpcional,
    instaladoPorNos: z.boolean().default(false),
    observacoes: z.string().trim().max(2000).optional().nullable().transform((v) => v || null),
  })
  .refine((d) => !d.dataInstalacao || !d.garantiaAte || d.garantiaAte >= d.dataInstalacao, { path: ["garantiaAte"], message: "A garantia não pode terminar antes da instalação." });

export type EquipamentoInput = z.input<typeof equipamentoSchema>;

export async function salvarEquipamento(id: string | null, input: EquipamentoInput): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("equipamentos.editar");
    const p = equipamentoSchema.safeParse(input);
    if (!p.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosDeCampo(p.error) };
    const db = await getDb();
    const cliente = await db.query.clientes.findFirst({
      where: and(eq(schema.clientes.id, p.data.clienteId), eq(schema.clientes.empresaId, sessao.empresaId), isNull(schema.clientes.excluidoEm)),
      columns: { id: true },
    });
    if (!cliente) return { ok: false, erro: "Cliente não encontrado.", campos: { clienteId: "Escolha o cliente." } };
    if (p.data.localId) {
      const local = await db.query.locais.findFirst({ where: and(eq(schema.locais.id, p.data.localId), eq(schema.locais.clienteId, p.data.clienteId)), columns: { id: true } });
      if (!local) return { ok: false, erro: "Local não pertence a este cliente.", campos: { localId: "Escolha um local do cliente." } };
    }
    const resumo = `${p.data.marca} ${p.data.btus.toLocaleString("pt-BR")} BTUs`;
    let novoId = id;
    if (id) {
      const r = await db
        .update(schema.equipamentos)
        .set(p.data)
        .where(and(eq(schema.equipamentos.id, id), eq(schema.equipamentos.empresaId, sessao.empresaId)))
        .returning({ id: schema.equipamentos.id });
      if (!r.length) return { ok: false, erro: "Equipamento não encontrado." };
    } else {
      const [e] = await db.insert(schema.equipamentos).values({ ...p.data, empresaId: sessao.empresaId }).returning({ id: schema.equipamentos.id });
      novoId = e!.id;
    }
    await registrar(db, sessao, "equipamento", novoId, id ? "editar" : "criar", `${resumo} ${id ? "atualizado" : "cadastrado"}`);
    revalidatePath(`/clientes/${p.data.clienteId}`);
    revalidatePath("/equipamentos");
    return { ok: true, id: novoId! };
  } catch (e) {
    return falha(e);
  }
}

export async function excluirEquipamento(id: string, desfazer = false): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("equipamentos.editar");
    const db = await getDb();
    const r = await db
      .update(schema.equipamentos)
      .set({ excluidoEm: desfazer ? null : new Date() })
      .where(and(eq(schema.equipamentos.id, id), eq(schema.equipamentos.empresaId, sessao.empresaId)))
      .returning({ id: schema.equipamentos.id, clienteId: schema.equipamentos.clienteId, marca: schema.equipamentos.marca });
    if (!r.length) return { ok: false, erro: "Equipamento não encontrado." };
    await registrar(db, sessao, "equipamento", id, desfazer ? "restaurar" : "excluir", `${r[0]!.marca} ${desfazer ? "restaurado" : "excluído"}`);
    revalidatePath(`/clientes/${r[0]!.clienteId}`);
    revalidatePath("/equipamentos");
    return { ok: true, id };
  } catch (e) {
    return falha(e);
  }
}
