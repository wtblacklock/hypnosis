"use client";
import { SESSIONS, SessionId } from "@/lib/sessions";

export default function SessionSelect({ onPick }: { onPick: (id: SessionId) => void }) {
  return (
    <main className="absolute inset-0 overflow-y-auto scroll-soft bg-gradient-to-b from-black/45 via-black/25 to-black/60">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-5 py-14">
        <header className="rise mb-10 text-center">
          <h1 className="serif text-5xl tracking-[0.18em] text-white/95 sm:text-6xl">REVERIE</h1>
          <p className="mt-3 text-sm text-[color:var(--muted)]">Guided hypnosis, visualization &amp; deep relaxation</p>
        </header>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SESSIONS.map((s, i) => (
            <button key={s.id} onClick={() => onPick(s.id)} style={{ animationDelay: `${150 + i * 90}ms` }}
              className="rise glass group relative overflow-hidden rounded-2xl px-5 py-5 text-left transition hover:border-white/30">
              <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-2xl transition group-hover:opacity-60"
                style={{ background: s.accent }} />
              <span className="relative block text-lg text-white/95">{s.name}</span>
              <span className="relative mt-1 block text-[13px] text-[color:var(--muted)]">{s.blurb}</span>
            </button>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-md text-center text-[11px] leading-relaxed text-white/35">
          Best with headphones, in a quiet place. Never use while driving or operating machinery. This is a relaxation tool,
          not medical treatment. If you drink heavily, speak to a doctor before cutting back.
        </p>
      </div>
    </main>
  );
}
