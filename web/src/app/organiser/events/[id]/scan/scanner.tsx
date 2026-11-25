"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkInTicket, type ScanResult } from "../../../actions";

const MESSAGES: Record<string, string> = {
  invalid_code: "Not a valid ticket.",
  code_expired: "This QR code has expired. Ask the student to open their ticket again (it refreshes every 30 seconds).",
  already_checked_in: "Already checked in.",
  wrong_event: "This ticket belongs to another organiser's event.",
  ticket_not_valid: "This ticket is no longer valid.",
  outside_window: "Check-in is not open for this event right now.",
};

function describe(result: ScanResult) {
  if (result.ok) return "Checked in";
  if (result.error) return result.error;
  return MESSAGES[result.reason ?? ""] ?? "Check-in failed.";
}

export function Scanner() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const busy = useRef(false);
  const lastToken = useRef<{ token: string; at: number } | null>(null);

  const submit = useCallback(async (token: string) => {
    const now = Date.now();
    // The camera sees the same code many times a second; ignore repeats for a few seconds.
    if (busy.current || (lastToken.current && lastToken.current.token === token && now - lastToken.current.at < 4000)) return;
    busy.current = true;
    lastToken.current = { token, at: now };
    try {
      setResult(await checkInTicket(token));
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        scanner = new Html5Qrcode("qr-reader");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => void submit(text),
          () => {},
        );
      } catch {
        setCameraError("Camera unavailable. Allow camera access (HTTPS is required), or paste the code below.");
      }
    })();

    return () => {
      cancelled = true;
      if (scanner?.isScanning) void scanner.stop().catch(() => {});
    };
  }, [submit]);

  const tone = result?.ok
    ? "bg-forest text-cream"
    : result?.reason === "already_checked_in"
      ? "bg-amber text-ink"
      : "bg-cherry text-cream";

  return (
    <div className="space-y-4">
      <div id="qr-reader" className="min-h-40 overflow-hidden rounded-[var(--radius-bento)] bg-ink" />
      {cameraError && <p className="rounded-2xl bg-amber/40 px-4 py-2 text-sm font-semibold">{cameraError}</p>}

      <form
        className="flex gap-2 rounded-full bg-paper p-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("token") as HTMLInputElement;
          if (input.value.trim()) void submit(input.value.trim());
          input.value = "";
        }}
      >
        <input
          name="token"
          aria-label="Ticket code"
          placeholder="Or paste ticket code"
          className="min-w-0 flex-1 rounded-full bg-transparent px-4 py-2 font-mono text-xs outline-none"
        />
        <button type="submit" className="rounded-full bg-ink px-4 py-2 font-display text-xs uppercase text-cream">
          Check in
        </button>
      </form>

      {result && (
        <div role="status" className={`space-y-1 rounded-[var(--radius-bento)] p-6 ${tone}`}>
          <p className="font-display text-2xl uppercase leading-tight">{describe(result)}</p>
          {result.full_name !== undefined && (
            <>
              {result.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.photo_url} alt={`Profile photo of ${result.full_name ?? "the student"}`} width={96} height={96} className="h-24 w-24 rounded-2xl object-cover ring-4 ring-paper/60" />
              )}
              <p className="pt-2 text-xl font-bold">{result.full_name || "Name not set"}</p>
              <p className="font-mono text-sm opacity-90">
                {result.matric_no ?? "No matric number"}
                {result.programme ? ` · ${result.programme}` : ""}
              </p>
              {result.event && <p className="font-mono text-[11px] uppercase opacity-70">{result.event}</p>}
            </>
          )}
          {result.first_at && (
            <p className="font-mono text-xs opacity-80">
              First scanned at {new Date(result.first_at).toLocaleTimeString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
