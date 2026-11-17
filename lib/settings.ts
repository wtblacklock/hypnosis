export type VisualStyle = "fractal" | "mandala" | "aurora";
export type AmbientType = "pad" | "ocean" | "rain" | "padOcean" | "none";

export interface Settings {
  style: VisualStyle;
  intensity: number; // 0.2 - 1.5
  narrationVolume: number; // 0 - 1
  ambientVolume: number; // 0 - 1
  ambient: AmbientType;
  minutes: 5 | 10 | 15 | 20;
  reducedMotion: boolean;
  fixation: boolean;
  particles: boolean;
  breathRings: boolean;
  captions: boolean;
  voiceURI: string;
  pace: number; // 0.7 - 1
}

export const STYLES: { id: VisualStyle; name: string; blurb: string }[] = [
  { id: "fractal", name: "Fractal Bloom", blurb: "A slowly turning luminous fractal" },
  { id: "mandala", name: "Mandala", blurb: "Pulsing geometry and breathing rings" },
  { id: "aurora", name: "Aurora", blurb: "Flowing light waves and gradients" },
];

export const AMBIENTS: { id: AmbientType; name: string }[] = [
  { id: "pad", name: "Warm pad" },
  { id: "ocean", name: "Ocean" },
  { id: "rain", name: "Soft rain" },
  { id: "padOcean", name: "Pad + ocean" },
  { id: "none", name: "Silence" },
];

export const DEFAULTS: Settings = {
  style: "fractal",
  intensity: 1.0,
  narrationVolume: 0.9,
  ambientVolume: 0.5,
  ambient: "pad",
  minutes: 10,
  reducedMotion: false,
  fixation: true,
  particles: true,
  breathRings: true,
  captions: true,
  voiceURI: "",
  pace: 0.82,
};

const KEY = "reverie.settings.v2";

export function loadSettings(): Settings {
  const s = { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(s, JSON.parse(raw));
  } catch {}
  try {
    if (!localStorage.getItem(KEY) && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      s.reducedMotion = true;
    }
  } catch {}
  return s;
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}
