// Chicken Short v2 — timeline, farm layout, flock logic and camera grammar.
// OWN code written for v2 (2026-11-11). 24 fps, 75.984 s voice -> 1824 frames.
// Every boundary below is derived from voice/words.json seconds x 24 (see SHOT_TIMELINE.md),
// NOT copied from the v1 30 fps frame numbers.
export const FPS = 24;
export const TOTAL = 1824; // round(75.984 * 24)
export const D0 = 0; // farm ground height (m)
export type V3 = [number, number, number];
export type Light = "day" | "golden";

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
/** symmetric smootherstep glide for camera moves (attack = release) */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- farm layout (metres; ground y = 0, village street along x) ----------------
// Group 1 red (west), Group 2 green (centre), Group 3 gold/blue (east). Houses face +z.
export const G1_AT: V3 = [-15, 0, -5];
export const G2_AT: V3 = [0, 0, -4];
export const G3_AT: V3 = [15, 0, -5];
export const COOP1: V3 = [-18.5, 0, -11];
export const COOP2: V3 = [-3.2, 0, -10.5];
export const COOP3: V3 = [18.5, 0, -11];
export const NEST2: V3 = [2.0, 0, -1.6];
export const NEST3: V3 = [13.2, 0, -1.6];
export const POT_AT: V3 = [-15, 0, -3.4]; // Group 1 cooking pot
export const BASKET_AT: V3 = [1.6, 0, -2.6]; // Group 2 egg basket
export const STALL_AT: V3 = [7.5, 0, -3.0]; // meeting / market stall between G2 and G3

// ---------------- flock growth (story time from words.json) ----------------
// Gift lands at "chicken" 16.11 s; G1 cooks at "cook" 18.63 s; chicks hatch at "hatch" 45.0 s;
// young hens lay at "laying" 47.58 s; flock multiplies from "raises more and more" ~50.4 s.
export const GIFT_F = 387;  // 16.11 s
export const COOK_F = 447;  // 18.63 s
export const HATCH_F = 1080; // 45.0 s
export const LAY_F = 1142;  // 47.58 s
export const GROW_F = 1195; // ~49.8 s
export type Flock = { hens: number; roosters: number; chicks: number };
export const flockAt = (group: 1 | 2 | 3, f: number): Flock => {
  if (f < GIFT_F) return { hens: 0, roosters: 0, chicks: 0 };
  if (group === 1) return { hens: f < COOK_F ? 1 : 0, roosters: 0, chicks: 0 };
  if (group === 2) return { hens: 1, roosters: 1, chicks: f >= HATCH_F && f < LAY_F ? 2 : 0 };
  if (f < HATCH_F) return { hens: 1, roosters: 1, chicks: 0 };
  if (f < LAY_F) return { hens: 1, roosters: 1, chicks: 4 };
  if (f < GROW_F) return { hens: 5, roosters: 1, chicks: 0 };
  const grown = Math.min(18, 6 + Math.floor((f - GROW_F) / 30));
  return { hens: grown, roosters: 2, chicks: 0 };
};
/** eggs visible in a nest at frame f */
export const eggsAt = (group: 2 | 3, f: number) => {
  if (f < GIFT_F) return 0;
  if (group === 2) return f < HATCH_F ? 3 : 2;
  return f < HATCH_F ? 0 : f < LAY_F ? 4 : 3;
};

// ---------------- shots (frame ranges from words.json, see SHOT_TIMELINE.md) ----------------
export type ShotDef = { id: number; a: number; b: number; light: Light; note: string };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 120, light: "day", note: "hook: one chicken explains it" },
  { id: 2, a: 120, b: 264, light: "day", note: "wealth taken: coins, houses, fields gone" },
  { id: 3, a: 264, b: 408, light: "day", note: "poor + hungry, then each person gets one chicken" },
  { id: 4, a: 408, b: 566, light: "golden", note: "Group 1 cooks its chicken that same night" },
  { id: 5, a: 566, b: 763, light: "day", note: "Group 2 keeps chickens alive: hen's eggs, rooster" },
  { id: 6, a: 763, b: 928, light: "day", note: "Group 3 walks over: let's pool hens and roosters" },
  { id: 7, a: 928, b: 1042, light: "day", note: "second group wanted eggs, third wanted chickens" },
  { id: 8, a: 1042, b: 1176, light: "day", note: "three weeks later: first chicks hatch" },
  { id: 9, a: 1176, b: 1258, light: "day", note: "months later: chicks laying; flock grows" },
  { id: 10, a: 1258, b: 1398, light: "day", note: "Group 1 has nothing left: they complain" },
  { id: 11, a: 1398, b: 1483, light: "golden", note: "Group 2 has enough eggs, lives comfortably" },
  { id: 12, a: 1483, b: 1656, light: "day", note: "Group 3 can't look after them all: hires Group 1" },
  { id: 13, a: 1656, b: TOTAL, light: "day", note: "final split: poor / middle class / rich" },
];
/** crossfades (frames, ~0.25 s at 24 fps) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 2: 6, 4: 6, 5: 6, 8: 6, 11: 6, 13: 6 };
export const FLASH_AT = 120;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 20)));
  }
  return cur;
};
/** push-in factor since f0: subject grows ~rate per frame; `punch` raises it briefly for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 28) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 6, (n - i - 0.5) / 6));
  return Math.exp(-s);
};
/** dolly push: camera slides toward the look point by factor k */
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** zoom push (camera stays put): tan(fov/2) shrinks by k */
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });

