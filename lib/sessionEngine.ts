import { Narrator, preload } from "./narrator";
import { buildScript } from "./scripts";
import type { Phase, Seg } from "./scripts/types";
import type { SessionId } from "./sessions";
import type { Settings } from "./settings";
import type { AmbientEngine } from "./audioEngine";

/** Shared, mutable state read every frame by the visual engine. */
export interface VisualState {
  depth: number; // 0 awake .. 1 deepest (smoothed by renderer)
  targetDepth: number;
  breathPeriod: number; // seconds
  fade: number; // 0..1 global brightness multiplier target
  playing: boolean;
}

export const newVisualState = (): VisualState => ({ depth: 0, targetDepth: 0.1, breathPeriod: 10, fade: 1, playing: false });

const PHASE_DEPTH: Record<Phase, number> = { intro: 0.1, induction: 0.35, deepening: 0.7, deep: 1, return: 0.25, sleep: 1 };
const PHASE_BREATH: Record<Phase, number> = { intro: 9, induction: 10, deepening: 11, deep: 12, return: 8, sleep: 13 };

export type EngineStatus = "idle" | "playing" | "paused" | "done";

export interface EngineView {
  status: EngineStatus;
  caption: string;
  index: number;
  total: number;
  elapsed: number;
  target: number;
  phase: Phase;
}

export class SessionEngine {
  private script: Seg[] = [];
  private index = 0;
  private gen = 0;
  private status: EngineStatus = "idle";
  private elapsed = 0;
  private lastTick = 0;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private gapTimer: ReturnType<typeof setTimeout> | null = null;
  private gapRemaining = 0;
  private gapStart = 0;
  private inGap = false;
  private cps = 11;
  private caption = "";
  private target = 600;
  private narrator = new Narrator();

  constructor(
    private id: SessionId,
    private getSettings: () => Settings,
    private visual: VisualState,
    private audio: AmbientEngine,
    private onUpdate: (v: EngineView) => void,
  ) {}

  start(minutes: number) {
    this.script = buildScript(this.id, minutes);
    this.target = minutes * 60;
    this.index = 0;
    this.elapsed = 0;
    this.cps = 11 * (this.getSettings().pace / 0.82);
    this.status = "playing";
    this.visual.playing = true;
    this.visual.fade = 1;
    this.audio.start();
    this.narrator.unlock();
    this.beginTicker();
    this.run(++this.gen, false);
    this.emit();
  }

  pause() {
    if (this.status !== "playing") return;
    this.gen++;
    this.narrator.cancel();
    if (this.inGap) {
      this.gapRemaining = Math.max(0.3, this.gapRemaining - (performance.now() - this.gapStart) / 1000);
    }
    if (this.gapTimer) clearTimeout(this.gapTimer);
    this.status = "paused";
    this.visual.playing = false;
    this.audio.setPaused(true);
    this.emit();
  }

  resume() {
    if (this.status !== "paused") return;
    this.status = "playing";
    this.visual.playing = true;
    this.lastTick = performance.now();
    this.audio.setPaused(false);
    this.run(++this.gen, this.inGap);
    this.emit();
  }

  /** Jump relative number of segments (-1 = replay current/previous). */
  jump(delta: number) {
    if (this.status === "idle" || this.status === "done") return;
    const wasPlaying = this.status === "playing";
    this.gen++;
    this.narrator.cancel();
    if (this.gapTimer) clearTimeout(this.gapTimer);
    this.inGap = false;
    this.index = Math.max(0, Math.min(this.script.length - 1, this.index + delta));
    this.caption = this.script[this.index].t;
    if (wasPlaying) this.run(++this.gen, false);
    else this.emit();
  }

  stop() {
    this.gen++;
    this.narrator.cancel();
    if (this.gapTimer) clearTimeout(this.gapTimer);
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
    this.status = "idle";
    this.visual.playing = false;
    this.audio.stop(1.5);
    this.emit();
  }

  private beginTicker() {
    this.lastTick = performance.now();
    this.ticker = setInterval(() => {
      const now = performance.now();
      if (this.status === "playing") this.elapsed += (now - this.lastTick) / 1000;
      this.lastTick = now;
      this.emit();
    }, 500);
  }

  private emit() {
    const seg = this.script[Math.min(this.index, this.script.length - 1)];
    this.onUpdate({
      status: this.status,
      caption: this.caption,
      index: this.index,
      total: this.script.length,
      elapsed: this.elapsed,
      target: this.target,
      phase: seg ? seg.phase : "intro",
    });
  }

  private computePause(weight: number): number {
    const remainingSegs = this.script.slice(this.index + 1);
    const remainingWeight = weight + remainingSegs.reduce((a, s) => a + s.p, 0);
    const speech = remainingSegs.reduce((a, s) => a + s.t.length, 0) / this.cps;
    const timeLeft = this.target - this.elapsed - speech;
    const scale = Math.max(0.35, timeLeft / remainingWeight);
    return Math.min(weight * 4, Math.max(1.0, weight * scale));
  }

  private wait(sec: number, gen: number): Promise<void> {
    return new Promise((resolve) => {
      this.inGap = true;
      this.gapRemaining = sec;
      this.gapStart = performance.now();
      this.gapTimer = setTimeout(() => {
        if (gen === this.gen) {
          this.inGap = false;
          resolve();
        }
      }, sec * 1000);
    });
  }

  private async run(gen: number, resumingGap: boolean) {
    while (gen === this.gen && this.index < this.script.length) {
      const seg = this.script[this.index];
      this.visual.targetDepth = PHASE_DEPTH[seg.phase];
      this.visual.breathPeriod = PHASE_BREATH[seg.phase];
      if (!resumingGap) {
        this.caption = seg.t;
        const nx = this.script[this.index + 1];
        if (nx) preload(nx.t);
        this.emit();
        const st = this.getSettings();
        const t0 = performance.now();
        await this.narrator.speak({ text: seg.t, volume: st.narrationVolume, rate: st.pace, voiceURI: st.voiceURI, cps: this.cps });
        if (gen !== this.gen) return;
        const dt = (performance.now() - t0) / 1000;
        if (dt > 1.5 && st.narrationVolume > 0.001) {
          this.cps = this.cps * 0.7 + (seg.t.length / dt) * 0.3; // learn the voice's real pace
        }
        const pause = this.computePause(seg.p);
        if (seg.phase === "sleep" && this.index === this.script.length - 1) this.visual.fade = 0.0;
        await this.wait(pause, gen);
        if (gen !== this.gen) return;
      } else {
        resumingGap = false;
        await this.wait(this.gapRemaining, gen);
        if (gen !== this.gen) return;
      }
      this.index++;
    }
    if (gen !== this.gen) return;
    this.finish();
  }

  private finish() {
    this.caption = "";
    this.status = "done";
    this.visual.playing = false;
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
    this.audio.stop(this.id === "sleep" ? 14 : 5);
    this.emit();
  }
}
