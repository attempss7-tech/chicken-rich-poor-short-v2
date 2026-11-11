# Character Bible — Chicken Short v2

Every figure in the film is designed **once, here**, and reused identically in every
shot (same face, hair, clothing, build). Built in code (`src/videos/chicken2/figures.ts`,
`makeHuman` / `makeChicken`) — no GLBs, no template characters. Skin tones are warm
browns; faces are simple but consistent (dark eyes, small nose, mouth line). Humans are
~1.6–1.8 m with realistic proportions (legs 0.8 m, torso 0.58 m, head r 0.115 m).

## The three groups (colour-coded, as in v1)

| Group | Colours | Representative | Supporters |
|---|---|---|---|
| **Group 1 — the ones who cook** | **Red** shirts, dark trousers | **Ravi**, 1.72 m, build 1.05, skin #8a5a3c, short black hair, red shirt #b03030, dark grey trousers #3a3a44 | Woman, 1.60 m, tied black hair, shirt #c05040, trousers #4a3a30 · Elder, 1.68 m, grey hair, shirt #a03838 |
| **Group 2 — the ones who keep** | **Green** shirts, brown trousers | **Meera**, 1.62 m, build 0.95, skin #9a6a44, tied black hair, green shirt #2e7a3e, brown trousers #5a4632 | Man, 1.75 m, short black hair, shirt #3a8a4a · Woman, 1.58 m, hair bun, shirt #2a6a38 |
| **Group 3 — the ones who pool** | **Gold** shirts, **blue** trousers | **Dev**, 1.78 m, build 1.10, skin #a07048, short black hair, gold shirt #c89a2e, blue trousers #2e4a7a | Woman, 1.64 m, hair bun, shirt #d8a83a, blue trousers · Man, 1.74 m, shirt #b8860b, blue trousers |

## Chickens (anatomically believable, code-built)

- **White hen** (the gift, the hero of the hook): white body, red comb (2 lobes) +
  wattle, orange beak, orange legs, pale tail feathers. Pecks in a loop
  (`peckPose`: head dips, body bobs).
- **Rooster**: 18% larger, bigger 3-lobe comb, dark-green tail feathers, head held high.
- **Chicks**: 45% scale, all yellow, no comb, fast peck. They scale in over 48 frames
  at the hatch (slow-motion beat) and are full size by the laying beat.

## Props that recur (same build everywhere)

Nest (straw bowl + rim), egg basket, cooking pot (dark pot, brown stew, orange fire,
rising steam wisps), market stall (counter + red canopy), coops, houses (G1 cream/red
roof, G2 pale green, G3 pale gold/blue roof), fences, trees, windmill (rotating blades),
coin piles + feed sacks (the wealth — they shrink to nothing across "Gone").

## Movement language

- Walk cycle: legs/arms counter-swing, slight bob (Dev's walk to the stall, shot 6).
- Hands: arms raise to receive the gift (shot 3), stir the pot (shot 4), present the
  flock (shots 7, 13), throw up in complaint (shot 10), rest on the egg basket (shot 11).
- Heads: bowed in hunger/loss (shots 2–3), shaking in complaint (shot 10), lifted in
  the golden comfortable beat (shot 11).
- Chickens: peck loops everywhere; rooster alert with head high; chicks cluster at nests.
