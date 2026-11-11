// Chicken Short v2 — OWN-BUILT world (2026-11-11).
// Village, characters, flock and props are assembled here from figures.ts primitives only.
// No GLBs, no template scene files, no copied v1 world/cast/toon content.
// One World instance is built once; update() re-poses it per shot/frame.
import * as THREE from "three";
import { LIGHTS } from "./lights";
import { grass, rep } from "./paint";
import {
  makeHuman, walkPose, peckPose, makeChicken, makeEgg, makeNest, makeCoop, makeHouse,
  makeTree, makeFence, makeStall, makePot, makeSteam, makeBasket, makeCoin, makeSack,
  makeCloud, makeSunDisc,
} from "./figures";
import type { Human, Chicken } from "./figures";
import {
  FPS, TOTAL, G1_AT, G2_AT, G3_AT, COOP1, COOP2, COOP3, NEST2, NEST3, POT_AT, BASKET_AT, STALL_AT,
  flockAt, eggsAt, camAt, dofAt, shotAt, hatchProgress, layProgress, wealthAt,
} from "./story";
import type { V3 } from "./story";

void TOTAL; void FPS;
const std = (color: string | number, rough = 0.9) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
const scatter = (i: number, cx: number, cz: number, r: number): [number, number] => {
  const a = ((i * 2.39996) % (Math.PI * 2));
  const d = r * (0.35 + 0.65 * (((i * 7 + 3) % 10) / 10));
  return [cx + Math.cos(a) * d, cz + Math.sin(a) * d * 0.7];
};
const face = (o: THREE.Object3D, x: number, z: number) => { o.rotation.y = Math.atan2(x - o.position.x, z - o.position.z); };
const place = (o: THREE.Object3D, x: number, z: number, ry = 0) => { o.position.x = x; o.position.z = z; o.rotation.y = ry; };

export class World {
  root = new THREE.Group();
  sun = new THREE.DirectionalLight("#fff3e0", 2.8);
  hemi = new THREE.HemisphereLight("#dcecff", "#b49a78", 0.55);
  sunDisc = makeSunDisc();
  // characters (CHARACTER_BIBLE.md — each designed once, reused identically)
  g1!: Human; g1w!: Human; g1e!: Human;
  g2!: Human; g2m!: Human; g2w!: Human;
  g3!: Human; g3w!: Human; g3m!: Human;
  // chickens
  hens: Chicken[] = []; roosters: Chicken[] = []; chicks: Chicken[] = [];
  eggs2: THREE.Mesh[] = []; eggs3: THREE.Mesh[] = [];
  nest2!: THREE.Group; nest3!: THREE.Group;
  pot!: THREE.Group; steam!: THREE.Group; basket!: THREE.Group; basketEggs: THREE.Mesh[] = [];
  coins: THREE.Group[] = [];
  fields: THREE.Mesh[] = [];
  grain: THREE.Mesh[] = [];
  fences: THREE.Group[] = [];
  blades!: THREE.Group;
  clouds: THREE.Group[] = [];
  houseMats: THREE.MeshStandardMaterial[] = [];

