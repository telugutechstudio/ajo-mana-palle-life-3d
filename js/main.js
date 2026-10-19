// Mana Palle Life 3D — a day in an Indian village (Three.js, no build step)
import * as THREE from 'three';

/* ============================== LANGUAGE ============================== */
const SAVE_KEY = 'manaPalle.save.v1';
let S = null;
function isTe() { return !S || S.lang !== 'en'; }
function tr(en, te) { return isTe() ? te : en; }
const $ = id => document.getElementById(id);

/* ============================== ICONS ================================= */
const EMOJI = { water: '💧', wood: '🪵', egg: '🥚', milk: '🥛', cow: '🐮', temple: '🛕', bed: '🛏️', chai: '🍵', coin: '🪙', energy: '⚡',
  sun: '☀️', moon: '🌙', chicken: '🐔', home: '🏡', shop: '🛒', check: '✅', fire: '🔥', tea: '🌿', leaf: '🍃', speaker: '🔊', rice: '🌾',
  hut: '🛖', tasks: '📋', gear: '⚙️', speech: '💬', bucket: '🪣', axe: '🪓', party: '🎉', pray: '🙏' };
function ico(key, cls = '') {
  return `<span class="i3d ${cls}" data-e="${EMOJI[key] || '❔'}"><img src="icons/${key}.webp" alt="" draggable="false" onerror="this.parentNode.classList.add('fail')"></span>`;
}
function hydrateIcons() { document.querySelectorAll('[data-ico]').forEach(el => { el.outerHTML = ico(el.dataset.ico, el.className); }); }

/* ============================== STATE ================================= */
function defaultState() {
  return {
    lang: 'te', // Telugu first; English is one tap away in the menu
    sound: true,
    day: 1, time: 6.5 * 60, // minutes since midnight
    energy: 100, money: 20,
    inv: { water: 0, wood: 0, egg: 0, milk: 0, tea: 2, chai: 0 },
    stove: { state: 'empty', until: 0 }, // empty | cooking | ready
    eggsLeft: [true, true, true],
    milked: false, prayed: false,
    done: {},
    pos: { x: 2, z: 9, yaw: 0 },
  };
}
function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return Object.assign(defaultState(), JSON.parse(raw)); } catch (e) { /* storage blocked */ }
  return defaultState();
}
let resetting = false;
function save() {
  if (resetting) return; // don't write the old game back while starting a new one
  S.pos = { x: player.position.x, z: player.position.z, yaw };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ }
}
S = load();

/* ============================== RENDERER ============================== */
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const canvas = $('world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_TOUCH, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? 1.3 : 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9fd3ff, 35, 110);
scene.background = new THREE.Color(0x9fd3ff);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 400);
const player = new THREE.Object3D();
player.position.set(S.pos.x, 0, S.pos.z);
scene.add(player);
player.add(camera);
camera.position.y = 1.62;
let yaw = S.pos.yaw || 0, pitch = 0;

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

/* ============================== LIGHTS & SKY ========================== */
const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x5a7a3a, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 1.3);
sun.castShadow = true;
sun.shadow.mapSize.set(IS_TOUCH ? 1024 : 2048, IS_TOUCH ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 });
sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);
const sunBall = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff2b0, fog: false }));
const moonBall = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 12), new THREE.MeshBasicMaterial({ color: 0xe8ecff, fog: false }));
scene.add(sunBall, moonBall);
const stars = (() => {
  const g = new THREE.BufferGeometry(), p = [];
  for (let i = 0; i < 900; i++) {
    const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI * 0.45;
    p.push(Math.cos(a) * Math.cos(b) * 180, Math.sin(b) * 180 + 10, Math.sin(a) * Math.cos(b) * 180);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, transparent: true, opacity: 0, fog: false }));
  scene.add(m);
  return m;
})();
// Sky colours through the day (hour → colour)
const SKY = [[0, 0x0b1026], [4.8, 0x141d3a], [5.8, 0xf2a65a], [7, 0x9fd3ff], [16.5, 0x9fd3ff], [18, 0xf08a4b], [19, 0x2a2a55], [24, 0x0b1026]];
const tmpA = new THREE.Color(), tmpB = new THREE.Color();
function skyColor(h) {
  for (let i = 0; i < SKY.length - 1; i++) {
    if (h >= SKY[i][0] && h <= SKY[i + 1][0]) {
      const t = (h - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]);
      return tmpA.set(SKY[i][1]).lerp(tmpB.set(SKY[i + 1][1]), t);
    }
  }
  return tmpA.set(SKY[0][1]);
}
const lanterns = [];
const SUN_DIR = new THREE.Vector3();
function updateSky() {
  const h = S.time / 60;
  const ang = (h - 6) / 12 * Math.PI; // sunrise 6:00, sunset 18:00
  const day = Math.max(0, Math.sin(ang));
  const sunDir = SUN_DIR.set(Math.cos(ang), Math.sin(ang), -0.35).normalize();
  sun.position.copy(player.position).addScaledVector(sunDir, 80);
  sun.target.position.copy(player.position);
  sun.intensity = 0.15 + day * 1.25;
  sun.color.setHSL(0.1, 0.6, 0.6 + day * 0.3);
  hemi.intensity = 0.25 + day * 0.75;
  sunBall.position.copy(player.position).addScaledVector(sunDir, 170);
  moonBall.position.copy(player.position).addScaledVector(sunDir, -170);
  const c = skyColor(h);
  scene.background.copy(c);
  scene.fog.color.copy(c);
  stars.material.opacity = Math.max(0, 1 - day * 4) * (h < 6 || h > 18 ? 1 : 0.4);
  stars.position.copy(player.position);
  const night = h < 6 || h > 18.3;
  for (const l of lanterns) l.intensity = night ? 1.6 : 0;
}

