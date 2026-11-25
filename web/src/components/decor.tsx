// Decorative, purely visual pieces (all aria-hidden). Server-safe: no hooks, no randomness at render.

type Svg = { className?: string };

export function Sparkle({ className }: Svg) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
      <path d="M24 4v10M10 12l6 7M38 12l-6 7" />
    </svg>
  );
}

export function SquiggleArrow({ className }: Svg) {
  return (
    <svg viewBox="0 0 80 60" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10c14-6 24 2 22 12s-14 10-12 2 20-10 30 2 12 20 20 24" />
      <path d="M58 40l10 10-14 2" />
    </svg>
  );
}

export function LogoMark({ className }: Svg) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M20 2c10 0 18 7 18 17 0 11-9 19-19 19C9 38 2 31 2 22 2 11 10 2 20 2z" fill="var(--color-amber)" />
      <path d="M13 15l-5 5 5 5M27 15l5 5-5 5M22 12l-4 16" fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Deterministic pseudo-random generator so the same seed always draws the same pattern.
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
}

// A decorative QR-like pixel grid (not scannable). The real ticket QR is generated separately.
export function PixelQr({ seed, className, color = "var(--color-ink)" }: Svg & { seed: string; color?: string }) {
  const size = 21;
  const rand = rng(seed);
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
      if (inBox(ox, oy)) {
        const dx = x - ox;
        const dy = y - oy;
        const ring = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        return ring || core ? 1 : 0;
      }
    }
    return -1;
  };
  const cells: [number, number][] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const f = finder(x, y);
      const on = f === -1 ? rand() > 0.52 : f === 1;
      if (on) cells.push([x, y]);
    }
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden shapeRendering="crispEdges">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />
      ))}
    </svg>
  );
}

// An event ticket card with perforated edges, used as the hero "object".
export function Ticket({
  title,
  meta,
  seed,
  tone = "paper",
  notch = "bg-amber",
  className = "",
}: {
  title: string;
  meta: string;
  seed: string;
  tone?: "paper" | "cream" | "ink";
  notch?: string;
  className?: string;
}) {
  const bg = tone === "ink" ? "bg-ink text-cream" : tone === "cream" ? "bg-cream text-ink" : "bg-paper text-ink";
  const qrColor = tone === "ink" ? "var(--color-amber)" : "var(--color-ink)";
  return (
    <div className={`relative flex w-64 items-stretch rounded-[1.4rem] shadow-[0_18px_40px_-18px_rgb(22_19_15/0.55)] ${bg} ${className}`}>
      <div className="flex flex-1 flex-col justify-between p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] opacity-60">admit one // fcsit</p>
        <p className="font-display text-xl uppercase leading-none">{title}</p>
        <p className="font-mono text-[10px] opacity-70">{meta}</p>
      </div>
      <div className="relative flex w-24 items-center justify-center border-l-2 border-dashed border-current/25 p-3">
        <PixelQr seed={seed} className="h-16 w-16" color={qrColor} />
        <span className={`absolute -top-3 -left-3 h-6 w-6 rounded-full ${notch}`} />
        <span className={`absolute -bottom-3 -left-3 h-6 w-6 rounded-full ${notch}`} />
      </div>
    </div>
  );
}

export function Blob({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[50%] bg-forest px-6 py-3 text-center text-amber shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

export function LiveDot({ className = "" }: Svg) {
  return (
    <span className={`relative inline-flex h-2.5 w-2.5 ${className}`} aria-hidden>
      <span className="absolute inset-0 animate-ping-soft rounded-full bg-cherry" />
      <span className="relative h-2.5 w-2.5 rounded-full bg-cherry" />
    </span>
  );
}
