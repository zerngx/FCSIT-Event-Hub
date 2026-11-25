import Link from "next/link";
import { cacheLife } from "next/cache";
import { Blob, LiveDot, PixelQr, Sparkle, SquiggleArrow, Ticket } from "@/components/decor";
import { createPublicClient } from "@/lib/supabase/public";
import { formatDateTime } from "@/lib/format";
import { btnDark, heading, monoTag } from "@/lib/ui";

const steps = [
  { n: "01", title: "Discover", text: "Every FCSIT event in one feed. No more digging through ten group chats.", tone: "bg-amber" },
  { n: "02", title: "Register", text: "Profile filled once. Seats, waitlists and confirmations handled for you.", tone: "bg-sky" },
  { n: "03", title: "Get your QR", text: "A personal ticket that re-signs itself every 30 seconds.", tone: "bg-tangerine" },
  { n: "04", title: "Check in", text: "Organiser scans, sees your name and matric no. Attendance done.", tone: "bg-forest text-cream" },
];

const ticker = [
  "registration open",
  "rotating qr tickets",
  "zero screenshots accepted",
  "auto waitlist",
  "attendance in one tap",
  "csv export for organisers",
];

export default function Home() {
  return (
    <div className="space-y-5">
      {/* ---------- Bento hero ---------- */}
      <section className="grid grid-cols-1 gap-5 *:min-w-0 lg:grid-cols-3 lg:grid-rows-[auto_auto_auto]">
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-[var(--radius-bento)] bg-amber p-6 sm:p-8 lg:col-span-2 lg:row-span-2">
          <Sparkle className="absolute top-10 left-8 h-10 w-10 -rotate-12 text-paper" />
          <Sparkle className="absolute right-10 bottom-32 h-9 w-9 rotate-[160deg] text-paper" />
          <p className={`${monoTag} relative z-10 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-cream`}>
            <LiveDot /> fcsit · universiti malaya
          </p>

          <h1 className="sr-only">FCSIT Event Hub: discover, register for and check in to FCSIT events</h1>
          <p
            aria-hidden
            className={`${heading} pointer-events-none relative z-0 mt-6 text-center text-[clamp(4rem,17vw,8rem)] text-paper select-none lg:text-left lg:text-[clamp(5rem,9vw,8.5rem)]`}
          >
            Let&apos;s
            <br />
            gooo!
          </p>

          {/* Floating ticket stack: the hero "object" */}
          {/* Outer wrappers place each ticket; the inner Ticket carries the float animation. */}
          <div className="relative z-10 mx-auto mt-6 mb-4 h-[19rem] w-72 lg:absolute lg:top-16 lg:right-6 lg:m-0 xl:right-10">
            <div className="absolute top-0 left-2">
              <Ticket title="Road to DevFest" meta="02 DEC · DK1" seed="devfest" tone="cream" className="animate-float-slow [--tilt:-12deg]" />
            </div>
            <div className="absolute top-[5.5rem] left-6">
              <Ticket title="Hackathon 101" meta="28 NOV · THE CUBE" seed="hack" tone="ink" className="animate-float [--tilt:7deg]" />
            </div>
            <div className="absolute top-[11rem] left-0">
              <Ticket title="Git & GitHub" meta="25 NOV · THE CUBE" seed="git" className="animate-float-slow [--tilt:-5deg]" />
            </div>
            <Blob className="absolute -right-2 bottom-2 z-20 -rotate-12">
              <span className="font-mono text-[10px] tracking-widest text-cream">ENTRY</span>
              <span className="font-display text-3xl leading-none">FREE</span>
            </Blob>
          </div>

          <div className="relative z-10 mt-2 flex flex-wrap items-end justify-between gap-6 lg:mt-24">
            <p className="max-w-48 text-sm font-semibold">Every FCSIT event, one tap away. Made for students, by students.</p>
            <p className="flex items-center gap-3">
              <span className="text-5xl font-thin">(</span>
              <span className="text-center">
                <span className="block font-display text-4xl leading-none">30s</span>
                <span className="font-mono text-[10px] uppercase tracking-widest">qr refresh</span>
              </span>
              <span className="text-5xl font-thin">)</span>
            </p>
            <div className="flex gap-2" aria-label="Event types">
              {["</>", "🏆", "🎤"].map((g, i) => (
                <span
                  key={g}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${i === 0 ? "border-ink bg-paper" : "border-transparent bg-paper/60"} font-mono text-sm font-bold`}
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sky card: hackathons */}
        <div className="relative overflow-hidden rounded-[var(--radius-bento)] bg-sky p-6 sm:p-7">
          <h2 className={`${heading} text-center text-5xl`}>Hack</h2>
          <p className="mt-1 text-center text-sm font-semibold">Hackathons, workshops and talks</p>
          <div className="relative mt-5 flex items-end justify-between gap-3">
            <div className="relative">
              <p className="animate-wiggle font-mono text-sm font-bold uppercase leading-tight">
                join
                <br />
                now
              </p>
              <SquiggleArrow className="mt-1 h-10 w-14 text-ink" />
            </div>
            <div className="w-44 -rotate-3 rounded-2xl bg-ink p-3 font-mono text-[11px] leading-5 text-cream shadow-xl">
              <div className="mb-2 flex gap-1.5" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-cherry" />
                <span className="h-2 w-2 rounded-full bg-amber" />
                <span className="h-2 w-2 rounded-full bg-forest-soft" />
              </div>
              <p><span className="text-amber">$</span> fcsit join</p>
              <p className="text-forest-soft">✓ seat reserved</p>
              <p>
                <span className="text-amber">$</span> <span className="inline-block h-3 w-1.5 translate-y-0.5 animate-blink bg-cream" />
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <Link href="/events" className={`${btnDark} flex-1`}>
              Explore
            </Link>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber font-display text-lg" aria-hidden>
              ↗
            </span>
          </div>
        </div>

        {/* Tangerine card: check-in */}
        <div className="relative overflow-hidden rounded-[var(--radius-bento)] bg-tangerine p-6 sm:p-7 lg:row-span-2">
          <h2 className={`${heading} text-center text-[2.6rem]`}>Check-in</h2>
          <div className="relative mx-auto mt-6 w-fit">
            <div className="rotate-3 rounded-3xl bg-paper p-4 shadow-xl">
              <PixelQr seed="checkin-demo" className="h-36 w-36" />
              <div className="mt-3 h-1.5 w-36 overflow-hidden rounded-full bg-ink/10">
                <div className="h-full w-2/3 rounded-full bg-ink" />
              </div>
            </div>
            <Blob className="absolute -top-5 -right-10 rotate-12">
              <span className="font-display text-2xl leading-none">30s</span>
            </Blob>
            <Sparkle className="absolute -bottom-4 -left-10 h-9 w-9 rotate-[200deg] text-paper" />
          </div>
          <p className="mx-auto mt-8 max-w-56 text-center text-sm font-semibold">
            Your QR re-signs itself every 30 seconds. Forwarded screenshots simply bounce.
          </p>
          <p className={`${monoTag} mt-4 text-center text-ink/70`}>hmac-sha256 · one scan per ticket</p>
        </div>

        {/* Up next */}
        <div className="rounded-[var(--radius-bento)] bg-paper p-6 sm:p-8 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
            <div>
              <p className={`${monoTag} text-muted`}>{"// live feed"}</p>
              <h2 className={`${heading} text-5xl sm:text-6xl`}>
                Up
                <br />
                next
              </h2>
            </div>
            <UpNext />
          </div>
        </div>
      </section>

      {/* ---------- Ticker ---------- */}
      <div className="overflow-hidden rounded-full bg-ink py-3 text-cream" aria-hidden>
        <div className="flex w-max animate-marquee gap-8 font-mono text-xs uppercase tracking-[0.2em]">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} className="flex items-center gap-8">
              {t} <span className="text-amber">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ---------- How it works ---------- */}
      <section id="how" className="scroll-mt-6 rounded-[var(--radius-bento)] bg-paper p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className={`${heading} text-4xl sm:text-5xl`}>How it works</h2>
          <p className={`${monoTag} text-muted`}>4 steps · 0 google forms</p>
        </div>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.n}
              className={`rounded-3xl p-5 transition hover:-translate-y-1 hover:rotate-0 ${s.tone} ${i % 2 ? "rotate-1" : "-rotate-1"}`}
            >
              <p className="font-mono text-xs font-bold">{s.n}</p>
              <h3 className="mt-6 font-display text-2xl uppercase leading-none">{s.title}</h3>
              <p className="mt-2 text-sm">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Organisers ---------- */}
      <section id="organisers" className="grid scroll-mt-6 grid-cols-1 gap-5 *:min-w-0 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[var(--radius-bento)] bg-forest p-6 text-cream sm:p-8">
          <p className={`${monoTag} text-amber`}>{"// for societies & staff"}</p>
          <h2 className={`${heading} mt-2 text-4xl text-amber sm:text-5xl`}>Run the room</h2>
          <ul className="mt-5 space-y-2 text-sm">
            {[
              "Publish an event in under a minute",
              "Seat limits and waitlists enforced by the database",
              "Scan tickets at the door and see who is really there",
              "Registered, attended and absent lists with CSV export",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="text-amber">→</span>
                {t}
              </li>
            ))}
          </ul>
          <Link href="/signup" className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 font-display text-sm uppercase text-ink transition hover:-translate-y-0.5">
            Request organiser access
          </Link>
        </div>
        <div className="rounded-[var(--radius-bento)] bg-ink p-6 font-mono text-sm leading-7 text-cream sm:p-8" aria-label="Example check-in log">
          <p className="text-muted">{"# door scanner, 7:36 pm"}</p>
          <p><span className="text-amber">scan</span> 25000123 → <span className="text-forest-soft">✓ checked in</span></p>
          <p><span className="text-amber">scan</span> 25000123 → <span className="text-amber">! already checked in</span></p>
          <p><span className="text-amber">scan</span> screenshot.png → <span className="text-cherry">✗ code expired</span></p>
          <p><span className="text-amber">scan</span> 24205825 → <span className="text-forest-soft">✓ checked in</span></p>
          <p className="mt-3 text-muted">{"// attended: 2 · absent: 0 · proxies: 0"}</p>
        </div>
      </section>
    </div>
  );
}

const tones = ["bg-amber", "bg-sky", "bg-tangerine", "bg-forest-soft", "bg-sage"];

// Public list, cached for a few minutes so the landing page stays fast.
async function UpNext() {
  "use cache";
  cacheLife("minutes");

  const { data } = await createPublicClient().rpc("public_upcoming_events", { p_limit: 3 });
  const events = data ?? [];

  if (!events.length) {
    return <p className="text-sm text-muted">No upcoming events yet. Check back soon.</p>;
  }

  return (
    <ul className="divide-y-2 divide-sage">
      {events.map((e, i) => (
        <li key={e.event_id} className="flex items-center gap-4 py-3">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${tones[i % tones.length]}`}>
            {e.mode === "application" ? "APP" : "OPEN"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{e.title}</p>
            <p className="truncate text-xs text-muted">
              {formatDateTime(e.start_at)} · {e.venue ?? "Venue TBA"}
            </p>
          </div>
          <p className="hidden text-right font-mono text-xs sm:block">
            <span className="block font-display text-lg leading-none">{e.seats_left}</span>
            seats left
          </p>
          <Link
            href={`/events/${e.event_id}`}
            aria-label={`View ${e.title}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-xl text-amber transition hover:rotate-90"
          >
            +
          </Link>
        </li>
      ))}
    </ul>
  );
}
