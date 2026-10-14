"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Dialog as D } from "radix-ui";
import { AirVent, ClipboardList, FileText, Keyboard, LogOut, Menu, Moon, Plus, Search, Sun, UserPlus, X } from "lucide-react";
import type { Sessao } from "@/server/auth/session";
import { sair } from "@/server/auth/actions";
import { NOME_PERFIL, pode } from "@/lib/permissions";
import { iniciais } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { NovoClienteSheet } from "@/components/clientes/novo-cliente-sheet";
import { NovoEquipamentoSheet } from "@/components/equipamentos/novo-equipamento-sheet";
import { NavLista, Sidebar, type GrupoNav } from "./sidebar";
import { Atalho, CommandPalette, type AcaoPaleta } from "./command-palette";

type Props = {
  sessao: Sessao;
  empresa: { nome: string; logo: string | null };
  grupos: GrupoNav[];
  recolhidoInicial: boolean;
  children: React.ReactNode;
};

export function AppShell(props: Props) {
  return (
    <TooltipProvider delayDuration={300}>
      <Suspense>
        <Shell {...props} />
      </Suspense>
    </TooltipProvider>
  );
}

function Shell({ sessao, empresa, grupos, recolhidoInicial, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [recolhido, setRecolhido] = useState(recolhidoInicial);
  const [menuMobil, setMenuMobil] = useState(false);
  const [paleta, setPaleta] = useState(false);
  const [ajuda, setAjuda] = useState(false);

  const p = (x: Parameters<typeof pode>[1]) => pode(sessao.perfil, x);

  const alternarMenu = useCallback(() => {
    setRecolhido((r) => {
      document.cookie = `menu=${r ? "aberto" : "recolhido"}; path=/; max-age=31536000; samesite=lax`;
      return !r;
    });
  }, []);

  /** Abre um painel de criação em qualquer tela via ?novo=… (o "voltar" fecha). */
  const abrirNovo = useCallback(
    (tipo: string, extra?: Record<string, string>) => {
      const sp = new URLSearchParams(params.toString());
      sp.set("novo", tipo);
      for (const [k, v] of Object.entries(extra ?? {})) sp.set(k, v);
      router.push(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );
  const fecharNovo = useCallback(() => {
    const sp = new URLSearchParams(params.toString());
    sp.delete("novo");
    sp.delete("cliente");
    const s = sp.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  const acoes = useMemo<AcaoPaleta[]>(() => {
    const a: AcaoPaleta[] = [];
    if (p("os.ver")) a.push({ id: "nova-os", rotulo: "Nova ordem de serviço", icone: "clipboard-list", href: "/ordens/nova", atalho: "n o", palavras: "os abrir criar" });
    if (p("clientes.editar")) a.push({ id: "novo-cliente", rotulo: "Novo cliente", icone: "users", href: `${pathname}?novo=cliente`, atalho: "n c", palavras: "cadastrar pessoa empresa" });
    if (p("equipamentos.editar")) a.push({ id: "novo-equip", rotulo: "Novo equipamento", icone: "air-vent", href: `${pathname}?novo=equipamento`, atalho: "n e", palavras: "aparelho split cadastrar" });
    if (p("vendas.ver")) a.push({ id: "novo-orc", rotulo: "Novo orçamento", icone: "file-text", href: "/vendas", palavras: "orcamento proposta" });
    if (p("importar")) a.push({ id: "importar", rotulo: "Importar planilha", icone: "file-spreadsheet", href: "/importar", palavras: "excel csv migrar" });
    if (p("cadastros.editar")) a.push({ id: "novo-produto", rotulo: "Novo produto ou peça", icone: "package", href: "/cadastros/produtos?novo=produto", palavras: "peça sku" });
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao.perfil, pathname]);

  const navegacao = useMemo<AcaoPaleta[]>(
    () => grupos.flatMap((g) => g.itens.map((i) => ({ id: i.href, rotulo: i.rotulo, icone: i.icone, href: i.href, atalho: i.atalho }))),
    [grupos],
  );

  // Atalhos globais: Ctrl/⌘+K, "?", "[", sequências "g c", "n c"…
  const seq = useRef<{ k: string; t: number } | null>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaleta((v) => !v);
        return;
      }
      const alvo = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || alvo?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (e.key === "?") {
        e.preventDefault();
        setAjuda(true);
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        setPaleta(true);
        return;
      }
      if (e.key === "[") {
        alternarMenu();
        return;
      }
      const k = e.key.toLowerCase();
      const ant = seq.current;
      if (ant && Date.now() - ant.t < 1200) {
        const combo = `${ant.k} ${k}`;
        seq.current = null;
        const destino = [...acoes, ...navegacao].find((a) => a.atalho === combo);
        if (destino) {
          e.preventDefault();
          router.push(destino.href);
        }
        return;
      }
      if (k === "g" || k === "n") seq.current = { k, t: Date.now() };
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [acoes, navegacao, router, alternarMenu]);

  const novo = params.get("novo");

  return (
    <div className="flex min-h-dvh">
      <a href="#conteudo" className="sr-only z-[60] rounded-md bg-primary px-3 py-2 text-primary-fg focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Pular para o conteúdo
      </a>
      <Sidebar grupos={grupos} recolhido={recolhido} alternar={alternarMenu} empresa={empresa} podeCriarOs={p("os.ver")} />

      {/* Menu no celular/tablet */}
      <D.Root open={menuMobil} onOpenChange={setMenuMobil}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-fade-in lg:hidden" />
          <D.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,86vw)] flex-col bg-surface shadow-lg outline-none data-[state=open]:animate-slide-in-left lg:hidden" aria-describedby={undefined}>
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <D.Title asChild>
                <div><Logo nome={empresa.nome} logoUrl={empresa.logo} /></div>
              </D.Title>
              <D.Close className="grid size-11 place-items-center rounded-md text-fg-muted hover:bg-surface-3" aria-label="Fechar menu">
                <X className="size-5" />
              </D.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavLista grupos={grupos} recolhido={false} aoNavegar={() => setMenuMobil(false)} />
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-bg/85 px-3 backdrop-blur-md sm:gap-3 sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuMobil(true)} aria-label="Abrir menu">
            <Menu className="size-5" />
          </Button>

          <button
            type="button"
            onClick={() => setPaleta(true)}
            className="group flex h-11 min-w-0 flex-1 items-center gap-3 rounded-md border border-border bg-surface px-3 text-left text-sm text-fg-subtle shadow-xs transition-colors hover:border-border-strong sm:h-9 sm:max-w-md"
            aria-label="Buscar (Ctrl+K)"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate">Buscar cliente, aparelho, OS…</span>
            <span className="ml-auto hidden items-center gap-1 sm:flex">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => setAjuda(true)} aria-label="Atalhos de teclado" title="Atalhos de teclado (?)">
              <Keyboard className="size-[18px]" />
            </Button>
            <AlternarTema />
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-1 flex h-11 items-center gap-2.5 rounded-md pl-1 pr-1 hover:bg-surface-3 sm:h-10 sm:pr-2.5" aria-label="Menu do usuário">
                <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-fg">{iniciais(sessao.nome)}</span>
                <span className="hidden text-left leading-tight md:block">
                  <span className="block text-xs font-medium text-fg">{sessao.nome}</span>
                  <span className="block text-2xs text-fg-subtle">{NOME_PERFIL[sessao.perfil]}</span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60">
                <DropdownMenuLabel>
                  <span className="block text-sm font-medium text-fg">{sessao.nome}</span>
                  <span className="block truncate">{sessao.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {p("empresa.configurar") ? (
                  <DropdownMenuItem asChild>
                    <Link href="/configuracoes">Configurações da empresa</Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onSelect={() => setAjuda(true)}>
                  <Keyboard /> Atalhos de teclado
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void sair()}>
                  <LogOut /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="conteudo" className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-8">
          {children}
        </main>
      </div>

      <BotaoCriar
        podeOs={p("os.ver")}
        podeCliente={p("clientes.editar")}
        podeEquip={p("equipamentos.editar")}
        podeOrc={p("vendas.ver")}
        abrirNovo={abrirNovo}
      />

      <CommandPalette aberto={paleta} setAberto={setPaleta} acoes={acoes} navegacao={navegacao} />
      <AjudaAtalhos aberto={ajuda} setAberto={setAjuda} itens={[...acoes, ...navegacao].filter((a) => a.atalho)} />

      {p("clientes.editar") ? <NovoClienteSheet aberto={novo === "cliente"} aoFechar={fecharNovo} /> : null}
      {p("equipamentos.editar") ? <NovoEquipamentoSheet aberto={novo === "equipamento"} clienteId={params.get("cliente")} aoFechar={fecharNovo} /> : null}
    </div>
  );
}

function AlternarTema() {
  const { resolvedTheme, setTheme } = useTheme();
  const escuro = resolvedTheme === "dark";
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(escuro ? "light" : "dark")} aria-label="Alternar tema claro/escuro" title="Alternar tema claro/escuro">
      <Sun className="hidden size-[18px] dark:block" />
      <Moon className="size-[18px] dark:hidden" />
    </Button>
  );
}

