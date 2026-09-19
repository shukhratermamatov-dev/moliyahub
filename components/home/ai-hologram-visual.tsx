import styles from "./ai-hologram-visual.module.css";

const TICK_COUNT = 60;
const TICK_CENTER = { x: 430, y: 300 };
const TICK_R1 = 232;
const TICK_R2 = 244;

const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
  const a = (i / TICK_COUNT) * Math.PI * 2;
  const x1 = TICK_CENTER.x + TICK_R1 * Math.cos(a);
  const y1 = TICK_CENTER.y + TICK_R1 * Math.sin(a);
  const x2 = TICK_CENTER.x + TICK_R2 * Math.cos(a);
  const y2 = TICK_CENTER.y + TICK_R2 * Math.sin(a);
  const major = i % 5 === 0;
  return {
    key: i,
    x1: x1.toFixed(2),
    y1: y1.toFixed(2),
    x2: x2.toFixed(2),
    y2: y2.toFixed(2),
    strokeWidth: major ? 2 : 1,
    opacity: major ? 0.7 : 0.35,
  };
});

const BADGES: Array<{
  key: string;
  x: number;
  y: number;
  delay: string;
  glowDelay: string;
  icon: React.ReactNode;
}> = [
  {
    key: "growth",
    x: 430,
    y: 112,
    delay: "0s",
    glowDelay: "0s",
    icon: (
      <g stroke="#a9f7e8" strokeWidth={2} fill="none" strokeLinecap="round">
        <rect x={-14} y={2} width={7} height={12} />
        <rect x={-3} y={-4} width={7} height={18} />
        <rect x={8} y={-10} width={7} height={24} />
        <path d="M-15,-9 L-3,-16 L9,-13 L15,-20" stroke="#d8b168" />
      </g>
    ),
  },
  {
    key: "calculator",
    x: 614,
    y: 231,
    delay: ".4s",
    glowDelay: ".5s",
    icon: (
      <g stroke="#a9f7e8" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x={-13} y={-16} width={26} height={32} rx={3} />
        <rect x={-9} y={-11} width={18} height={7} fill="#3fd0e0" stroke="none" opacity={0.5} />
        <circle cx={-7} cy={2} r={1.6} fill="#a9f7e8" stroke="none" />
        <circle cx={0} cy={2} r={1.6} fill="#a9f7e8" stroke="none" />
        <circle cx={7} cy={2} r={1.6} fill="#a9f7e8" stroke="none" />
        <circle cx={-7} cy={9} r={1.6} fill="#a9f7e8" stroke="none" />
        <circle cx={0} cy={9} r={1.6} fill="#a9f7e8" stroke="none" />
        <circle cx={7} cy={9} r={1.6} fill="#a9f7e8" stroke="none" />
      </g>
    ),
  },
  {
    key: "calendar",
    x: 562,
    y: 446,
    delay: ".8s",
    glowDelay: "1s",
    icon: (
      <g stroke="#a9f7e8" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x={-15} y={-11} width={30} height={26} rx={3} />
        <line x1={-15} y1={-3} x2={15} y2={-3} />
        <line x1={-8} y1={-16} x2={-8} y2={-9} />
        <line x1={8} y1={-16} x2={8} y2={-9} />
        <circle cx={-7} cy={5} r={1.5} fill="#d8b168" stroke="none" />
        <circle cx={0} cy={5} r={1.5} fill="#a9f7e8" stroke="none" />
        <circle cx={7} cy={5} r={1.5} fill="#a9f7e8" stroke="none" />
      </g>
    ),
  },
  {
    key: "pie",
    x: 298,
    y: 446,
    delay: "1.2s",
    glowDelay: "1.5s",
    icon: (
      <g stroke="#a9f7e8" strokeWidth={2} strokeLinejoin="round">
        <circle cx={0} cy={0} r={15} fill="none" />
        <path d="M0,0 L0,-15 A15,15 0 0,1 13,7.5 Z" fill="#3fd0e0" opacity={0.7} stroke="none" />
        <line x1={0} y1={0} x2={0} y2={-15} />
        <line x1={0} y1={0} x2={13} y2={7.5} />
      </g>
    ),
  },
  {
    key: "clipboard",
    x: 246,
    y: 231,
    delay: "1.6s",
    glowDelay: "2s",
    icon: (
      <g stroke="#a9f7e8" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x={-13} y={-15} width={26} height={32} rx={3} />
        <rect x={-6} y={-18} width={12} height={6} rx={1.5} fill="#0c2420" />
        <line x1={-7} y1={-5} x2={7} y2={-5} />
        <line x1={-7} y1={1} x2={7} y2={1} />
        <line x1={-7} y1={7} x2={3} y2={7} />
      </g>
    ),
  },
];