// ---- framings (f -> camera); each pushes in from the frame its key starts ----
// shot 1 (hook): drone wide over the village -> MS on the one white hen -> hen macro CU (punch on "chicken" f 98)
const S1a = (f: number) => dolly([10, 6.5, 21], [0, 1.2, -7], pushK(f, 0, 0.0022), { fov: 46 });
const S1b = (f: number) => dolly([3.2, 1.6, 3.4], [0, 0.6, -1.0], pushK(f, 40, 0.0024), { fov: 40 });
const S1c = (f: number) => dolly([0.7, 0.55, 0.7], [0, 0.32, -1.0], pushK(f, 78, 0.0022, 0.007, 26), { fov: 32 });
// shot 2 (wealth taken): high wide, slow push; coins/houses/fields empty out as "Gone" lands (f 248)
const S2a = (f: number) => zoom([13, 12, 19], [0, 1, -13], 44, pushK(f, 120, 0.0018));
// shot 3 (poor/hungry, then the gift): low dolly-back on hungry villagers -> chicken appears (punch on "chicken" f 387)
const S3a = (f: number) => dolly([-5, 1.6, 4.5], [-7.5, 1.1, -5], pushK(f, 264, 0.002), { fov: 40 });
const S3b = (f: number) => dolly([4.0, 2.3, 5.4], [0.6, 0.5, -3.0], pushK(f, 352, 0.002, 0.007, 26), { fov: 42 });
// shot 4 (Group 1 cooks, golden dusk): MS red group around the pot -> pot macro CU with steam
const S4a = (f: number) => dolly([-11.5, 1.9, 0.8], [-15, 1.0, -4.2], pushK(f, 408, 0.002), { fov: 40 });
const S4b = (f: number) => dolly([-12.8, 1.5, 0.6], [-15, 0.5, -3.4], pushK(f, 480, 0.0022), { fov: 38, roll: -0.03 });
// shot 5 (Group 2 keeps chickens): MS green group with hen + rooster -> nest macro CU (eggs, punch on "eggs" f 683)
const S5a = (f: number) => dolly([3.6, 1.7, 2.2], [0, 0.8, -3.6], pushK(f, 566, 0.002), { fov: 40 });
const S5b = (f: number) => dolly([3.3, 0.85, 0.7], [2.0, 0.3, -1.6], pushK(f, 640, 0.002, 0.007, 26), { fov: 34 });
// shot 6 (Group 3 walks over to Group 2): low-angle tracking of the walk -> two-group meeting MS
const S6a = (f: number) => dolly([9, 1.2, 6.5], [8, 1.0, -4.5], pushK(f, 763, 0.002), { fov: 42 });
const S6b = (f: number) => dolly([5.0, 2.4, 5.8], [7.5, 1.0, -3.2], pushK(f, 848, 0.002), { fov: 40 });
// shot 7 (eggs vs chickens): green yard with eggs -> gold yard with chickens (hard cut on "third group wanted chickens" f 1000)
const S7a = (f: number) => dolly([2.9, 1.35, 1.9], [1, 0.5, -2.8], pushK(f, 928, 0.002), { fov: 38 });
const S7b = (f: number) => dolly([17.6, 1.1, 1.6], [15, 0.6, -4.6], pushK(f, 997, 0.002), { fov: 38 });
// shot 8 (chicks hatch): nest macro CU, chicks popping out in slow motion (punch on "hatch" f 1080)
const S8a = (f: number) => dolly([3.1, 0.95, 0.5], [2.0, 0.25, -1.6], pushK(f, 1042, 0.002, 0.006, 26), { fov: 32 });
// shot 9 (flock grows): wide of the gold yard filling with chickens -> closer on the growing flock
const S9a = (f: number) => dolly([19, 3.4, 6.5], [15, 0.8, -5.5], pushK(f, 1176, 0.002), { fov: 44 });
const S9b = (f: number) => dolly([17, 1.7, 2.2], [15, 0.6, -4.6], pushK(f, 1216, 0.002), { fov: 40 });
// shot 10 (Group 1 complains): slow dolly-back on the empty red yard -> complaining villager CU (punch on "complain" f 1369)
const S10a = (f: number) => dolly([-11.5, 1.9, 0.6], [-15, 1.0, -4.2], pushK(f, 1258, 0.0016), { fov: 40 });
const S10b = (f: number) => dolly([-13.6, 1.7, -0.6], [-16, 1.35, -3.5], pushK(f, 1344, 0.002, 0.007, 26), { fov: 36 });
// shot 11 (Group 2 comfortable, golden): MS green group relaxed with the egg basket, slow dolly-out
const S11a = (f: number) => dolly([3.9, 1.8, 2.6], [0, 1.0, -3.6], pushK(f, 1398, 0.0016), { fov: 40 });
// shot 12 (Group 3 hires Group 1): wide gold yard, red villager working among the flock -> MS of the handover (eggs for work)
const S12a = (f: number) => dolly([18, 2.7, 5.2], [13, 0.9, -4.6], pushK(f, 1483, 0.002), { fov: 44 });
const S12b = (f: number) => dolly([14.6, 1.6, 1.2], [12.2, 0.8, -3.6], pushK(f, 1580, 0.002), { fov: 38 });
// shot 13 (final split): high crane-out over all three yards — poor (empty, red) / middle (eggs, green) / rich (flock, gold)
const S13a = (f: number) => zoom([0, 9, 28], [0, 0.7, -3.5], 50, pushK(f, 1656, 0.0012));
const S13b = (f: number) => zoom([0, 11, 32], [0, 0.7, -3.5], 52, pushK(f, 1740, 0.001));

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: S1a },
    { f: 40, dur: 24, s: S1b },
    { f: 78, dur: 24, s: S1c }, // punch on "chicken" f 98
  ],
  2: [{ f: 120, s: S2a }],
  3: [
    { f: 264, s: S3a },
    { f: 352, dur: 22, s: S3b }, // punch on "chicken" f 387
  ],
  4: [
    { f: 408, s: S4a },
    { f: 480, dur: 22, s: S4b }, // centred on "Best dinner" f 491
  ],
  5: [
    { f: 566, s: S5a },
    { f: 640, dur: 24, s: S5b }, // punch on "eggs" f 683
  ],
  6: [
    { f: 763, s: S6a },
    { f: 848, dur: 24, s: S6b }, // centred on "let's put our hens and roosters together" f ~860
  ],
  7: [
    { f: 928, s: S7a },
    { f: 997, cut: true, s: S7b }, // hard cut on "the third group wanted chickens" f 1000
  ],
  8: [{ f: 1042, s: S8a }], // punch on "hatch" f 1080
  9: [
    { f: 1176, s: S9a },
    { f: 1216, dur: 20, s: S9b },
  ],
  10: [
    { f: 1258, s: S10a },
    { f: 1344, dur: 22, s: S10b }, // punch on "complain" f 1369
  ],
  11: [{ f: 1398, s: S11a }],
  12: [
    { f: 1483, s: S12a },
    { f: 1580, dur: 22, s: S12b }, // centred on "offer them work paid in eggs" f ~1630
  ],
  13: [
    { f: 1656, s: S13a },
    { f: 1740, dur: 24, s: S13b },
  ],
};

