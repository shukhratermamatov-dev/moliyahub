import { cn } from "@/lib/utils";

export function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const tone = score >= 70 ? "text-ok" : score >= 45 ? "text-warn" : "text-danger";

  return (
    <div className="relative grid size-32 place-items-center">
      <svg viewBox="0 0 100 100" className="size-32 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-line" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          className={tone}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center">
        <div className={cn("font-display text-3xl tabular-nums", tone)}>{score}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted">из 100</div>
      </div>
    </div>
  );
}
