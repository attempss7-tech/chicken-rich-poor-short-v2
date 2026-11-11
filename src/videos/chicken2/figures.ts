// Chicken Short v2 — OWN-BUILT figures and props (2026-11-11).
// Everything here is built from THREE primitives in code: no GLBs, no template
// scene content, no copied v1 cast/toon code. Realistic proportions per CHARACTER_BIBLE.md.
import * as THREE from "three";

export type V3 = [number, number, number];
const std = (color: string | number, rough = 0.85, metal = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const mesh = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = true; o.receiveShadow = true;
  return o;
};
const sphere = (r: number, m: THREE.Material, sx = 1, sy = 1, sz = 1) => {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), m);
  o.scale.set(sx, sy, sz); o.castShadow = true; o.receiveShadow = true;
  return o;
};
const box = (w: number, h: number, d: number, m: THREE.Material) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.castShadow = true; o.receiveShadow = true;
  return o;
};
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, seg = 14) => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  o.castShadow = true; o.receiveShadow = true;
  return o;
};

// ---------------- humans ----------------
export type HumanSpec = {
  skin: string; hair: string; hairStyle: "bun" | "short" | "tied" | "grey";
  shirt: string; pants: string; height: number; build: number; // build = torso width factor
};
export type Human = {
  root: THREE.Group; head: THREE.Group; torso: THREE.Mesh;
  armL: THREE.Group; armR: THREE.Group; legL: THREE.Group; legR: THREE.Group;
  spec: HumanSpec;
};
/** One representative, designed once (see CHARACTER_BIBLE.md) and reused in every shot. */
export const makeHuman = (spec: HumanSpec): Human => {
  const h = spec.height, s = h / 1.7; // scale everything from a 1.7 m reference build
  const skin = std(spec.skin, 0.6), hairM = std(spec.hair, 0.9), shirtM = std(spec.shirt, 0.9), pantsM = std(spec.pants, 0.95);
  const root = new THREE.Group();
  const legL = new THREE.Group(); legL.position.set(-0.09 * s, 0.82 * s, 0);
  const legR = new THREE.Group(); legR.position.set(0.09 * s, 0.82 * s, 0);
  for (const [leg, x] of [[legL, -0.09], [legR, 0.09]] as const) {
    const thigh = cyl(0.055 * s, 0.05 * s, 0.42 * s, pantsM); thigh.position.y = -0.21 * s;
    const shin = cyl(0.045 * s, 0.04 * s, 0.4 * s, pantsM); shin.position.y = -0.62 * s;
    const foot = box(0.09 * s, 0.05 * s, 0.22 * s, std("#5a4632", 0.9)); foot.position.set(0, -0.8 * s, 0.05 * s);
    leg.add(thigh, shin, foot); void x;
  }
  // torso: slightly tapered, realistic proportions (shoulders ~0.42 m wide at 1.7 m)
  const torso = mesh(new THREE.CylinderGeometry(0.16 * s * spec.build, 0.19 * s * spec.build, 0.58 * s, 16), shirtM, 0, 1.12 * s, 0);
  torso.scale.z = 0.72;
  const shoulders = sphere(0.19 * s * spec.build, shirtM, 1.05, 0.45, 0.7); shoulders.position.set(0, 1.38 * s, 0);
  const armL = new THREE.Group(); armL.position.set(-0.21 * s * spec.build, 1.36 * s, 0);
  const armR = new THREE.Group(); armR.position.set(0.21 * s * spec.build, 1.36 * s, 0);
  for (const [arm, side] of [[armL, -1], [armR, 1]] as const) {
    const upper = cyl(0.045 * s, 0.04 * s, 0.32 * s, shirtM); upper.position.y = -0.16 * s;
    const fore = cyl(0.038 * s, 0.033 * s, 0.3 * s, skin); fore.position.y = -0.46 * s;
    const hand = sphere(0.05 * s, skin, 0.9, 1.15, 0.9); hand.position.y = -0.64 * s;
    arm.add(upper, fore, hand); void side;
  }
  // head: skin sphere, hair cap, simple believable face (eyes, brows, nose, mouth)
  const head = new THREE.Group(); head.position.set(0, 1.55 * s, 0);
  const skull = sphere(0.115 * s, skin, 0.94, 1.08, 0.98);
  const hairCap = sphere(0.12 * s, hairM, 0.96, 1.0, 1.0); hairCap.position.set(0, 0.028 * s, -0.012 * s);
  const hairBack = sphere(0.115 * s, hairM, 0.9, 1.05, 0.9); hairBack.position.set(0, -0.01 * s, -0.045 * s);
  const eyeM = std("#241a12", 0.4);
  const eyeL = sphere(0.013 * s, eyeM); eyeL.position.set(-0.042 * s, 0.01 * s, 0.1 * s);
  const eyeR = sphere(0.013 * s, eyeM); eyeR.position.set(0.042 * s, 0.01 * s, 0.1 * s);
  const nose = mesh(new THREE.ConeGeometry(0.014 * s, 0.045 * s, 8), skin, 0, -0.02 * s, 0.115 * s);
  nose.rotation.x = Math.PI / 2.3;
  const mouth = box(0.05 * s, 0.008 * s, 0.01 * s, std("#7a3b2e", 0.6)); mouth.position.set(0, -0.062 * s, 0.108 * s);
  head.add(skull, hairCap, hairBack, eyeL, eyeR, nose, mouth);
  if (spec.hairStyle === "bun") {
    const bun = sphere(0.05 * s, hairM); bun.position.set(0, 0.1 * s, -0.09 * s); head.add(bun);
  } else if (spec.hairStyle === "tied") {
    const tail = cyl(0.03 * s, 0.018 * s, 0.22 * s, hairM); tail.position.set(0, -0.08 * s, -0.12 * s); tail.rotation.x = 0.35; head.add(tail);
  } else if (spec.hairStyle === "grey") {
    hairCap.material = std("#cfc8bd", 0.95); hairBack.material = std("#cfc8bd", 0.95);
  }
  root.add(legL, legR, torso, shoulders, armL, armR, head);
  return { root, head, torso, armL, armR, legL, legR, spec };
};
/** walk cycle: legs swing, arms counter-swing, slight bob. phase in radians. */
export const walkPose = (hu: Human, phase: number, amp = 0.5) => {
  hu.legL.rotation.x = Math.sin(phase) * amp;
  hu.legR.rotation.x = -Math.sin(phase) * amp;
  hu.armL.rotation.x = -Math.sin(phase) * amp * 0.7;
  hu.armR.rotation.x = Math.sin(phase) * amp * 0.7;
  hu.root.position.y = Math.abs(Math.sin(phase)) * 0.03;
};