/* ============================== WORLD HELPERS ========================= */
const colliders = []; // {x, z, r}
const MAT = {};
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  return MAT[key] || (MAT[key] = new THREE.MeshLambertMaterial(Object.assign({ color }, opts)));
}
function mesh(geo, color, x = 0, y = 0, z = 0, parent = scene, opts) {
  const m = new THREE.Mesh(geo, typeof color === 'number' ? mat(color, opts) : color);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
const box = (w, h, d, color, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), color, x, y, z, parent);
function textTexture(lines, w = 512, h = 128, bg = '#fff3d0', fg = '#7a2a00') {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((l, i) => { x.font = `700 ${i ? 34 : 48}px "Baloo Tammudu 2", Fredoka, sans-serif`; x.fillText(l, w / 2, h / (lines.length + 1) * (i + 1)); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function rand(a, b) { return a + Math.random() * (b - a); }
let seed = 11;
function srand(a, b) { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); }

/* ============================== GROUND ================================ */
{
  const g = new THREE.PlaneGeometry(240, 240, 80, 80);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, colors = [];
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), d = Math.hypot(x, z);
    // flat village, rolling hills further out
    const hill = d > 55 ? (d - 55) * 0.12 * (1 + Math.sin(x * 0.07) * Math.cos(z * 0.06)) : 0;
    pos.setY(i, hill + Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.05);
    c.setHSL(0.26 + srand(-0.02, 0.02), 0.45, 0.32 + srand(-0.04, 0.04) + Math.min(hill * 0.01, 0.1));
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const ground = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
  ground.receiveShadow = true;
  scene.add(ground);
  // Mud paths
  const path = (w, d, x, z, rot = 0) => { const m = mesh(new THREE.PlaneGeometry(w, d), 0xb08a5a, x, 0.03, z); m.rotation.set(-Math.PI / 2, 0, rot); m.castShadow = false; };
  path(4, 70, 6, 0); path(50, 3.5, 0, 14); path(3, 18, 0, -16); path(10, 3, 10, -8);
  // Distant hills
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2, r = srand(120, 150);
    const m = mesh(new THREE.ConeGeometry(srand(18, 32), srand(16, 30), 7), 0x5f7f6a, Math.cos(a) * r, 6, Math.sin(a) * r);
    m.castShadow = false;
  }
}

/* ============================== BUILDINGS ============================= */
function thatchedRoof(w, d, h, x, y, z, parent) {
  const r = mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.6, h, 4), 0xc9a24f, x, y + h / 2, z, parent);
  r.rotation.y = Math.PI / 4;
  r.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
  return r;
}
function house(x, z, rot, wall = 0xd89a63) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  box(6, 2.6, 0.3, wall, 0, 1.3, -2.5, g);            // back
  box(0.3, 2.6, 5, wall, -3, 1.3, 0, g);              // left
  box(0.3, 2.6, 5, wall, 3, 1.3, 0, g);               // right
  box(2.4, 2.6, 0.3, wall, -1.8, 1.3, 2.5, g);        // front left of door
  box(2.4, 2.6, 0.3, wall, 1.8, 1.3, 2.5, g);         // front right of door
  box(1.2, 0.6, 0.3, wall, 0, 2.3, 2.5, g);           // above door
  box(1.2, 2, 0.08, 0x5a3418, 0, 1, 2.62, g);         // wooden door
  box(0.7, 0.6, 0.08, 0x3a2614, -1.8, 1.6, 2.62, g);  // window
  box(0.7, 0.6, 0.08, 0x3a2614, 1.8, 1.6, 2.62, g);
  box(6.4, 0.25, 0.8, 0xc29a6a, 0, 0.12, 3.1, g);     // front step (arugu)
  thatchedRoof(7.2, 6.2, 2.6, 0, 2.6, 0, g);
  // collision box approximated by circles along the walls
  const cos = Math.cos(rot), sin = Math.sin(rot);
  for (const [lx, lz] of [[-2, -1.6], [0, -1.6], [2, -1.6], [-2, 0.8], [2, 0.8], [0, 0.6]]) {
    colliders.push({ x: x + lx * cos + lz * sin, z: z - lx * sin + lz * cos, r: 1.8 });
  }
  return g;
}
// Muggu (rangoli) drawn on a canvas
function muggu(x, z, size = 2.4) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const k = c.getContext('2d');
  k.translate(128, 128);
  const cols = ['#ffffff', '#ff4fa3', '#ffd23d', '#2fd27a', '#4da3ff'];
  for (let ring = 5; ring >= 1; ring--) {
    k.fillStyle = cols[ring % cols.length];
    k.beginPath();
    for (let a = 0; a <= 16; a++) {
      const ang = a / 16 * Math.PI * 2, r = ring * 22 + (a % 2 ? 0 : 10);
      a ? k.lineTo(Math.cos(ang) * r, Math.sin(ang) * r) : k.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    k.fill();
  }
  k.fillStyle = '#ffffff';
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; k.beginPath(); k.arc(Math.cos(a) * 118, Math.sin(a) * 118, 6, 0, 7); k.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 32), new THREE.MeshLambertMaterial({ map: t, transparent: true }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.04, z); m.receiveShadow = true;
  scene.add(m);
}

// Player's home
const home = house(0, 0, 0);
muggu(0, 5, 2.6);
// Neighbours' houses
house(-14, 2, 0.15, 0xe0b080); house(16, -2, -0.2, 0xcf8c5c); house(-12, 22, Math.PI, 0xd99f70); house(14, 24, Math.PI + 0.1, 0xe2a874);
muggu(-14, 7, 2); muggu(16, 3, 2);

// Lantern by the door
{
  const post = box(0.12, 2.2, 0.12, 0x4a2e18, 3.4, 1.1, 3.2);
  box(0.35, 0.4, 0.35, 0xffd27a, 3.4, 2.3, 3.2);
  const l = new THREE.PointLight(0xffb15a, 0, 14, 1.6); l.position.set(3.4, 2.4, 3.6); scene.add(l); lanterns.push(l);
  colliders.push({ x: 3.4, z: 3.2, r: 0.3 });
  post.castShadow = false;
}

// Well (naada)
const WELL = new THREE.Vector3(-8, 0, 7);
{
  const ring = mesh(new THREE.CylinderGeometry(1.35, 1.45, 0.95, 22, 1, true), 0xb8b0a0, WELL.x, 0.47, WELL.z);
  ring.material = mat(0xb8b0a0, { side: THREE.DoubleSide });
  mesh(new THREE.TorusGeometry(1.4, 0.13, 8, 26), 0xd2cabb, WELL.x, 0.95, WELL.z).rotation.x = Math.PI / 2;
  mesh(new THREE.CircleGeometry(1.3, 22), 0x1b4a6a, WELL.x, 0.35, WELL.z).rotation.x = -Math.PI / 2;
  box(0.18, 2.4, 0.18, 0x6b4426, WELL.x - 1.5, 1.2, WELL.z); box(0.18, 2.4, 0.18, 0x6b4426, WELL.x + 1.5, 1.2, WELL.z);
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8), 0x6b4426, WELL.x, 2.25, WELL.z).rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), 0xd9c8a0, WELL.x, 1.65, WELL.z);
  mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.3, 10), 0x8a8f96, WELL.x, 1, WELL.z);
  colliders.push({ x: WELL.x, z: WELL.z, r: 1.7 });
}

