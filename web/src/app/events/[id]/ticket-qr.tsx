"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getQrToken } from "../actions";

const WINDOW_MS = 30_000;

// Shows the student's personal QR. The code changes every 30 seconds, so a screenshot
// forwarded to a friend stops working within about a minute.
export function TicketQr({ ticketId }: { ticketId: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fraction, setFraction] = useState(1);

  useEffect(() => {
    let stopped = false;
    let refresh: ReturnType<typeof setTimeout> | undefined;
    let expiresAt = Date.now() + WINDOW_MS;

    async function load() {
      const result = await getQrToken(ticketId);
      if (stopped) return;
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      expiresAt = Date.now() + result.secondsLeft * 1000;
      const dataUrl = await QRCode.toDataURL(result.token, { margin: 1, width: 280, errorCorrectionLevel: "M" });
      if (stopped) return;
      setImage(dataUrl);
      // Fetch the next code just after the current one runs out.
      refresh = setTimeout(load, Math.max(result.secondsLeft * 1000 + 300, 1000));
    }

    void load();
    const tick = setInterval(() => {
      setFraction(Math.min(Math.max((expiresAt - Date.now()) / WINDOW_MS, 0), 1));
    }, 250);

    return () => {
      stopped = true;
      clearTimeout(refresh);
      clearInterval(tick);
    };
  }, [ticketId]);

  if (error) return <p className="text-sm font-semibold text-cherry">{error}</p>;

  return (
    <div className="relative mt-2 inline-flex rotate-[-1.5deg] flex-col items-center gap-3 rounded-[1.75rem] bg-ink p-4 pb-5 text-cream shadow-[0_20px_40px_-20px_rgb(22_19_15/0.7)]">
      <p className="self-start font-mono text-[10px] uppercase tracking-[0.22em] text-amber">admit one // live ticket</p>
      <div className="rounded-2xl bg-paper p-2">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Your personal check-in QR code" width={240} height={240} />
        ) : (
          <div className="h-[240px] w-[240px] animate-pulse rounded-xl bg-sage" aria-label="Loading QR code" />
        )}
      </div>
      <div className="flex w-full items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream/15" aria-hidden>
          <div className="h-full rounded-full bg-amber transition-[width] duration-300 ease-linear" style={{ width: `${fraction * 100}%` }} />
        </div>
        <span className="font-mono text-xs tabular-nums text-amber">{Math.ceil(fraction * 30)}s</span>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-cream/70">re-signs every 30s · screenshots bounce</p>
      <span className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-paper" aria-hidden />
      <span className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-paper" aria-hidden />
    </div>
  );
}
