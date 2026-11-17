import type { VisualStyle } from "./settings";

export type SessionId = "relaxation" | "alcohol" | "habits" | "confidence" | "stress" | "sleep";

export interface SessionMeta {
  id: SessionId;
  name: string;
  blurb: string;
  /** three glow colours (rgb 0-1) used by the visuals */
  palette: [number[], number[], number[]];
  accent: string; // css gradient for cards
  style: VisualStyle;
}

const c = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export const SESSIONS: SessionMeta[] = [
  { id: "relaxation", name: "Relaxation", blurb: "Melt tension and rest in deep calm", style: "fractal",
    palette: [c("#6d5bd0"), c("#2fb5b0"), c("#f0b46a")], accent: "linear-gradient(135deg,#6d5bd0,#2fb5b0)" },
  { id: "alcohol", name: "Alcohol Cravings", blurb: "Ride out urges and choose freedom", style: "aurora",
    palette: [c("#2f8fbf"), c("#27b59a"), c("#e0a85c")], accent: "linear-gradient(135deg,#2f8fbf,#27b59a)" },
  { id: "habits", name: "Breaking Habits", blurb: "Loosen old patterns, install new ones", style: "mandala",
    palette: [c("#7a5cd6"), c("#3f86d6"), c("#e8b565")], accent: "linear-gradient(135deg,#7a5cd6,#3f86d6)" },
  { id: "confidence", name: "Confidence", blurb: "Rehearse calm, steady self-belief", style: "mandala",
    palette: [c("#e0a050"), c("#8a63d6"), c("#37b3c0")], accent: "linear-gradient(135deg,#e0a050,#8a63d6)" },
  { id: "stress", name: "Stress Relief", blurb: "Release the day, return to centre", style: "aurora",
    palette: [c("#2fb5b0"), c("#4f7fd8"), c("#8d6fd8")], accent: "linear-gradient(135deg,#2fb5b0,#4f7fd8)" },
  { id: "sleep", name: "Better Sleep", blurb: "Drift gently down into sleep", style: "fractal",
    palette: [c("#4d4fb8"), c("#7a4fb0"), c("#3c8cc0")], accent: "linear-gradient(135deg,#4d4fb8,#7a4fb0)" },
];

export const sessionById = (id: SessionId) => SESSIONS.find((s) => s.id === id)!;