// Chulha (mud stove) beside the house, with pot, fire and smoke
const CHULHA = new THREE.Vector3(4.6, 0, 1.5);
const stove = { pot: null, fire: null, light: null };
{
  const mud = 0x9a5a34;
  box(0.9, 0.5, 0.25, mud, CHULHA.x, 0.25, CHULHA.z - 0.4);
  box(0.25, 0.5, 0.8, mud, CHULHA.x - 0.35, 0.25, CHULHA.z);
  box(0.25, 0.5, 0.8, mud, CHULHA.x + 0.35, 0.25, CHULHA.z);
  stove.pot = mesh(new THREE.SphereGeometry(0.33, 14, 10), 0x7a8088, CHULHA.x, 0.68, CHULHA.z);
  stove.pot.scale.set(1, 0.75, 1); stove.pot.visible = false;
  stove.fire = mesh(new THREE.ConeGeometry(0.2, 0.45, 7), new THREE.MeshBasicMaterial({ color: 0xff7a1a }), CHULHA.x, 0.25, CHULHA.z);
  stove.fire.visible = false; stove.fire.castShadow = false;
  stove.light = new THREE.PointLight(0xff8a2a, 0, 7, 1.5); stove.light.position.set(CHULHA.x, 0.8, CHULHA.z); scene.add(stove.light);
  colliders.push({ x: CHULHA.x, z: CHULHA.z, r: 0.75 });
  // Firewood pile
  for (let i = 0; i < 9; i++) {
    const l = mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 7), 0x7a4a26, 7.4, 0.14 + Math.floor(i / 3) * 0.24, -1.3 + (i % 3) * 0.26 + (Math.floor(i / 3) % 2) * 0.12);
    l.rotation.x = Math.PI / 2;
  }
  colliders.push({ x: 7.4, z: -1, r: 0.9 });
}
const WOODPILE = new THREE.Vector3(7.4, 0, -1);

// Smoke & steam particles
const puffs = [];
const puffGeo = new THREE.SphereGeometry(0.12, 6, 5);
function puff(x, y, z, color = 0xdddddd) {
  const m = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false }));
  m.position.set(x + rand(-0.1, 0.1), y, z + rand(-0.1, 0.1));
  scene.add(m);
  puffs.push({ m, life: 2.2 });
}

// Chicken coop, chickens and eggs
const COOP = new THREE.Vector3(-7, 0, -7);
{
  box(2.2, 1.4, 1.6, 0xb07a48, COOP.x, 0.7, COOP.z);
  thatchedRoof(2.8, 2.2, 1.1, COOP.x, 1.4, COOP.z);
  box(0.6, 0.7, 0.05, 0x3a2614, COOP.x, 0.45, COOP.z + 0.82);
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2;
    const p = box(0.08, 0.8, 0.08, 0x8a6a3a, COOP.x + Math.cos(a) * 4.2, 0.4, COOP.z + Math.sin(a) * 4.2);
    p.castShadow = false;
  }
  colliders.push({ x: COOP.x, z: COOP.z, r: 1.5 });
}
const chickens = [];
function makeChicken(color) {
  const g = new THREE.Group();
  mesh(new THREE.SphereGeometry(0.22, 10, 8), color, 0, 0.3, 0, g).scale.set(1, 0.85, 1.25);
  mesh(new THREE.SphereGeometry(0.12, 8, 6), color, 0, 0.5, 0.2, g);
  box(0.04, 0.09, 0.12, 0xe02020, 0, 0.62, 0.2, g);
  mesh(new THREE.ConeGeometry(0.04, 0.1, 5), 0xf0b020, 0, 0.5, 0.33, g).rotation.x = Math.PI / 2;
  box(0.03, 0.18, 0.03, 0xf0b020, -0.07, 0.09, 0, g); box(0.03, 0.18, 0.03, 0xf0b020, 0.07, 0.09, 0, g);
  g.position.set(COOP.x + rand(-3, 3), 0, COOP.z + rand(-3, 3));
  scene.add(g);
  chickens.push({ g, target: g.position.clone(), wait: rand(0, 2) });
}
[0xffffff, 0xd2691e, 0xffffff, 0x8b4513, 0xf5deb3].forEach(makeChicken);
const EGG_SPOTS = [[-5.4, -9.2], [-9.6, -5.8], [-4.6, -5.2]];
const eggMeshes = EGG_SPOTS.map(([x, z]) => {
  const m = mesh(new THREE.SphereGeometry(0.1, 10, 8), 0xfaf3e3, x, 0.12, z);
  m.scale.set(1, 1.3, 1);
  return m;
});

// Cow tied near the house
const COW = new THREE.Vector3(9.5, 0, 5);
const cow = new THREE.Group();
{
  const w = 0xf2efe6, b = 0x4a3a2a;
  box(1.8, 0.9, 0.8, w, 0, 1.05, 0, cow);
  box(0.5, 0.42, 0.42, w, 1.08, 1.3, 0, cow);
  box(0.28, 0.2, 0.36, 0xf0b8a0, 1.36, 1.2, 0, cow);
  mesh(new THREE.ConeGeometry(0.05, 0.3, 5), 0xe8dcc0, 1.05, 1.6, 0.16, cow).rotation.z = -0.4;
  mesh(new THREE.ConeGeometry(0.05, 0.3, 5), 0xe8dcc0, 1.05, 1.6, -0.16, cow).rotation.z = -0.4;
  box(0.5, 0.4, 0.82, b, -0.3, 1.2, 0, cow);
  for (const [lx, lz] of [[0.65, 0.28], [0.65, -0.28], [-0.65, 0.28], [-0.65, -0.28]]) box(0.16, 0.65, 0.16, w, lx, 0.32, lz, cow);
  box(0.06, 0.7, 0.06, w, -0.95, 0.85, 0, cow).rotation.z = 0.3;
  cow.position.copy(COW); cow.rotation.y = -0.6;
  scene.add(cow);
  box(0.15, 1.2, 0.15, 0x6b4426, COW.x + 1.8, 0.6, COW.z + 1);
  colliders.push({ x: COW.x, z: COW.z, r: 1.3 });
}

// Kirana shop
const SHOP = new THREE.Vector3(14, 0, 9);
{
  const g = new THREE.Group(); g.position.copy(SHOP); g.rotation.y = -Math.PI / 2; scene.add(g);
  box(5, 3, 3.4, 0x6fa8c8, 0, 1.5, -0.6, g);
  box(4.6, 1, 0.6, 0xa8743c, 0, 0.5, 1.4, g);                  // counter
  for (let i = 0; i < 6; i++) box(0.5, 0.45, 0.4, [0xe8443a, 0xffc83d, 0x3ccf6e, 0x4da3ff, 0xff8ad8, 0xffffff][i], -1.6 + i * 0.65, 1.25, 1.35, g);
  const aw = mesh(new THREE.BoxGeometry(5.4, 0.12, 2), new THREE.MeshLambertMaterial({ map: (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 32; const k = c.getContext('2d');
    for (let i = 0; i < 8; i++) { k.fillStyle = i % 2 ? '#ffffff' : '#e8443a'; k.fillRect(i * 32, 0, 32, 32); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })() }), 0, 2.9, 1.6, g);
  aw.rotation.x = -0.25;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: textTexture(['కిరాణా షాప్', 'Kirana Shop']) }));
  document.fonts.load('700 48px "Baloo Tammudu 2"').then(() => { sign.material.map = textTexture(['కిరాణా షాప్', 'Kirana Shop']); sign.material.needsUpdate = true; });
  sign.position.set(0, 3.55, 1.12); g.add(sign);
  // Shopkeeper
  mesh(new THREE.CylinderGeometry(0.3, 0.34, 1, 10), 0xffffff, 0, 1.3, 0.6, g);
  mesh(new THREE.SphereGeometry(0.22, 12, 10), 0x9a6a46, 0, 2.02, 0.6, g);
  mesh(new THREE.SphereGeometry(0.23, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0x1a1a1a, 0, 2.06, 0.58, g);
  colliders.push({ x: SHOP.x, z: SHOP.z - 1.2, r: 2.2 }, { x: SHOP.x, z: SHOP.z + 1.2, r: 2.2 });
}
const SHOP_FRONT = new THREE.Vector3(SHOP.x - 2.6, 0, SHOP.z);

