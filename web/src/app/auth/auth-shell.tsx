import { PixelQr, Sparkle } from "@/components/decor";
import { heading, monoTag } from "@/lib/ui";

// Two-panel bento used by the sign-in and sign-up pages.
export function AuthShell({
  title,
  kicker,
  tone,
  children,
}: {
  title: string;
  kicker: string;
  tone: "sky" | "amber";
  children: React.ReactNode;
}) {
  const bg = tone === "sky" ? "bg-sky" : "bg-amber";
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 *:min-w-0 md:grid-cols-2">
      <div className={`relative hidden min-h-[28rem] overflow-hidden rounded-[var(--radius-bento)] p-8 md:block ${bg}`}>
        <Sparkle className="absolute top-8 right-8 h-10 w-10 rotate-12 text-paper" />
        <p className={`${monoTag}`}>{kicker}</p>
        <h1 className={`${heading} mt-3 text-6xl text-paper [text-shadow:0_3px_0_rgb(22_19_15/0.15)]`}>{title}</h1>
        <div className="absolute right-8 bottom-8 left-8 rotate-[-4deg] rounded-3xl bg-ink p-4 font-mono text-xs leading-6 text-cream">
          <p className="text-muted">{"// your ticket, re-signed every 30s"}</p>
          <div className="mt-2 flex items-center gap-4">
            <span className="rounded-xl bg-cream p-2">
              <PixelQr seed={title} className="h-16 w-16" />
            </span>
            <span>
              <span className="text-amber">status</span>: ready
              <br />
              <span className="text-amber">proxies</span>: 0
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center rounded-[var(--radius-bento)] bg-paper p-6 sm:p-8">
        <h1 className={`${heading} mb-6 text-4xl md:hidden`}>{title}</h1>
        {children}
      </div>
    </div>
  );
}
