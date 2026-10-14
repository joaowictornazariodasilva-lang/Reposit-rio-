/** CSV com ; e BOM — abre direto no Excel em pt-BR com acentos certos. */
export function paraCsv(linhas: Record<string, unknown>[], colunas: { chave: string; titulo: string }[]): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : Array.isArray(v) ? v.join(", ") : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const cab = colunas.map((c) => esc(c.titulo)).join(";");
  const corpo = linhas.map((l) => colunas.map((c) => esc(l[c.chave])).join(";")).join("\r\n");
  return `﻿${cab}\r\n${corpo}`;
}

export function baixarArquivo(nome: string, conteudo: string, tipo = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
