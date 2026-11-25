import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Bagel_Fat_One, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { LogoMark } from "@/components/decor";
import { UserNav } from "./user-nav";
import "./globals.css";

const display = Bagel_Fat_One({ variable: "--font-bagel", weight: "400", subsets: ["latin"] });
const sans = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FCSIT Event Hub",
  description:
    "Discover, register for and check in to FCSIT events in one place. Universiti Malaya WIA2006 project.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-5 sm:gap-4">
          <Link href="/" aria-label="FCSIT Event Hub home" className="group flex items-center gap-2.5">
            <LogoMark className="h-9 w-9 shrink-0 transition group-hover:rotate-12" />
            <span className="hidden font-display text-lg uppercase leading-none tracking-tight min-[400px]:inline">
              FCSIT<span className="block text-[11px] tracking-[0.25em] text-muted">event hub</span>
            </span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-semibold md:flex">
            <Link href="/events" className="hover:underline decoration-2 underline-offset-4">Events</Link>
            <Link href="/#how" className="hover:underline decoration-2 underline-offset-4">How it works</Link>
            <Link href="/#organisers" className="hover:underline decoration-2 underline-offset-4">For organisers</Link>
          </nav>
          {/* Reads the session cookie, so it streams in behind a Suspense boundary. */}
          <Suspense fallback={<span className="h-10 w-28 rounded-full bg-ink/10" aria-hidden />}>
            <UserNav />
          </Suspense>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12">{children}</main>
        <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 font-mono text-[11px] uppercase tracking-wider text-muted">
          <span>{"// WIA2006 · Group Suibian · Universiti Malaya"}</span>
          <span>built with next.js + postgres</span>
        </footer>
      </body>
    </html>
  );
}
