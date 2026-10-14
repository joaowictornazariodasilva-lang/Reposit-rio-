import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { hashSenha } from "../auth/password";
import type { CategoriaServico, StatusOs, TipoEquipamento } from "./schema";

type Db = NodePgDatabase<typeof schema>;

/*
 * Dados de demonstração realistas (Fortaleza/CE). Determinísticos: a mesma
 * semente gera sempre os mesmos dados, o que deixa screenshots e testes estáveis.
 * Datas são relativas a "hoje" para o painel sempre parecer vivo.
 */

export const SENHA_DEMO = "brisa2026";
export const USUARIOS_DEMO = [
  { nome: "Ricardo Moura", email: "dono@brisaclima.demo", perfil: "admin", cor: "#0B5F6E", comissaoPct: 0 },
  { nome: "Patrícia Lima", email: "financeiro@brisaclima.demo", perfil: "financeiro", cor: "#7C3AED", comissaoPct: 0 },
  { nome: "Juliana Castro", email: "atendimento@brisaclima.demo", perfil: "atendimento", cor: "#DB2777", comissaoPct: 2 },
  { nome: "Marcos Sales", email: "marcos@brisaclima.demo", perfil: "tecnico", cor: "#0891B2", comissaoPct: 10 },
  { nome: "Diego Freitas", email: "diego@brisaclima.demo", perfil: "tecnico", cor: "#EA580C", comissaoPct: 10 },
  { nome: "Anderson Rocha", email: "anderson@brisaclima.demo", perfil: "tecnico", cor: "#16A34A", comissaoPct: 8 },
] as const;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const diasAtras = (n: number, hora = 9) => {
  const d = new Date(Date.now() - n * 86_400_000);
  d.setUTCHours(hora + 3, 0, 0, 0); // hora local de Fortaleza (UTC-3)
  return d;
};
const iso = (d: Date) => d.toISOString().slice(0, 10);

export async function semearSeVazio(db: Db): Promise<boolean> {
  const r = await db.execute<{ n: number }>(sql`select count(*)::int as n from empresas`);
  const linhas = (r as unknown as { rows: { n: number }[] }).rows;
  if ((linhas[0]?.n ?? 0) > 0) return false;
  await semear(db);
  return true;
}

