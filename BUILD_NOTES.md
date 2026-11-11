# Chicken Short v2 — Build Notes (builder handoff, 2026-11-11)

"Why do the rich keep getting richer while the poor get poorer? One chicken explains it."
Same script + same Warm Pebble voice as v1 (reused, not re-recorded). v1 untouched.
Final video `chicken_short_v2.mp4` is made later by the render agent — NOT by this build.

## Format (24 fps — tried first, worked cleanly)

- **24 fps, 1824 frames** (round(75.984 × 24)), 540x960 composition + ThreeCanvas,
  `--scale 1.3333` → 1080x1920 delivery. Remotion 4.0.541 / three 0.169.
- No fallback needed: tsc clean, stills render at 24 fps, word alignment is seconds×24
  throughout (`story.ts`, `audio/timeline.py`).
- `tsc --noEmit` clean. Stills ~5–10 s/frame on local SwiftShader.

## Own-build (standing rule)

- `src/videos/chicken2/figures.ts` + `world.ts` + `story.ts` + `Chicken2.tsx` are NEW
  own code: humans, chickens, eggs, nests, coops, houses, trees, fences, stall, pot,
  basket, coins, sacks, windmill, clouds — all THREE primitives. No GLBs (the v1
  `public/chicken/kenney/` files were NOT copied; v2 has no `public/` at all), no copied
  v1 `world.ts`/`cast.ts`/`toon.ts` scene content.
- Reused engine only (allowed): `lights.ts`, `grade.ts`, `lensblur.ts`, `shade.ts`,
  `paint.ts`, `cardshade.ts` (look helpers), plus `scripts/render_range.mjs`,
  `scripts/short_qa.py`, `remotion.config.ts`, package deps.
- Cinematic, not toon: NO ink pass in `Chicken2.tsx`. Post = lens DOF (pre+main) →
  bloom (emissive only) → NEUTRAL tone map → warm grade → film grain ON (0.02).
  Golden-hour shots (4, 11) use the `golden` light preset + sun disc.
- Note: Three.js cannot do photorealistic live-action humans — the film is cinematic
  3D with realistic proportions, skin-tone shading and golden-hour grade, not live action.

## Shots / docs

- `CHARACTER_BIBLE.md` — Ravi (G1 red), Meera (G2 green), Dev (G3 gold/blue) + supporters,
  hen/rooster/chick builds, recurring props.
- `SHOT_TIMELINE.md` — 13 shots, every boundary from `voice/words.json` seconds × 24,
  per-second spine. Acts: hook/contrast, mechanism, cost, final contrast + fade to black.
- Known staging choices: houses stay standing in shot 2 (only coins/sacks vanish and
  fields go bare across "Gone"); the final tableau is COMPRESSED (groups step to
  x = −7 / 0 / +7) because a 9:16 frame cannot hold the full 36 m village wide.

## Stills (all inspected, all pass)

`out/stills/` (270x480 JPEGs, scale 0.5; mean luma 86–159, no black frames):

| frame | beat | verdict |
|---|---|---|
| f60 | hook, hero hen MS | PASS — hen large/readable, green rep behind, fence mid-frame |
| f200 | wealth taken, high wide | PASS — house, coop, stall, villagers, coin pile + sack |
| f390 | gift, arms opening | PASS — green group receiving, hen + eggs right |
| f500 | cooking pot CU, golden | PASS after fix — pot + stew + fire glow, red rep leaning in |
| f700 | nest macro CU, eggs | PASS — eggs in nest + basket, hen top-right |
| f870 | pooling deal at stall | PASS after fix — Meera + Dev at the stall |
| f1100 | hatching, chicks | PASS — yellow chicks + eggs in nest, hen behind |
| f1220 | flock growth, gold yard | PASS — gold group + hens + fence + house, grain dots |
| f1380 | complaining CU | PASS after fix — Ravi front-centre, arms thrown up, windmill behind |
| f1440 | comfortable, golden | PASS — warm grade, sun disc, long shadows, rooster + basket |
| f1600 | hiring, handover | PASS — red rep working among flock, baskets of eggs |
| f1750 | final three-tier split | PASS after fix — red/green/gold tiers all in frame |

Fixes made during still review: full-length trousers (bare shins read oddly); fences moved
to z=−2.5; pot lightened + S4b pulled back + G1 fence hidden in shot 4; S6b pulled back
and Dev ends beside the stall; S10b re-aimed at Ravi (portrait horizontal half-angle is
only ~10–13°, off-axis subjects vanish); final tableau compressed + camera pulled to z≈32.

## Sound

- `audio/mix.wav` — 75.984 s exactly, 48 kHz stereo 24-bit, **−14.5 LUFS** (ffmpeg
  ebur128 cross-check: I −14.5, LRA 2.5, TP −1.2 dBTP). Stems voice/music/sfx + `cues.md`.
- v1 pipeline copied (`mix.py`, `timeline.py` FPS 24, `sfx.py`, `music.py`, `dsp.py`,
  `instruments.py`, `sfx_gen.py`); voice gain only, same pastoral score + ducking.
- Cinematic v2 additions (all in `sfx.py` cues, verified in `cues.md` + SFX-stem RMS):
  wind gust at 0.0 s, grain patter at 50.40 s, deep bass drop (95→36 Hz sweep) at
  73.56 s on the final contrast (SFX-stem RMS +16 dB vs the preceding window).
- Rebuild: `cd audio && python3 mix.py` (~56 s; stems cached in `_cache/`).

## Render (for the render agent — NOT dispatched, no repo created)

- Workflow `.github/workflows/render.yml` in place, undispatched: shard A f0–911,
  shard B f912–1823 (2 runners max, static ffmpeg, Playwright 1.49.1 / headless-shell 1148,
  CHROME_PATH resolved into a shell variable first — the v1 fix is preserved).
- Local stills: `REMOTION_TMP=$PWD/remotion-tmp node scripts/stills_v2.mjs out/stills <f,f,...> 0.5`
- Full shard render: `node scripts/render_range.mjs out/chicken2/shardA 0 911 1.3333`
  (and shardB 912–1823). Assemble per v1: concat JPEGs (shard B `-start_number 912`),
  lanczos to 1080x1920, mux `audio/mix.wav`, verify with `scripts/short_qa.py`.
- Expected render time: v1 took ~5.5 s/frame (shard A) to ~10 s/frame (shard B) at 30 fps
  on Actions; v2 has 1824 frames at 24 fps and a heavier scene (more chickens, grain),
  so budget ~2–3.5 h for the slow shard.

## Known issues / limits

- Figures are stylised-realistic, not photoreal: faces are simple (eyes/nose/mouth line),
  trees are sphere-foliage, clouds are flattened spheres. Chickens read well; chicks are
  very round (sphere bodies) in macro.
- Shot 2: houses remain visible after "every house... Gone" (staging choice, same as v1);
  only the wealth (coins/sacks) and the crops vanish.
- Grain is ON (0.02) — v1 shipped grain off for file size; v2 keeps it per the cinematic brief.
- `remotion-tmp/` holds several bundle dirs from still renders (as in v1); harmless.
