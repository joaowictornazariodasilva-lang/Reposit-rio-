import { moeda } from "@/lib/format";

/** Mini-colunas dos últimos 6 meses (série única, sem legenda; valores no hover e para leitores de tela). */
export function MiniColunas({ valores, rotulos }: { valores: number[]; rotulos: string[] }) {
  const max = Math.max(1, ...valores);
  const w = 9;
  const gap = 3;
  const h = 32;
  return (
    <figure className="m-0">
      <svg width={valores.length * (w + gap) - gap} height={h} role="img" aria-label={`Faturamento dos últimos ${valores.length} meses: ${valores.map((v, i) => `${rotulos[i]} ${moeda(v)}`).join("; ")}`}>
        {valores.map((v, i) => {
          const bh = Math.max(3, (v / max) * h);
          const atual = i === valores.length - 1;
          return (
            <g key={i}>
              <title>{`${rotulos[i]}: ${moeda(v)}`}</title>
              <rect x={i * (w + gap) - 2} y={0} width={w + 4} height={h} fill="transparent" />
              <rect x={i * (w + gap)} y={h - bh} width={w} height={bh} rx={3} className={atual ? "fill-primary" : "fill-primary/25"} />
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
