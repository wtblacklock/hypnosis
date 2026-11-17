/**
 * Pre-render all narration with a local Kokoro (OpenAI-compatible) server.
 *   npm run generate:audio
 * Env: KOKORO_URL (default http://localhost:8880)  KOKORO_VOICE (default bm_george)
 *      KOKORO_SPEED (default 0.85)  KOKORO_MODEL (default kokoro)  KOKORO_FORMAT (default mp3)
 * Existing files are skipped, so re-running only renders new/changed lines. Use FORCE=1 to redo all.
 */
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildScript } from "../lib/scripts";
import { audioKey } from "../lib/audioKey";
import { SESSIONS } from "../lib/sessions";

const URL_ = (process.env.KOKORO_URL ?? "http://localhost:8880").replace(/\/$/, "");
const VOICE = process.env.KOKORO_VOICE ?? "bm_george";
const SPEED = parseFloat(process.env.KOKORO_SPEED ?? "0.85");
const MODEL = process.env.KOKORO_MODEL ?? "kokoro";
const FORMAT = process.env.KOKORO_FORMAT ?? "mp3";
const FORCE = !!process.env.FORCE;
const dir = join(process.cwd(), "public", "audio");
mkdirSync(dir, { recursive: true });

const lines = new Map<string, string>();
for (const s of SESSIONS) for (const seg of buildScript(s.id, 20)) lines.set(audioKey(seg.t), seg.t);

const manifestPath = join(dir, "manifest.json");
const manifest: { voice: string; format: string; speed: number; lines: Record<string, true> } = {
  voice: VOICE, format: FORMAT, speed: SPEED, lines: {},
};
try {
  const old = JSON.parse(readFileSync(manifestPath, "utf8"));
  // a different voice/speed invalidates old files
  if (old.voice === VOICE && old.speed === SPEED && old.format === FORMAT) manifest.lines = old.lines;
} catch {}

async function main() {
  console.log(`Rendering ${lines.size} lines with ${VOICE} @ ${SPEED}x via ${URL_}`);
  let n = 0;
  for (const [key, text] of lines) {
    n++;
    const file = join(dir, `${key}.${FORMAT}`);
    if (!FORCE && manifest.lines[key] && existsSync(file)) continue;
    const res = await fetch(`${URL_}/v1/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, voice: VOICE, input: text, response_format: FORMAT, speed: SPEED }),
    });
    if (!res.ok) throw new Error(`TTS failed (${res.status}) on: ${text}\n${await res.text()}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    manifest.lines[key] = true;
    writeFileSync(manifestPath, JSON.stringify(manifest));
    console.log(`[${n}/${lines.size}] ${text.slice(0, 60)}`);
  }
  writeFileSync(manifestPath, JSON.stringify(manifest));
  console.log("Done. Restart the app; narration will use the generated voice.");
}
main().catch((e) => { console.error(e.message); process.exit(1); });