// Temple (gudi)
const TEMPLE = new THREE.Vector3(0, 0, -26);
{
  box(8, 0.4, 8, 0xd8d0c0, TEMPLE.x, 0.2, TEMPLE.z);
  box(7, 0.4, 7, 0xe2dacb, TEMPLE.x, 0.6, TEMPLE.z);
  box(4, 3, 4, 0xf4efe6, TEMPLE.x, 2.3, TEMPLE.z);
  box(1.2, 2, 0.1, 0x3a2614, TEMPLE.x, 1.8, TEMPLE.z + 2.02);
  for (let i = 0; i < 5; i++) {
    const s = 3.8 - i * 0.65;
    box(s, 0.9, s, i % 2 ? 0xffd27a : 0xf6e2b8, TEMPLE.x, 4.25 + i * 0.9, TEMPLE.z);
  }
  mesh(new THREE.SphereGeometry(0.35, 12, 10), 0xffc83d, TEMPLE.x, 8.9, TEMPLE.z);
  mesh(new THREE.ConeGeometry(0.15, 0.5, 8), 0xffc83d, TEMPLE.x, 9.4, TEMPLE.z);
  box(0.05, 2, 0.05, 0x6b4426, TEMPLE.x + 3, 1.8, TEMPLE.z + 3);
  const flag = mesh(new THREE.PlaneGeometry(0.8, 0.5), 0xff8a1a, TEMPLE.x + 3.4, 2.5, TEMPLE.z + 3);
  flag.material = mat(0xff8a1a, { side: THREE.DoubleSide });
  colliders.push({ x: TEMPLE.x, z: TEMPLE.z, r: 3.4 });
}
const TEMPLE_FRONT = new THREE.Vector3(TEMPLE.x, 0, TEMPLE.z + 4.6);

// Rachabanda: big tree with a stone platform
{
  mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.6, 16), 0xc8c0b0, 12, 0.3, -8);
  mesh(new THREE.CylinderGeometry(0.45, 0.6, 4, 9), 0x6b4a2e, 12, 2.2, -8);
  for (let i = 0; i < 6; i++) mesh(new THREE.IcosahedronGeometry(srand(1.6, 2.2), 0), 0x3f7a2e, 12 + srand(-1.5, 1.5), srand(4.4, 5.6), -8 + srand(-1.5, 1.5));
  colliders.push({ x: 12, z: -8, r: 2.4 });
}

// Paddy field with rows of rice plants
{
  const fx = -22, fz = -18, fw = 16, fd = 12;
  const water = mesh(new THREE.PlaneGeometry(fw, fd), 0x5f8f6a, fx, 0.05, fz); water.rotation.x = -Math.PI / 2; water.castShadow = false;
  for (const [w, d, x, z] of [[fw + 0.6, 0.6, fx, fz - fd / 2], [fw + 0.6, 0.6, fx, fz + fd / 2], [0.6, fd, fx - fw / 2, fz], [0.6, fd, fx + fw / 2, fz]]) box(w, 0.35, d, 0x8a6a3a, x, 0.17, z);
  const geo = new THREE.ConeGeometry(0.09, 0.6, 4);
  geo.translate(0, 0.3, 0);
  const rows = 22, cols = 30, inst = new THREE.InstancedMesh(geo, mat(0x6fbf3a), rows * cols);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  let n = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    q.setFromEuler(new THREE.Euler(srand(-0.15, 0.15), srand(0, 3), srand(-0.15, 0.15)));
    sc.setScalar(srand(0.8, 1.2));
    m4.compose(new THREE.Vector3(fx - fw / 2 + 0.5 + c * (fw - 1) / cols, 0.05, fz - fd / 2 + 0.5 + r * (fd - 1) / rows), q, sc);
    inst.setMatrixAt(n++, m4);
  }
  inst.castShadow = false; inst.receiveShadow = true;
  scene.add(inst);
}

// Trees: coconut palms and neem trees
function palm(x, z) {
  const lean = srand(-0.25, 0.25), h = srand(5.5, 7.5);
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.set(lean * 0.4, srand(0, 6), lean); scene.add(g);
  for (let i = 0; i < 5; i++) mesh(new THREE.CylinderGeometry(0.17 - i * 0.015, 0.2 - i * 0.015, h / 5 + 0.05, 7), 0x8a6a46, 0, h / 10 + i * h / 5, 0, g);
  const leaf = new THREE.PlaneGeometry(0.7, 3); leaf.translate(0, 1.5, 0);
  for (let i = 0; i < 8; i++) {
    const l = mesh(leaf, 0x3f8f3a, 0, h, 0, g, { side: THREE.DoubleSide });
    l.rotation.set(1.15 + srand(-0.2, 0.25), i / 8 * Math.PI * 2, 0, 'YXZ');
    l.castShadow = true;
  }
  for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(0.16, 8, 6), 0x6b8f2a, Math.cos(i * 2) * 0.22, h - 0.2, Math.sin(i * 2) * 0.22, g);
  colliders.push({ x, z, r: 0.45 });
}
function neem(x, z) {
  const h = srand(2.4, 3.4);
  mesh(new THREE.CylinderGeometry(0.22, 0.32, h, 8), 0x6b4a2e, x, h / 2, z);
  for (let i = 0; i < 4; i++) mesh(new THREE.IcosahedronGeometry(srand(1.1, 1.6), 0), [0x3a7a2a, 0x4a8a30, 0x2f6a24][i % 3], x + srand(-0.9, 0.9), h + srand(0.4, 1.4), z + srand(-0.9, 0.9));
  colliders.push({ x, z, r: 0.5 });
}
[[-4, 12], [10, 17.5], [-18, 10], [20, 8], [-26, 4], [24, -12], [-2, -12], [18, 18], [-30, -6], [28, 2], [-8, 18], [4, -34], [-10, -30]].forEach(([x, z]) => palm(x, z));
[[-11, -14], [20, -18], [-20, 14], [26, 16], [-28, 20], [9.5, -20], [-34, -26], [32, -26], [-3, 26], [30, 28]].forEach(([x, z]) => neem(x, z));
// Bushes and stones scattered around
for (let i = 0; i < 40; i++) {
  const a = srand(0, 6.28), r = srand(18, 50), x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (Math.abs(x - 6) < 3 || Math.abs(z - 14) < 2.5) continue;
  if (i % 3) mesh(new THREE.IcosahedronGeometry(srand(0.4, 0.8), 0), 0x4a8a30, x, 0.35, z);
  else mesh(new THREE.DodecahedronGeometry(srand(0.25, 0.5), 0), 0x9a958c, x, 0.2, z);
}

