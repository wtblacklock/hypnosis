/** Thin wrapper around browser speech synthesis with robust completion + cancel handling. */

const PREFERRED = [
  "Samantha", "Ava", "Allison", "Serena", "Karen", "Moira", "Tessa", "Daniel", "Google UK English Female",
  "Microsoft Aria", "Microsoft Jenny", "Microsoft Sonia", "Natural", "Google US English",
];

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
}

export function pickVoice(uri: string): SpeechSynthesisVoice | null {
  const voices = getVoices();
  if (!voices.length) return null;
  const chosen = voices.find((v) => v.voiceURI === uri);
  if (chosen) return chosen;
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    PREFERRED.forEach((p, i) => {
      if (v.name.includes(p)) s = Math.max(s, 100 - i);
    });
    if (/natural|neural|premium|enhanced/i.test(v.name)) s += 30;
    if (v.localService) s += 2;
    if (/^en-(US|GB)/i.test(v.lang)) s += 3;
    return s;
  };
  return [...voices].sort((a, b) => score(b) - score(a))[0];
}

export interface SpeakOpts {
  text: string;
  volume: number;
  rate: number;
  voiceURI: string;
  /** characters per second used when audio isn't available */
  cps: number;
}

export class Narrator {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private resolve: (() => void) | null = null;

  /** Resolves when speech ends (or the guard timeout fires). */
  speak(o: SpeakOpts): Promise<void> {
    this.cancel();
    return new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.resolve = null;
        resolve();
      };
      this.resolve = finish;
      const est = o.text.length / o.cps;
      if (!speechSupported() || o.volume <= 0.001) {
        this.timer = setTimeout(finish, est * 1000);
        return;
      }
      const u = new SpeechSynthesisUtterance(o.text);
      const v = pickVoice(o.voiceURI);
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      }
      u.rate = o.rate;
      u.pitch = 0.92;
      u.volume = Math.min(1, o.volume);
      const t0 = performance.now();
      // If the engine bails out instantly (no voices installed), keep reading-pace timing so the session doesn't rush.
      const settle = () => {
        const spent = (performance.now() - t0) / 1000;
        if (spent < est * 0.5) {
          if (this.timer) clearTimeout(this.timer);
          this.timer = setTimeout(finish, (est - spent) * 1000);
        } else finish();
      };
      u.onend = settle;
      u.onerror = (e) => {
        if (e.error === "interrupted" || e.error === "canceled") finish();
        else settle();
      };
      // Some engines never fire onend; guard generously
      this.timer = setTimeout(finish, (est * 1.8 + 6) * 1000);
      try {
        window.speechSynthesis.speak(u);
      } catch {
        finish();
      }
    });
  }

  cancel() {
    if (speechSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.resolve = null; // dropped without resolving: owner uses generation tokens
  }
}
