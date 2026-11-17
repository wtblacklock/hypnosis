"use client";
import { useEffect, useState } from "react";
import { AMBIENTS, STYLES, Settings } from "@/lib/settings";
import { getVoices, speechSupported } from "@/lib/narrator";

export function Slider({ label, value, min = 0, max = 1, step = 0.01, onChange, hint, rainbow }: {
  rainbow?: boolean;
  label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void; hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
        <span>{label}</span><span>{hint ?? `${Math.round(pct)}%`}</span>
      </div>
      <input type="range" className={rainbow ? "rainbow" : ""} min={min} max={max} step={step} value={value} style={{ ["--v" as string]: `${pct}%` }}
        onChange={(e) => onChange(parseFloat(e.target.value))} aria-label={label} />
    </label>
  );
}

export function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-left text-sm text-[color:var(--ink)]/85">
      <span>{label}</span>
      <span className={"relative h-5 w-9 rounded-full transition-colors " + (on ? "bg-violet-400/70" : "bg-white/15")}>
        <span className={"absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all " + (on ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-[11px] uppercase tracking-[0.28em] text-violet-200/50">{title}</h3>
    {children}
  </div>
);

export default function Controls({ s, set, showStyle = true }: { s: Settings; set: (p: Partial<Settings>) => void; showStyle?: boolean }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!speechSupported()) return;
    const load = () => setVoices(getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  return (
    <div className="space-y-7">
      {showStyle && (
        <Section title="Visual style">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {STYLES.map((v) => (
              <button key={v.id} onClick={() => set({ style: v.id })} aria-pressed={s.style === v.id}
                className={"rounded-xl border px-2 py-3 text-center text-[13px] transition " +
                  (s.style === v.id ? "border-violet-300/60 bg-violet-400/15 text-white" : "border-white/10 text-white/60 hover:border-white/30")}>
                {v.name}
              </button>
            ))}
          </div>
          <Slider label="Colour" value={s.hue} min={0} max={1} rainbow hint={`${Math.round(s.hue * 360)}°`} onChange={(v) => set({ hue: v })} />
          <Toggle label="Slowly cycle colours" on={s.colorCycle} onChange={(v) => set({ colorCycle: v })} />
          <Slider label="Tunnel zoom speed" value={s.zoom} min={0} max={2} hint={s.zoom === 0 ? "off" : `${s.zoom.toFixed(1)}×`} onChange={(v) => set({ zoom: v })} />
          <Slider label="Visual intensity" value={s.intensity} min={0.2} max={1.5} hint={`${Math.round(s.intensity * 100)}%`} onChange={(v) => set({ intensity: v })} />
        </Section>
      )}

      <Section title="Sound">
        <Slider label="Narration volume" value={s.narrationVolume} onChange={(v) => set({ narrationVolume: v })} />
        <Slider label="Ambient volume" value={s.ambientVolume} onChange={(v) => set({ ambientVolume: v })} />
        <div className="flex flex-wrap gap-2">
          {AMBIENTS.map((a) => (
            <button key={a.id} onClick={() => set({ ambient: a.id })} aria-pressed={s.ambient === a.id}
              className={"rounded-full border px-3 py-1.5 text-xs transition " +
                (s.ambient === a.id ? "border-teal-300/60 bg-teal-300/15 text-white" : "border-white/10 text-white/55 hover:border-white/30")}>
              {a.name}
            </button>
          ))}
        </div>
        {speechSupported() && voices.length > 0 && (
          <label className="block">
            <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">Voice</div>
            <select value={s.voiceURI} onChange={(e) => set({ voiceURI: e.target.value })}>
              <option value="">Automatic (best available)</option>
              {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
            </select>
          </label>
        )}
        <Slider label="Voice pace" value={s.pace} min={0.65} max={1} hint={s.pace < 0.78 ? "slower" : s.pace > 0.9 ? "faster" : "natural"} onChange={(v) => set({ pace: v })} />
      </Section>

      <Section title="Comfort">
        <Toggle label="Reduced motion" on={s.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
        <Toggle label="Fixation point" on={s.fixation} onChange={(v) => set({ fixation: v })} />
        <Toggle label="Breathing rings" on={s.breathRings} onChange={(v) => set({ breathRings: v })} />
        <Toggle label="Drifting particles" on={s.particles} onChange={(v) => set({ particles: v })} />
        <Toggle label="Captions" on={s.captions} onChange={(v) => set({ captions: v })} />
      </Section>
    </div>
  );
}