export async function semear(db: Db) {
  const rand = rng(2026);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;

  await db.transaction(async (tx) => {
    const [empresa] = await tx
      .insert(schema.empresas)
      .values({
        nome: "Brisa Climatização",
        razaoSocial: "Brisa Climatização e Serviços Ltda.",
        cnpj: "45723174000110",
        telefone: "8532241890",
        whatsapp: "85991234567",
        email: "contato@brisaclima.demo",
        endereco: "Av. Santos Dumont, 2789 — Aldeota",
        cidade: "Fortaleza",
        uf: "CE",
        onboarding: ["empresa", "servicos", "equipe"],
      })
      .returning();
    const empresaId = empresa!.id;

    const senhaHash = await hashSenha(SENHA_DEMO);
    const usuarios = await tx
      .insert(schema.usuarios)
      .values(USUARIOS_DEMO.map((u) => ({ ...u, empresaId, senhaHash, telefone: "8598" + Math.floor(1000000 + rand() * 8999999) })))
      .returning();
    const tecnicos = usuarios.filter((u) => u.perfil === "tecnico");

    // Tipos de serviço (preços praticados em Fortaleza, 2026)
    const servicosBase: {
      nome: string;
      categoria: CategoriaServico;
      precoPadrao: number;
      duracaoMin: number;
      garantiaDias: number;
      recorrenciaMeses?: number;
      variacoes?: schema.VariacaoPreco[];
      descricao?: string;
    }[] = [
      {
        nome: "Instalação de split",
        categoria: "instalacao",
        precoPadrao: 450,
        duracaoMin: 180,
        garantiaDias: 90,
        variacoes: [
          { btusAte: 12000, preco: 450 },
          { btusAte: 18000, preco: 550 },
          { btusAte: 24000, preco: 650 },
          { btusAte: 60000, preco: 950 },
        ],
        descricao: "Inclui até 3 m de tubulação, suporte e dreno. Metro adicional cobrado à parte.",
      },
      { nome: "Desinstalação", categoria: "desinstalacao", precoPadrao: 180, duracaoMin: 90, garantiaDias: 0, descricao: "Recolhimento do gás na condensadora." },
      {
        nome: "Limpeza / higienização completa",
        categoria: "higienizacao",
        precoPadrao: 180,
        duracaoMin: 90,
        garantiaDias: 30,
        recorrenciaMeses: 6,
        variacoes: [
          { btusAte: 12000, preco: 180 },
          { btusAte: 18000, preco: 220 },
          { btusAte: 24000, preco: 260 },
          { btusAte: 60000, preco: 380 },
        ],
        descricao: "Evaporadora e condensadora, bactericida, desobstrução do dreno.",
      },
      { nome: "Manutenção preventiva", categoria: "preventiva", precoPadrao: 150, duracaoMin: 60, garantiaDias: 30, recorrenciaMeses: 6 },
      { nome: "Manutenção corretiva", categoria: "corretiva", precoPadrao: 120, duracaoMin: 90, garantiaDias: 90, descricao: "Mão de obra; peças à parte." },
      {
        nome: "Carga de gás",
        categoria: "carga_gas",
        precoPadrao: 280,
        duracaoMin: 60,
        garantiaDias: 90,
        variacoes: [
          { btusAte: 12000, preco: 280 },
          { btusAte: 24000, preco: 380 },
          { btusAte: 60000, preco: 560 },
        ],
        descricao: "Inclui teste de vazamento com nitrogênio.",
      },
      { nome: "Visita técnica / diagnóstico", categoria: "visita_tecnica", precoPadrao: 80, duracaoMin: 45, garantiaDias: 0, descricao: "Abatida do serviço se aprovado." },
      { nome: "PMOC — visita mensal", categoria: "pmoc", precoPadrao: 350, duracaoMin: 120, garantiaDias: 30, recorrenciaMeses: 1 },
      { nome: "Venda de equipamento", categoria: "venda_equipamento", precoPadrao: 0, duracaoMin: 30, garantiaDias: 365 },
    ];
    const servicos = await tx
      .insert(schema.tiposServico)
      .values(servicosBase.map((s) => ({ ...s, empresaId, variacoes: s.variacoes ?? [] })))
      .returning();
    const servicoPor = (c: CategoriaServico) => servicos.find((s) => s.categoria === c)!;

    const categorias = await tx
      .insert(schema.categorias)
      .values(["Tubulação e isolamento", "Gás refrigerante", "Elétrica", "Peças de reposição", "Suportes e fixação", "Equipamentos", "Limpeza e química"].map((nome) => ({ empresaId, nome })))
      .returning();
    const cat = (n: string) => categorias.find((c) => c.nome === n)!.id;

    const fornecedores = await tx
      .insert(schema.fornecedores)
      .values([
        { empresaId, nome: "Frigelar Fortaleza", contato: "Sandro", telefone: "8532181500", whatsapp: "85988112233", prazoEntregaDias: 1 },
        { empresaId, nome: "Dufrio Distribuidora", contato: "Camila", telefone: "8534561200", whatsapp: "85987451200", prazoEntregaDias: 3 },
        { empresaId, nome: "Polo Refrigeração", contato: "Edson", telefone: "8532725511", whatsapp: "85996127788", prazoEntregaDias: 2 },
        { empresaId, nome: "Casa do Gás Refrigerante", contato: "Renata", whatsapp: "85994418822", prazoEntregaDias: 1 },
      ])
      .returning();
    const forn = (n: string) => fornecedores.find((f) => f.nome.startsWith(n))!.id;

    const produtosBase: [string, string, string, string, number, number, number, string, boolean?][] = [
      // nome, sku, categoria, fornecedor, custo, preço, mínimo, unidade, favorito
      ["Tubo de cobre 1/4\" (metro)", "TC-014", "Tubulação e isolamento", "Frigelar", 28.5, 55, 30, "m", true],
      ["Tubo de cobre 3/8\" (metro)", "TC-038", "Tubulação e isolamento", "Frigelar", 39.9, 72, 30, "m", true],
      ["Tubo de cobre 1/2\" (metro)", "TC-012", "Tubulação e isolamento", "Frigelar", 52, 95, 15, "m"],
      ["Isolamento esponjoso 3/8\" (2 m)", "IS-038", "Tubulação e isolamento", "Dufrio", 6.9, 15, 40, "un"],
      ["Fita PVC branca", "FT-PVC", "Tubulação e isolamento", "Dufrio", 4.2, 12, 20, "un"],
      ["Mangueira de dreno cristal (metro)", "DR-001", "Tubulação e isolamento", "Polo", 2.8, 8, 50, "m"],
      ["Gás R-410A (kg)", "GAS-410", "Gás refrigerante", "Casa do Gás", 62, 140, 8, "kg", true],
      ["Gás R-32 (kg)", "GAS-32", "Gás refrigerante", "Casa do Gás", 55, 130, 6, "kg", true],
      ["Gás R-22 (kg)", "GAS-22", "Gás refrigerante", "Casa do Gás", 95, 190, 4, "kg"],
      ["Cabo PP 4x1,5 mm (metro)", "CB-PP4", "Elétrica", "Polo", 6.4, 14, 40, "m"],
      ["Disjuntor bipolar 20 A", "DJ-20", "Elétrica", "Polo", 32, 65, 6, "un"],
      ["Capacitor 35+5 µF", "CAP-355", "Peças de reposição", "Dufrio", 28, 75, 6, "un", true],
      ["Capacitor 25 µF", "CAP-25", "Peças de reposição", "Dufrio", 18, 55, 6, "un"],
      ["Placa universal evaporadora", "PL-UNI", "Peças de reposição", "Frigelar", 145, 290, 2, "un"],
      ["Sensor de temperatura 10K", "SN-10K", "Peças de reposição", "Frigelar", 12, 45, 5, "un"],
      ["Motor ventilador condensadora", "MT-VC", "Peças de reposição", "Dufrio", 210, 420, 1, "un"],
      ["Suporte condensadora 400 mm", "SP-400", "Suportes e fixação", "Polo", 38, 85, 8, "un", true],
      ["Suporte condensadora 500 mm", "SP-500", "Suportes e fixação", "Polo", 46, 98, 4, "un"],
      ["Bactericida para serpentina (1 L)", "QM-BAC", "Limpeza e química", "Dufrio", 24, 0, 6, "un"],
      ["Desincrustante alcalino (5 L)", "QM-ALC", "Limpeza e química", "Dufrio", 68, 0, 2, "un"],
      ["Split Midea Xtreme 12.000 BTUs inverter", "EQ-MID12", "Equipamentos", "Frigelar", 1890, 2690, 1, "un"],
      ["Split LG Dual Inverter 9.000 BTUs", "EQ-LG09", "Equipamentos", "Frigelar", 1990, 2790, 1, "un"],
      ["Split Gree G-Top 18.000 BTUs inverter", "EQ-GRE18", "Equipamentos", "Dufrio", 2850, 3890, 1, "un"],
    ];
    const produtos = await tx
      .insert(schema.produtos)
      .values(
        produtosBase.map(([nome, sku, c, f, custo, preco, estoqueMinimo, unidade, favorito], i) => ({
          empresaId,
          nome,
          sku,
          codigoBarras: `789${String(1000000000 + i * 7919).slice(0, 10)}`,
          categoriaId: cat(c),
          fornecedorId: forn(f),
          custo,
          preco,
          estoqueMinimo,
          unidade,
          favorito: favorito ?? false,
        })),
      )
      .returning();
    const prod = (sku: string) => produtos.find((p) => p.sku === sku)!.id;

    const inst = servicoPor("instalacao").id;
    const kitsBase: { nome: string; descricao: string; itens: { s?: string; p?: string; q: number; preco?: number }[] }[] = [
      {
        nome: "Kit instalação 9.000/12.000 BTUs",
        descricao: "Mão de obra + 3 m de tubulação 1/4 e 3/8, isolamento, suporte 400 mm, cabo e dreno.",
        itens: [{ s: inst, q: 1, preco: 450 }, { p: "TC-014", q: 3 }, { p: "TC-038", q: 3 }, { p: "IS-038", q: 3 }, { p: "SP-400", q: 1 }, { p: "CB-PP4", q: 4 }, { p: "DR-001", q: 3 }],
      },
      {
        nome: "Kit instalação 18.000 BTUs",
        descricao: "Mão de obra + 3 m de tubulação 1/4 e 1/2, isolamento, suporte 500 mm, cabo e dreno.",
        itens: [{ s: inst, q: 1, preco: 550 }, { p: "TC-014", q: 3 }, { p: "TC-012", q: 3 }, { p: "IS-038", q: 3 }, { p: "SP-500", q: 1 }, { p: "CB-PP4", q: 4 }, { p: "DR-001", q: 3 }],
      },
      {
        nome: "Kit instalação 24.000 BTUs",
        descricao: "Mão de obra + 3 m de tubulação, suporte 500 mm, disjuntor dedicado.",
        itens: [{ s: inst, q: 1, preco: 650 }, { p: "TC-038", q: 3 }, { p: "TC-012", q: 3 }, { p: "SP-500", q: 1 }, { p: "DJ-20", q: 1 }, { p: "CB-PP4", q: 5 }],
      },
      {
        nome: "Troca de capacitor (com diagnóstico)",
        descricao: "Visita + capacitor 35+5 µF + mão de obra corretiva.",
        itens: [{ s: servicoPor("corretiva").id, q: 1 }, { p: "CAP-355", q: 1 }],
      },
    ];
    for (const k of kitsBase) {
      const [kit] = await tx.insert(schema.kits).values({ empresaId, nome: k.nome, descricao: k.descricao }).returning();
      await tx.insert(schema.kitItens).values(
        k.itens.map((i) => ({ kitId: kit!.id, tipoServicoId: i.s ?? null, produtoId: i.p ? prod(i.p) : null, quantidade: i.q, precoUnitario: i.preco ?? null })),
      );
    }

    // Clientes
    const bairros = ["Aldeota", "Meireles", "Cocó", "Papicu", "Dionísio Torres", "Fátima", "Benfica", "Messejana", "Cambeba", "Edson Queiroz", "Parquelândia", "Guararapes", "Varjota", "Cidade dos Funcionários", "Água Fria", "Engenheiro Luciano Cavalcante"];
    const ruas = ["Rua Tibúrcio Cavalcante", "Av. Dom Luís", "Rua Silva Jatahy", "Rua Canuto de Aguiar", "Av. Washington Soares", "Rua Joaquim Nabuco", "Av. Engenheiro Santana Júnior", "Rua Frederico Borges", "Rua Pereira Valente", "Rua Coronel Jucá", "Av. Rui Barbosa", "Rua Ana Bilhar"];
    const pf = [
      "Mariana Albuquerque", "Francisco Bezerra", "Luciana Távora", "Raimundo Nonato Pinheiro", "Camila Girão", "Thiago Holanda", "Ana Cláudia Furtado", "Rafael Montenegro",
      "Helena Benevides", "José Airton Sampaio", "Beatriz Arruda", "Gustavo Teixeira", "Fernanda Queiroz", "Paulo Henrique Linhares", "Larissa Cavalcante", "Antônio Carlos Diógenes",
    ];
    const pj: [string, string, string][] = [
      ["Clínica Odontológica Sorriso Pleno Ltda.", "Sorriso Pleno", "Clínica"],
      ["Padaria Pão de Mel Ltda.", "Pão de Mel", "Comércio"],
      ["Escritório Rocha & Viana Advogados", "Rocha & Viana", "Escritório"],
      ["Restaurante Sabor do Mar Ltda.", "Sabor do Mar", "Restaurante"],
      ["Academia Movimento Fitness Ltda.", "Movimento Fitness", "Academia"],
      ["Condomínio Edifício Porto Bello", "Ed. Porto Bello", "Condomínio"],
      ["Laboratório Vida Análises Clínicas", "Vida Análises", "Clínica"],
      ["Colégio Novo Saber", "Novo Saber", "Escola"],
    ];
    // CNPJs válidos de demonstração (dígitos verificadores calculados)
    const cnpjDemo = (base: string) => {
      const d = base.split("").map(Number);
      const calc = (pesos: number[]) => {
        const r = pesos.reduce((a, p, i) => a + d[i]! * p, 0) % 11;
        return r < 2 ? 0 : 11 - r;
      };
      d.push(calc([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]));
      d.push(calc([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]));
      return d.join("");
    };
    const cpfDemo = (base: string) => {
      const d = base.split("").map(Number);
      const calc = (n: number) => {
        let s = 0;
        for (let i = 0; i < n; i++) s += d[i]! * (n + 1 - i);
        const r = (s * 10) % 11;
        return r === 10 ? 0 : r;
      };
      d.push(calc(9));
      d.push(calc(10));
      return d.join("");
    };

    type NovoCliente = typeof schema.clientes.$inferInsert;
    const novos: NovoCliente[] = [];
    let codigo = 1;
    pf.forEach((nome, i) => {
      novos.push({
        empresaId,
        codigo: codigo++,
        tipo: "pf",
        nome,
        documento: cpfDemo(String(123456789 + i * 1111111).padStart(9, "0").slice(0, 9)),
        email: `${nome.split(" ")[0]!.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}${i}@email.demo`,
        telefone: null,
        whatsapp: `859${String(81000000 + Math.floor(rand() * 18999999)).padStart(8, "0")}`,
        origem: pick(["Indicação", "Instagram", "Google", "WhatsApp", "Indicação"]),
        tags: rand() > 0.7 ? ["VIP"] : [],
        notas: i === 0 ? "Prefere atendimento pela manhã. Tem cachorro — avisar antes de entrar." : null,
      });
    });
    pj.forEach(([razao, fantasia, seg], i) => {
      novos.push({
        empresaId,
        codigo: codigo++,
        tipo: "pj",
        nome: razao,
        nomeFantasia: fantasia,
        documento: cnpjDemo(`${String(11222333 + i * 104729).slice(0, 8)}0001`),
        email: `contato@${fantasia.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "")}.demo`,
        telefone: `8532${String(100000 + Math.floor(rand() * 899999))}`,
        whatsapp: `859${String(81000000 + Math.floor(rand() * 18999999)).padStart(8, "0")}`,
        origem: pick(["Indicação", "Google", "Já era cliente"]),
        tags: [seg, ...(i < 3 ? ["Contrato"] : [])],
      });
    });
    const clientes = await tx.insert(schema.clientes).values(novos).returning();

    const tiposPf: TipoEquipamento[] = ["split", "split", "split", "split", "janela"];
    const tiposPj: TipoEquipamento[] = ["split", "cassete", "piso_teto", "split", "vrf", "cassete"];
    const ambientesCasa = ["Quarto do casal", "Quarto 2", "Sala", "Escritório", "Quarto das crianças", "Suíte"];
    const ambientesEmp = ["Recepção", "Sala 1", "Sala 2", "Salão principal", "Sala de reunião", "Consultório 1", "Consultório 2", "Administrativo", "Cozinha", "CPD"];
    const modelos: Record<string, string[]> = {
      LG: ["Dual Inverter S3-Q12JA31A", "Dual Inverter S4-W18KL31A", "Artcool S3-W24K231B"],
      Samsung: ["WindFree AR12CVFAMWK", "Digital Inverter AR18BVHZCWK"],
      Midea: ["Xtreme Save 42AGVQI12M5", "AirVolution 42MBCA18M5"],
      Gree: ["G-Top GWC12ATA-D6DNA1A", "Eco Garden GWC18QD-D3NNB4D"],
      Elgin: ["Eco Inverter HJFI12C2WB", "Eco Power HWFI18B2IA"],
      Daikin: ["EcoSwing FTKP12Q5VL", "SkyAir FCQ36AVL (cassete)"],
      Fujitsu: ["ASBG12JMCA", "ABBG36LRTA (piso-teto)"],
      Carrier: ["X-Power 42LVQA012515LC"],
    };
    const marcas = Object.keys(modelos);

    let numeroOs = 1;
    const osParaInserir: (typeof schema.ordensServico.$inferInsert)[] = [];

    for (const [ci, cliente] of clientes.entries()) {
      const ehPj = cliente.tipo === "pj";
      const qtdLocais = ehPj && ci % 3 === 0 ? 2 : 1;
      const locaisCliente = await tx
        .insert(schema.locais)
        .values(
          Array.from({ length: qtdLocais }, (_, li) => ({
            clienteId: cliente.id,
            nome: ehPj ? (li === 0 ? "Matriz" : "Filial " + pick(["Cocó", "Messejana", "Eusébio"])) : pick(["Casa", "Apartamento"]),
            cep: `60${String(110000 + Math.floor(rand() * 750000)).slice(0, 6)}`,
            logradouro: pick(ruas),
            numero: String(100 + Math.floor(rand() * 2800)),
            complemento: !ehPj && rand() > 0.5 ? `Apto ${100 + Math.floor(rand() * 1500)}` : null,
            bairro: pick(bairros),
            cidade: li === 1 && rand() > 0.6 ? "Eusébio" : "Fortaleza",
            uf: "CE",
            principal: li === 0,
          })),
        )
        .returning();

      if (ehPj) {
        await tx.insert(schema.contatos).values([
          { clienteId: cliente.id, nome: pick(["Sílvia", "Roberto", "Kátia", "Fábio", "Aline"]) + " " + pick(["Menezes", "Barros", "Pontes", "Façanha"]), cargo: pick(["Gerente", "Administrativo", "Síndico(a)", "Sócio(a)"]), whatsapp: cliente.whatsapp, principal: true },
          { clienteId: cliente.id, nome: pick(["Carlos", "Neide", "Igor", "Débora"]) + " (financeiro)", cargo: "Financeiro", email: cliente.email, principal: false },
        ]);
      } else {
        await tx.insert(schema.contatos).values({ clienteId: cliente.id, nome: cliente.nome, whatsapp: cliente.whatsapp, email: cliente.email, principal: true });
      }

      const qtdEquip = ehPj ? 2 + Math.floor(rand() * 4) : 1 + Math.floor(rand() * 3);
      for (let e = 0; e < qtdEquip; e++) {
        const local = locaisCliente[e % locaisCliente.length]!;
        const tipo = pick(ehPj ? tiposPj : tiposPf);
        const marca = pick(marcas);
        const btusOpts = tipo === "janela" ? [7500, 10000] : tipo === "vrf" ? [48000, 60000] : tipo === "split" ? [9000, 12000, 12000, 18000, 24000] : [24000, 36000, 48000];
        const b = pick(btusOpts);
        const instaladoHaDias = 60 + Math.floor(rand() * 1300);
        const instalado = diasAtras(instaladoHaDias);
        const nosso = rand() > 0.35;
        const garantia = new Date(instalado.getTime() + (nosso ? 365 : 365 * 3) * 86_400_000);
        const [equip] = await tx
          .insert(schema.equipamentos)
          .values({
            empresaId,
            clienteId: cliente.id,
            localId: local.id,
            tipo,
            marca,
            modelo: pick(modelos[marca]!),
            btus: b,
            gas: b >= 48000 ? "R-410A" : pick(["R-410A", "R-32", "R-32", "R-22"]),
            tensao: b >= 24000 ? "220 V" : pick(["220 V", "220 V", "127 V"]),
            inverter: rand() > 0.35,
            numeroSerie: `${marca.slice(0, 2).toUpperCase()}${Math.floor(10000000 + rand() * 89999999)}`,
            ambiente: pick(ehPj ? ambientesEmp : ambientesCasa),
            dataInstalacao: iso(instalado),
            garantiaAte: iso(garantia),
            instaladoPorNos: nosso,
          })
          .returning();

        // Histórico: instalação (se nossa) + limpezas a cada ~6 meses + eventual corretiva
        const eventos: { dias: number; cat: CategoriaServico; retorno?: boolean }[] = [];
        if (nosso) eventos.push({ dias: instaladoHaDias, cat: "instalacao" });
        const intervalo = 150 + Math.floor(rand() * 140);
        // Alguns aparelhos ficam propositalmente com limpeza vencida (oportunidade de retorno)
        const parar = rand() > 0.55 ? 160 + Math.floor(rand() * 200) : 20 + Math.floor(rand() * 60);
        for (let d = instaladoHaDias - intervalo; d > parar; d -= intervalo) eventos.push({ dias: d, cat: ehPj && rand() > 0.5 ? "preventiva" : "higienizacao" });
        if (rand() > 0.6) eventos.push({ dias: 10 + Math.floor(rand() * 300), cat: pick(["corretiva", "carga_gas"] as const), retorno: rand() > 0.8 });
        for (const ev of eventos.sort((a, z) => z.dias - a.dias)) {
          const tipoServ = servicoPor(ev.cat);
          const faixa = tipoServ.variacoes.find((v) => b <= v.btusAte);
          const valor = ev.retorno ? 0 : (faixa?.preco ?? tipoServ.precoPadrao) + (ev.cat === "corretiva" ? 75 : 0);
          const ab = diasAtras(ev.dias + 2, 8 + Math.floor(rand() * 8));
          const concl = diasAtras(ev.dias, 9 + Math.floor(rand() * 8));
          osParaInserir.push({
            empresaId,
            numero: 0,
            clienteId: cliente.id,
            localId: local.id,
            equipamentoId: equip!.id,
            tipoServicoId: tipoServ.id,
            tecnicoId: pick(tecnicos).id,
            status: "faturada",
            descricao: ev.retorno ? "Retorno em garantia — gotejamento na evaporadora" : null,
            abertaEm: ab,
            agendadaPara: concl,
            concluidaEm: concl,
            valorTotal: valor,
            ehRetorno: ev.retorno ?? false,
          });
        }
      }
    }

    // Algumas OS do dia/semana para o painel "Hoje"
    const proximos: { dias: number; hora: number; status: StatusOs; cat: CategoriaServico }[] = [
      { dias: 0, hora: 8, status: "em_execucao", cat: "higienizacao" },
      { dias: 0, hora: 10, status: "agendada", cat: "instalacao" },
      { dias: 0, hora: 14, status: "agendada", cat: "corretiva" },
      { dias: 0, hora: 16, status: "agendada", cat: "higienizacao" },
      { dias: -1, hora: 9, status: "agendada", cat: "preventiva" },
      { dias: -2, hora: 13, status: "aguardando_peca", cat: "corretiva" },
      { dias: 1, hora: 15, status: "aguardando_aprovacao", cat: "carga_gas" },
    ];
    const equipamentosTodos = await tx.select().from(schema.equipamentos);
    // Movimento recente (últimos ~45 dias) para o painel ter faturamento do mês e do mês anterior
    for (let i = 0; i < 34; i++) {
      const eq = pick(equipamentosTodos);
      const cat = pick(["higienizacao", "higienizacao", "higienizacao", "preventiva", "corretiva", "carga_gas", "instalacao", "visita_tecnica"] as const);
      const t = servicoPor(cat);
      const dias = 1 + Math.floor(rand() * 44);
      const valor = (t.variacoes.find((v) => eq.btus <= v.btusAte)?.preco ?? t.precoPadrao) + (cat === "corretiva" ? 75 + Math.floor(rand() * 4) * 55 : 0);
      osParaInserir.push({
        empresaId,
        numero: 0,
        clienteId: eq.clienteId,
        localId: eq.localId,
        equipamentoId: eq.id,
        tipoServicoId: t.id,
        tecnicoId: pick(tecnicos).id,
        status: dias < 3 ? "concluida" : "faturada",
        abertaEm: diasAtras(dias + 2),
        agendadaPara: diasAtras(dias, 8 + Math.floor(rand() * 9)),
        concluidaEm: diasAtras(dias, 10 + Math.floor(rand() * 7)),
        valorTotal: valor,
      });
    }
    for (const p of proximos) {
      const eq = pick(equipamentosTodos);
      const t = servicoPor(p.cat);
      osParaInserir.push({
        empresaId,
        numero: 0,
        clienteId: eq.clienteId,
        localId: eq.localId,
        equipamentoId: eq.id,
        tipoServicoId: t.id,
        tecnicoId: pick(tecnicos).id,
        status: p.status,
        abertaEm: diasAtras(Math.max(p.dias, 0) + 3),
        agendadaPara: diasAtras(p.dias, p.hora),
        valorTotal: t.variacoes.find((v) => eq.btus <= v.btusAte)?.preco ?? t.precoPadrao,
      });
    }

    osParaInserir.sort((a, z) => (a.abertaEm as Date).getTime() - (z.abertaEm as Date).getTime());
    for (const os of osParaInserir) os.numero = numeroOs++;
    for (let i = 0; i < osParaInserir.length; i += 200) await tx.insert(schema.ordensServico).values(osParaInserir.slice(i, i + 200));

    await tx.insert(schema.auditoria).values({
      empresaId,
      usuarioId: usuarios[0]!.id,
      entidade: "empresa",
      entidadeId: empresaId,
      acao: "criar",
      resumo: "Ambiente de demonstração criado",
    });
  });
}