  constructor() {
    const R = this.root;
    // ---- sky, ground, street, fields ----
    const ground = new THREE.Mesh(new THREE.CircleGeometry(70, 48), new THREE.MeshStandardMaterial({ map: rep(grass(), 18, 18), roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; R.add(ground);
    const street = new THREE.Mesh(new THREE.PlaneGeometry(46, 5), std("#b99a6a", 1));
    street.rotation.x = -Math.PI / 2; street.position.set(0, 0.02, 1.5); street.receiveShadow = true; R.add(street);
    // ploughed fields flanking the village (turn bare as wealth vanishes — see update)
    for (const [x, z, w, d] of [[-26, -8, 12, 9], [26, -8, 12, 9], [-26, 4, 10, 7], [26, 4, 10, 7]] as const) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std("#7a5a34", 1));
      f.rotation.x = -Math.PI / 2; f.position.set(x, 0.03, z); f.receiveShadow = true;
      R.add(f); this.fields.push(f);
      for (let i = 0; i < 5; i++) {
        const ridge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.3), std("#6a4a28", 1));
        ridge.position.set(x, 0.06, z - d / 2 + 1 + i * (d - 2) / 4); ridge.receiveShadow = true; R.add(ridge);
      }
    }
    // ---- houses, coops, fences, trees, windmill, stall ----
    const h1 = makeHouse("#e8dcc0", "#8a4a2e"); place(h1, G1_AT[0], G1_AT[2] - 7); R.add(h1);
    const h2 = makeHouse("#dce8c8", "#5a6a3a"); place(h2, G2_AT[0], G2_AT[2] - 7); R.add(h2);
    const h3 = makeHouse("#f0e0b8", "#3a4a6a"); place(h3, G3_AT[0], G3_AT[2] - 7); R.add(h3);
    for (const [c, x, z] of [[COOP1, COOP1[0], COOP1[2]], [COOP2, COOP2[0], COOP2[2]], [COOP3, COOP3[0], COOP3[2]]] as const) {
      const coop = makeCoop(); place(coop, x, z, 0.3); R.add(coop); void c;
    }
    for (const [x, z, ry] of [[-15, -2.5, 0], [0, -2.5, 0], [15, -2.5, 0]] as const) {
      const fence = makeFence(7); place(fence, x, z, ry); R.add(fence); this.fences.push(fence);
    }
    for (const [x, z, h, leaf] of [[-22, -2, 3.4, "#4e8a3c"], [-9, -14, 2.8, "#5a9a44"], [8, -14, 3.0, "#4e8a3c"], [22, -1, 3.6, "#6a9a3a"], [-21, 6, 2.6, "#5a8a44"], [21, 6, 2.9, "#4e8a3c"]] as const) {
      const t = makeTree(h, leaf); place(t, x, z); R.add(t);
    }
    // own-built windmill (dressing, west edge)
    const mill = new THREE.Group();
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.5, 6, 10), std("#d8cbb2", 0.95));
    tower.position.y = 3; tower.castShadow = true; mill.add(tower);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.2, 10), std("#7a4a2e", 0.95));
    cap.position.y = 6.6; cap.castShadow = true; mill.add(cap);
    this.blades = new THREE.Group(); this.blades.position.set(0, 5.6, 1.35);
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.6, 0.06), std("#f0e8d8", 0.9));
      b.position.y = 1.5; b.castShadow = true;
      const arm = new THREE.Group(); arm.rotation.z = (i * Math.PI) / 2; arm.add(b); this.blades.add(arm);
    }
    mill.add(this.blades); place(mill, -25, -16); R.add(mill);
    const stall = makeStall(); place(stall, STALL_AT[0], STALL_AT[2], -0.2); R.add(stall);
    // ---- wealth: coin piles + sacks in front of each house (vanish on "Gone") ----
    for (const [x, z] of [[-13, -1.5], [2, -1], [13, -1.5]] as const) {
      const pile = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const c = makeCoin();
        c.position.set(((i % 3) - 1) * 0.2, 0.02 + Math.floor(i / 3) * 0.025, (Math.floor(i / 3) % 2) * 0.2 - 0.1);
        pile.add(c);
      }
      const sack = makeSack(); sack.position.set(0.7, 0, 0.3); pile.add(sack);
      place(pile, x, z); R.add(pile); this.coins.push(pile);
    }
    // ---- nests, pot, basket ----
    this.nest2 = makeNest(); place(this.nest2, NEST2[0], NEST2[2]); R.add(this.nest2);
    this.nest3 = makeNest(); place(this.nest3, NEST3[0], NEST3[2]); R.add(this.nest3);
    this.pot = makePot(); place(this.pot, POT_AT[0], POT_AT[2]); R.add(this.pot);
    this.steam = makeSteam(); this.steam.position.set(POT_AT[0], 0.55, POT_AT[2]); R.add(this.steam);
    this.basket = makeBasket(); place(this.basket, BASKET_AT[0], BASKET_AT[2]); R.add(this.basket);
    for (let i = 0; i < 4; i++) {
      const e = makeEgg(); e.position.set((i % 2) * 0.14 - 0.07, 0.32, Math.floor(i / 2) * 0.14 - 0.07);
      this.basket.add(e); this.basketEggs.push(e);
    }
    // ---- eggs in nests ----
    for (let i = 0; i < 4; i++) {
      const e2 = makeEgg(0.9); e2.position.set(NEST2[0] + (i % 2) * 0.16 - 0.08, 0.12, NEST2[2] + Math.floor(i / 2) * 0.16 - 0.08);
      R.add(e2); this.eggs2.push(e2);
      const e3 = makeEgg(0.9); e3.position.set(NEST3[0] + (i % 2) * 0.16 - 0.08, 0.12, NEST3[2] + Math.floor(i / 2) * 0.16 - 0.08);
      R.add(e3); this.eggs3.push(e3);
    }
    // ---- grain particles (flock-growth beat) ----
    const grainM = std("#e8c84a", 0.8);
    for (let i = 0; i < 14; i++) {
      const g = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), grainM);
      g.castShadow = false; g.userData.seed = i * 0.37; R.add(g); this.grain.push(g);
    }
    // ---- clouds ----
    for (let i = 0; i < 5; i++) {
      const c = makeCloud(1.6 + (i % 3) * 0.7);
      c.position.set(-30 + i * 14, 16 + (i % 2) * 4, -30 - (i % 3) * 6);
      R.add(c); this.clouds.push(c);
    }
    // ---- characters (bible specs) ----
    this.g1 = makeHuman({ skin: "#8a5a3c", hair: "#1c1410", hairStyle: "short", shirt: "#b03030", pants: "#3a3a44", height: 1.72, build: 1.05 });
    this.g1w = makeHuman({ skin: "#7a4a30", hair: "#1c1410", hairStyle: "tied", shirt: "#c05040", pants: "#4a3a30", height: 1.6, build: 0.95 });
    this.g1e = makeHuman({ skin: "#9a6a48", hair: "#8a8078", hairStyle: "grey", shirt: "#a03838", pants: "#44403a", height: 1.68, build: 1.0 });
    this.g2 = makeHuman({ skin: "#9a6a44", hair: "#1c1410", hairStyle: "tied", shirt: "#2e7a3e", pants: "#5a4632", height: 1.62, build: 0.95 });
    this.g2m = makeHuman({ skin: "#8a5a3c", hair: "#1c1410", hairStyle: "short", shirt: "#3a8a4a", pants: "#33302a", height: 1.75, build: 1.05 });
    this.g2w = makeHuman({ skin: "#a07048", hair: "#241a12", hairStyle: "bun", shirt: "#2a6a38", pants: "#4a4038", height: 1.58, build: 0.9 });
    this.g3 = makeHuman({ skin: "#a07048", hair: "#1c1410", hairStyle: "short", shirt: "#c89a2e", pants: "#2e4a7a", height: 1.78, build: 1.1 });
    this.g3w = makeHuman({ skin: "#96603c", hair: "#1c1410", hairStyle: "bun", shirt: "#d8a83a", pants: "#2e4a7a", height: 1.64, build: 0.95 });
    this.g3m = makeHuman({ skin: "#8a5a3c", hair: "#2a2018", hairStyle: "short", shirt: "#b8860b", pants: "#35486a", height: 1.74, build: 1.0 });
    for (const h of [this.g1, this.g1w, this.g1e, this.g2, this.g2m, this.g2w, this.g3, this.g3w, this.g3m]) R.add(h.root);
    // ---- chicken pools ----
    for (let i = 0; i < 20; i++) { const c = makeChicken("hen"); R.add(c.root); this.hens.push(c); }
    for (let i = 0; i < 3; i++) { const c = makeChicken("rooster"); R.add(c.root); this.roosters.push(c); }
    for (let i = 0; i < 8; i++) { const c = makeChicken("chick"); R.add(c.root); this.chicks.push(c); }
    // ---- lights ----
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -38; this.sun.shadow.camera.right = 38;
    this.sun.shadow.camera.top = 38; this.sun.shadow.camera.bottom = -38;
    this.sun.shadow.camera.near = 5; this.sun.shadow.camera.far = 160;
    this.sun.shadow.bias = -0.00025; this.sun.shadow.normalBias = 0.015;
    R.add(this.sun, this.sun.target, this.hemi);
    this.sunDisc.position.set(-28, 9, -55); R.add(this.sunDisc);
  }

  /** pose one frame; returns the camera look target (for DOF focus). */
  update(shotId: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): V3 {
    const shot = shotAt(f);
    const light = LIGHTS[shot.light];
    const c = camAt(shotId, f);
    cam.position.set(...c.pos);
    cam.lookAt(c.look[0], c.look[1], c.look[2]);
    cam.fov = c.fov; cam.rotation.z += c.roll; cam.updateProjectionMatrix();
    // --- lighting per shot ---
    const az = (light.az * Math.PI) / 180, el = (light.el * Math.PI) / 180;
    const sd: V3 = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
    this.sun.position.set(sd[0] * 60, sd[1] * 60, sd[2] * 60);
    this.sun.color.set(light.sunCol); this.sun.intensity = light.sunI;
    this.hemi.color.set(light.sky); this.hemi.groundColor.set(light.ground); this.hemi.intensity = light.hemiI;
    this.sun.shadow.bias = light.bias; this.sun.shadow.normalBias = light.normalBias;
    scene.background = new THREE.Color(light.hor);
    scene.fog = new THREE.Fog(light.fog, light.fogNear, light.fogFar);
    this.sunDisc.visible = shot.light === "golden";
    this.sunDisc.lookAt(cam.position);
    // --- ambient life: windmill, clouds, grain, steam ---
    this.blades.rotation.z = f * 0.012;
    this.clouds.forEach((cl, i) => { cl.position.x = -30 + i * 14 + ((f * 0.008 + i * 7) % 12); });
    const steamOn = shotId === 4 && f >= 447;
    this.steam.visible = steamOn;
    if (steamOn) this.steam.children.forEach((s, i) => {
      const p = (((f * 0.02) + s.userData.phase) % 1);
      s.position.set(POT_AT[0] + Math.sin(p * 9 + i) * 0.12 * p, 0.55 + p * 1.1, POT_AT[2] + Math.cos(p * 7 + i) * 0.08 * p);
      ((s as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.35 * (1 - p);
      const sc = 0.7 + p; s.scale.setScalar(sc);
    });
    const grainOn = shotId === 9;
    this.grain.forEach((g, i) => {
      g.visible = grainOn;
      if (grainOn) {
        const p = (((f * 0.03) + g.userData.seed) % 1);
        g.position.set(13 + Math.sin(i * 2.1) * 2.2, 2.2 - p * 2.1, -3 + Math.cos(i * 1.7) * 1.6);
      }
    });
    // --- wealth vanishes across "Gone" (shot 2); fields go bare with it ---
    const w = shotId === 2 ? wealthAt(f) : f < 120 ? 1 : 0;
    this.coins.forEach((pile) => { pile.visible = w > 0.02; pile.scale.setScalar(Math.max(0.02, w)); });
    this.fields.forEach((fld) => {
      (fld.material as THREE.MeshStandardMaterial).color.setHex(w > 0.5 ? 0x7a9a44 : 0x7a5a34);
    });
    // the G1 fence would cut across the cooking close-up; hide it for shot 4
    this.fences[0].visible = shotId !== 4;
    // --- pot: only the cooking beat shows it lit ---
    this.pot.visible = shotId === 4 || f >= 408 && f < 566;
    // --- characters: base yards, then per-shot staging ---
    place(this.basket, BASKET_AT[0], BASKET_AT[2], 0); // reset: shot 12 moves it, every other shot it lives at G2
    const all = [this.g1, this.g1w, this.g1e, this.g2, this.g2m, this.g2w, this.g3, this.g3w, this.g3m];
    all.forEach((h) => { h.armL.rotation.set(0, 0, 0); h.armR.rotation.set(0, 0, 0); h.head.rotation.set(0, 0, 0); h.legL.rotation.set(0, 0, 0); h.legR.rotation.set(0, 0, 0); h.root.position.y = 0; h.torso.rotation.x = 0; });
    place(this.g1.root, G1_AT[0] - 1, G1_AT[2] + 1.5, 0.4);
    place(this.g1w.root, G1_AT[0] + 1.2, G1_AT[2] + 1.0, -0.5);
    place(this.g1e.root, G1_AT[0] + 2.4, G1_AT[2] - 0.5, -1.2);
    place(this.g2.root, G2_AT[0] - 1.2, G2_AT[2] + 1.2, 0.3);
    place(this.g2m.root, G2_AT[0] + 1.0, G2_AT[2] + 0.8, -0.4);
    place(this.g2w.root, G2_AT[0] + 2.2, G2_AT[2] - 0.6, -1.0);
    place(this.g3.root, G3_AT[0] - 1, G3_AT[2] + 1.5, 0.4);
    place(this.g3w.root, G3_AT[0] + 1.2, G3_AT[2] + 1.0, -0.5);
    place(this.g3m.root, G3_AT[0] + 2.4, G3_AT[2] - 0.5, -1.2);
    // shot-specific staging
    if (shotId === 1) { // hook: everyone looks up / toward the hen at centre
      for (const h of all) face(h.root, 0, -1);
      this.g1.head.rotation.x = -0.15; this.g2.head.rotation.x = -0.15; this.g3.head.rotation.x = -0.15;
    }
    if (shotId === 2) { // wealth taken: hands to faces, heads bowed as coins vanish
      this.g1.armL.rotation.x = -2.2; this.g1.armR.rotation.x = -2.2; this.g1.head.rotation.x = 0.35;
      this.g2.armL.rotation.x = -2.0; this.g2.head.rotation.x = 0.3;
      this.g3.armR.rotation.x = -2.2; this.g3.head.rotation.x = 0.35;
    }
    if (shotId === 3) { // hungry, then the gift: hollow look, then arms opening to receive
      const gift = Math.max(0, Math.min(1, (f - 370) / 20));
      this.g1.head.rotation.x = 0.2 - gift * 0.2; this.g2.head.rotation.x = 0.2 - gift * 0.2; this.g3.head.rotation.x = 0.2 - gift * 0.2;
      this.g1.armL.rotation.x = -gift * 1.2; this.g1.armR.rotation.x = -gift * 1.2;
      this.g2.armL.rotation.x = -gift * 1.2; this.g2.armR.rotation.x = -gift * 1.2;
      this.g3.armL.rotation.x = -gift * 1.2; this.g3.armR.rotation.x = -gift * 1.2;
    }
    if (shotId === 4) { // cooking: red group leans over the pot, stirring
      place(this.g1.root, POT_AT[0] - 1.1, POT_AT[2] + 1.2, 0.9); face(this.g1.root, POT_AT[0], POT_AT[2]);
      this.g1.torso.rotation.x = 0.25; this.g1.armR.rotation.x = -0.9; this.g1.armL.rotation.x = -0.5;
      place(this.g1w.root, POT_AT[0] + 1.2, POT_AT[2] + 0.9, -0.9); face(this.g1w.root, POT_AT[0], POT_AT[2]);
      this.g1w.torso.rotation.x = 0.2;
      this.g1e.head.rotation.x = 0.15;
    }
    if (shotId === 5) { // keeping: green group crouches by the nest, gentle hands
      place(this.g2.root, NEST2[0] - 1.0, NEST2[2] + 1.3, 0.6); face(this.g2.root, NEST2[0], NEST2[2]);
      this.g2.torso.rotation.x = 0.3; this.g2.armR.rotation.x = -0.8;
      place(this.g2m.root, NEST2[0] + 1.3, NEST2[2] + 0.6, -0.7); face(this.g2m.root, NEST2[0], NEST2[2]);
    }
    if (shotId === 6) { // the walk: G3 rep crosses to the stall, low-angle tracking
      const k = Math.max(0, Math.min(1, (f - 763) / 85));
      const wx = 15 - k * 7.6, wz = -3.5 + k * 1.3; // ends beside the stall at (7.4, -2.2), not behind it
      place(this.g3.root, wx, wz, -Math.PI / 2 + 0.3);
      walkPose(this.g3, f * 0.35, 0.45);
      face(this.g3.root, 7, -3);
      place(this.g2.root, 6.2, -2.2, 1.2); face(this.g2.root, STALL_AT[0], STALL_AT[2]);
      this.g2.armR.rotation.x = -1.4; // welcoming gesture
    }
    if (shotId === 7) { // eggs vs chickens: G2 shows eggs, G3 shows flock
      place(this.g2.root, BASKET_AT[0] - 1.0, BASKET_AT[2] + 1.2, 0.5); face(this.g2.root, BASKET_AT[0], BASKET_AT[2]);
      this.g2.armR.rotation.x = -0.9;
      place(this.g3.root, G3_AT[0] - 1, G3_AT[2] + 1.5, 0.4);
      this.g3.armL.rotation.x = -1.1; this.g3.armR.rotation.x = -1.1; // presenting the flock
    }
    if (shotId === 10) { // complain: red group, arms thrown up, heads shaking
      const shake = Math.sin(f * 0.5) * 0.12;
      this.g1.armL.rotation.z = 0.9; this.g1.armR.rotation.z = -0.9;
      this.g1.armL.rotation.x = -1.6; this.g1.armR.rotation.x = -1.6;
      this.g1.head.rotation.y = shake; this.g1.head.rotation.x = -0.1;
      this.g1w.armL.rotation.x = -1.2; this.g1w.head.rotation.x = 0.25;
      this.g1e.head.rotation.x = 0.3; this.g1e.armL.rotation.x = -0.6;
    }
    if (shotId === 11) { // comfortable: green group relaxed, hand resting on the egg basket
      place(this.g2.root, BASKET_AT[0] - 0.9, BASKET_AT[2] + 1.0, 0.5); face(this.g2.root, BASKET_AT[0], BASKET_AT[2]);
      this.g2.armR.rotation.x = -0.35; this.g2.head.rotation.x = -0.05;
      this.g2m.armL.rotation.x = -0.2;
    }
    if (shotId === 12) { // hiring: G1 rep works among the gold flock, basket of pay-eggs between them
      place(this.g1.root, 12.2, -3.2, 0.6); face(this.g1.root, 13.5, -4.5);
      this.g1.torso.rotation.x = 0.35; this.g1.armR.rotation.x = -1.0; // scattering feed / tending
      this.g1.armL.rotation.x = -0.7;
      place(this.g3.root, 14.6, -3.0, -0.8); face(this.g3.root, this.g1.root.position.x, this.g1.root.position.z);
      this.g3.armR.rotation.x = -0.8; // handing over eggs
      place(this.basket, 13.2, -2.4, 0);
    }
    if (shotId === 13) { // final three-tier tableau, COMPRESSED (portrait half-angle is only ~13 deg):
      // the three groups step toward the centre so all three tiers fit one 9:16 frame
      place(this.g1.root, -7, -3, 0.3); place(this.g1w.root, -5.4, -2, -0.4); place(this.g1e.root, -8.6, -4.6, 0.8);
      place(this.g2.root, -0.6, -3, 0.2); place(this.g2m.root, 1.4, -2.2, -0.4); place(this.g2w.root, 2.6, -4, -0.9);
      place(this.g3.root, 7, -3, -0.3); place(this.g3w.root, 5.4, -2, 0.4); place(this.g3m.root, 8.6, -4.6, -0.8);
      this.g1.head.rotation.x = 0.3; this.g1.armL.rotation.x = -0.15; // empty-handed, bowed
      this.g2.armR.rotation.x = -0.35; // hand on basket
      this.g3.armL.rotation.x = -1.0; this.g3.armR.rotation.x = -1.0; // presenting the flock
    }
    // --- flock placement (deterministic scatter per group) ---
    const placeFlock = (group: 1 | 2 | 3, cx: number, cz: number) => {
      const fl = flockAt(group, f);
      // dedicated hen slices: G1 -> [0], G2 -> [1], G3 -> [2..19] (18 max grown flock)
      const henIdx = group === 1 ? [0] : group === 2 ? [1] : Array.from({ length: 18 }, (_, k) => 2 + k);
      for (let i = 0; i < fl.hens; i++) {
        const c = this.hens[henIdx[i]]; if (!c) continue;
        const [x, z] = scatter(i * 3 + group, cx, cz, 3.2);
        c.root.visible = true; place(c.root, x, z, (i * 1.3) % 6.28);
        peckPose(c, f * 0.12 + i * 1.7, 0.5);
      }
      for (let i = 0; i < fl.roosters; i++) {
        const c = this.roosters[group - 1]; if (!c) continue;
        const [x, z] = scatter(i * 5 + group, cx + 1.5, cz - 1, 1.5);
        c.root.visible = true; place(c.root, x, z, 0.8);
        c.head.rotation.x = -0.15 + Math.sin(f * 0.08 + group) * 0.05; // alert, head high
      }
      for (let i = 0; i < fl.chicks; i++) {
        const c = this.chicks[(group - 1) * 2 + i]; if (!c) continue;
        const prog = group === 3 ? hatchProgress(f) : 1;
        const [x, z] = scatter(i * 4 + group, group === 3 ? NEST3[0] : NEST2[0], group === 3 ? NEST3[2] : NEST2[2], 1.0);
        c.root.visible = prog > 0.05;
        c.root.scale.setScalar(Math.max(0.05, prog));
        place(c.root, x, z, (i * 2.1) % 6.28);
        peckPose(c, f * 0.2 + i, 0.4);
      }
    };
    // hide all first, then place what the story needs this frame
    [...this.hens, ...this.roosters, ...this.chicks].forEach((c) => { c.root.visible = false; });
    if (shotId === 13) { // compressed tableau centres (see above)
      placeFlock(1, -7, -3); placeFlock(2, 0, -3); placeFlock(3, 7, -3);
    } else {
      placeFlock(1, G1_AT[0], G1_AT[2]);
      placeFlock(2, G2_AT[0], G2_AT[2]);
      placeFlock(3, G3_AT[0], G3_AT[2]);
    }
    // hero hen centre-frame for the hook (shot 1): one white hen at the village heart
    if (shotId === 1) {
      const hero = this.hens[19];
      hero.root.visible = true; place(hero.root, 0, -1.0, 2.6);
      peckPose(hero, f * 0.1, 0.4);
      hero.root.scale.setScalar(1.15);
    } else { this.hens[19].root.scale.setScalar(1); }
    // hatching slow-motion: chicks near nest 3 grow in over 48 frames
    if (shotId === 8) {
      const p = hatchProgress(f);
      this.chicks.slice(4, 8).forEach((c, i) => {
        c.root.visible = p > 0.02;
        c.root.scale.setScalar(Math.max(0.02, p));
        const [x, z] = scatter(i * 4 + 3, NEST3[0], NEST3[2], 0.7);
        place(c.root, x, z, i * 1.9);
      });
    }
    // --- eggs in nests / basket ---
    this.eggs2.forEach((e, i) => { e.visible = i < eggsAt(2, f); });
    this.eggs3.forEach((e, i) => { e.visible = i < eggsAt(3, f); });
    const basketCount = shotId === 11 || shotId === 12 ? 4 : shotId === 5 || shotId === 7 ? 3 : 2;
    this.basketEggs.forEach((e, i) => { e.visible = i < basketCount; });
    void layProgress;
    return c.look;
  }
}
