"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import { exigirPermissao } from "@/server/auth/session";
import { registrar } from "@/server/audit";
import { validarLinha, type Entidade } from "@/lib/importacao";
import { falha, type Resultado } from "./resultado";

export type ResumoImportacao = { importados: number; ignorados: { linha: number; motivo: string }[] };

/** Recebe as linhas já mapeadas pelo navegador, valida de novo e grava. Duplicados são pulados. */
export async function importarLinhas(entidade: Entidade, linhas: { linha: number; valores: Record<string, unknown> }[]): Promise<Resultado<ResumoImportacao>> {
  try {
    const sessao = await exigirPermissao("importar");
    if (entidade === "produtos") await exigirPermissao("cadastros.editar");
    if (linhas.length > 1000) return { ok: false, erro: "Envie no máximo 1.000 linhas por vez." };
    const db = await getDb();
    const ignorados: ResumoImportacao["ignorados"] = [];
    const validas = linhas.flatMap((l) => {
      const v = validarLinha(entidade, l.valores);
      const erros = Object.values(v.erros);
      if (erros.length) {
        ignorados.push({ linha: l.linha, motivo: erros.join("; ") });
        return [];
      }
      return [{ linha: l.linha, dados: v.dados }];
    });

    let importados = 0;
    await db.transaction(async (tx) => {
      if (entidade === "clientes") {
        const docs = validas.map((v) => v.dados.documento as string | null).filter((d): d is string => !!d);
        const existentes = new Set(
          docs.length
            ? (await tx.select({ d: schema.clientes.documento }).from(schema.clientes).where(and(eq(schema.clientes.empresaId, sessao.empresaId), isNull(schema.clientes.excluidoEm), inArray(schema.clientes.documento, docs)))).map((r) => r.d)
            : [],
        );
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"clientes:" + sessao.empresaId}))`);
        const [{ prox } = { prox: 1 }] = await tx.select({ prox: sql<number>`coalesce(max(${schema.clientes.codigo}), 0)::int + 1` }).from(schema.clientes).where(eq(schema.clientes.empresaId, sessao.empresaId));
        let codigo = prox;
        const vistos = new Set<string>();
        for (const { linha, dados: d } of validas) {
          const doc = d.documento as string | null;
          if (doc && (existentes.has(doc) || vistos.has(doc))) {
            ignorados.push({ linha, motivo: "CPF/CNPJ já cadastrado" });
            continue;
          }
          if (doc) vistos.add(doc);
          const [c] = await tx
            .insert(schema.clientes)
            .values({
              empresaId: sessao.empresaId,
              codigo: codigo++,
              tipo: d.tipo as "pf" | "pj",
              nome: d.nome as string,
              nomeFantasia: d.nomeFantasia as string | null,
              documento: doc,
              whatsapp: d.whatsapp as string | null,
              telefone: d.telefone as string | null,
              email: d.email as string | null,
              tags: d.tags as string[],
              notas: d.notas as string | null,
              origem: "Importação",
            })
            .returning({ id: schema.clientes.id });
          if (d.cep || d.logradouro || d.bairro || d.cidade) {
            await tx.insert(schema.locais).values({
              clienteId: c!.id,
              nome: d.tipo === "pj" ? "Matriz" : "Principal",
              cep: d.cep as string | null,
              logradouro: d.logradouro as string | null,
              numero: d.numero as string | null,
              complemento: d.complemento as string | null,
              bairro: d.bairro as string | null,
              cidade: d.cidade as string | null,
              uf: d.uf as string | null,
              principal: true,
            });
          }
          if (d.whatsapp || d.email || d.telefone) {
            await tx.insert(schema.contatos).values({ clienteId: c!.id, nome: (d.nomeFantasia as string | null) ?? (d.nome as string), whatsapp: d.whatsapp as string | null, telefone: d.telefone as string | null, email: d.email as string | null, principal: true });
          }
          importados++;
        }
      } else {
        const cats = new Map((await tx.select().from(schema.categorias).where(eq(schema.categorias.empresaId, sessao.empresaId))).map((c) => [c.nome.toLowerCase(), c.id]));
        const forns = new Map((await tx.select().from(schema.fornecedores).where(and(eq(schema.fornecedores.empresaId, sessao.empresaId), isNull(schema.fornecedores.excluidoEm)))).map((f) => [f.nome.toLowerCase(), f.id]));
        const skus = new Set(
          (await tx.select({ s: schema.produtos.sku }).from(schema.produtos).where(and(eq(schema.produtos.empresaId, sessao.empresaId), isNull(schema.produtos.excluidoEm)))).map((r) => r.s?.toUpperCase()).filter(Boolean),
        );
        for (const { linha, dados: d } of validas) {
          const sku = d.sku as string | null;
          if (sku && skus.has(sku)) {
            ignorados.push({ linha, motivo: `SKU ${sku} já cadastrado` });
            continue;
          }
          if (sku) skus.add(sku);
          let categoriaId: string | null = null;
          if (d.categoria) {
            const k = (d.categoria as string).toLowerCase();
            categoriaId = cats.get(k) ?? null;
            if (!categoriaId) {
              const [c] = await tx.insert(schema.categorias).values({ empresaId: sessao.empresaId, nome: d.categoria as string }).returning({ id: schema.categorias.id });
              categoriaId = c!.id;
              cats.set(k, categoriaId);
            }
          }
          let fornecedorId: string | null = null;
          if (d.fornecedor) {
            const k = (d.fornecedor as string).toLowerCase();
            fornecedorId = forns.get(k) ?? null;
            if (!fornecedorId) {
              const [f] = await tx.insert(schema.fornecedores).values({ empresaId: sessao.empresaId, nome: d.fornecedor as string }).returning({ id: schema.fornecedores.id });
              fornecedorId = f!.id;
              forns.set(k, fornecedorId);
            }
          }
          await tx.insert(schema.produtos).values({
            empresaId: sessao.empresaId,
            nome: d.nome as string,
            sku,
            codigoBarras: d.codigoBarras as string | null,
            categoriaId,
            fornecedorId,
            unidade: d.unidade as string,
            custo: d.custo as number,
            preco: d.preco as number,
            estoqueMinimo: d.estoqueMinimo as number,
          });
          importados++;
        }
      }
      await registrar(tx, sessao, entidade === "clientes" ? "cliente" : "produto", null, "importar", `${importados} ${entidade} importados da planilha`, { ignorados: ignorados.length });
    });
    revalidatePath(entidade === "clientes" ? "/clientes" : "/cadastros/produtos");
    revalidatePath("/");
    return { ok: true, importados, ignorados: ignorados.sort((a, b) => a.linha - b.linha) };
  } catch (e) {
    return falha(e);
  }
}
