// The signature visual motif for EduBridge: a hand-set "chalk ring" that
// represents a mastery score. A slightly irregular stroke (via two overlaid
// arcs with a tiny offset) keeps it from reading like a stock gauge widget.
export function MasteryRing({
  score,
  size = 88,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = size * 0.09;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  const color = score >= 70 ? "#157A6E" : score >= 45 ? "#E8A33D" : "#D65A46";

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#EDE7D9" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono font-semibold text-ink" style={{ fontSize: size * 0.24 }}>
          {Math.round(score)}%
        </span>
        {label && <span className="text-[10px] text-slate mt-0.5 text-center px-1">{label}</span>}
      </div>
    </div>
  );
}