/* ============================== AUDIO ================================= */
let actx = null;
function ac() { return actx || (actx = new (window.AudioContext || window.webkitAudioContext)()); }
function tone(freq, dur, type = 'sine', vol = 0.06, slide = 0) {
  if (!S.sound) return;
  try {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  } catch (e) { /* no audio */ }
}
function noise(dur, vol = 0.08, freq = 1200) {
  if (!S.sound) return;
  try {
    const c = ac(), b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f).connect(g).connect(c.destination); s.start();
  } catch (e) { /* no audio */ }
}
const SFX = {
  water: () => noise(0.7, 0.12, 700),
  chop: () => { noise(0.12, 0.25, 300); tone(120, 0.1, 'square', 0.04); },
  coin: () => { tone(988, 0.08, 'triangle', 0.07); setTimeout(() => tone(1318, 0.12, 'triangle', 0.07), 80); },
  good: () => { tone(523, 0.12, 'triangle'); setTimeout(() => tone(784, 0.2, 'triangle'), 110); },
  bad: () => tone(180, 0.15, 'sawtooth', 0.04),
  cluck: () => { tone(700, 0.06, 'square', 0.03, 0.6); setTimeout(() => tone(650, 0.08, 'square', 0.03, 0.5), 90); },
  moo: () => tone(140, 0.9, 'sawtooth', 0.05, 0.75),
  bell: () => { tone(880, 1.4, 'sine', 0.08); tone(1320, 1, 'sine', 0.03); },
  step: () => noise(0.05, 0.03, 500),
};
let ambientAcc = 0;
function ambient(dt) {
  ambientAcc -= dt;
  if (ambientAcc > 0 || !actx) return;
  ambientAcc = rand(1.5, 4);
  const h = S.time / 60;
  if (h > 6 && h < 18.5) { const f = rand(2200, 3400); tone(f, 0.08, 'sine', 0.02, 1.3); setTimeout(() => tone(f * 1.1, 0.06, 'sine', 0.015, 1.2), 120); }
  else for (let i = 0; i < 3; i++) setTimeout(() => tone(4200, 0.03, 'square', 0.006), i * 60);
}

/* ============================== UI ==================================== */
function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type; t.textContent = msg;
  $('toasts').appendChild(t);
  while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
  setTimeout(() => t.remove(), 3200);
}
const INV_ORDER = [['water', '💧'], ['wood', '🪵'], ['tea', '🌿'], ['milk', '🥛'], ['egg', '🥚'], ['chai', '🍵']];
let invShown = '';
function renderInventory(changed) {
  const html = INV_ORDER.filter(([k]) => S.inv[k] > 0).map(([k]) => `<div class="inv ${k === changed ? 'pop' : ''}">${ico(k)}${S.inv[k]}</div>`).join('');
  if (html !== invShown || changed) { $('inventory').innerHTML = html; invShown = html; }
}
const TASKS = [
  ['water', ['Fetch water from the well', 'బావి నుంచి నీళ్ళు తేవాలి']],
  ['wood', ['Collect firewood', 'కట్టెలు తేవాలి']],
  ['chai', ['Make chai on the chulha', 'పొయ్యి మీద చాయ్ చేయాలి']],
  ['eggs', ['Collect 3 eggs from the coop', 'కోళ్ల గూడు నుంచి 3 గుడ్లు']],
  ['milk', ['Milk the cow', 'ఆవు పాలు పితకాలి']],
  ['sell', ['Sell at the kirana shop', 'కిరాణా షాప్‌లో అమ్మాలి']],
  ['pray', ['Pray at the temple', 'గుడిలో దండం పెట్టాలి']],
];
let tasksOpen = !IS_TOUCH;
function renderTasks() {
  const el = $('tasks');
  el.classList.toggle('hidden', !tasksOpen);
  if (!tasksOpen) return;
  el.innerHTML = `<h3>${tr(`Day ${S.day} chores`, `రోజు ${S.day} పనులు`)}</h3>` +
    TASKS.map(([id, t]) => `<div class="task ${S.done[id] ? 'done' : ''}"><span class="box">${S.done[id] ? '✓' : ''}</span>${tr(...t)}</div>`).join('');
}
function completeTask(id) {
  if (S.done[id]) return;
  S.done[id] = true;
  renderTasks();
  if (TASKS.every(([t]) => S.done[t])) {
    S.money += 50;
    SFX.good();
    toast(tr('🎉 All chores done! Bonus ₹50. Sleep to start a new day.', '🎉 ఈ రోజు పనులన్నీ పూర్తి! బోనస్ ₹50. కొత్త రోజు కోసం పడుకోండి.'), 'good');
  }
}
function fmtTime() {
  const m = Math.floor(S.time) % 1440, h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0');
  const h12 = ((h + 11) % 12) + 1, ampm = h < 12 ? tr('AM', 'ఉ.') : tr('PM', 'సా.');
  return isTe() ? `${ampm} ${h12}:${mm}` : `${h12}:${mm} ${ampm}`;
}
let hudAcc = 0;
function renderHud() {
  const h = S.time / 60;
  $('clock').innerHTML = `${ico(h > 6 && h < 18.5 ? 'sun' : 'moon')} ${tr('Day', 'రోజు')} ${S.day} · ${fmtTime()}`;
  $('money').innerHTML = `${ico('coin')} ₹${Math.floor(S.money)}`;
  $('energyFill').style.width = S.energy + '%';
  $('energyFill').classList.toggle('low', S.energy < 25);
}

