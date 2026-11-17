"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Controls from "./Controls";
import type { EngineView } from "@/lib/sessionEngine";
import type { Settings } from "@/lib/settings";

const fmt = (s: number) => {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const Icon = {
  play: <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>,
  pause: <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1" /><rect x="13.5" y="5" width="4" height="14" rx="1" /></svg>,
  prev: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M6 6h2v12H6zM9.5 12 19 18V6z" /></svg>,
  next: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M16 6h2v12h-2zM5 18l9.5-6L5 6z" /></svg>,
  gear: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 8h10M18 8h2M4 16h2M10 16h10" /><circle cx="16" cy="8" r="2" /><circle cx="8" cy="16" r="2" /></svg>,
};

export default function Player({ view, s, set, onToggle, onJump, onEnd, spotifyMsg }: {
  spotifyMsg?: string; view: EngineView; s: Settings; set: (p: Partial<Settings>) => void;
  onToggle: () => void; onJump: (d: number) => void; onEnd: () => void;
}) {
  const [show, setShow] = useState(true);
  const [sheet, setSheet] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paused = view.status === "paused";

  const poke = useCallback(() => {
    setShow(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 3800);
  }, []);
  useEffect(() => { poke(); return () => { if (timer.current) clearTimeout(timer.current); }; }, [poke]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); onToggle(); poke(); }
      if (e.code === "Escape") setSheet(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onToggle, poke]);

  const visible = show || paused || sheet;
  const progress = Math.min(1, view.elapsed / Math.max(1, view.target));

  return (
    <div className="absolute inset-0 select-none" onPointerMove={poke} onPointerDown={() => { if (!sheet) poke(); }}>
      {/* captions */}
      {s.captions && view.caption && (
        <p key={view.index} className="fadein serif pointer-events-none absolute inset-x-0 bottom-[19%] mx-auto max-w-xl px-8 text-center text-lg leading-relaxed text-white/80 sm:text-xl"
          style={{ textShadow: "0 0 24px rgba(5,6,20,.95), 0 0 6px rgba(5,6,20,.9)" }}>
          {view.caption}
        </p>
      )}

      {spotifyMsg && (
        <p className="pointer-events-none absolute inset-x-0 top-16 mx-auto max-w-sm px-6 text-center text-xs text-amber-200/80">{spotifyMsg}</p>
      )}

      {/* top bar */}
      <div className={"absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] transition-opacity duration-700 " + (visible ? "opacity-100" : "pointer-events-none opacity-0")}>
        <button onClick={onEnd} className="rounded-full px-3 py-2 text-sm text-white/60 hover:text-white">✕ End</button>
        <span className="text-xs tabular-nums tracking-widest text-white/45">{fmt(Math.max(0, view.target - view.elapsed))}</span>
        <button onClick={() => setSheet(true)} aria-label="Settings" className="rounded-full p-2 text-white/60 hover:text-white">{Icon.gear}</button>
      </div>

      {/* transport */}
      <div className={"absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 pb-[max(2rem,env(safe-area-inset-bottom))] transition-opacity duration-700 " + (visible ? "opacity-100" : "pointer-events-none opacity-0")}>
        <div className="flex items-center gap-8">
          <button onClick={() => { onJump(-1); poke(); }} aria-label="Previous line" className="rounded-full p-3 text-white/55 hover:text-white">{Icon.prev}</button>
          <button onClick={() => { onToggle(); poke(); }} aria-label={paused ? "Resume" : "Pause"}
            className="glass grid h-16 w-16 place-items-center rounded-full text-white transition hover:bg-white/15">
            {paused ? Icon.play : Icon.pause}
          </button>
          <button onClick={() => { onJump(1); poke(); }} aria-label="Next line" className="rounded-full p-3 text-white/55 hover:text-white">{Icon.next}</button>
        </div>
      </div>

      {/* hairline progress, always visible */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-white/5">
        <div className="h-full bg-gradient-to-r from-violet-400/70 to-teal-300/70" style={{ width: `${progress * 100}%`, transition: "width .6s linear" }} />
      </div>

      {/* settings sheet */}
      {sheet && (
        <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center" onPointerDown={(e) => { if (e.target === e.currentTarget) setSheet(false); }}>
          <div className="glass scroll-soft rise max-h-[82vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="serif text-2xl text-white/90">Adjust</h3>
              <button onClick={() => setSheet(false)} className="px-2 text-sm text-white/60 hover:text-white">Done</button>
            </div>
            <Controls s={s} set={set} />
          </div>
        </div>
      )}
    </div>
  );
}