function BotaoCriar({ podeOs, podeCliente, podeEquip, podeOrc, abrirNovo }: { podeOs: boolean; podeCliente: boolean; podeEquip: boolean; podeOrc: boolean; abrirNovo: (t: string) => void }) {
  if (!podeOs && !podeCliente && !podeEquip) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "fixed bottom-5 right-4 z-40 grid size-14 place-items-center rounded-full bg-accent text-accent-fg shadow-lg transition-[transform,background-color] duration-150 hover:bg-accent-hover data-[state=open]:rotate-45 sm:bottom-6 sm:right-6",
        )}
        aria-label="Criar novo"
      >
        <Plus className="size-6" strokeWidth={2.4} />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" sideOffset={10} className="w-60">
        <DropdownMenuLabel>Criar</DropdownMenuLabel>
        {podeOs ? (
          <DropdownMenuItem asChild>
            <Link href="/ordens/nova"><ClipboardList /> Ordem de serviço <span className="ml-auto"><Atalho seq="n o" /></span></Link>
          </DropdownMenuItem>
        ) : null}
        {podeOrc ? (
          <DropdownMenuItem asChild>
            <Link href="/vendas"><FileText /> Orçamento</Link>
          </DropdownMenuItem>
        ) : null}
        {podeCliente ? (
          <DropdownMenuItem onSelect={() => abrirNovo("cliente")}>
            <UserPlus /> Cliente <span className="ml-auto"><Atalho seq="n c" /></span>
          </DropdownMenuItem>
        ) : null}
        {podeEquip ? (
          <DropdownMenuItem onSelect={() => abrirNovo("equipamento")}>
            <AirVent /> Equipamento <span className="ml-auto"><Atalho seq="n e" /></span>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AjudaAtalhos({ aberto, setAberto, itens }: { aberto: boolean; setAberto: (v: boolean) => void; itens: AcaoPaleta[] }) {
  const fixos = [
    { rotulo: "Busca e ações rápidas", teclas: ["Ctrl", "K"] },
    { rotulo: "Busca (alternativo)", teclas: ["/"] },
    { rotulo: "Recolher/expandir menu", teclas: ["["] },
    { rotulo: "Mostrar esta ajuda", teclas: ["?"] },
  ];
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogContent titulo="Atalhos de teclado" descricao="No Mac, use ⌘ no lugar de Ctrl. Sequências: aperte uma tecla e depois a outra.">
        <ul className="grid gap-1 text-sm">
          {fixos.map((f) => (
            <li key={f.rotulo} className="flex items-center justify-between gap-4 py-1.5">
              <span className="text-fg-muted">{f.rotulo}</span>
              <span className="flex gap-1">{f.teclas.map((t) => <Kbd key={t}>{t}</Kbd>)}</span>
            </li>
          ))}
          {itens.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-4 border-t border-border py-1.5">
              <span className="text-fg-muted">{i.rotulo}</span>
              <span className="flex gap-1">{i.atalho!.split(" ").map((t, n) => <Kbd key={n}>{t.toUpperCase()}</Kbd>)}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
