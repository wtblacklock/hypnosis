# Reverie — guided self-hypnosis prototype

Next.js + React + Tailwind. Real-time WebGL visuals, generative Web Audio ambience, and browser speech-synthesis narration. No accounts, no database, no audio files.

```bash
npm install
npm run dev     # http://localhost:3000
```

## What's here
- **3 visual styles** (GLSL, `lib/shaders.ts`): Fractal Bloom (morphing Julia set), Mandala (kaleidoscopic geometry + rings), Aurora (flowing light waves). Plus drifting particles, breathing rings and an optional fixation point.
- **6 guided sessions** (`lib/scripts/`): Relaxation, Alcohol Cravings, Breaking Habits, Confidence, Stress Relief, Better Sleep. Each: induction → progressive relaxation → deepening → suggestions/visualization → return (Sleep drifts off instead).
- **Lengths 5/10/15/20 min**: scripts are tiered; pauses stretch adaptively so the session lands on the chosen length (`lib/sessionEngine.ts`).
- **Player**: pause/resume, previous/next line, countdown, captions. Tap or move the pointer to reveal controls; they fade after a few seconds. Space toggles pause.
- **Settings**: visual style & intensity, narration volume, ambient volume/type (pad, ocean, rain, pad+ocean), voice & pace, reduced motion, fixation, rings, particles, captions. Saved in `localStorage`.

## British male voice (local Kokoro)
Start your Kokoro server (OpenAI-compatible, e.g. Kokoro-FastAPI on :8880), then:

```bash
npm run generate:audio                       # renders all 131 lines to public/audio (bm_george @ 0.85x)
KOKORO_VOICE=bm_lewis KOKORO_SPEED=0.8 npm run generate:audio   # other voice/pace
KOKORO_VOICE="bm_george+bm_lewis" ...        # Kokoro voice blends also work
```
Options: `KOKORO_URL`, `KOKORO_VOICE`, `KOKORO_SPEED`, `KOKORO_MODEL`, `KOKORO_FORMAT`, `FORCE=1`. Re-runs only render new or edited lines. When `public/audio/manifest.json` exists the player uses those clips (the pace slider adjusts playback speed); lines without a clip fall back to browser speech. Commit `public/audio` so a deployed copy (e.g. on your phone) has the voice too.

## Binaural beats
Ambient options **Delta 2 Hz** (deep sleep), **Theta 6 Hz** (deep relaxation, hypnotic state) and **Alpha 10 Hz** (calm wakefulness), layered under a soft pad. Generated with the Web Audio API (200 Hz carrier left, +beat right) and eased in from 10 Hz over ~3 minutes. Stereo headphones required; evidence is mixed.

## Spotify (optional, Premium)
Reverie can start a Spotify playlist on your Spotify app and follow the session: it starts with the session, pauses/resumes with it, follows the Ambient volume slider (where the device allows), and fades out at the end. Audio plays from Spotify, not from the page, so it works on phones.

1. Go to https://developer.spotify.com/dashboard → *Create app*. Choose **Web API**.
2. Add Redirect URIs (exact match, with the trailing slash): your deployed URL, e.g. `https://reverie-twinb.vercel.app/`, and for local dev `http://127.0.0.1:3000/` (Spotify doesn't accept `localhost`; open the app via 127.0.0.1).
3. In *User Management*, add your own Spotify account (apps in development mode only work for listed users).
4. Copy the **Client ID** and set `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` (`.env.local` locally, Project → Settings → Environment Variables on Vercel, then redeploy).
5. In Reverie: Sound → **Spotify** → *Connect Spotify* → pick a playlist or paste a link. Keep the Spotify app open on your phone.

Limits: Spotify doesn't allow remote volume control on some devices (e.g. iPhones), so the Ambient slider may not change Spotify's volume there; and the visuals can't react to the music (Spotify gives no audio access).

## Visual safety
No flashing or strobing: every oscillation is far below 1 Hz, brightness is tone-mapped and capped, changes are smoothed, and sessions fade in. Reduced motion (auto-enabled from the OS preference) slows everything to a crawl. Every effect is optional.

## Notes
- Narration quality depends on the device's installed voices; pick a "Natural/Neural" voice in the Voice menu where available. Narration volume changes apply from the next spoken line.
- Swapping in pre-generated TTS audio later only needs a change in `lib/narrator.ts`.
- Not medical treatment. Do not use while driving.
