import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { lerSessao } from "@/server/auth/session";
import { LogoMarca } from "@/components/brand/logo";
import { FormLogin } from "./form-login";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ de?: string }> }) {
  if (await lerSessao()) redirect("/");
  const { de } = await searchParams;
  const demo = process.env.DEMO_SEED !== "false";
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[#06262d] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <FluxoDeAr />
        <div className="relative flex items-center gap-3">
          <LogoMarca className="size-9" />
          <span className="text-base font-semibold tracking-tight">Brisa Gestão</span>
        </div>
        <div className="relative max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight">
            A operação da sua empresa de ar condicionado, <span className="text-[#7fd8e5]">sem planilha e sem correria.</span>
          </p>
          <ul className="mt-8 grid gap-3 text-sm text-[#c4dde2]">
            <li className="flex gap-3"><Ponto /> Ficha de cada aparelho com histórico completo</li>
            <li className="flex gap-3"><Ponto /> Lembrete de limpeza com WhatsApp pronto em 1 clique</li>
            <li className="flex gap-3"><Ponto /> OS, agenda, estoque e financeiro no mesmo lugar</li>
          </ul>
        </div>
        <p className="relative text-xs text-[#8fb3ba]">Fortaleza · CE</p>
      </section>

      <section className="flex flex-col justify-center px-4 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMarca className="size-9" />
            <span className="text-base font-semibold tracking-tight">Brisa Gestão</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-1 text-sm text-fg-muted">Use o e-mail e a senha cadastrados pela sua empresa.</p>
          <FormLogin de={de} demo={demo} />
        </div>
      </section>
    </main>
  );
}

function Ponto() {
  return <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#fb8a3c]" aria-hidden />;
}

/** Linhas de fluxo de ar — assinatura visual da marca. Estática (sem custo de motion). */
function FluxoDeAr() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="#38bdd0" stopOpacity="0" />
          <stop offset="0.5" stopColor="#38bdd0" stopOpacity="0.35" />
          <stop offset="1" stopColor="#38bdd0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="r" cx="0.85" cy="0.1" r="0.7">
          <stop offset="0" stopColor="#0b5f6e" stopOpacity="0.9" />
          <stop offset="1" stopColor="#06262d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="800" fill="url(#r)" />
      {Array.from({ length: 14 }, (_, i) => (
        <path
          key={i}
          d={`M-20 ${180 + i * 38} C 160 ${140 + i * 38}, 300 ${230 + i * 34}, 640 ${170 + i * 40}`}
          fill="none"
          stroke="url(#g)"
          strokeWidth={i % 4 === 0 ? 1.6 : 0.8}
        />
      ))}
    </svg>
  );
}