export const camAt = (shotId: number, f: number): Cam => run(CAMS[shotId], f);

/** thin-lens DOF per shot: focus point (world coords, fn of frame) + blur strength at infinity (px @1080x1920) */
export type Dof = { focus: (f: number) => V3; cInf: number };
export const dofAt = (f: number): Dof => {
  const s = shotAt(f);
  switch (s.id) {
    case 1: return { focus: () => (f < 78 ? [0, 0.6, -1.0] : [0, 0.32, -1.0]), cInf: f < 40 ? 0 : 14 };
    case 3: return { focus: () => [0, 0.5, -3.2], cInf: f >= 352 ? 16 : 6 };
    case 4: return { focus: () => [-15, 0.55, -3.4], cInf: f >= 480 ? 18 : 8 };
    case 5: return { focus: () => [2.0, 0.3, -1.6], cInf: f >= 640 ? 18 : 8 };
    case 8: return { focus: () => [2.0, 0.25, -1.6], cInf: 20 }; // macro hatch: shallowest focus in the film
    case 10: return { focus: () => [-15, 1.35, -4.8], cInf: f >= 1344 ? 16 : 6 };
    case 12: return { focus: () => [12.2, 0.8, -3.6], cInf: f >= 1580 ? 14 : 6 };
    default: return { focus: () => [0, 0.7, -4.6], cInf: 0 };
  }
};

/** slow-motion factor for the hatching beat (visual only: chicks scale in over more frames) */
export const hatchProgress = (f: number) => smooth((f - HATCH_F) / 48);
export const layProgress = (f: number) => smooth((f - LAY_F) / 48);
export const growProgress = (f: number) => smooth((f - GROW_F) / 60);
/** wealth vanishing: 1 = wealth present, 0 = gone; the fade runs across "Gone" (f 248-259) */
export const wealthAt = (f: number) => (f < 248 ? 1 : f > 259 ? 0 : 1 - (f - 248) / 11);
export const _lin = lin;
