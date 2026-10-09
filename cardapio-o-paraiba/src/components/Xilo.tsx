/**
 * Ilustrações no traço de xilogravura de cordel: formas cheias em tinta,
 * "entalhes" em cor de papel. São decorativas (aria-hidden).
 */

type Props = { className?: string };

export function Sol({ className }: Props) {
  const raios = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <g fill="var(--ink)">
        {raios.map((angulo, i) => (
          <polygon
            key={angulo}
            points={i % 2 === 0 ? '60,2 66,30 54,30' : '60,12 64,32 56,32'}
            transform={`rotate(${angulo} 60 60)`}
          />
        ))}
        <circle cx="60" cy="60" r="27" />
      </g>
      <g fill="none" stroke="var(--paper)" strokeLinecap="round">
        <circle cx="60" cy="60" r="20" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="12" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="60" cy="60" r="4" fill="var(--paper)" strokeWidth="0" />
      </g>
    </svg>
  );
}

export function Mandacaru({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 120 160" aria-hidden="true" focusable="false">
      <g fill="none" stroke="var(--ink)" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 150 V28" strokeWidth="22" />
        <path d="M50 104 H34 Q26 104 26 94 V62" strokeWidth="16" />
        <path d="M70 84 H86 Q94 84 94 74 V44" strokeWidth="16" />
      </g>
      {/* entalhes */}
      <g fill="none" stroke="var(--paper)" strokeWidth="2" strokeLinecap="round">
        <path d="M60 140 V30" />
        <path d="M53 136 V40" strokeDasharray="6 6" />
        <path d="M67 136 V40" strokeDasharray="6 6" />
        <path d="M26 92 V64" />
        <path d="M94 72 V46" />
      </g>
      {/* espinhos */}
      <g stroke="var(--ink)" strokeWidth="2" strokeLinecap="round">
        <path d="M46 46 l-6 -3 M46 66 l-6 -3 M74 56 l6 -3 M74 110 l6 -3 M46 124 l-6 -3 M16 76 l-5 -2 M104 56 l5 -2" />
      </g>
      <path d="M8 152 Q30 144 52 152 T96 152 T116 150" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Panela de barro fumegando — usada no self-service. */
export function Panela({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 120 100" aria-hidden="true" focusable="false">
      <g fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round">
        <path d="M44 30 q-6 -8 0 -16 q6 -8 0 -14" />
        <path d="M62 30 q-6 -8 0 -16 q6 -8 0 -14" />
        <path d="M80 30 q-6 -8 0 -16 q6 -8 0 -14" />
      </g>
      <path d="M14 42 H106 V50 Q106 92 60 94 Q14 92 14 50 Z" fill="var(--ink)" />
      <path d="M4 44 H16 M104 44 H116" stroke="var(--ink)" strokeWidth="8" strokeLinecap="round" />
      <g fill="none" stroke="var(--paper)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M24 56 Q60 64 96 56" />
        <path d="M30 70 Q60 78 90 70" strokeDasharray="5 6" />
      </g>
    </svg>
  );
}
