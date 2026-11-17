export type Phase = "intro" | "induction" | "deepening" | "deep" | "return" | "sleep";

export interface Seg {
  /** spoken text */
  t: string;
  /** relative pause weight (seconds at the baseline length) after speaking */
  p: number;
  /** minimum session length tier: 1 = 5min+, 2 = 10min+, 3 = 15min+, 4 = 20min */
  tier: 1 | 2 | 3 | 4;
  phase: Phase;
}

export type Builder = (phase: Phase) => (t: string, p: number, tier?: 1 | 2 | 3 | 4) => Seg;

export const mk = (phase: Phase) => (t: string, p: number, tier: 1 | 2 | 3 | 4 = 1): Seg => ({ t, p, tier, phase });
