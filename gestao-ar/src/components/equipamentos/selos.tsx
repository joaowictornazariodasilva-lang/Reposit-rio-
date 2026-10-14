import { ShieldCheck, ShieldAlert, Thermometer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { situacaoGarantia, situacaoLimpeza } from "@/lib/dominio";

export function SeloLimpeza({ proxima, hoje }: { proxima: string | null; hoje: string }) {
  const s = situacaoLimpeza(proxima, hoje);
  const tom = s.estado === "vencida" ? "acento" : s.estado === "proxima" ? "alerta" : s.estado === "em_dia" ? "primario" : "neutro";
  return (
    <Badge tom={tom}>
      <Thermometer aria-hidden /> {s.rotulo}
    </Badge>
  );
}

export function SeloGarantia({ ate, hoje }: { ate: string | null; hoje: string }) {
  const g = situacaoGarantia(ate, hoje);
  if (!g || !g.ativa) return null;
  return (
    <Badge tom={g.vencendo ? "alerta" : "sucesso"}>
      {g.vencendo ? <ShieldAlert aria-hidden /> : <ShieldCheck aria-hidden />} {g.rotulo}
    </Badge>
  );
}