// ---------------- chickens (anatomically believable, code-built) ----------------
export type ChickenKind = "hen" | "rooster" | "chick";
export type Chicken = { root: THREE.Group; head: THREE.Group; wingL: THREE.Mesh; wingR: THREE.Mesh; body: THREE.Mesh };
export const makeChicken = (kind: ChickenKind): Chicken => {
  const isChick = kind === "chick";
  const isRooster = kind === "rooster";
  const bodyCol = isChick ? "#f7d54a" : isRooster ? "#e8e2d4" : "#f4efe4";
  const s = isChick ? 0.45 : isRooster ? 1.18 : 1.0;
  const bodyM = std(bodyCol, 0.9);
  const root = new THREE.Group();
  const body = sphere(0.22 * s, bodyM, 1.25, 0.95, 0.9); body.position.y = 0.3 * s;
  const tailM = std(isRooster ? "#1d4d33" : isChick ? "#f7d54a" : "#d8cfc0", 0.9);
  for (let i = -1; i <= 1; i++) {
    const feather = mesh(new THREE.ConeGeometry(0.05 * s, 0.3 * s, 6), tailM, i * 0.05 * s, 0.42 * s, -0.26 * s);
    feather.rotation.x = -0.9 - Math.abs(i) * 0.15; feather.rotation.z = -i * 0.25;
    root.add(feather);
  }
  const wingL = sphere(0.11 * s, bodyM, 0.45, 1.0, 1.5); wingL.position.set(-0.24 * s, 0.32 * s, 0);
  const wingR = sphere(0.11 * s, bodyM, 0.45, 1.0, 1.5); wingR.position.set(0.24 * s, 0.32 * s, 0);
  const head = new THREE.Group(); head.position.set(0, 0.52 * s, 0.16 * s);
  const skull = sphere(0.09 * s, bodyM);
  const beak = mesh(new THREE.ConeGeometry(0.03 * s, 0.09 * s, 8), std("#e8862e", 0.6), 0, -0.01 * s, 0.11 * s);
  beak.rotation.x = Math.PI / 2;
  const eyeM = std("#1c1410", 0.35);
  const eL = sphere(0.012 * s, eyeM); eL.position.set(-0.05 * s, 0.02 * s, 0.07 * s);
  const eR = sphere(0.012 * s, eyeM); eR.position.set(0.05 * s, 0.02 * s, 0.07 * s);
  head.add(skull, beak, eL, eR);
  if (!isChick) {
    const combM = std("#c62f2f", 0.55);
    const n = isRooster ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const c = sphere(0.028 * s, combM, 1, 1.3, 1);
      c.position.set((i - (n - 1) / 2) * 0.045 * s, 0.1 * s, 0.01 * s);
      head.add(c);
    }
    const wattle = sphere(0.025 * s, combM, 1, 1.5, 0.8); wattle.position.set(0, -0.08 * s, 0.08 * s); head.add(wattle);
  }
  const legM = std("#e8a33d", 0.7);
  for (const x of [-0.07, 0.07]) {
    const leg = cyl(0.012 * s, 0.012 * s, 0.16 * s, legM); leg.position.set(x * s, 0.08 * s, 0); root.add(leg);
    const foot = box(0.07 * s, 0.012 * s, 0.09 * s, legM); foot.position.set(x * s, 0.005 * s, 0.02 * s); root.add(foot);
  }
  root.add(body, wingL, wingR, head);
  return { root, head, wingL, wingR, body };
};
/** peck cycle: head dips toward the ground, body bobs slightly. phase in radians. */
export const peckPose = (c: Chicken, phase: number, amp = 0.55) => {
  const k = Math.max(0, Math.sin(phase));
  c.head.rotation.x = k * amp;
  c.head.position.y = 0.52 - k * 0.12;
  c.body.position.y = 0.3 - k * 0.02;
};