/* ============================== INTERACTIONS ========================== */
// Each spot: where it is, what the prompt says, whether it can be used now and what it does.
const spots = [
  { at: WELL, r: 2.6, label: () => tr('Draw water', 'నీళ్ళు తోడు'),
    need: () => S.inv.water >= 2 ? tr('Pot is full (2 max)', 'బిందె నిండింది (2 వరకు)') : '',
    time: 2.2, start: SFX.water,
    done: () => { S.inv.water++; renderInventory('water'); completeTask('water'); toast(tr('💧 Got a pot of water', '💧 బిందె నీళ్ళు తెచ్చారు'), 'good'); } },
  { at: WOODPILE, r: 2.4, label: () => tr('Collect firewood', 'కట్టెలు తీసుకో'),
    need: () => S.inv.wood >= 3 ? tr('Carrying enough wood (3 max)', 'కట్టెలు చాలు (3 వరకు)') : '',
    time: 1.6, start: SFX.chop, tick: () => SFX.chop(),
    done: () => { S.inv.wood++; renderInventory('wood'); completeTask('wood'); } },
  { at: CHULHA, r: 2.3, label: () => S.stove.state === 'ready' ? tr('Drink chai', 'చాయ్ తాగు') : tr('Make chai', 'చాయ్ పెట్టు'),
    need: () => {
      if (S.stove.state === 'cooking') return tr('Chai is boiling…', 'చాయ్ మరుగుతోంది…');
      if (S.stove.state === 'ready') return '';
      const miss = [];
      if (!S.inv.water) miss.push(tr('water', 'నీళ్ళు'));
      if (!S.inv.wood) miss.push(tr('firewood', 'కట్టెలు'));
      if (!S.inv.tea) miss.push(tr('tea powder (shop)', 'టీ పొడి (షాప్)'));
      return miss.length ? tr('Need: ', 'కావాలి: ') + miss.join(', ') : '';
    },
    time: 0.6,
    done: () => {
      if (S.stove.state === 'ready') {
        const boost = S.stove.milk ? 55 : 35;
        S.energy = Math.min(100, S.energy + boost);
        S.stove.state = 'empty';
        S.inv.chai++;
        SFX.good();
        toast(tr(`🍵 Fresh chai! Energy +${boost}`, `🍵 వేడి వేడి చాయ్! శక్తి +${boost}`), 'good');
        completeTask('chai');
        return;
      }
      S.inv.water--; S.inv.wood--; S.inv.tea--;
      S.stove.milk = S.inv.milk > 0;
      if (S.stove.milk) S.inv.milk--;
      S.stove.state = 'cooking'; S.stove.until = 8;
      renderInventory();
      toast(tr('🔥 Fire lit. Chai will be ready soon…', '🔥 పొయ్యి వెలిగించారు. చాయ్ త్వరలో రెడీ…'));
    } },
  { at: COW, r: 2.8, label: () => tr('Milk the cow', 'ఆవు పాలు పితుకు'),
    need: () => S.milked ? tr('Already milked today', 'ఈ రోజు పాలు పితికారు') : '',
    time: 3, start: SFX.moo,
    done: () => { S.milked = true; S.inv.milk++; renderInventory('milk'); completeTask('milk'); toast(tr('🥛 Fresh milk! Use it in chai or sell it.', '🥛 తాజా పాలు! చాయ్‌లో వేయండి లేదా అమ్మండి.'), 'good'); } },
  { at: SHOP_FRONT, r: 2.8, label: () => (S.inv.egg || S.inv.milk) ? tr('Sell eggs & milk', 'గుడ్లు, పాలు అమ్ము') : tr('Buy tea powder ₹15', 'టీ పొడి కొను ₹15'),
    need: () => (!S.inv.egg && !S.inv.milk && S.money < 15) ? tr('Not enough money', 'డబ్బు సరిపోదు') : '',
    time: 0.8,
    done: () => {
      if (S.inv.egg || S.inv.milk) {
        const earned = S.inv.egg * 8 + S.inv.milk * 25;
        S.money += earned; S.inv.egg = 0; S.inv.milk = 0;
        SFX.coin(); renderInventory(); completeTask('sell');
        toast(tr(`🪙 Sold for ₹${earned}`, `🪙 ₹${earned} కి అమ్మారు`), 'good');
      } else {
        S.money -= 15; S.inv.tea++;
        SFX.coin(); renderInventory('tea');
        toast(tr('🌿 Bought tea powder', '🌿 టీ పొడి కొన్నారు'), 'good');
      }
    } },
  { at: TEMPLE_FRONT, r: 3.2, label: () => tr('Pray', 'దండం పెట్టు'),
    need: () => S.prayed ? tr('Already prayed today', 'ఈ రోజు దండం పెట్టారు') : '',
    time: 2.5, start: SFX.bell,
    done: () => { S.prayed = true; S.energy = Math.min(100, S.energy + 15); completeTask('pray'); toast(tr('🙏 Blessed! Energy +15', '🙏 దేవుడి దీవెన! శక్తి +15'), 'good'); } },
  { at: new THREE.Vector3(0, 0, 3.3), r: 1.9, label: () => tr('Sleep', 'నిద్రపో'),
    need: () => (S.time < 19 * 60 && S.energy > 20) ? tr('Sleep after 7 PM (or when tired)', 'రాత్రి 7 తర్వాత నిద్రపోండి (లేదా అలసినప్పుడు)') : '',
    time: 1.2, done: () => sleep() },
];
EGG_SPOTS.forEach(([x, z], i) => spots.push({
  at: new THREE.Vector3(x, 0, z), r: 1.5, egg: i, label: () => tr('Pick up egg', 'గుడ్డు తీసుకో'), need: () => '', time: 0.5, start: SFX.cluck,
  hidden: () => !S.eggsLeft[i],
  done: () => {
    S.eggsLeft[i] = false; eggMeshes[i].visible = false; S.inv.egg++; renderInventory('egg');
    if (S.eggsLeft.every(e => !e)) completeTask('eggs');
  },
}));