const FINGERTIPS = [
  { cx: 224.9, cy: 498.4, r: 5, delay: "0s" },
  { cx: 309.8, cy: 390.3, r: 5.5, delay: ".4s" },
  { cx: 413.1, cy: 350.6, r: 6, delay: ".8s" },
  { cx: 523.3, cy: 386.1, r: 5.5, delay: "1.2s" },
  { cx: 571.4, cy: 450.3, r: 5, delay: "1.6s" },
];

/**
 * Decorative animated hologram: a circuit-pattern hand holding up a
 * rotating analytics dashboard ring, orbited by five feature badges.
 * Purely decorative next to the hero heading, so it's marked aria-hidden.
 */
export function AiHologramVisual() {
  return (
    <div className={styles.wrap}>
      <span className={styles.tag}>Moving faster with AI</span>
      <svg
        className={styles.svg}
        viewBox="0 0 800 650"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="ia-coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#123b33" />
            <stop offset="70%" stopColor="#081a17" />
            <stop offset="100%" stopColor="#050e0d" />
          </radialGradient>
          <linearGradient id="ia-handStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8ff2df" />
            <stop offset="100%" stopColor="#2fb8c7" />
          </linearGradient>
        </defs>

        {/* ambient glow behind everything */}
        <circle cx={430} cy={300} r={270} fill="url(#ia-coreGlow)" opacity={0.9} />

        {/* forearm + hand, circuit-line style */}
        <g stroke="url(#ia-handStroke)" fill="none" strokeLinejoin="round" strokeLinecap="round">
          <path
            d="M330,690 L540,690 L610,760 L150,760 Z"
            strokeWidth={2.5}
            opacity={0.85}
            fill="rgba(63,208,224,0.07)"
          />
          <path
            className={styles.handTrace}
            d="M360,700 L430,700 M300,730 L560,730"
            strokeWidth={1.5}
            opacity={0.5}
          />

          {/* palm */}
          <path
            d="M352,566 C316,548 292,566 284,604 C278,646 296,682 344,694 L526,694 C566,682 572,646 562,606 C554,566 528,552 492,568 L466,586 L430,592 L396,584 Z"
            strokeWidth={2.5}
            fill="rgba(63,208,224,0.09)"
          />
          <path
            className={styles.handTrace}
            d="M330,600 L400,610 M460,600 L530,614 M400,640 L470,644"
            strokeWidth={1.3}
            opacity={0.45}
          />
          <circle className={styles.handTrace} cx={360} cy={620} r={3} fill="#8ff2df" stroke="none" opacity={0.6} />
          <circle className={styles.handTrace} cx={500} cy={630} r={3} fill="#8ff2df" stroke="none" opacity={0.6} />

          {/* thumb */}
          <g transform="rotate(-62 352 566)">
            <path d="M326,566 L336,442 L352,422 L368,442 L378,566 Z" strokeWidth={2.3} fill="rgba(63,208,224,0.12)" />
            <path className={styles.handTrace} d="M332,518 L372,518 M330,478 L374,478" strokeWidth={1.2} />
          </g>
          {/* index */}
          <g transform="rotate(-24 396 584)">
            <path d="M372,584 L380,392 L396,372 L412,392 L420,584 Z" strokeWidth={2.3} fill="rgba(63,208,224,0.12)" />
            <path className={styles.handTrace} d="M378,518 L414,518 M377,455 L415,455" strokeWidth={1.2} />
          </g>
          {/* middle */}
          <g transform="rotate(-4 430 592)">
            <path d="M405,592 L412,370 L430,350 L448,370 L455,592 Z" strokeWidth={2.3} fill="rgba(63,208,224,0.12)" />
            <path className={styles.handTrace} d="M412,518 L448,518 M411,448 L449,448" strokeWidth={1.2} />
          </g>
          {/* ring finger */}
          <g transform="rotate(16 466 586)">
            <path d="M442,586 L449,398 L466,378 L483,398 L490,586 Z" strokeWidth={2.3} fill="rgba(63,208,224,0.12)" />
            <path className={styles.handTrace} d="M449,518 L483,518 M448,458 L484,458" strokeWidth={1.2} />
          </g>
          {/* pinky */}
          <g transform="rotate(34 492 568)">
            <path d="M470,568 L475,444 L492,426 L509,444 L514,568 Z" strokeWidth={2.1} fill="rgba(63,208,224,0.12)" />
            <path className={styles.handTrace} d="M475,518 L509,518" strokeWidth={1.2} />
          </g>
        </g>
        <g fill="#a9f7e8">
          {FINGERTIPS.map((f) => (
            <circle
              key={f.cx}
              className={styles.fingertip}
              cx={f.cx}
              cy={f.cy}
              r={f.r}
              style={{ animationDelay: f.delay }}
            />
          ))}
        </g>

        {/* outer dashed ring, slow rotation */}
        <g className={styles.rotCw}>
          <circle
            cx={430}
            cy={300}
            r={300}
            fill="none"
            stroke="#3fd0e0"
            strokeWidth={1.4}
            strokeDasharray="1.5 13"
            opacity={0.55}
          />
        </g>

        {/* tick ring, opposite rotation */}
        <g className={styles.rotCcw}>
          {ticks.map((t) => (
            <line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="#58c79b"
              strokeWidth={t.strokeWidth}
              opacity={t.opacity}
            />
          ))}
        </g>

        {/* segmented ring */}
        <g className={styles.rotCw} style={{ animationDuration: "80s" }}>
          <circle
            cx={430}
            cy={300}
            r={255}
            fill="none"
            stroke="#58c79b"
            strokeWidth={2}
            strokeDasharray="46 9 12 9"
            opacity={0.6}
          />
        </g>

        {/* radial spokes to icon badges */}
        <g stroke="#3fd0e0" strokeWidth={1} opacity={0.25}>
          <line x1={430} y1={300} x2={430} y2={112} />
          <line x1={430} y1={300} x2={614} y2={231} />
          <line x1={430} y1={300} x2={562} y2={446} />
          <line x1={430} y1={300} x2={298} y2={446} />
          <line x1={430} y1={300} x2={246} y2={231} />
        </g>

        {/* main glowing ring */}
        <circle className={styles.pulseRing} cx={430} cy={300} r={168} fill="none" stroke="#3fd0e0" strokeWidth={4} />
        <circle cx={430} cy={300} r={150} fill="url(#ia-coreGlow)" stroke="#1ea87a" strokeWidth={1.5} opacity={0.95} />

        {/* central analytics glyph: bars + trend + percentage ring */}
        <g>
          <line x1={358} y1={350} x2={452} y2={350} stroke="#3fd0e0" strokeWidth={1.5} opacity={0.5} />
          <g fill="#58c79b">
            <rect className={styles.bar} x={362} y={322} width={14} height={28} rx={2} style={{ animationDelay: "0s" }} />
            <rect className={styles.bar} x={384} y={305} width={14} height={45} rx={2} style={{ animationDelay: ".3s" }} />
            <rect className={styles.bar} x={406} y={283} width={14} height={67} rx={2} style={{ animationDelay: ".6s" }} />
            <rect className={styles.bar} x={428} y={262} width={14} height={88} rx={2} style={{ animationDelay: ".9s" }} />
          </g>
          <polyline
            points="369,308 391,288 413,262 435,238"
            fill="none"
            stroke="#d8b168"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.85}
          />
          <g fill="#d8b168">
            <circle className={styles.dotPulse} cx={369} cy={308} r={3.4} />
            <circle className={styles.dotPulse} cx={391} cy={288} r={3.4} style={{ animationDelay: ".5s" }} />
            <circle className={styles.dotPulse} cx={413} cy={262} r={3.4} style={{ animationDelay: "1s" }} />
            <circle className={styles.dotPulse} cx={435} cy={238} r={3.4} style={{ animationDelay: "1.5s" }} />
          </g>
          <circle cx={486} cy={305} r={35} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth={9} />
          <circle
            className={styles.pctArc}
            cx={486}
            cy={305}
            r={35}
            fill="none"
            stroke="#3fd0e0"
            strokeWidth={9}
            strokeLinecap="round"
            transform="rotate(-90 486 305)"
          />
        </g>

        {/* 5 orbiting icon badges */}
        <g fontFamily="Manrope, sans-serif">
          {BADGES.map((b) => (
            <g key={b.key} transform={`translate(${b.x},${b.y})`}>
              <g className={styles.badge} style={{ animationDelay: b.delay }}>
                <circle
                  className={styles.badgeGlow}
                  r={38}
                  fill="#0c2420"
                  stroke="#3fd0e0"
                  strokeWidth={2}
                  style={{ animationDelay: b.glowDelay }}
                />
                {b.icon}
              </g>
            </g>
          ))}
        </g>

        {/* ambient drifting particles */}
        <g fill="#8ff2df">
          <circle className={styles.drift} cx={180} cy={180} r={2} style={{ animationDelay: ".2s" }} />
          <circle className={styles.drift} cx={660} cy={150} r={2.4} style={{ animationDelay: "1.4s" }} />
          <circle className={styles.drift} cx={700} cy={420} r={2} style={{ animationDelay: "2.6s" }} />
          <circle className={styles.drift} cx={150} cy={380} r={2.2} style={{ animationDelay: "3.6s" }} />
        </g>
      </svg>
    </div>
  );
}
