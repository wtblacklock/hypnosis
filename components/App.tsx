"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HypnoCanvas from "./HypnoCanvas";
import SessionSelect from "./SessionSelect";
import SetupPanel from "./SetupPanel";
import Player from "./Player";
import * as spotify from "@/lib/spotify";
import { loadManifest } from "@/lib/narrator";
import { AmbientEngine } from "@/lib/audioEngine";
import { EngineView, newVisualState, SessionEngine } from "@/lib/sessionEngine";
import { DEFAULTS, loadSettings, saveSettings, Settings } from "@/lib/settings";
import { SESSIONS, SessionId, sessionById } from "@/lib/sessions";

type Screen = "select" | "setup" | "session" | "done";

const IDLE_VIEW: EngineView = { status: "idle", caption: "", index: 0, total: 1, elapsed: 0, target: 600, phase: "intro" };

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const settingsRef = useRef<Settings>(DEFAULTS);
  const visual = useRef(newVisualState()).current;
  const audio = useRef<AmbientEngine | null>(null);
  const engine = useRef<SessionEngine | null>(null);
  const [screen, setScreen] = useState<Screen>("select");
  const [sid, setSid] = useState<SessionId>("relaxation");
  const [view, setView] = useState<EngineView>(IDLE_VIEW);
  const [ready, setReady] = useState(false);

  if (!audio.current && typeof window !== "undefined") audio.current = new AmbientEngine();

  useEffect(() => {
    loadManifest();
    const s = loadSettings();
    // Returning from Spotify's login page: finish the login and switch to Spotify sound
    if (spotify.spotifyConfigured() && /[?&]code=/.test(window.location.search)) {
      spotify.handleCallback().then((ok) => { if (ok) update({ ambient: "spotify" }); });
    }
    settingsRef.current = s;
    setSettings(s);
    setReady(true);
  }, []);

  const update = useCallback((p: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...p };
    settingsRef.current = next;
    setSettings(next);
    saveSettings(next);
    if ("ambientVolume" in p) {
      audio.current?.setVolume(next.ambientVolume);
      if (next.ambient === "spotify") spotify.setVolume(next.ambientVolume * 100);
    }
    if ("ambient" in p) audio.current?.setType(next.ambient);
  }, []);

  useEffect(() => {
    audio.current?.setVolume(settings.ambientVolume);
    audio.current?.setType(settings.ambient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Spotify follows the session: start with it, pause/resume with it, fade out at the end
  const prevStatus = useRef<EngineView["status"]>("idle");
  const [spotifyMsg, setSpotifyMsg] = useState("");
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = view.status;
    const st = settingsRef.current;
    if (st.ambient !== "spotify" || !st.spotifyUri) return;
    const vol = st.ambientVolume * 100;
    if (view.status === "playing" && prev === "idle") {
      setSpotifyMsg("");
      spotify.startContext(st.spotifyUri, vol).then((r) => {
        if (r === "no-device") setSpotifyMsg("Open the Spotify app on this device, then tap resume.");
        else if (r === "premium") setSpotifyMsg("Spotify Premium is required for playback control.");
        else if (r === "auth") setSpotifyMsg("Spotify login expired. Reconnect in settings.");
        else if (r === "error") setSpotifyMsg("Couldn't start Spotify.");
      });
    } else if (view.status === "paused" && prev === "playing") spotify.pausePlayback();
    else if (view.status === "playing" && prev === "paused") spotify.resumePlayback();
    else if (view.status === "done") spotify.fadeOutAndPause(vol, sid === "sleep" ? 14 : 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.status]);

  const session = sessionById(sid);
  const palette = useMemo(() => session.palette, [session]);

  const pick = (id: SessionId) => {
    setSid(id);
    setScreen("setup");
  };

  const begin = () => {
    engine.current?.stop();
    visual.fade = 1;
    const e = new SessionEngine(sid, () => settingsRef.current, visual, audio.current!, (v) => {
      setView(v);
      if (v.status === "done") setScreen("done");
    });
    engine.current = e;
    setView(IDLE_VIEW);
    setScreen("session");
    e.start(settingsRef.current.minutes);
  };

  const toggle = useCallback(() => {
    const e = engine.current;
    if (!e) return;
    if (view.status === "playing") e.pause();
    else if (view.status === "paused") e.resume();
  }, [view.status]);

  const end = () => {
    engine.current?.stop();
    if (settingsRef.current.ambient === "spotify") spotify.fadeOutAndPause(settingsRef.current.ambientVolume * 100, 2);
    visual.targetDepth = 0.1;
    visual.fade = 1;
    setScreen("select");
  };

  const finishToMenu = () => {
    visual.targetDepth = 0.1;
    visual.fade = 1;
    setScreen("select");
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#03040d]">
      <HypnoCanvas settingsRef={settingsRef} visual={visual} palette={screen === "select" ? SESSIONS[0].palette : palette} />
      {screen === "select" && <SessionSelect onPick={pick} />}
      {screen === "setup" && <SetupPanel session={session} s={settings} set={update} onBegin={begin} onBack={() => setScreen("select")} />}
      {screen === "session" && (
        <Player spotifyMsg={spotifyMsg} view={view} s={settings} set={update} onToggle={toggle} onJump={(d) => engine.current?.jump(d)} onEnd={end} />
      )}
      {screen === "done" && (
        <div className="fadein absolute inset-0 grid place-items-center bg-black/25 px-6 text-center">
          <div>
            <h2 className="serif text-4xl text-white/90">{sid === "sleep" ? "Sleep well" : "Welcome back"}</h2>
            <p className="mx-auto mt-3 max-w-xs text-sm text-white/50">
              {sid === "sleep" ? "Let the quiet carry you the rest of the way." : "Take a moment before you move on. Carry this calm with you."}
            </p>
            <button onClick={finishToMenu} className="mt-8 rounded-full border border-white/20 px-8 py-3 text-xs uppercase tracking-[0.3em] text-white/80 hover:bg-white/10">
              Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
