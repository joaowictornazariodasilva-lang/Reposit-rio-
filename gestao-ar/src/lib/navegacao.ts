import type { Permissao } from "./permissions";

export type ItemNav = {
  href: string;
  rotulo: string;
  icone: string; // nome do ícone Lucide (resolvido no cliente)
  permissao: Permissao;
  /** Passo do plano em que o módulo é entregue; ausente = disponível. */
  passo?: number;
  atalho?: string;
};

export const NAV: { grupo: string; itens: ItemNav[] }[] = [
  {
    grupo: "Operação",
    itens: [
      { href: "/", rotulo: "Início", icone: "house", permissao: "inicio.ver", atalho: "g i" },
      { href: "/ordens", rotulo: "Ordens de serviço", icone: "clipboard-list", permissao: "os.ver", passo: 3, atalho: "g o" },
      { href: "/agenda", rotulo: "Agenda", icone: "calendar-days", permissao: "agenda.ver", passo: 3, atalho: "g a" },
      { href: "/vendas", rotulo: "Orçamentos e vendas", icone: "file-text", permissao: "vendas.ver", passo: 4 },
      { href: "/pdv", rotulo: "PDV", icone: "scan-barcode", permissao: "vendas.ver", passo: 4 },
    ],
  },
  {
    grupo: "Clientes",
    itens: [
      { href: "/clientes", rotulo: "Clientes", icone: "users", permissao: "clientes.ver", atalho: "g c" },
      { href: "/equipamentos", rotulo: "Equipamentos", icone: "air-vent", permissao: "equipamentos.ver", atalho: "g e" },
      { href: "/contratos", rotulo: "Contratos", icone: "repeat", permissao: "clientes.editar", passo: 6 },
      { href: "/lembretes", rotulo: "Lembretes", icone: "bell-ring", permissao: "clientes.ver", passo: 6 },
    ],
  },
  {
    grupo: "Gestão",
    itens: [
      { href: "/estoque", rotulo: "Estoque", icone: "package", permissao: "estoque.ver", passo: 5 },
      { href: "/financeiro", rotulo: "Financeiro", icone: "wallet", permissao: "financeiro.ver", passo: 5 },
      { href: "/metas", rotulo: "Metas", icone: "target", permissao: "metas.ver", passo: 6 },
      { href: "/relatorios", rotulo: "Relatórios", icone: "chart-column", permissao: "relatorios.ver", passo: 6 },
    ],
  },
  {
    grupo: "Configuração",
    itens: [
      { href: "/cadastros", rotulo: "Cadastros", icone: "list-checks", permissao: "cadastros.ver", atalho: "g p" },
      { href: "/importar", rotulo: "Importar planilha", icone: "file-spreadsheet", permissao: "importar" },
      { href: "/configuracoes", rotulo: "Configurações", icone: "settings", permissao: "empresa.configurar" },
    ],
  },
];

export const MODULOS_FUTUROS: Record<string, { titulo: string; passo: number; resumo: string; itens: string[] }> = {
  ordens: {
    titulo: "Ordens de serviço",
    passo: 3,
    resumo: "Lista e kanban com arrastar para mudar status, filtros salvos e criação em um único painel lateral.",
    itens: ["Kanban: Aberta → Agendada → Em deslocamento → Em execução → Concluída → Faturada", "Criar OS em < 30 s: cliente → aparelho → serviço → técnico/data", "Itens com baixa automática no estoque, fotos, checklist e assinatura", "Enviar por WhatsApp, gerar PDF e cobrar via PIX"],
  },
  agenda: {
    titulo: "Agenda",
    passo: 3,
    resumo: "Visões Dia, Semana, Mês, Por técnico e Lista, com arrastar e soltar e detecção de conflito.",
    itens: ["Cores por tipo de serviço e status", "Alerta de técnico sobrecarregado e sugestão por região", "Bloqueios (férias, folga)", "Confirmação automática D-1 e 1 h antes"],
  },
  vendas: {
    titulo: "Orçamentos e vendas",
    passo: 4,
    resumo: "Orçamento relâmpago a partir dos kits favoritos, PDF com sua marca e link de aprovação online.",
    itens: ["Kits de instalação e limpeza por BTU já cadastrados", "Link público com aceite, data e IP", "Aprovou → vira OS e entra na agenda", "Venda direta de equipamentos e peças"],
  },
  pdv: { titulo: "PDV", passo: 4, resumo: "Venda de balcão com leitor de código de barras, desconto e recibo por WhatsApp.", itens: ["Busca por nome ou código de barras", "PIX, cartão, dinheiro e parcelado", "Recibo imprimível"] },
  contratos: {
    titulo: "Contratos de manutenção",
    passo: 6,
    resumo: "Planos mensais, trimestrais ou semestrais que geram as OS futuras e a cobrança recorrente sozinhos.",
    itens: ["Geração automática das OS na agenda", "Cobrança recorrente", "Alerta de contrato vencendo"],
  },
  lembretes: { titulo: "Lembretes", passo: 6, resumo: "Central de lembretes manuais e automáticos, no sistema, por e-mail e WhatsApp.", itens: ["Preventiva a cada 6 meses por aparelho", "Garantia e contrato vencendo", "Mensagens com variáveis {cliente}, {data}, {aparelho}"] },
  estoque: {
    titulo: "Estoque",
    passo: 5,
    resumo: "Saldo, kardex, depósitos (incluindo o carro de cada técnico) e lista de compras automática.",
    itens: ["Baixa automática pelas peças usadas na OS", "Controle de cilindros de gás (kg por serviço)", "Lista de compras por fornecedor, enviada por WhatsApp"],
  },
  financeiro: {
    titulo: "Financeiro",
    passo: 5,
    resumo: "Contas a receber e a pagar, fluxo de caixa, PIX e comissões calculadas sozinhas.",
    itens: ["Cobrança PIX (QR e copia-e-cola)", "Comissões por técnico/vendedor com fechamento mensal", "Recibos e número de nota fiscal"],
  },
  metas: { titulo: "Metas", passo: 6, resumo: "Metas de faturamento, OS e vendas por mês e por colaborador, com barra de progresso.", itens: ["Meta da empresa e por pessoa", "Acompanhamento diário"] },
  relatorios: {
    titulo: "Relatórios",
    passo: 6,
    resumo: "Relatórios prontos com exportação PDF/Excel e envio agendado por e-mail.",
    itens: ["Faturamento, lucro por serviço, comissões", "Inadimplência, estoque, retornos em garantia", "Produtividade por técnico"],
  },
};
