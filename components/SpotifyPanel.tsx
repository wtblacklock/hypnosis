"use client";
import { useEffect, useState } from "react";
import {
  disconnect, handleCallback, login, myPlaylists, parseSpotifyLink, Playlist, redirectUri, spotifyConfigured,
} from "@/lib/spotify";
import type { Settings } from "@/lib/settings";

export default function SpotifyPanel({ s, set }: { s: Settings; set: (p: Partial<Settings>) => void }) {
  const [connected, setConnected] = useState(false);
  const [lists, setLists] = useState<Playlist[]>([]);
  const [link, setLink] = useState("");
  const [bad, setBad] = useState(false);

  useEffect(() => {
    if (!spotifyConfigured()) return;
    handleCallback().then((ok) => {
      setConnected(ok);
      if (ok) myPlaylists().then(setLists);
    });
  }, []);

  if (!spotifyConfigured()) {
    return (
      <p className="rounded-xl border border-white/10 p-3 text-xs leading-relaxed text-white/50">
        Spotify isn&apos;t set up yet. Create a free Spotify developer app and set <code>NEXT_PUBLIC_SPOTIFY_CLIENT_ID</code>.
        Redirect URI to register: <code className="break-all">{typeof window !== "undefined" ? redirectUri() : ""}</code>
      </p>
    );
  }

  if (!connected) {
    return (
      <button onClick={() => login()} className="w-full rounded-xl border border-emerald-300/40 bg-emerald-300/10 py-3 text-sm text-white hover:bg-emerald-300/20">
        Connect Spotify
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 p-3">
      <label className="block">
        <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">Playlist</div>
        <select value={lists.some((l) => l.uri === s.spotifyUri) ? s.spotifyUri : ""}
          onChange={(e) => { const l = lists.find((x) => x.uri === e.target.value); if (l) set({ spotifyUri: l.uri, spotifyName: l.name }); }}>
          <option value="">{s.spotifyName ? `Current: ${s.spotifyName}` : "Choose one of your playlists"}</option>
          {lists.map((l) => <option key={l.uri} value={l.uri}>{l.name}</option>)}
        </select>
      </label>
      <label className="block">
        <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">…or paste a Spotify link</div>
        <input value={link} placeholder="open.spotify.com/playlist/…"
          onChange={(e) => {
            setLink(e.target.value);
            const u = parseSpotifyLink(e.target.value);
            setBad(!!e.target.value && !u);
            if (u) set({ spotifyUri: u, spotifyName: "Pasted link" });
          }}
          className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30" />
        {bad && <div className="mt-1 text-[11px] text-amber-300/80">That doesn&apos;t look like a Spotify playlist or album link.</div>}
      </label>
      <p className="text-[11px] leading-relaxed text-white/40">
        Open the Spotify app on this device first, so Reverie can find it. Music plays from Spotify; volume follows the Ambient slider where your device allows.
      </p>
      <button onClick={() => { disconnect(); setConnected(false); }} className="text-[11px] text-white/40 underline hover:text-white/70">Disconnect Spotify</button>
    </div>
  );
}
