"use client";
import Controls from "./Controls";
import { Settings } from "@/lib/settings";
import { SessionMeta } from "@/lib/sessions";

const LENGTHS = [5, 10, 15, 20] as const;

export default function SetupPanel({ session, s, set, onBegin, onBack }: {
  session: SessionMeta; s: Settings; set: (p: Partial<Settings>) => void; onBegin: () => void; onBack: () => void;
}) {
  return (
    <main className="absolute inset-0 overflow-y-auto scroll-soft bg-gradient-to-t from-black/70 via-black/30 to-black/10">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-5 pb-10 pt-6">
        <button onClick={onBack} className="self-start py-2 text-sm text-white/50 hover:text-white/90">← Sessions</button>
        <div className="rise mt-6 flex-1">
          <h2 className="serif text-4xl text-white/95">{session.name}</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">{session.blurb}</p>

          <div className="mt-8">
            <div className="mb-2 text-[11px] uppercase tracking-[0.28em] text-violet-200/50">Length</div>
            <div className="grid grid-cols-4 gap-2">
              {LENGTHS.map((m) => (
                <button key={m} onClick={() => set({ minutes: m })} aria-pressed={s.minutes === m}
                  className={"rounded-xl border py-3 text-sm transition " +
                    (s.minutes === m ? "border-violet-300/60 bg-violet-400/15 text-white" : "border-white/10 text-white/60 hover:border-white/30")}>
                  {m} min
                </button>
              ))}
            </div>
          </div>

          <div className="glass mt-8 rounded-2xl p-5"><Controls s={s} set={set} /></div>
        </div>

        <div className="sticky bottom-0 -mx-5 mt-8 bg-gradient-to-t from-[#03040d] via-[#03040d]/85 to-transparent px-5 pb-4 pt-8">
          <button onClick={onBegin}
            className="w-full rounded-full border border-white/25 bg-white/10 py-4 text-sm uppercase tracking-[0.35em] text-white backdrop-blur-md transition hover:bg-white/20">
            Begin
          </button>
          <p className="mt-3 text-center text-[11px] text-white/35">Headphones recommended · Tap the screen during a session for controls</p>
        </div>
      </div>
    </main>
  );
}
