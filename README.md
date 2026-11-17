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

## Visual safety
No flashing or strobing: every oscillation is far below 1 Hz, brightness is tone-mapped and capped, changes are smoothed, and sessions fade in. Reduced motion (auto-enabled from the OS preference) slows everything to a crawl. Every effect is optional.

## Notes
- Narration quality depends on the device's installed voices; pick a "Natural/Neural" voice in the Voice menu where available. Narration volume changes apply from the next spoken line.
- Swapping in pre-generated TTS audio later only needs a change in `lib/narrator.ts`.
- Not medical treatment. Do not use while driving.
