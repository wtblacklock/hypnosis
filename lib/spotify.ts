/**
 * Spotify "remote control" integration (Authorization Code + PKCE, no backend).
 * Reverie logs you in, then tells your Spotify app/device what to play and how loud.
 * Requires Spotify Premium and a free developer app (client id) — see README.
 */
export const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
const SCOPES = "user-modify-playback-state user-read-playback-state playlist-read-private playlist-read-collaborative";
const KEY = "reverie.spotify.v1";
const VERIFIER = "reverie.spotify.verifier";

interface Tokens { access: string; refresh: string; expires: number }

export const redirectUri = () => `${window.location.origin}/`;
export const spotifyConfigured = () => !!SPOTIFY_CLIENT_ID;

const load = (): Tokens | null => {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
};
const save = (t: Tokens | null) => {
  try { t ? localStorage.setItem(KEY, JSON.stringify(t)) : localStorage.removeItem(KEY); } catch {}
};
export const isConnected = () => !!load();
export const disconnect = () => save(null);

const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function login() {
  const bytes = crypto.getRandomValues(new Uint8Array(48));
  const verifier = b64url(bytes.buffer);
  try { localStorage.setItem(VERIFIER, verifier); } catch {}
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const q = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID, response_type: "code", redirect_uri: redirectUri(),
    scope: SCOPES, code_challenge_method: "S256", code_challenge: challenge,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${q}`;
}

async function tokenRequest(body: Record<string, string>): Promise<Tokens | null> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, ...body }),
  });
  if (!res.ok) return null;
  const j = await res.json();
  return { access: j.access_token, refresh: j.refresh_token ?? load()?.refresh ?? "", expires: Date.now() + (j.expires_in - 60) * 1000 };
}

/** Call once on page load; finishes the login if Spotify just redirected back with ?code=. Returns true if connected now. */
export async function handleCallback(): Promise<boolean> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (code) {
    let verifier = "";
    try { verifier = localStorage.getItem(VERIFIER) || ""; } catch {}
    const t = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri(), code_verifier: verifier });
    window.history.replaceState({}, "", url.pathname);
    if (t) { save(t); return true; }
  } else if (url.searchParams.get("error")) {
    window.history.replaceState({}, "", url.pathname);
  }
  return isConnected();
}

async function token(): Promise<string | null> {
  const t = load();
  if (!t) return null;
  if (Date.now() < t.expires) return t.access;
  const n = await tokenRequest({ grant_type: "refresh_token", refresh_token: t.refresh });
  if (!n) { save(null); return null; }
  save(n);
  return n.access;
}

async function api(path: string, method = "GET", body?: unknown): Promise<{ ok: boolean; status: number; data: any }> {
  const tk = await token();
  if (!tk) return { ok: false, status: 401, data: null };
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${tk}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

export interface Playlist { uri: string; name: string }

export async function myPlaylists(): Promise<Playlist[]> {
  const r = await api("/me/playlists?limit=50");
  return r.ok ? r.data.items.filter(Boolean).map((p: any) => ({ uri: p.uri, name: p.name })) : [];
}

/** Accepts spotify:playlist:ID or an open.spotify.com link (playlist / album / artist). */
export function parseSpotifyLink(input: string): string | null {
  const s = input.trim();
  if (/^spotify:(playlist|album|artist|show):[A-Za-z0-9]+$/.test(s)) return s;
  const m = s.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|artist|show)\/([A-Za-z0-9]+)/);
  return m ? `spotify:${m[1]}:${m[2]}` : null;
}

export type StartResult = "ok" | "no-device" | "premium" | "auth" | "error";

/** Pick a device: the active one, else a phone, else anything. */
async function pickDevice(): Promise<string | null> {
  const r = await api("/me/player/devices");
  const devices: any[] = r.ok ? r.data.devices : [];
  const d = devices.find((x) => x.is_active) || devices.find((x) => x.type === "Smartphone") || devices[0];
  return d ? d.id : null;
}

export async function startContext(uri: string, volumePct: number): Promise<StartResult> {
  const device = await pickDevice();
  if (!device) return "no-device";
  await api(`/me/player/shuffle?state=true&device_id=${device}`, "PUT");
  await api(`/me/player/repeat?state=context&device_id=${device}`, "PUT");
  await setVolume(volumePct, device);
  const r = await api(`/me/player/play?device_id=${device}`, "PUT", { context_uri: uri });
  if (r.ok) return "ok";
  if (r.status === 401) return "auth";
  if (r.status === 403) return "premium";
  if (r.status === 404) return "no-device";
  return "error";
}

export const pausePlayback = () => api("/me/player/pause", "PUT");
export const resumePlayback = () => api("/me/player/play", "PUT");

let lastVol = -1;
/** Volume control isn't supported by every device (e.g. iPhones); failures are ignored silently. */
export async function setVolume(pct: number, device?: string) {
  const v = Math.round(Math.max(0, Math.min(100, pct)));
  if (v === lastVol && !device) return;
  lastVol = v;
  await api(`/me/player/volume?volume_percent=${v}${device ? `&device_id=${device}` : ""}`, "PUT");
}

/** Ease Spotify's volume down, pause, then restore the volume for next time. */
export async function fadeOutAndPause(fromPct: number, seconds: number) {
  const steps = Math.max(4, Math.round(seconds / 1.5));
  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, (seconds * 1000) / steps));
    await setVolume(fromPct * (1 - i / steps));
  }
  await pausePlayback();
  lastVol = -1;
  await setVolume(fromPct);
}
