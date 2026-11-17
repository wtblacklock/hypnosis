import { VERT, FRACTAL, MANDALA, AURORA } from "./shaders";
import type { VisualState } from "./sessionEngine";
import type { Settings, VisualStyle } from "./settings";

const FRAGS: Record<VisualStyle, string> = { fractal: FRACTAL, mandala: MANDALA, aurora: AURORA };
const UNIFORMS = ["u_res", "u_time", "u_breath", "u_depth", "u_intensity", "u_motion", "u_fade", "u_c0", "u_c1", "u_c2"] as const;

interface Prog {
  p: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null>;
}

interface Particle { x: number; y: number; r: number; vx: number; vy: number; ph: number; hue: number }

export class VisualEngine {
  private gl: WebGLRenderingContext | null;
  private ctx2: CanvasRenderingContext2D;
  private progs: Partial<Record<VisualStyle, Prog>> = {};
  private raf = 0;
  private last = 0;
  private t = 0;
  private breathPhase = 0;
  private depth = 0;
  private styleFade = 1;
  private shownStyle: VisualStyle;
  private scale = 0.5;
  private slowFrames = 0;
  private particles: Particle[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private visible = true;
  private palette: number[][] = [[0.4, 0.35, 0.8], [0.2, 0.7, 0.7], [0.9, 0.7, 0.4]];
  private paletteTarget: number[][] = this.palette.map((c) => [...c]);
  private onVis = () => { this.visible = !document.hidden; this.last = performance.now(); };
  private onCtxLost = (e: Event) => { e.preventDefault(); this.gl = null; };
  webglOk: boolean;

  constructor(
    private glCanvas: HTMLCanvasElement,
    private fxCanvas: HTMLCanvasElement,
    private settings: () => Settings,
    private state: VisualState,
  ) {
    this.shownStyle = settings().style;
    this.gl = glCanvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "default" });
    this.ctx2 = fxCanvas.getContext("2d")!;
    this.webglOk = !!this.gl;
    if (this.gl) this.setupGL();
    for (let i = 0; i < 70; i++) this.particles.push(this.newParticle(true));
    glCanvas.addEventListener("webglcontextlost", this.onCtxLost);
    document.addEventListener("visibilitychange", this.onVis);
  }

  private setupGL() {
    const gl = this.gl!;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  }

  private program(style: VisualStyle): Prog | null {
    const gl = this.gl;
    if (!gl) return null;
    if (this.progs[style]) return this.progs[style]!;
    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = mk(gl.VERTEX_SHADER, VERT);
    const fs = mk(gl.FRAGMENT_SHADER, FRAGS[style]);
    if (!vs || !fs) return null;
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, "p");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    const u: Record<string, WebGLUniformLocation | null> = {};
    UNIFORMS.forEach((n) => (u[n] = gl.getUniformLocation(p, n)));
    return (this.progs[style] = { p, u });
  }

  setPalette(p: number[][]) {
    this.paletteTarget = p.map((c) => [...c]);
  }

  private newParticle(initial: boolean): Particle {
    return {
      x: Math.random(), y: initial ? Math.random() : 1.05,
      r: 0.6 + Math.random() * 1.8, vx: (Math.random() - 0.5) * 0.004, vy: -(0.004 + Math.random() * 0.012),
      ph: Math.random() * 6.28, hue: Math.random(),
    };
  }

  resize() {
    const rect = this.glCanvas.parentElement!.getBoundingClientRect();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.fxCanvas.width = Math.round(this.w * this.dpr);
    this.fxCanvas.height = Math.round(this.h * this.dpr);
    this.applyScale();
  }

  private applyScale() {
    this.glCanvas.width = Math.max(2, Math.round(this.w * this.scale));
    this.glCanvas.height = Math.max(2, Math.round(this.h * this.scale));
  }

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      if (!this.visible) return;
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.frame(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.onVis);
    this.glCanvas.removeEventListener("webglcontextlost", this.onCtxLost);
  }

  private frame(dt: number) {
    const s = this.settings();
    const st = this.state;
    const reduced = s.reducedMotion;

    // Smooth everything: no sudden changes anywhere.
    this.depth += (st.targetDepth - this.depth) * Math.min(1, dt * 0.15);
    for (let i = 0; i < 3; i++)
      for (let k = 0; k < 3; k++) this.palette[i][k] += (this.paletteTarget[i][k] - this.palette[i][k]) * Math.min(1, dt * 0.8);

    const idle = st.playing ? 1 : 0.55;
    const speed = (0.5 + 0.7 * s.intensity) * (1 - 0.4 * this.depth) * (reduced ? 0.25 : 1) * idle;
    this.t += dt * speed;
    this.breathPhase += dt / Math.max(4, st.breathPeriod);
    const breath = 0.5 - 0.5 * Math.cos(this.breathPhase * Math.PI * 2);
    const motion = reduced ? 0.25 : 1;

    // Style crossfade (fade down, swap, fade up)
    let target = 1;
    if (s.style !== this.shownStyle) {
      target = 0;
      if (this.styleFade < 0.02) this.shownStyle = s.style;
    }
    this.styleFade += (target - this.styleFade) * Math.min(1, dt * 3);
    const gfade = this.styleFade;
    this.fade += ((st.fade) - this.fade) * Math.min(1, dt * (st.fade < this.fade ? 0.12 : 0.5));

    this.drawGL(breath, motion, gfade * this.fade, s);
    this.drawFx(dt, breath, s, gfade * this.fade, motion);

    // Adaptive quality
    if (dt > 0.034) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 0.5);
    if (this.slowFrames > 25 && this.scale > 0.28) {
      this.scale *= 0.85;
      this.slowFrames = 0;
      this.applyScale();
    }
  }
  private fade = 0;
  private sprites: HTMLCanvasElement[] = [];
  private spriteKey = "";

  /** Pre-rendered soft glow sprite in a palette colour (avoids per-particle gradients). */
  private sprite(i: number) {
    const key = this.palette.map((c) => c.map((v) => Math.round(v * 8)).join(",")).join("|");
    if (key !== this.spriteKey || !this.sprites.length) {
      this.spriteKey = key;
      this.sprites = [0, 1, 2].map((k) => {
        const cv = document.createElement("canvas");
        cv.width = cv.height = 64;
        const x = cv.getContext("2d")!;
        const p = this.palette[k];
        const rgb = `${Math.round(p[0] * 255)},${Math.round(p[1] * 255)},${Math.round(p[2] * 255)}`;
        const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, `rgba(${rgb},1)`);
        g.addColorStop(0.35, `rgba(${rgb},0.35)`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        x.fillStyle = g;
        x.fillRect(0, 0, 64, 64);
        return cv;
      });
    }
    return this.sprites[i];
  }

  private drawGL(breath: number, motion: number, fade: number, s: Settings) {
    const gl = this.gl;
    if (!gl) return;
    const pr = this.program(this.shownStyle);
    if (!pr) return;
    gl.viewport(0, 0, this.glCanvas.width, this.glCanvas.height);
    gl.useProgram(pr.p);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const u = pr.u;
    gl.uniform2f(u.u_res, this.glCanvas.width, this.glCanvas.height);
    gl.uniform1f(u.u_time, this.t + 40);
    gl.uniform1f(u.u_breath, breath);
    gl.uniform1f(u.u_depth, this.depth);
    gl.uniform1f(u.u_intensity, s.intensity);
    gl.uniform1f(u.u_motion, motion);
    gl.uniform1f(u.u_fade, fade);
    gl.uniform3fv(u.u_c0, this.palette[0]);
    gl.uniform3fv(u.u_c1, this.palette[1]);
    gl.uniform3fv(u.u_c2, this.palette[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private drawFx(dt: number, breath: number, s: Settings, fade: number, motion: number) {
    const c = this.ctx2;
    const { w, h, dpr } = this;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    c.globalCompositeOperation = "lighter";
    const cx = w / 2, cy = h / 2, m = Math.min(w, h);
    const col = (i: number, a: number) => {
      const p = this.palette[i % 3];
      return `rgba(${Math.round(p[0] * 255)},${Math.round(p[1] * 255)},${Math.round(p[2] * 255)},${a})`;
    };

    if (s.particles) {
      const sp = (reduced(s) ? 0.3 : 1) * (this.state.playing ? 1 : 0.5);
      for (const p of this.particles) {
        p.x += p.vx * dt * sp; p.y += p.vy * dt * sp; p.ph += dt * 0.25;
        if (p.y < -0.05) Object.assign(p, this.newParticle(false));
        const tw = 0.55 + 0.45 * Math.sin(p.ph);
        const a = 0.22 * tw * fade * (0.4 + 0.6 * s.intensity);
        const x = p.x * w, y = p.y * h, r = p.r * (m / 500) * 3;
        const sp2 = this.sprite(Math.floor(p.hue * 3));
        c.globalAlpha = a / 0.22 * 0.35;
        c.drawImage(sp2, x - r * 3, y - r * 3, r * 6, r * 6);
      }
      c.globalAlpha = 1;
    }

    if (s.breathRings) {
      const amp = motion;
      for (let i = 0; i < 3; i++) {
        const base = m * (0.11 + i * 0.075);
        const r = base * (0.9 + 0.22 * breath * amp * (1 + i * 0.25));
        c.lineWidth = 1.2;
        c.strokeStyle = col(i, (0.20 - i * 0.045) * fade * (0.5 + 0.5 * s.intensity));
        c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.stroke();
      }
    }

    if (s.fixation) {
      const r = m * (0.012 + 0.004 * breath * motion);
      const halo = m * (0.07 + 0.03 * breath * motion);
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, halo);
      g.addColorStop(0, `rgba(255,244,225,${0.55 * fade})`);
      g.addColorStop(0.15, col(2, 0.28 * fade));
      g.addColorStop(1, col(2, 0));
      c.fillStyle = g;
      c.beginPath(); c.arc(cx, cy, halo, 0, 6.2832); c.fill();
      c.fillStyle = `rgba(255,248,236,${0.85 * fade})`;
      c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();
    }
    c.globalCompositeOperation = "source-over";
  }
}

const reduced = (s: Settings) => s.reducedMotion;
