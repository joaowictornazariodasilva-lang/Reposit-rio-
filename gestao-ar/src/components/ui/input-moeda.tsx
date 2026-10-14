"use client";

import { useEffect, useState } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

/** Campo de dinheiro em R$ (aceita vírgula), emite número. */
export function InputMoeda({ valor, onChange, className, ...props }: Omit<React.ComponentProps<"input">, "value" | "onChange"> & { valor: number; onChange: (v: number) => void }) {
  const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(2).replace(".", ",") : "");
  const [texto, setTexto] = useState(fmt(valor));
  useEffect(() => {
    setTexto((t) => (Number(t.replace(/\./g, "").replace(",", ".")) === valor ? t : fmt(valor)));
  }, [valor]);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-fg-subtle">R$</span>
      <Input
        {...props}
        inputMode="decimal"
        className={cn("tabular pl-9 text-right", className)}
        value={texto}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d,.]/g, "");
          setTexto(t);
          const n = Number(t.replace(/\./g, "").replace(",", "."));
          onChange(Number.isFinite(n) ? n : 0);
        }}
        onBlur={() => setTexto(fmt(valor))}
      />
    </div>
  );
}
