import type { Perfil } from "@/server/db/schema";

/*
 * Permissões por perfil — a mesma tabela decide o que aparece no menu (cliente)
 * e o que o servidor aceita (ações e consultas). O servidor é quem manda.
 */

export const PERMISSOES = [
  "inicio.ver",
  "clientes.ver",
  "clientes.editar",
  "clientes.excluir",
  "equipamentos.ver",
  "equipamentos.editar",
  "cadastros.ver",
  "cadastros.editar",
  "custos.ver",
  "importar",
  "os.ver",
  "agenda.ver",
  "vendas.ver",
  "estoque.ver",
  "financeiro.ver",
  "relatorios.ver",
  "metas.ver",
  "empresa.configurar",
  "equipe.gerenciar",
  "auditoria.ver",
] as const;

export type Permissao = (typeof PERMISSOES)[number];

const TODAS = new Set<Permissao>(PERMISSOES);

const MATRIZ: Record<Perfil, Set<Permissao>> = {
  admin: TODAS,
  financeiro: new Set<Permissao>([
    "inicio.ver",
    "clientes.ver",
    "clientes.editar",
    "equipamentos.ver",
    "cadastros.ver",
    "custos.ver",
    "os.ver",
    "vendas.ver",
    "estoque.ver",
    "financeiro.ver",
    "relatorios.ver",
    "metas.ver",
  ]),
  atendimento: new Set<Permissao>([
    "inicio.ver",
    "clientes.ver",
    "clientes.editar",
    "equipamentos.ver",
    "equipamentos.editar",
    "cadastros.ver",
    "importar",
    "os.ver",
    "agenda.ver",
    "vendas.ver",
    "estoque.ver",
  ]),
  // Técnico: só o que precisa em campo. Sem custos, financeiro ou exclusões.
  tecnico: new Set<Permissao>(["inicio.ver", "clientes.ver", "equipamentos.ver", "equipamentos.editar", "os.ver", "agenda.ver"]),
};

export function pode(perfil: Perfil, permissao: Permissao): boolean {
  return MATRIZ[perfil].has(permissao);
}

export const NOME_PERFIL: Record<Perfil, string> = {
  admin: "Administrador",
  financeiro: "Financeiro",
  atendimento: "Atendimento",
  tecnico: "Técnico",
};