// ---------------- props (all code-built) ----------------
export const makeEgg = (scale = 1) => {
  const e = sphere(0.055 * scale, std("#f3e6c8", 0.5), 1, 1.3, 1);
  return e;
};
export const makeNest = (r = 0.42) => {
  const g = new THREE.Group();
  const straw = std("#b98d4f", 1);
  const bowl = mesh(new THREE.CylinderGeometry(r, r * 0.55, 0.16, 18, 1, true), straw, 0, 0.08, 0);
  const rim = mesh(new THREE.TorusGeometry(r, 0.06, 10, 20), std("#8a6a3c", 1), 0, 0.16, 0);
  rim.rotation.x = Math.PI / 2;
  const inner = mesh(new THREE.CircleGeometry(r * 0.92, 18), std("#6e4f2a", 1), 0, 0.05, 0);
  inner.rotation.x = -Math.PI / 2;
  g.add(bowl, rim, inner);
  return g;
};
export const makeCoop = (w = 1.6, h = 1.1, d = 1.2, wall = "#a9805a", roofCol = "#7a4a2e") => {
  const g = new THREE.Group();
  const body = box(w, h, d, std(wall, 0.95)); body.position.y = h / 2; g.add(body);
  const roof = mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, 0.55, 4), std(roofCol, 0.95), 0, h + 0.27, 0);
  roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, d / w); g.add(roof);
  const door = box(0.4, 0.55, 0.04, std("#4a3220", 0.9)); door.position.set(0, 0.28, d / 2 + 0.01); g.add(door);
  return g;
};
export const makeHouse = (wall: string, roofCol: string, w = 4.2, h = 2.6, d = 3.6) => {
  const g = new THREE.Group();
  const body = box(w, h, d, std(wall, 0.95)); body.position.y = h / 2; g.add(body);
  const roof = mesh(new THREE.CylinderGeometry(0.01, Math.max(w, d) * 0.72, 1.5, 4), std(roofCol, 0.95), 0, h + 0.72, 0);
  roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, d / w); g.add(roof);
  const door = box(0.8, 1.5, 0.06, std("#4a3220", 0.9)); door.position.set(-0.8, 0.75, d / 2 + 0.01); g.add(door);
  for (const x of [0.7, 1.5]) {
    const win = box(0.6, 0.6, 0.05, std("#ffe9a8", 0.3)); win.position.set(x, 1.6, d / 2 + 0.01); g.add(win);
    const frame = box(0.7, 0.7, 0.03, std("#ffffff", 0.9)); frame.position.set(x, 1.6, d / 2); g.add(frame);
  }
  const chimney = box(0.4, 1.0, 0.4, std("#8a6a5a", 0.95)); chimney.position.set(w / 2 - 0.7, h + 1.0, -0.8); g.add(chimney);
  return g;
};
export const makeTree = (h = 3.2, leaf = "#4e8a3c") => {
  const g = new THREE.Group();
  const trunk = cyl(0.14, 0.2, h * 0.55, std("#6b4a2c", 1)); trunk.position.y = h * 0.27; g.add(trunk);
  const lm = std(leaf, 1);
  for (const [x, y, z, r] of [[0, h * 0.72, 0, 0.95], [0.55, h * 0.58, 0.2, 0.6], [-0.5, h * 0.6, -0.15, 0.62], [0.1, h * 0.88, -0.1, 0.55]] as const) {
    const s = sphere(r * (h / 3.2), lm); s.position.set(x, y, z); g.add(s);
  }
  return g;
};
export const makeFence = (len = 6, h = 0.9) => {
  const g = new THREE.Group();
  const wood = std("#8a6a42", 1);
  for (let i = 0; i <= Math.floor(len / 1.2); i++) {
    const post = box(0.09, h, 0.09, wood); post.position.set(-len / 2 + i * 1.2, h / 2, 0); g.add(post);
  }
  for (const y of [h * 0.32, h * 0.72]) {
    const rail = box(len, 0.08, 0.05, wood); rail.position.set(0, y, 0); g.add(rail);
  }
  return g;
};
export const makeStall = () => {
  const g = new THREE.Group();
  const counter = box(2.2, 0.9, 1.0, std("#7a5a38", 0.95)); counter.position.y = 0.45; g.add(counter);
  const canopy = box(2.6, 0.08, 1.5, std("#c65a3a", 0.9)); canopy.position.y = 2.1; g.add(canopy);
  for (const [x, z] of [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]] as const) {
    const pole = cyl(0.04, 0.04, 2.1, std("#5a4028", 0.9)); pole.position.set(x, 1.05, z); g.add(pole);
  }
  return g;
};
export const makePot = () => {
  const g = new THREE.Group();
  const pot = mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.4, 18), std("#4a4440", 0.55, 0.35), 0, 0.32, 0);
  const rim = mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 20), std("#1c1917", 0.5, 0.4), 0, 0.52, 0);
  rim.rotation.x = Math.PI / 2;
  const stew = mesh(new THREE.CircleGeometry(0.38, 18), std("#8a5a2a", 0.4), 0, 0.5, 0);
  stew.rotation.x = -Math.PI / 2;
  const fire = mesh(new THREE.ConeGeometry(0.3, 0.35, 8), std("#e8862e", 0.5), 0, 0.1, 0);
  (fire.material as THREE.MeshStandardMaterial).emissive = new THREE.Color("#ff7a1a");
  (fire.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.6;
  g.add(pot, rim, stew, fire);
  return g;
};
/** steam wisps above the pot: translucent spheres animated by world.ts */
export const makeSteam = (n = 6) => {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, roughness: 1 });
  for (let i = 0; i < n; i++) {
    const s = sphere(0.09 + i * 0.015, m);
    s.castShadow = false;
    s.position.set(0, 0.7 + i * 0.18, 0);
    s.userData.phase = i / n;
    g.add(s);
  }
  return g;
};
export const makeBasket = () => {
  const g = new THREE.Group();
  const b = mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.3, 16, 1, true), std("#a9805a", 1), 0, 0.15, 0);
  const bottom = mesh(new THREE.CircleGeometry(0.3, 16), std("#8a6a3c", 1), 0, 0.01, 0);
  bottom.rotation.x = -Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 20), std("#7a5a34", 1), 0, 0.3, 0);
  rim.rotation.x = Math.PI / 2;
  g.add(b, bottom, rim);
  return g;
};
export const makeCoin = () => {
  const c = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16), std("#e8b73a", 0.35, 0.8), 0, 0, 0);
  (c.material as THREE.MeshStandardMaterial).emissive = new THREE.Color("#664d00");
  (c.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25;
  return c;
};
export const makeSack = () => {
  const g = new THREE.Group();
  const s = sphere(0.32, std("#cbb27f", 1), 1, 1.15, 1); s.position.y = 0.36; g.add(s);
  const tie = cyl(0.1, 0.16, 0.14, std("#a98d5f", 1)); tie.position.y = 0.72; g.add(tie);
  return g;
};
export const makeCloud = (scale = 1) => {
  const g = new THREE.Group();
  const m = std("#fdfbf6", 1);
  for (const [x, y, z, r] of [[0, 0, 0, 1], [0.9, -0.1, 0.1, 0.7], [-0.85, -0.05, -0.1, 0.75], [0.3, 0.25, 0, 0.6]] as const) {
    const s = sphere(r * scale, m, 1.4, 0.55, 1); s.position.set(x * scale, y * scale, z * scale); s.castShadow = false; g.add(s);
  }
  return g;
};
/** golden-hour sun disc for golden shots */
export const makeSunDisc = () => {
  const m = new THREE.MeshBasicMaterial({ color: "#ffd9a0", fog: false });
  const d = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), m);
  d.castShadow = false;
  return d;
};