let busy = null, focus = null;
function nearestSpot() {
  let best = null, bestD = Infinity;
  const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  for (const s of spots) {
    if (s.hidden && s.hidden()) continue;
    const dx = s.at.x - player.position.x, dz = s.at.z - player.position.z, d = Math.hypot(dx, dz);
    if (d > s.r) continue;
    const facing = (dx * fwd.x + dz * fwd.z) / (d || 1);
    if (d > 1.2 && facing < 0.2) continue;
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}
function updatePrompt() {
  focus = busy ? null : nearestSpot();
  const p = $('prompt'), btn = $('actBtn');
  if (!focus) { p.classList.add('hidden'); btn.classList.add('hidden'); return; }
  const need = focus.need();
  p.classList.remove('hidden');
  p.innerHTML = need ? `${focus.label()} <span class="need">— ${need}</span>` : `${IS_TOUCH ? '' : '<kbd>E</kbd>'}${focus.label()}`;
  btn.classList.toggle('hidden', !!need);
  btn.textContent = focus.label();
}
function interact() {
  if (busy || !focus) return;
  if (focus.need()) { SFX.bad(); return; }
  if (S.energy <= 0 && focus.time > 1) { SFX.bad(); toast(tr('Too tired! Drink chai or sleep.', 'చాలా అలసిపోయారు! చాయ్ తాగండి లేదా నిద్రపోండి.'), 'bad'); return; }
  const s = focus;
  if (s.start) s.start();
  busy = { s, t: 0, total: s.time, tickAcc: 0 };
  $('progressFill').style.width = '0%';
  $('progressLabel').textContent = s.label() + '…';
  $('progress').classList.remove('hidden');
}
function updateBusy(dt) {
  if (!busy) return;
  busy.t += dt;
  busy.tickAcc += dt;
  if (busy.s.tick && busy.tickAcc > 0.55) { busy.tickAcc = 0; busy.s.tick(); }
  $('progressFill').style.width = Math.min(100, busy.t / busy.total * 100) + '%';
  if (busy.t >= busy.total) {
    const s = busy.s;
    busy = null;
    $('progress').classList.add('hidden');
    S.energy = Math.max(0, S.energy - (s.time > 1 ? 3 : 0));
    s.done();
    save();
  }
}

function sleep() {
  S.day++;
  S.time = 6 * 60;
  S.energy = 100;
  S.milked = false; S.prayed = false; S.done = {};
  S.eggsLeft = [true, true, true];
  eggMeshes.forEach(m => { m.visible = true; });
  // Wake up on the doorstep, looking out at the village
  player.position.set(0, 0, 5.4); yaw = Math.PI; pitch = 0;
  if (S.stove.state === 'cooking') S.stove.state = 'ready';
  renderTasks(); renderInventory();
  fade();
  SFX.good();
  toast(tr(`🌅 Good morning! Day ${S.day}`, `🌅 శుభోదయం! రోజు ${S.day}`), 'good');
  save();
}
function fade() {
  const f = document.createElement('div');
  f.style.cssText = 'position:fixed;inset:0;background:#000;z-index:25;opacity:1;transition:opacity 1.2s;pointer-events:none';
  document.body.appendChild(f);
  requestAnimationFrame(() => requestAnimationFrame(() => { f.style.opacity = '0'; }));
  setTimeout(() => f.remove(), 1400);
}

/* ============================== CONTROLS ============================== */
const keys = {};
let running = false, playing = false;
const joy = { id: null, x: 0, y: 0, ox: 0, oy: 0 };
let look = { id: null, x: 0, y: 0 };
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyE' && playing) interact();
  if (e.code === 'KeyT' && playing) { tasksOpen = !tasksOpen; renderTasks(); }
  if (e.code === 'Escape' && playing && !document.pointerLockElement) openMenu();
});
addEventListener('keyup', e => { keys[e.code] = false; });
// Pointer lock can be refused (e.g. inside some embedded browsers); dragging with the mouse still works then
function lockPointer() { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* drag to look instead */ } }
canvas.addEventListener('click', () => { if (playing && !IS_TOUCH && !document.pointerLockElement) lockPointer(); });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && playing && !IS_TOUCH) openMenu(); });
addEventListener('mousemove', e => {
  const dragging = playing && (e.buttons & 1) && !IS_TOUCH && e.target === canvas;
  if (document.pointerLockElement !== canvas && !dragging) return;
  yaw -= e.movementX * 0.0022;
  pitch = Math.max(-1.3, Math.min(1.3, pitch - e.movementY * 0.0022));
});
// Phone: left half moves (joystick), right half drags to look around
addEventListener('touchstart', e => {
  if (!playing) return;
  for (const t of e.changedTouches) {
    if (t.target.closest('button')) continue;
    if (t.clientX < innerWidth * 0.45 && joy.id === null) {
      joy.id = t.identifier; joy.ox = t.clientX; joy.oy = t.clientY; joy.x = joy.y = 0;
      const j = $('joy'); j.style.left = (t.clientX - 65) + 'px'; j.style.top = (t.clientY - 65) + 'px'; j.style.bottom = 'auto';
    } else if (look.id === null) { look = { id: t.identifier, x: t.clientX, y: t.clientY }; }
  }
}, { passive: true });
addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) {
      let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy;
      const d = Math.hypot(dx, dy), max = 50;
      if (d > max) { dx *= max / d; dy *= max / d; }
      joy.x = dx / max; joy.y = dy / max;
      $('joyKnob').style.transform = `translate(${dx}px, ${dy}px)`;
    } else if (t.identifier === look.id) {
      yaw -= (t.clientX - look.x) * 0.006;
      pitch = Math.max(-1.2, Math.min(1.2, pitch - (t.clientY - look.y) * 0.006));
      look.x = t.clientX; look.y = t.clientY;
    }
  }
}, { passive: true });
function endTouch(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) {
      joy.id = null; joy.x = joy.y = 0; $('joyKnob').style.transform = '';
      const j = $('joy'); j.style.left = ''; j.style.top = ''; j.style.bottom = '';
    }
    if (t.identifier === look.id) look.id = null;
  }
}
addEventListener('touchend', endTouch);
addEventListener('touchcancel', endTouch);

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  switch (el.dataset.act) {
    case 'play': startPlaying(); break;
    case 'menu': openMenu(); break;
    case 'interact': interact(); break;
    case 'run': running = !running; el.classList.toggle('on', running); break;
    case 'tasks': tasksOpen = !tasksOpen; renderTasks(); break;
    case 'lang': S.lang = el.dataset.id; renderMenu(); renderTasks(); renderHud(); save(); break;
    case 'sound': S.sound = !S.sound; renderMenu(); save(); break;
    case 'reset':
      if (confirmReset) { resetting = true; localStorage.removeItem(SAVE_KEY); location.reload(); }
      else { confirmReset = true; el.textContent = tr('Tap again to erase', 'తొలగించడానికి మళ్ళీ నొక్కండి'); }
      break;
  }
});
let confirmReset = false;

/* ============================== MENU ================================== */
function renderMenu() {
  document.documentElement.lang = isTe() ? 'te' : 'en';
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.id === (isTe() ? 'te' : 'en')));
  $('menuText').textContent = tr('Live a day in a Telugu village: fetch water from the well, make chai on the chulha, collect eggs, milk the cow and sell at the kirana shop.',
    'తెలుగు పల్లెటూరిలో ఒక రోజు గడపండి: బావి నుంచి నీళ్ళు, పొయ్యి మీద చాయ్, కోడి గుడ్లు, ఆవు పాలు, కిరాణా షాప్‌లో అమ్మకం.');
  $('playBtn').textContent = S.day > 1 || S.done.water ? tr('▶ Continue', '▶ కొనసాగించు') : tr('▶ Play', '▶ ఆడండి');
  $('soundBtn').textContent = (S.sound ? '🔊 ' : '🔇 ') + tr('Sound', 'సౌండ్');
  $('resetBtn').textContent = '🗑️ ' + tr('New game', 'కొత్త గేమ్');
  confirmReset = false;
  $('controlsHelp').innerHTML = IS_TOUCH
    ? tr('<b>Left side</b>: move · <b>Right side</b>: look around · <b>Yellow button</b>: do the task', '<b>ఎడమ వైపు</b>: నడవండి · <b>కుడి వైపు</b>: చుట్టూ చూడండి · <b>పసుపు బటన్</b>: పని చేయండి')
    : tr('<b>W A S D</b>: walk · <b>Mouse</b>: look · <b>Shift</b>: run · <b>E</b>: do the task · <b>T</b>: chores list · <b>Esc</b>: menu',
      '<b>W A S D</b>: నడవండి · <b>మౌస్</b>: చూడండి · <b>Shift</b>: పరుగు · <b>E</b>: పని · <b>T</b>: పనుల లిస్ట్ · <b>Esc</b>: మెనూ');
}
function openMenu() {
  playing = false;
  if (document.pointerLockElement) document.exitPointerLock();
  renderMenu();
  $('menu').classList.remove('hidden');
  $('touch').classList.add('hidden');
  save();
}
function startPlaying() {
  try { ac().resume(); } catch (e) { /* no audio */ }
  playing = true;
  $('menu').classList.add('hidden');
  $('hud').classList.remove('hidden');
  if (IS_TOUCH) $('touch').classList.remove('hidden');
  else lockPointer();
  renderTasks(); renderInventory(); renderHud();
  if (!S.done.water && S.day === 1) toast(tr('Start your day: walk to the well and draw water 💧', 'మీ రోజు మొదలుపెట్టండి: బావి దగ్గరకు వెళ్ళి నీళ్ళు తోడండి 💧'));
}

