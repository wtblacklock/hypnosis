import type { AmbientType } from "./settings";

/** Generative ambient sound built entirely with the Web Audio API (no audio files). */
export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private padGain!: GainNode;
  private oceanGain!: GainNode;
  private rainGain!: GainNode;
  private started = false;
  private volume = 0.5;
  private type: AmbientType = "pad";
  private paused = false;
  private nodes: { stop?: () => void }[] = [];

  /** Must be called from a user gesture. */
  ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    return this.ctx;
  }

  private noiseBuffer(ctx: AudioContext, seconds = 6) {
    const buf = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.099046; // pink-ish noise
        b1 = 0.963 * b1 + w * 0.2965164;
        b2 = 0.57 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
      }
    }
    return buf;
  }

  private reverb(ctx: AudioContext) {
    const len = ctx.sampleRate * 4;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    return conv;
  }

  private lfo(ctx: AudioContext, freq: number, depth: number, target: AudioParam) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    g.gain.value = depth;
    o.connect(g).connect(target);
    o.start();
    this.nodes.push({ stop: () => o.stop() });
  }

  private build() {
    const ctx = this.ctx!;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // --- Warm pad: stacked detuned sines through a slowly breathing low-pass + reverb
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 700;
    padFilter.Q.value = 0.4;
    this.lfo(ctx, 0.045, 260, padFilter.frequency);
    const rev = this.reverb(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    padFilter.connect(this.padGain);
    padFilter.connect(rev);
    rev.connect(wet).connect(this.padGain);
    this.padGain.connect(this.master);
    const freqs = [73.42, 146.83, 220.0, 293.66, 329.63, 440.0]; // D2 D3 A3 D4 E4 A4 (open, unresolved)
    freqs.forEach((f, i) => {
      [-5, 5].forEach((cents) => {
        const o = ctx.createOscillator();
        o.type = i < 2 ? "sine" : "triangle";
        o.frequency.value = f;
        o.detune.value = cents;
        const g = ctx.createGain();
        g.gain.value = (i < 2 ? 0.16 : 0.05) / (1 + i * 0.15);
        this.lfo(ctx, 0.02 + Math.random() * 0.05, g.gain.value * 0.6, g.gain);
        o.connect(g).connect(padFilter);
        o.start();
        this.nodes.push({ stop: () => o.stop() });
      });
    });

    // --- Ocean: filtered noise with ~11s swells
    const nbuf = this.noiseBuffer(ctx);
    this.oceanGain = ctx.createGain();
    this.oceanGain.gain.value = 0;
    const src = ctx.createBufferSource();
    src.buffer = nbuf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 520;
    const swell = ctx.createGain();
    swell.gain.value = 0.55;
    this.lfo(ctx, 0.09, 0.4, swell.gain);
    this.lfo(ctx, 0.09, 220, lp.frequency);
    src.connect(lp).connect(swell).connect(this.oceanGain).connect(this.master);
    src.start();
    this.nodes.push({ stop: () => src.stop() });

    // --- Rain: soft band-limited noise
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    const rsrc = ctx.createBufferSource();
    rsrc.buffer = nbuf;
    rsrc.loop = true;
    rsrc.playbackRate.value = 1.3;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1400;
    const bp = ctx.createBiquadFilter();
    bp.type = "lowpass";
    bp.frequency.value = 7000;
    rsrc.connect(hp).connect(bp).connect(this.rainGain).connect(this.master);
    rsrc.start();
    this.nodes.push({ stop: () => rsrc.stop() });
  }

  private applyMix(t = 3) {
    if (!this.ctx || !this.started) return;
    const now = this.ctx.currentTime;
    const set = (g: GainNode, v: number) => {
      g.gain.cancelScheduledValues(now);
      g.gain.setTargetAtTime(v, now, t / 3);
    };
    set(this.padGain, this.type === "pad" ? 1 : this.type === "padOcean" ? 0.7 : 0);
    set(this.oceanGain, this.type === "ocean" ? 1.1 : this.type === "padOcean" ? 0.7 : 0);
    set(this.rainGain, this.type === "rain" ? 0.5 : 0);
  }

  start() {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    if (!this.started) {
      this.build();
      this.started = true;
    }
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.volume * 0.7, now, 2.5);
    this.applyMix(2);
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.ctx && this.started && !this.paused) {
      this.master.gain.setTargetAtTime(v * 0.7, this.ctx.currentTime, 0.2);
    }
  }

  setType(t: AmbientType) {
    this.type = t;
    this.applyMix(2.5);
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (!this.ctx || !this.started) return;
    // Keep a quieter bed while paused so the space doesn't go dead
    this.master.gain.setTargetAtTime(p ? this.volume * 0.25 : this.volume * 0.7, this.ctx.currentTime, 0.6);
  }

  /** Fade out and tear everything down. */
  stop(fadeSeconds = 2) {
    if (!this.ctx || !this.started) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now, fadeSeconds / 3);
    const nodes = this.nodes;
    this.nodes = [];
    this.started = false;
    setTimeout(() => {
      nodes.forEach((n) => {
        try {
          n.stop?.();
        } catch {}
      });
      try {
        this.master.disconnect();
      } catch {}
    }, fadeSeconds * 1000 + 600);
  }
}
