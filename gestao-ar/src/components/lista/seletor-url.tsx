"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NativeSelect } from "@/components/ui/input";

export function SeletorUrl({ param, rotulo, opcoes, className }: { param: string; rotulo: string; opcoes: { valor: string; rotulo: string }[]; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <NativeSelect
      aria-label={rotulo}
      className={className}
      value={params.get(param) ?? ""}
      onChange={(e) => {
        const sp = new URLSearchParams(params.toString());
        if (e.target.value) sp.set(param, e.target.value);
        else sp.delete(param);
        sp.delete("pagina");
        router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
      }}
    >
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </NativeSelect>
  );
}