/* ============================== GAME LOOP ============================= */
const clock = new THREE.Clock();
const move = new THREE.Vector3();
let stepAcc = 0, saveAcc = 0, puffAcc = 0, bob = 0;
function collide(p) {
  for (const c of colliders) {
    const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), min = c.r + 0.35;
    if (d < min && d > 0.0001) { p.x = c.x + dx / d * min; p.z = c.z + dz / d * min; }
  }
  const r = Math.hypot(p.x, p.z);
  if (r > 58) { p.x *= 58 / r; p.z *= 58 / r; }
}
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.1);
  if (playing) {
    // Movement
    let fx = 0, fz = 0;
    if (keys.KeyW || keys.ArrowUp) fz -= 1;
    if (keys.KeyS || keys.ArrowDown) fz += 1;
    if (keys.KeyA || keys.ArrowLeft) fx -= 1;
    if (keys.KeyD || keys.ArrowRight) fx += 1;
    fx += joy.x; fz += joy.y;
    const len = Math.hypot(fx, fz);
    if (len > 0.1 && !busy) {
      const run = (running || keys.ShiftLeft || keys.ShiftRight) && S.energy > 0;
      const speed = (S.energy <= 0 ? 1.8 : run ? 5.6 : 3.4) * Math.min(1, len);
      move.set(fx / len, 0, fz / len).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiplyScalar(speed * dt);
      player.position.add(move);
      collide(player.position);
      S.energy = Math.max(0, S.energy - dt * (run ? 0.6 : 0.18));
      bob += dt * (run ? 13 : 9);
      stepAcc += dt * (run ? 1.6 : 1);
      if (stepAcc > 0.45) { stepAcc = 0; SFX.step(); }
    }
    camera.position.y = 1.62 + Math.sin(bob) * 0.035;
    // Game time: 1 real second = 1 village minute
    S.time += dt;
    if (S.time >= 24 * 60) { S.time = 23.99 * 60; }
    if (S.time > 23 * 60 && !busy) { toast(tr('Too late! You fell asleep…', 'చాలా లేట్ అయింది! నిద్ర వచ్చేసింది…')); sleep(); }
    updateBusy(dt);
    ambient(dt);
  }
  player.rotation.y = yaw;
  camera.rotation.x = pitch;

  // Chulha fire, cooking and smoke
  const st = S.stove;
  const cooking = st.state === 'cooking';
  stove.pot.visible = st.state !== 'empty';
  stove.fire.visible = cooking;
  stove.light.intensity = cooking ? 1.2 + Math.random() * 0.6 : 0;
  if (cooking) {
    stove.fire.scale.y = 0.8 + Math.random() * 0.5;
    st.until -= dt;
    if (st.until <= 0) { st.state = 'ready'; SFX.good(); toast(tr('🍵 Chai is ready! Go drink it.', '🍵 చాయ్ రెడీ! వెళ్ళి తాగండి.'), 'good'); }
  }
  puffAcc += dt;
  if (puffAcc > 0.25 && st.state !== 'empty') { puffAcc = 0; puff(CHULHA.x, 0.95, CHULHA.z, cooking ? 0xbbbbbb : 0xffffff); }
  for (let i = puffs.length - 1; i >= 0; i--) {
    const p = puffs[i];
    p.life -= dt;
    p.m.position.y += dt * 0.7; p.m.position.x += dt * 0.15;
    p.m.scale.setScalar(1 + (2.2 - p.life) * 1.4);
    p.m.material.opacity = Math.max(0, p.life / 2.2 * 0.5);
    if (p.life <= 0) { scene.remove(p.m); p.m.material.dispose(); puffs.splice(i, 1); }
  }

  // Chickens wander and peck
  for (const c of chickens) {
    c.wait -= dt;
    const to = c.target.clone().sub(c.g.position); to.y = 0;
    if (to.length() < 0.15) {
      if (c.wait <= 0) { c.target.set(COOP.x + rand(-3.5, 3.5), 0, COOP.z + rand(-3.5, 3.5)); c.wait = rand(1, 4); }
      c.g.children[1].position.y = 0.5 - Math.max(0, Math.sin(performance.now() / 150)) * 0.12;
    } else {
      to.normalize();
      c.g.position.addScaledVector(to, dt * 0.9);
      c.g.rotation.y = Math.atan2(to.x, to.z);
      c.g.position.y = Math.abs(Math.sin(performance.now() / 90)) * 0.04;
    }
  }
  cow.children[1].rotation.z = Math.sin(performance.now() / 900) * 0.08;

  updateSky();
  hudAcc += dt;
  if (hudAcc > 0.2) { hudAcc = 0; if (playing) { renderHud(); updatePrompt(); } }
  saveAcc += dt;
  if (saveAcc > 10 && playing) { saveAcc = 0; save(); }
  renderer.render(scene, camera);
}

/* ============================== BOOT ================================== */
hydrateIcons();
S.eggsLeft.forEach((left, i) => { eggMeshes[i].visible = left; });
renderMenu();
updateSky();
addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
frame();

// Test hook, only with ?debug in the address
if (new URLSearchParams(location.search).has('debug')) {
  window.__palle = {
    S, player, spots, start: startPlaying,
    goTo(x, z, faceX, faceZ) { player.position.set(x, 0, z); yaw = Math.atan2(-(faceX - x), -(faceZ - z)); updatePrompt(); return focus ? focus.label() : null; },
    use() { updatePrompt(); interact(); return !!busy; },
    get busy() { return !!busy; },
    get focusNeed() { return focus ? focus.need() : null; },
  };
}
