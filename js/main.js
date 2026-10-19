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
  hut: '🛖', tasks: '📋', gear: '⚙️', speech: '💬', bucket: '🪣', axe: '🪓', party: '🎉', pray: '🙏',
  rain: '🌧️', storm: '⛈️', veg: '🍅', seed: '🌱', ball: '⚽', basket: '🧺', umbrella: '☔', oldman: '👴', woman: '👩', boy: '👦', farmer: '🧑‍🌾',
  brinjal: '🍆', chilli: '🌶️', corn: '🌽', goat: '🐐', buffalo: '🐃', duck: '🦆', gmilk: '🐐', fodder: '🌾', fish: '🐟', bigfish: '🐠', rod: '🎣', ricebag: '🍚', sapling: '🪴', sarpanch: '👨‍💼', teacher: '👩‍🏫', postman: '📬', letter: '✉️', chaiwala: '👨‍🍳', school: '🏫', bell: '🔔', trash: '🗑️', trophy: '🏆', cricket: '🏏', kite: '🪁', fireworks: '🎆', mango: '🥭', diya: '🪔', elephant: '🐘', ox: '🐂', cold: '❄️', bowl: '🥣', flower: '🌼', sparkle: '✨' };
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
    inv: { water: 0, wood: 0, egg: 0, milk: 0, tea: 2, chai: 0, seed: 0, veg: 0, brinjal: 0, chilli: 0, corn: 0, gmilk: 0, fodder: 0, fish: 0, bigfish: 0, rod: 0, ricebag: 0, sapling: 0, letter: 0, ball: 0, kite: 0, fireworks: 0, bowl: 0, flower: 0 },
    cart: { x: 6.5, z: -14, rot: 0 },
    townDay: 0,
    stats: {}, ach: {},
    tools: { pot: false, axe: false },
    santa: { day: 0, snacks: 0, sold: 0, rides: 0 },
    storyDay: 0, storiesHeard: 0,
    story: { step: 0, litter: [false, false, false, false, false] }, // the sarpanch's village development story
    post: { day: 0, to: null, done: false },
    teachDay: 0,
    chaiStall: { day: 0, n: 0 },
    paddy: { stage: 2, watered: false }, // -1 empty, 0 saplings … 4 golden and ready to cut
    cricketDay: 0,
    fishing: { day: 0, n: 0 },
    animals: { goat: 0, buffalo: 0, ducks: 0, fedDay: 0, goatDay: 0, buffaloDay: 0, duckDay: 0 },
    home: { level: 0, fan: false, radio: false, tv: false, tvDay: 0 },
    stove: { state: 'empty', until: 0 }, // empty | cooking | ready
    eggsLeft: [true, true, true],
    milked: false, prayed: false,
    done: {},
    farm: Array.from({ length: 6 }, () => ({ stage: -1, watered: false, crop: 'tomato' })), // stage -1 empty, 0 seeds, then grows to the crop's ripe stage
    seeds: { tomato: 6, brinjal: 0, chilli: 0, corn: 0 },
    quests: { ram: 'new', lak: 'new', ball: 'new' }, // new | active | done
    ballSpot: 0,
    weather: { rain: false },
    pos: { x: 2, z: 9, yaw: 0 },
  };
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const d = defaultState(), s = Object.assign(defaultState(), JSON.parse(raw));
      s.inv = Object.assign(d.inv, s.inv); // older saves miss the newer items
      s.quests = Object.assign(d.quests, s.quests);
      s.home = Object.assign(d.home, s.home);
      s.animals = Object.assign(d.animals, s.animals);
      s.paddy = Object.assign(d.paddy, s.paddy);
      s.story = Object.assign(d.story, s.story);
      s.stats = s.stats || {}; s.ach = s.ach || {};
      s.tools = Object.assign(d.tools, s.tools);
      s.santa = Object.assign(d.santa, s.santa);
      s.post = Object.assign(d.post, s.post);
      s.chaiStall = Object.assign(d.chaiStall, s.chaiStall);
      if (!JSON.parse(raw).seeds) s.seeds.tomato = s.inv.seed || 0; // seeds used to be one item
      s.inv.seed = 0;
      s.farm.forEach(p => { p.crop = p.crop || 'tomato'; });
      return s;
    }
  } catch (e) { /* storage blocked */ }
  return defaultState();
}
let resetting = false;
function save() {
  if (resetting) return; // don't write the old game back while starting a new one
  S.pos = { x: player.position.x, z: player.position.z, yaw };
  S.cart = { x: cart.g.position.x, z: cart.g.position.z, rot: cart.g.rotation.y };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ }
}
S = load();

/* ============================== CALENDAR ============================== */
// A village year is 21 days: 7 of winter, 7 of summer, 7 of monsoon, with four festivals
const YEAR = 21;
const SEASONS = [
  { id: 'winter', icon: 'cold', name: ['Winter', 'చలికాలం'], rain: 0.12, ground: 0xe2ebe0, paddy: 0xd8b84a },
  { id: 'summer', icon: 'mango', name: ['Summer', 'ఎండాకాలం'], rain: 0.08, ground: 0xecd296, paddy: 0xa8a060 },
  { id: 'monsoon', icon: 'umbrella', name: ['Monsoon', 'వర్షాకాలం'], rain: 0.6, ground: 0xffffff, paddy: 0x6fbf3a },
];
function dayOfYear(day = S.day) { return ((day - 1) % YEAR) + 1; }
function season(day = S.day) { return SEASONS[Math.floor((dayOfYear(day) - 1) / 7)]; }
const FESTIVALS = {
  2: { id: 'deepavali', icon: 'diya', emoji: '🪔', name: ['Deepavali', 'దీపావళి'], item: 'fireworks', price: 20,
    itemName: ['Crackers', 'టపాకాయలు'], task: ['Burst crackers at home after 6 PM', 'సాయంత్రం 6 తర్వాత ఇంటి దగ్గర టపాకాయలు కాల్చాలి'] },
  6: { id: 'sankranti', icon: 'kite', emoji: '🪁', name: ['Sankranti', 'సంక్రాంతి'], item: 'kite', price: 15,
    itemName: ['Kite', 'గాలిపటం'], task: ['Fly a kite on the town road', 'పట్నం రోడ్డు మీద గాలిపటం ఎగరేయాలి'] },
  9: { id: 'ugadi', icon: 'bowl', emoji: '🥭', name: ['Ugadi', 'ఉగాది'], item: 'bowl', price: 10,
    itemName: ['Pachadi items', 'పచ్చడి సామాను'], task: ['Make Ugadi pachadi on the chulha', 'పొయ్యి దగ్గర ఉగాది పచ్చడి చేయాలి'] },
  17: { id: 'chavithi', icon: 'elephant', emoji: '🐘', name: ['Vinayaka Chavithi', 'వినాయక చవితి'], item: 'flower', price: 10,
    itemName: ['Pooja items', 'పూజ సామాను'], task: ['Do pooja at the Ganesha pandal', 'వినాయకుడి పందిరిలో పూజ చేయాలి'] },
};
function festival(day = S.day) { return FESTIVALS[dayOfYear(day)] || null; }
const isFest = id => festival()?.id === id;
// Every seventh day is Sunday, when the weekly santa (market) sets up near the temple
const isSantaDay = (day = S.day) => dayOfYear(day) % 7 === 0;
const santaOpen = () => isSantaDay() && S.time >= 8 * 60 && S.time < 18 * 60;

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
let wet = 0, flash = 0; // rain strength 0..1 and lightning flash
const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, fog: false });
function updateSky() {
  const h = S.time / 60;
  const ang = (h - 6) / 12 * Math.PI; // sunrise 6:00, sunset 18:00
  const day = Math.max(0, Math.sin(ang));
  const sunDir = SUN_DIR.set(Math.cos(ang), Math.sin(ang), -0.35).normalize();
  sun.position.copy(player.position).addScaledVector(sunDir, 80);
  sun.target.position.copy(player.position);
  sun.intensity = (0.15 + day * 1.25) * (1 - wet * 0.7);
  sun.color.setHSL(0.1, 0.6, 0.6 + day * 0.3);
  hemi.intensity = (0.25 + day * 0.75) * (1 - wet * 0.3) + flash * 2.5;
  sunBall.position.copy(player.position).addScaledVector(sunDir, 170);
  moonBall.position.copy(player.position).addScaledVector(sunDir, -170);
  sunBall.visible = moonBall.visible = wet < 0.4;
  const c = skyColor(h);
  if (wet > 0) c.lerp(tmpB.set(0x66727c).multiplyScalar(0.25 + day * 0.75), wet * 0.8);
  if (flash > 0) c.lerp(tmpB.set(0xe8eeff), Math.min(1, flash * 3));
  // Winter mornings are misty (manchu)
  const mist = season().id === 'winter' && h > 4 ? Math.max(0, Math.min(1, (9.5 - h) / 2.5)) : 0;
  if (mist > 0) c.lerp(tmpB.set(0xdfe6ea).multiplyScalar(0.4 + day * 0.6), mist * 0.5);
  scene.background.copy(c);
  scene.fog.color.copy(c);
  scene.fog.near = 35 - Math.max(wet * 22, mist * 28); scene.fog.far = 110 - Math.max(wet * 55, mist * 66);
  cloudMat.color.set(0xffffff).lerp(tmpB.set(0x6a727a), wet * 0.85);
  cloudMat.emissive.copy(cloudMat.color).multiplyScalar(0.05 + day * 0.5 * (1 - wet * 0.6)); // clouds stay soft and bright by day
  stars.material.opacity = Math.max(0, 1 - day * 4) * (h < 6 || h > 18 ? 1 : 0.4) * (1 - wet);
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
const groundMat = new THREE.MeshLambertMaterial({ vertexColors: true }); // tinted by the season
const paddyMat = new THREE.MeshLambertMaterial({ color: 0x6fbf3a });
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
  const ground = new THREE.Mesh(g, groundMat);
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
const houses = [];
function house(x, z, rot, wall = 0xd89a63) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  houses.push(g);
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
function muggu(x, z, size = 2.4, parent = scene) {
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
  parent.add(m);
}

// Player's home
const home = house(0, 0, 0);
muggu(0, 5, 2.6);
// Home upgrades: tiled roof (penkutillu), concrete house (pakka illu), fan, radio and TV
const homeUp = { tiles: new THREE.Group(), slab: new THREE.Group(), fan: new THREE.Group(), radio: new THREE.Group(), tv: new THREE.Group(), screen: null };
{
  const c = home.children;
  homeUp.walls = c.slice(0, 6); homeUp.door = c[6]; homeUp.windows = [c[7], c[8]]; homeUp.thatch = c[10];
  // Keep the front door open so you can see inside, with a small lamp in the room
  homeUp.door.position.set(-0.56, 1, 3.2); homeUp.door.rotation.y = Math.PI / 2;
  const lamp = new THREE.PointLight(0xffd8a0, 0.9, 7, 1.5); lamp.position.set(0, 2, 0); home.add(lamp);
  home.add(homeUp.tiles, homeUp.slab, homeUp.fan, homeUp.radio, homeUp.tv);
  // Penkutillu: low clay-tile roof with ridge lines
  const tileRoof = mesh(new THREE.ConeGeometry(Math.hypot(7.2, 6.2) / 2 + 0.5, 1.9, 4), 0xb5532e, 0, 2.6 + 0.95, 0, homeUp.tiles);
  tileRoof.rotation.y = Math.PI / 4; tileRoof.scale.set(1, 1, 6.2 / 7.2);
  for (let i = 0; i < 6; i++) box(7.4 - i * 1.1, 0.06, 0.08, 0x8a3a1e, 0, 2.75 + i * 0.3, 3.1 - i * 0.52, homeUp.tiles).castShadow = false;
  // Pakka illu: flat slab with a parapet and a black water tank
  box(6.8, 0.3, 5.8, 0xe8e2d6, 0, 2.75, 0, homeUp.slab);
  for (const [w, d, x, z] of [[6.8, 0.15, 0, 2.85], [6.8, 0.15, 0, -2.85], [0.15, 5.8, 3.33, 0], [0.15, 5.8, -3.33, 0]]) box(w, 0.5, d, 0xf0ead8, x, 3.15, z, homeUp.slab);
  mesh(new THREE.CylinderGeometry(0.55, 0.55, 1, 12), 0x222222, 2, 3.4, -1.6, homeUp.slab);
  box(6.8, 0.12, 1.2, 0xd0c8b8, 0, 2.62, 3.2, homeUp.slab); // sunshade over the door
  // Ceiling fan
  homeUp.fan.position.set(0, 2.35, 0);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), 0x888888, 0, 0.15, 0, homeUp.fan);
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10), 0xdddddd, 0, 0, 0, homeUp.fan);
  homeUp.blades = new THREE.Group(); homeUp.fan.add(homeUp.blades);
  for (let i = 0; i < 3; i++) { const b = box(0.7, 0.02, 0.14, 0xeeeeee, 0.4, 0, 0, new THREE.Group()); const p = b.parent; p.rotation.y = i * Math.PI * 2 / 3; homeUp.blades.add(p); }
  // Radio on the front step
  homeUp.radio.position.set(-2.3, 0.25, 3.05);
  box(0.42, 0.26, 0.16, 0x7a3a1a, 0, 0.13, 0, homeUp.radio);
  box(0.2, 0.16, 0.02, 0xc8c8c8, -0.07, 0.14, 0.085, homeUp.radio);
  box(0.015, 0.4, 0.015, 0xcccccc, 0.15, 0.45, 0, homeUp.radio).rotation.z = -0.4;
  // TV on a stand against the back wall, screen glows
  homeUp.tv.position.set(0, 0, -2.1);
  box(1.3, 0.6, 0.45, 0x6b4426, 0, 0.3, 0, homeUp.tv);
  box(1.05, 0.66, 0.12, 0x151515, 0, 0.95, 0, homeUp.tv);
  homeUp.screen = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.56), new THREE.MeshBasicMaterial({ color: 0x223344 }));
  homeUp.screen.position.set(0, 0.95, 0.065); homeUp.tv.add(homeUp.screen);
}
const HOME_LEVELS = [
  { name: ['Hut (gudisa)', 'గుడిసె'], price: 0 },
  { name: ['Tiled house (penkutillu)', 'పెంకుటిల్లు'], price: 300, perk: ['You tire 20% slower', 'అలసట 20% తక్కువ'] },
  { name: ['Concrete house (pakka illu)', 'పక్కా ఇల్లు'], price: 800, perk: ['You tire 40% slower', 'అలసట 40% తక్కువ'] },
];
const FURNITURE = [
  { id: 'fan', emoji: '🌀', name: ['Ceiling fan', 'ఫ్యాన్'], price: 80, perk: ['No extra tiredness in summer heat', 'ఎండాకాలం వేడికి అలసట ఉండదు'] },
  { id: 'radio', emoji: '📻', name: ['Radio', 'రేడియో'], price: 60, perk: ['Songs at home and the morning weather report', 'ఇంటి దగ్గర పాటలు, ఉదయం వాతావరణ వార్తలు'] },
  { id: 'tv', emoji: '📺', name: ['TV', 'టీవీ'], price: 250, perk: ['Watch TV in the evening: energy +20', 'సాయంత్రం టీవీ చూస్తే శక్తి +20'] },
];
function applyHome() {
  const H = S.home, L = H.level;
  homeUp.thatch.visible = L === 0; homeUp.tiles.visible = L === 1; homeUp.slab.visible = L === 2;
  const wall = [0xd89a63, 0xf3ece0, 0xf5c66a][L];
  if (!homeUp.wallMat) homeUp.wallMat = new THREE.MeshLambertMaterial();
  homeUp.wallMat.color.set(wall);
  homeUp.walls.forEach(w => { w.material = homeUp.wallMat; });
  homeUp.door.material = mat([0x5a3418, 0x6b3a1a, 0x2a8a8a][L]);
  homeUp.windows.forEach(w => { w.material = mat([0x3a2614, 0x3a2614, 0x2a5aa8][L]); });
  homeUp.fan.visible = H.fan; homeUp.radio.visible = H.radio; homeUp.tv.visible = H.tv;
}
function homeComfort() { return [1, 0.8, 0.6][S.home.level]; }
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
    const l = mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 7), 0x7a4a26, 8.6, 0.14 + Math.floor(i / 3) * 0.24, -1.3 + (i % 3) * 0.26 + (Math.floor(i / 3) % 2) * 0.12);
    l.rotation.x = Math.PI / 2;
  }
  colliders.push({ x: 8.6, z: -1, r: 0.9 });
}
const WOODPILE = new THREE.Vector3(8.6, 0, -1);

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
  // Sankranti decorations: painted cloth, marigold garland and coloured horn tips
  const deco = new THREE.Group(); cow.add(deco); deco.visible = false;
  box(1.0, 0.5, 0.86, 0xc8202a, -0.1, 1.28, 0, deco);
  box(1.02, 0.08, 0.88, 0xffc83d, -0.1, 1.52, 0, deco);
  mesh(new THREE.TorusGeometry(0.3, 0.07, 6, 14), 0xff8a1a, 0.85, 1.2, 0, deco).rotation.y = Math.PI / 2;
  mesh(new THREE.SphereGeometry(0.06, 6, 5), 0x2fb35a, 1.0, 1.76, 0.21, deco); mesh(new THREE.SphereGeometry(0.06, 6, 5), 0x2fb35a, 1.0, 1.76, -0.21, deco);
  cow.userData.deco = deco;
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
const paddy = { water: null, plants: null };
const PADDY_SPOT = new THREE.Vector3(-13.1, 0, -18);
{
  const fx = -22, fz = -18, fw = 16, fd = 12;
  const water = mesh(new THREE.PlaneGeometry(fw, fd), new THREE.MeshLambertMaterial({ color: 0x5f8f6a }), fx, 0.05, fz); water.rotation.x = -Math.PI / 2; water.castShadow = false;
  paddy.water = water;
  // Canal from the pond into the field
  const canal = mesh(new THREE.PlaneGeometry(0.7, 4.6), 0x3a7aa0, -24, 0.055, -9.9); canal.rotation.x = -Math.PI / 2; canal.castShadow = false;
  for (const [w, d, x, z] of [[fw + 0.6, 0.6, fx, fz - fd / 2], [fw + 0.6, 0.6, fx, fz + fd / 2], [0.6, fd, fx - fw / 2, fz], [0.6, fd, fx + fw / 2, fz]]) box(w, 0.35, d, 0x8a6a3a, x, 0.17, z);
  const geo = new THREE.ConeGeometry(0.09, 0.6, 4);
  geo.translate(0, 0.3, 0);
  const rows = 22, cols = 30, inst = new THREE.InstancedMesh(geo, paddyMat, rows * cols);
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
  paddy.plants = inst;
}
function renderPaddy() {
  const st = S.paddy.stage;
  paddy.plants.visible = st >= 0;
  paddy.plants.scale.y = [0.25, 0.45, 0.65, 0.85, 1][Math.max(0, st)];
  paddyMat.color.set(st >= 4 ? 0xd8b84a : [0x9ad860, 0x84cc4a, 0x6fbf3a, 0x5fae30][Math.max(0, st)]);
  paddy.water.material.color.set(S.paddy.watered || wet > 0.5 ? 0x4f8faa : st < 0 ? 0x7a6a4a : 0x5f8f6a);
}

// Crops: each season has its own; the farm grows one crop per plot
const CROPS = {
  tomato: { item: 'veg', emoji: '🍅', name: ['Tomato', 'టమాటా'], seedPrice: 10, yield: 2, grow: 3, color: 0xe0301e, fruit: [1, 1, 1], seasons: ['winter', 'monsoon'] },
  brinjal: { item: 'brinjal', emoji: '🍆', name: ['Brinjal', 'వంకాయ'], seedPrice: 14, yield: 2, grow: 3, color: 0x5a2a7a, fruit: [1, 1.8, 1], seasons: ['winter', 'summer', 'monsoon'] },
  chilli: { item: 'chilli', emoji: '🌶️', name: ['Chilli', 'మిరపకాయ'], seedPrice: 12, yield: 4, grow: 3, color: 0xd81e1e, fruit: [0.5, 1.9, 0.5], seasons: ['summer'] },
  corn: { item: 'corn', emoji: '🌽', name: ['Corn', 'మొక్కజొన్న'], seedPrice: 16, yield: 1, grow: 4, color: 0xf2c12e, fruit: [0.9, 2.2, 0.9], seasons: ['monsoon'], tall: 1.6 },
};
const cropOf = p => CROPS[p.crop] || CROPS.tomato;
const isRipe = p => p.stage >= 0 && p.stage >= cropOf(p).grow;
const isGrowing = p => p.stage >= 0 && p.stage < cropOf(p).grow;
const seasonCrops = () => Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(season().id));
// Vegetable farm (polam) next to the well: 6 plots
const FARM_C = new THREE.Vector3(-9.5, 0, 10.5);
const plots = [];
for (const z of [9.6, 11.4]) for (const x of [-11.5, -9.5, -7.5]) {
  const soil = mesh(new THREE.BoxGeometry(1.7, 0.14, 1.5), new THREE.MeshLambertMaterial({ color: 0x8a6038 }), x, 0.07, z);
  soil.castShadow = false;
  const mounds = new THREE.Group(), plants = new THREE.Group(), fruit = [];
  scene.add(mounds, plants);
  for (const [ox, oz] of [[-0.4, -0.35], [0.4, -0.35], [-0.4, 0.35], [0.4, 0.35]]) {
    mesh(new THREE.SphereGeometry(0.12, 7, 5), 0x5a3a20, x + ox, 0.14, z + oz, mounds).scale.y = 0.5;
    const p = new THREE.Group(); p.position.set(x + ox, 0.14, z + oz); plants.add(p);
    mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.55, 5), 0x4f8f2a, 0, 0.27, 0, p);
    mesh(new THREE.IcosahedronGeometry(0.2, 0), 0x3f9a2e, 0, 0.5, 0, p).scale.y = 0.8;
    mesh(new THREE.IcosahedronGeometry(0.14, 0), 0x4aa83a, 0.08, 0.3, -0.05, p);
    for (let i = 0; i < 3; i++) fruit.push(mesh(new THREE.SphereGeometry(0.065, 8, 6), 0xe0301e, Math.cos(i * 2.1) * 0.17, 0.32 + i * 0.07, Math.sin(i * 2.1) * 0.17, p));
  }
  // Bamboo border sticks
  for (const [bx, bz] of [[-0.85, -0.75], [0.85, -0.75], [-0.85, 0.75], [0.85, 0.75]]) box(0.05, 0.5, 0.05, 0xc8a860, x + bx, 0.25, z + bz).castShadow = false;
  plots.push({ soil, mounds, plants, fruit });
}
function renderFarm() {
  plots.forEach((p, i) => {
    const st = S.farm[i];
    p.soil.material.color.set(st.watered || wet > 0.5 ? 0x4a2e1a : 0x8a6038);
    const c = cropOf(st), ripe = isRipe(st);
    p.mounds.visible = st.stage === 0;
    p.plants.visible = st.stage >= 1;
    const s = st.stage < 1 ? 0 : ripe ? 1 : 0.35 + 0.65 * (st.stage - 1) / Math.max(1, c.grow - 1);
    p.plants.children.forEach(pl => pl.scale.set(s, s * (c.tall || 1), s));
    p.fruit.forEach(f => { f.visible = ripe; f.material = mat(c.color); f.scale.set(...c.fruit); });
  });
}

// A floating name tag above a villager
const tagTextures = [];
function nameTag(lines, parent, y) {
  const make = () => textTexture(lines, 512, 140, 'rgba(20,30,20,0.72)', '#fff3c8');
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: make(), depthWrite: false }));
  s.scale.set(1.2, 0.33, 1); s.position.y = y;
  parent.add(s);
  tagTextures.push(() => { s.material.map.dispose(); s.material.map = make(); s.material.needsUpdate = true; });
  return s;
}
document.fonts.load('700 48px "Baloo Tammudu 2"').then(() => tagTextures.forEach(f => f()));

// Villagers: simple low-poly people who walk between waypoints (model faces +z)
function makePerson({ cloth, lower = 0xf4f0e6, skin = 0x8a5a3a, hair = 0x1a1a1a, h = 1, saree = false, stick = false }) {
  const g = new THREE.Group();
  const legs = [];
  for (const sx of [-0.1, 0.1]) {
    const pivot = new THREE.Group(); pivot.position.set(sx, 0.8 * h, 0); g.add(pivot);
    box(0.13, 0.8 * h, 0.14, saree ? skin : lower, 0, -0.4 * h, 0, pivot);
    legs.push(pivot);
  }
  if (saree) mesh(new THREE.CylinderGeometry(0.2, 0.34, 0.82 * h, 10), cloth, 0, 0.45 * h, 0, g);
  mesh(new THREE.CylinderGeometry(0.19 * Math.max(h, 0.8), 0.23 * Math.max(h, 0.8), 0.62 * h, 10), cloth, 0, 1.1 * h, 0, g);
  if (saree) box(0.08, 0.66 * h, 0.3, 0xffc83d, 0.12, 1.12 * h, 0.02, g).rotation.z = -0.5; // pallu
  box(0.09, 0.55 * h, 0.1, skin, -0.27 * Math.max(h, 0.8), 1.1 * h, 0, g);
  box(0.09, 0.55 * h, 0.1, skin, 0.27 * Math.max(h, 0.8), 1.1 * h, 0, g);
  const head = mesh(new THREE.SphereGeometry(0.16, 12, 10), skin, 0, 1.55 * h + 0.06, 0, g);
  mesh(new THREE.SphereGeometry(0.168, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), hair, 0, head.position.y + 0.02, -0.02, g);
  for (const ex of [-0.055, 0.055]) mesh(new THREE.SphereGeometry(0.022, 6, 4), 0x111111, ex, head.position.y + 0.02, 0.145, g); // eyes
  if (saree) mesh(new THREE.SphereGeometry(0.08, 8, 6), hair, 0, head.position.y, -0.18, g); // bun
  if (saree) mesh(new THREE.SphereGeometry(0.02, 6, 4), 0xd01a1a, 0, head.position.y + 0.05, 0.158, g); // bottu
  if (stick) box(0.04, 1.2, 0.04, 0x6b4426, 0.36, 0.6, 0.15, g);
  scene.add(g);
  return { g, legs, headY: head.position.y };
}
const villagers = [];
function villager(id, look, names, icon, path, speed) {
  const p = makePerson(look);
  p.g.position.set(path[0][0], 0, path[0][1]);
  const tag = nameTag(names, p.g, p.headY + 0.45);
  const v = Object.assign(p, { id, icon, tag, names, path: path.map(([x, z]) => new THREE.Vector3(x, 0, z)), i: 1, speed, wait: rand(0, 3), phase: 0, near: false });
  villagers.push(v);
  return v;
}
villager('ram', { cloth: 0xf8f6ee, hair: 0xd8d8d8, stick: true }, ['రామయ్య తాత', 'Ramayya'], 'oldman', [[9.4, -4.8], [14.8, -4.6], [15.6, -11], [15.4, -4.9]], 0.7);
villager('lak', { cloth: 0xd0306a, saree: true }, ['లక్ష్మి అక్క', 'Lakshmi'], 'woman', [[-13.4, 6.2], [-10.5, 4.6], [-4.2, 4.8], [-3.6, 8.2]], 1.1);
villager('chintu', { cloth: 0x2f7fd8, lower: 0x2a3a5a, h: 0.72 }, ['చింటు', 'Chintu'], 'boy', [[4.2, 14], [-6, 13.8], [1.5, 18.5], [10.5, 13.4]], 2.1);
villager('ven', { cloth: 0x7a9a5a, hair: 0x2a2a2a }, ['వెంకన్న మామ', 'Venkanna'], 'farmer', [[-12.8, -11.5], [-12.8, -24], [-20, -25.4], [-12.8, -24.8]], 0.9);
villager('sar', { cloth: 0xffffff, lower: 0xffffff, hair: 0x333333 }, ['సర్పంచ్ నారాయణ గారు', 'Sarpanch Narayana'], 'sarpanch', [[3.2, -12], [3.2, -21], [-3.4, -21], [3.2, -21]], 0.8);
villager('teacher', { cloth: 0x2f6ad0, saree: true }, ['శారద టీచర్', 'Sarada Teacher'], 'teacher', [[-23.5, -26.6], [-16.5, -26.6]], 0.8);
villager('post', { cloth: 0xb8a070, lower: 0x8a7650 }, ['పోస్ట్‌మ్యాన్ రాజు', 'Postman Raju'], 'postman', [[7.4, -6], [7.4, 26]], 1.3);
villager('chai', { cloth: 0xf0e8d0, lower: 0x5a5a8a, hair: 0x222222 }, ['చాయ్ అన్న', 'Chai Anna'], 'chaiwala', [[9.2, -12.6], [9.2, -12.65]], 0.3);

// Government school (badi) south-west of the paddy field
const SCHOOL = house(-20, -31, 0, 0xf2e2a0);
SCHOOL.children[10].material = mat(0xb5532e);
const SCHOOL_SPOT = new THREE.Vector3(-20, 0, -26.2);
{
  const t = () => textTexture(['ప్రభుత్వ పాఠశాల', 'Govt. School'], 512, 140, '#1f5a2a', '#ffffff');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.7), new THREE.MeshBasicMaterial({ map: t() }));
  sign.position.set(0, 2.3, 2.68); SCHOOL.add(sign);
  document.fonts.load('700 48px "Baloo Tammudu 2"').then(() => { sign.material.map = t(); sign.material.needsUpdate = true; });
}
// Things the village gets as the sarpanch's story moves on
const upgrades = { benches: new THREE.Group(), bell: new THREE.Group(), lamps: new THREE.Group(), award: new THREE.Group(), litter: [] };
scene.add(upgrades.benches, upgrades.bell, upgrades.lamps, upgrades.award);
for (const x of [-23, -20, -17]) { box(1.6, 0.08, 0.4, 0x8a5a2a, x, 0.45, -25.2, upgrades.benches); for (const dx of [-0.7, 0.7]) box(0.08, 0.45, 0.35, 0x6b4426, x + dx, 0.22, -25.2, upgrades.benches); }
for (const x of [-0.9, 0.9]) box(0.12, 2.9, 0.12, 0x8a6a3a, x, 1.45, -21.9, upgrades.bell);
box(2, 0.12, 0.12, 0x8a6a3a, 0, 2.9, -21.9, upgrades.bell);
const bellMesh = mesh(new THREE.CylinderGeometry(0.08, 0.28, 0.4, 12, 1, true), 0xd8a832, 0, 2.6, -21.9, upgrades.bell, { side: THREE.DoubleSide });
const lampHead = new THREE.MeshBasicMaterial({ color: 0x555544 });
for (const z of [-18, -3.5, 10, 23]) {
  box(0.1, 4, 0.1, 0x666666, 9.4, 2, z, upgrades.lamps);
  box(0.8, 0.08, 0.08, 0x666666, 9.05, 3.95, z, upgrades.lamps);
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.2), lampHead); h.position.set(8.7, 3.88, z); upgrades.lamps.add(h);
  colliders.push({ x: 9.4, z, r: 0.2 });
}
const streetLight = new THREE.PointLight(0xfff0c0, 0, 22, 1.4); streetLight.position.set(7, 4, 2); upgrades.lamps.add(streetLight);
{
  const t = () => textTexture(['🏆 ఉత్తమ గ్రామం', 'Best Village Award'], 512, 160, '#7a1f1f', '#ffe08a');
  const b = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.75), new THREE.MeshBasicMaterial({ map: t(), side: THREE.DoubleSide }));
  b.position.set(2.6, 2.4, 30); b.rotation.y = Math.PI; upgrades.award.add(b);
  for (const dx of [-1, 1]) box(0.1, 2.6, 0.1, 0x6b4426, 2.6 + dx, 1.3, 30, upgrades.award);
  document.fonts.load('700 48px "Baloo Tammudu 2"').then(() => { b.material.map = t(); b.material.needsUpdate = true; });
}
const LITTER = [[-5, 20.5], [19, 5.5], [-16, -9], [6, -31], [24, 11.5]].map(([x, z]) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  for (let i = 0; i < 6; i++) box(rand(0.15, 0.35), rand(0.05, 0.15), rand(0.15, 0.3), [0x7a6a5a, 0xd8d8d8, 0x3a7ad8, 0xd83a3a, 0x5a5a4a][i % 5], rand(-0.4, 0.4), 0.05, rand(-0.4, 0.4), g).rotation.y = rand(0, 3);
  upgrades.litter.push(g);
  return new THREE.Vector3(x, 0, z);
});
function applyStory() {
  const st = S.story.step;
  upgrades.benches.visible = st >= 1; upgrades.bell.visible = st >= 2; upgrades.lamps.visible = st >= 3; upgrades.award.visible = st >= 4;
  upgrades.litter.forEach((g, i) => { g.visible = st === 3 && !S.story.litter[i]; });
}
// Tea stall next to the cart stand
const TEA_STALL = new THREE.Vector3(9.2, 0, -11.4), TEA_SPOT = new THREE.Vector3(9.2, 0, -9.6);
{
  box(1.8, 0.95, 0.6, 0x8a5a2a, TEA_STALL.x, 0.48, TEA_STALL.z);
  for (const dx of [-0.85, 0.85]) box(0.08, 2.3, 0.08, 0x6b4426, TEA_STALL.x + dx, 1.15, TEA_STALL.z - 0.6);
  const aw = mesh(new THREE.BoxGeometry(2.2, 0.08, 1.6), 0x2fb35a, TEA_STALL.x, 2.3, TEA_STALL.z - 0.3); aw.rotation.x = 0.18;
  mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.25, 10), 0xbbbbbb, TEA_STALL.x - 0.4, 1.08, TEA_STALL.z);
  for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 8), 0xe8f4ff, TEA_STALL.x + 0.1 + i * 0.14, 1.0, TEA_STALL.z + 0.1, scene, { transparent: true, opacity: 0.8 });
  colliders.push({ x: TEA_STALL.x, z: TEA_STALL.z, r: 1.0 });
}
// Evening bonfire (mantalu) near the rachabanda: villagers gather 7–10 PM
const BONFIRE = new THREE.Vector3(11.6, 0, -3.8);
const bonfire = { flames: [], light: new THREE.PointLight(0xff8a30, 0, 16, 1.4) };
{
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; mesh(new THREE.DodecahedronGeometry(0.16, 0), 0x8a857a, BONFIRE.x + Math.cos(a) * 0.65, 0.1, BONFIRE.z + Math.sin(a) * 0.65); }
  for (let i = 0; i < 4; i++) { const l = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 6), 0x5a3418, BONFIRE.x, 0.15, BONFIRE.z); l.rotation.z = Math.PI / 2; l.rotation.y = i * Math.PI / 4; }
  for (const [c, sc, x, z] of [[0xff6a1a, 1, 0, 0], [0xffb02a, 0.7, 0.12, 0.05], [0xffe07a, 0.45, -0.08, -0.06]]) {
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.3 * sc, 0.9 * sc, 7), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 }));
    fl.position.set(BONFIRE.x + x, 0.2 + 0.45 * sc, BONFIRE.z + z); scene.add(fl); bonfire.flames.push(fl);
  }
  bonfire.light.position.set(BONFIRE.x, 1.2, BONFIRE.z); scene.add(bonfire.light);
  colliders.push({ x: BONFIRE.x, z: BONFIRE.z, r: 0.8 });
}
const SEATS = { ram: [-1.6, 0.6], ven: [1.5, 0.9], lak: [0.4, -1.7], chai: [-1.1, -1.4] };
const isGathering = () => { const h = S.time / 60; return h >= 19 && h < 22; };
function updateBonfire(dt) {
  const on = isGathering();
  bonfire.light.intensity = on ? 2.2 + Math.random() * 0.8 : 0;
  bonfire.flames.forEach((fl, i) => { fl.visible = on; fl.scale.y = 0.8 + Math.random() * 0.5; fl.rotation.y += dt * (i + 1); });
  if (on && Math.random() < dt * 4) puff(BONFIRE.x, 1.1, BONFIRE.z, 0x777777);
}
// Fireflies over the pond, the paddy field and the farm at night
const FLY_N = 70;
const flyPos = new Float32Array(FLY_N * 3), flyHome = [];
for (let i = 0; i < FLY_N; i++) {
  const [cx, cz, r] = [[-24, -4, 6], [-22, -18, 8], [-9.5, 10.5, 4]][i % 3];
  const p = new THREE.Vector3(cx + rand(-r, r), rand(0.4, 1.8), cz + rand(-r, r)); flyHome.push(p); flyPos.set([p.x, p.y, p.z], i * 3);
}
const fliesGeo = new THREE.BufferGeometry(); fliesGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
const flies = new THREE.Points(fliesGeo, new THREE.PointsMaterial({ color: 0xd8ff6a, size: 0.22, map: null, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
flies.visible = false; scene.add(flies);
function updateFlies() {
  const h = S.time / 60, t = performance.now() / 1000;
  flies.visible = (h > 19 || h < 5) && wet < 0.4;
  if (!flies.visible) return;
  if (!flies.material.map) { flies.material.map = sparkTex; flies.material.needsUpdate = true; }
  for (let i = 0; i < FLY_N; i++) {
    const p = flyHome[i];
    flyPos[i * 3] = p.x + Math.sin(t * 0.5 + i) * 0.8; flyPos[i * 3 + 1] = p.y + Math.sin(t * 0.9 + i * 2) * 0.3; flyPos[i * 3 + 2] = p.z + Math.cos(t * 0.4 + i) * 0.8;
  }
  fliesGeo.attributes.position.needsUpdate = true;
  flies.material.opacity = 0.55 + Math.sin(t * 3) * 0.35;
}
// Stories Ramayya tells by the fire
const STORIES = [
  ['The clever rabbit', 'తెలివైన కుందేలు', 'A lion ate one animal every day. A small rabbit told him another lion lived in the well. The proud lion jumped at his own reflection and never came back. Brains beat strength!', 'ఒక సింహం రోజూ ఒక జంతువును తినేది. ఒక చిన్న కుందేలు బావిలో ఇంకో సింహం ఉందని చెప్పింది. గర్వంతో సింహం తన నీడ మీదకే దూకింది. బలం కన్నా బుద్ధి గొప్ప!'],
  ['The monkey and the crocodile', 'కోతి – మొసలి', 'A crocodile wanted the monkey’s heart. Halfway across the river the monkey said, "I left my heart on the tree!" Back on the bank, he climbed up and was safe. Think fast in trouble!', 'మొసలి కోతి గుండె కావాలనుకుంది. నది మధ్యలో కోతి "నా గుండె చెట్టు మీదే వదిలేశా!" అంది. ఒడ్డుకు రాగానే చెట్టెక్కి బతికిపోయింది. ఆపదలో తెలివిగా ఆలోచించాలి!'],
  ['The thirsty crow', 'దాహం వేసిన కాకి', 'A thirsty crow found a pot with a little water at the bottom. It dropped pebbles in one by one until the water rose. Patience finds a way.', 'దాహంతో ఉన్న కాకికి అడుగున కొంచెం నీళ్ళున్న కుండ కనిపించింది. ఒక్కో రాయి వేసి నీళ్ళు పైకి తెచ్చుకుంది. ఓపిక ఉంటే దారి దొరుకుతుంది.'],
  ['Tenali Rama and the thieves', 'తెనాలి రామ – దొంగలు', 'Tenali Rama saw thieves hiding near his house. He loudly told his wife the gold was in the well. The thieves drew water all night, and his garden got watered for free!', 'ఇంటి దగ్గర దొంగలు దాక్కోవడం తెనాలి రామ చూశాడు. బంగారం బావిలో వేశామని గట్టిగా భార్యతో అన్నాడు. దొంగలు రాత్రంతా నీళ్ళు తోడారు, తోటకి ఉచితంగా నీళ్ళు!'],
  ['The four friends', 'నలుగురు స్నేహితులు', 'A crow, a mouse, a tortoise and a deer were friends. When the deer was caught in a net, the mouse chewed it open. Together, small friends beat a big hunter.', 'కాకి, ఎలుక, తాబేలు, జింక స్నేహితులు. జింక వలలో చిక్కితే ఎలుక వల కొరికి విడిపించింది. కలిసి ఉంటే చిన్నవాళ్ళూ పెద్ద వేటగాణ్ణి ఓడిస్తారు.'],
  ['The golden goose', 'బంగారు గుడ్ల బాతు', 'A farmer’s goose laid one golden egg a day. Greedy for more, he cut it open and found nothing. Be happy with steady blessings.', 'ఒక రైతు బాతు రోజూ ఒక బంగారు గుడ్డు పెట్టేది. అత్యాశతో దాన్ని కోస్తే ఏమీ దొరకలేదు. రోజూ వచ్చే దీవెనలతో సంతోషంగా ఉండాలి.'],
];
function updateVillagers(dt) {
  const h = S.time / 60, awake = h >= 6 && h < 20.5, gathering = isGathering();
  for (const v of villagers) {
    if (v.override) { v.g.visible = true; continue; }
    if (gathering && SEATS[v.id]) {
      const [sx, sz] = SEATS[v.id];
      v.g.visible = true; v.g.position.set(BONFIRE.x + sx, 0, BONFIRE.z + sz);
      v.g.rotation.y = Math.atan2(-sx, -sz); v.legs.forEach(l => { l.rotation.x = 0; });
      const d = Math.hypot(player.position.x - v.g.position.x, player.position.z - v.g.position.z);
      v.near = d < 3.2; v.tag.visible = d > 2.4 && d < 16;
      continue;
    }
    v.g.visible = awake;
    if (!awake) continue;
    const dx = player.position.x - v.g.position.x, dz = player.position.z - v.g.position.z;
    const dist = Math.hypot(dx, dz);
    v.near = dist < 3.2;
    v.tag.visible = dist > 2.4 && dist < 16; // name tags only from a comfortable distance
    let face = null, moving = false;
    if (v.near) face = Math.atan2(dx, dz);
    else if (v.wait > 0) v.wait -= dt;
    else {
      const to = v.path[v.i].clone().sub(v.g.position); to.y = 0;
      const d = to.length();
      if (d < 0.1) { v.i = (v.i + 1) % v.path.length; v.wait = rand(1.5, 5); }
      else {
        v.g.position.addScaledVector(to.normalize(), Math.min(d, v.speed * dt));
        face = Math.atan2(to.x, to.z); moving = true;
      }
    }
    if (face !== null) {
      let diff = face - v.g.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      v.g.rotation.y += diff * Math.min(1, dt * 6);
    }
    v.phase = moving ? v.phase + dt * v.speed * 4.5 : v.phase * 0.85;
    v.legs[0].rotation.x = Math.sin(v.phase) * 0.55;
    v.legs[1].rotation.x = -Math.sin(v.phase) * 0.55;
  }
}

// Chintu's lost cricket ball, hidden somewhere each time
const BALL_SPOTS = [
  [-17, -8, ['behind the chicken coop, towards the paddy field', 'కోళ్ల గూడు వెనక, వరి పొలం వైపు']],
  [22, 4, ['on the east side, past the neighbour\'s house', 'తూర్పు వైపు, పక్కింటి దాటి']],
  [-6, -16, ['on the way to the temple, left side', 'గుడికి వెళ్ళే దారిలో ఎడమ వైపు']],
  [18, -14, ['past the rachabanda tree', 'రచ్చబండ చెట్టు దాటి']],
  [-18, 18, ['near the back houses, by the coconut trees', 'వెనక ఇళ్ళ దగ్గర, కొబ్బరి చెట్ల వద్ద']],
];
const ballMesh = mesh(new THREE.SphereGeometry(0.12, 12, 10), 0xb01818, 0, 0.12, 0);
const BALL_AT = new THREE.Vector3();
function placeBall() {
  const [x, z] = BALL_SPOTS[S.ballSpot % BALL_SPOTS.length];
  BALL_AT.set(x, 0, z); ballMesh.position.set(x, 0.12, z);
  ballMesh.visible = S.quests.ball === 'active' && !S.inv.ball;
}

// Clouds drift overhead; more of them show up when it rains
const clouds = new THREE.Group();
scene.add(clouds);
for (let i = 0; i < 22; i++) {
  const c = new THREE.Group(), a = srand(0, 6.28), r = srand(15, 95);
  c.position.set(Math.cos(a) * r, srand(36, 50), Math.sin(a) * r);
  for (let k = 0; k < 4; k++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(srand(4, 7), 1), cloudMat);
    m.position.set(srand(-6, 6), srand(-1, 1.5), srand(-3, 3)); m.scale.y = 0.5;
    c.add(m);
  }
  c.userData.minWet = i < 8 ? 0 : 0.1 + (i - 8) * 0.03;
  clouds.add(c);
}

// Rain: falling streaks that follow the player around
const RAIN_N = IS_TOUCH ? 600 : 1400;
const rainPos = new Float32Array(RAIN_N * 6);
for (let i = 0; i < RAIN_N; i++) {
  const x = rand(-20, 20), y = rand(0, 18), z = rand(-20, 20);
  rainPos.set([x, y, z, x + 0.04, y + 0.55, z], i * 6);
}
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xb8d4ee, transparent: true, opacity: 0 }));
rain.frustumCulled = false; rain.visible = false;
scene.add(rain);
function updateRain(dt) {
  rain.visible = wet > 0.02;
  clouds.rotation.y += dt * 0.004;
  for (const c of clouds.children) c.visible = wet >= c.userData.minWet;
  if (!rain.visible) return;
  rain.position.set(player.position.x, 0, player.position.z);
  rain.material.opacity = wet * 0.55;
  const fall = dt * 20;
  for (let i = 0; i < RAIN_N; i++) {
    const o = i * 6;
    let y = rainPos[o + 1] - fall;
    if (y < 0) y += 18;
    rainPos[o + 1] = y; rainPos[o + 4] = y + 0.55;
  }
  rainGeo.attributes.position.needsUpdate = true;
}

// Bullock cart (yedla bandi): faces +z, the driver sits at the front of the bed
const cart = { g: new THREE.Group(), wheels: [], legs: [], tails: [], phase: 0, speed: 0 };
{
  const g = cart.g, wood = 0x8a5a30;
  scene.add(g);
  box(1.5, 0.12, 2.2, wood, 0, 0.95, 0, g);
  box(0.08, 0.35, 2.2, wood, -0.72, 1.15, 0, g); box(0.08, 0.35, 2.2, wood, 0.72, 1.15, 0, g);
  box(1.5, 0.35, 0.08, wood, 0, 1.15, -1.08, g);
  const hood = mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.3, 14, 1, true, Math.PI / 2, Math.PI), 0xd8c49a, 0, 1.15, -0.45, g, { side: THREE.DoubleSide });
  hood.rotation.x = Math.PI / 2;
  box(1.9, 0.08, 0.08, 0x5a3418, 0, 0.72, -0.2, g);
  for (const sx of [-0.9, 0.9]) {
    const w = new THREE.Group(); w.position.set(sx, 0.72, -0.2); g.add(w);
    mesh(new THREE.TorusGeometry(0.68, 0.06, 6, 20), 0x5a3418, 0, 0, 0, w).rotation.y = Math.PI / 2;
    for (let k = 0; k < 4; k++) box(0.05, 1.32, 0.06, 0x7a4a26, 0, 0, 0, w).rotation.x = k * Math.PI / 4;
    cart.wheels.push(w);
  }
  box(0.1, 0.1, 2.6, wood, 0, 0.95, 2.3, g);   // pole
  box(1.7, 0.1, 0.1, wood, 0, 1.38, 3.1, g);   // yoke
  for (const bx of [-0.55, 0.55]) {
    const b = new THREE.Group(); b.position.set(bx, 0, 3.1); g.add(b);
    const white = 0xeeeae0;
    box(0.55, 0.62, 1.4, white, 0, 0.98, 0, b);
    box(0.34, 0.3, 0.4, white, 0, 1.38, 0.38, b);              // hump
    box(0.32, 0.38, 0.48, white, 0, 1.12, 0.9, b);             // head
    box(0.24, 0.2, 0.16, 0xd8a890, 0, 1.02, 1.14, b);          // nose
    for (const hx of [-0.12, 0.12]) mesh(new THREE.ConeGeometry(0.04, 0.32, 5), bx < 0 ? 0xd02a2a : 0x2a6ad0, hx, 1.42, 0.85, b).rotation.z = hx * 3;
    for (const [lx, lz] of [[-0.18, 0.5], [0.18, 0.5], [-0.18, -0.5], [0.18, -0.5]]) {
      const p = new THREE.Group(); p.position.set(lx, 0.68, lz); b.add(p);
      box(0.13, 0.68, 0.13, white, 0, -0.34, 0, p);
      cart.legs.push(p);
    }
    const tail = new THREE.Group(); tail.position.set(0, 1.2, -0.7); b.add(tail);
    box(0.05, 0.6, 0.05, white, 0, -0.3, 0, tail);
    cart.tails.push(tail);
    for (const sx of [-0.2, 0.2]) mesh(new THREE.SphereGeometry(0.05, 6, 4), 0xffc83d, sx, 0.98, 0.72, b); // bells
  }
  g.position.set(S.cart.x, 0, S.cart.z); g.rotation.y = S.cart.rot;
}
// Two circles cover the cart and the bulls
function cartCircles(x, z, rot) {
  const fx = Math.sin(rot), fz = Math.cos(rot);
  return [[x - fx * 0.1, z - fz * 0.1, 0.95], [x + fx * 3.1, z + fz * 3.1, 0.8]];
}
function cartBlocked(x, z, rot) {
  for (const [cx, cz, r] of cartCircles(x, z, rot)) {
    if (Math.hypot(cx, cz) > 57) return true;
    for (const c of colliders) if (Math.hypot(cx - c.x, cz - c.z) < c.r + r) return true;
    for (const v of villagers) if (v.g.visible && Math.hypot(cx - v.g.position.x, cz - v.g.position.z) < r + 0.4) return true;
  }
  return false;
}

// Road sign to the town market at the north end of the main road
const TOWN = new THREE.Vector3(6, 0, 31);
{
  box(0.12, 2.4, 0.12, 0x6b4426, 9, 1.2, 32);
  const t = () => textTexture(['పట్నం సంత →', 'Town market'], 512, 160, '#2f6a2f', '#ffffff');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.6), new THREE.MeshBasicMaterial({ map: t(), side: THREE.DoubleSide }));
  sign.position.set(9, 2.2, 32); sign.rotation.y = -Math.PI / 2; scene.add(sign);
  document.fonts.load('700 48px "Baloo Tammudu 2"').then(() => { sign.material.map = t(); sign.material.needsUpdate = true; });
  colliders.push({ x: 9, z: 32, r: 0.25 });
}

// Festival decorations, shown only on festival days
const fest = { all: new THREE.Group(), muggulu: new THREE.Group(), kites: new THREE.Group(), pandal: new THREE.Group(), diyas: new THREE.Group(), flames: [] };
scene.add(fest.all, fest.muggulu, fest.kites, fest.pandal, fest.diyas);
// Mango-leaf torans with marigolds over every door
for (const h of houses) {
  const t = new THREE.Group(); h.add(t); fest.all.add(t);
  for (let i = 0; i < 11; i++) {
    const x = -1.1 + i * 0.22;
    if (i % 2) mesh(new THREE.SphereGeometry(0.07, 6, 5), 0xff9a1a, x, 2.5, 2.72, t);
    else mesh(new THREE.ConeGeometry(0.08, 0.32, 4), 0x2f8a2a, x, 2.42, 2.72, t).rotation.x = Math.PI;
  }
  box(2.3, 0.03, 0.03, 0x6b4426, 0, 2.6, 2.72, t);
}
// Paper flag strings across the main road
for (const z of [-6, 6, 19, 27]) {
  box(0.1, 3.8, 0.1, 0x6b4426, 3.5, 1.9, z, fest.all); box(0.1, 3.8, 0.1, 0x6b4426, 8.5, 1.9, z, fest.all);
  for (let i = 0; i < 12; i++) {
    const x = 3.75 + i * 0.42, sag = Math.sin(i / 11 * Math.PI) * 0.45;
    const f = mesh(new THREE.ConeGeometry(0.16, 0.34, 3), [0xff4f6a, 0xffc83d, 0x3ccf6e, 0x4da3ff, 0xff8a1a][i % 5], x, 3.55 - sag, z, fest.all);
    f.rotation.x = Math.PI; f.castShadow = false;
  }
}
// Extra muggulu in front of the houses and on the road
[[-12, 17.6], [14.4, 19.4], [6, 9], [6, -3], [0, 10]].forEach(([x, z]) => muggu(x, z, 2.2, fest.muggulu));
// Kites over the village (Sankranti)
const kiteGeo = new THREE.PlaneGeometry(1, 1);
function makeKite(color, parent) {
  const k = new THREE.Group(); parent.add(k);
  const m = new THREE.Mesh(kiteGeo, mat(color, { side: THREE.DoubleSide })); m.rotation.z = Math.PI / 4; m.scale.set(1, 1.3, 1); k.add(m);
  const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 1.6), mat(0xffffff, { side: THREE.DoubleSide })); tail.position.y = -1.4; k.add(tail);
  return k;
}
for (let i = 0; i < 12; i++) {
  const k = makeKite([0xff4f6a, 0xffc83d, 0x3ccf6e, 0x4da3ff, 0xff8a1a, 0xb04fff][i % 6], fest.kites);
  k.position.set(rand(-35, 35), rand(14, 26), rand(-35, 35)); k.userData.p = rand(0, 6);
}
const KITE_AT = new THREE.Vector3(5.5, 0, 22);
const myKite = makeKite(0xff2f8a, scene);
myKite.position.set(KITE_AT.x + 7, 17, KITE_AT.z + 9); myKite.scale.setScalar(1.4); myKite.visible = false;
const kiteString = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(KITE_AT.x, 1.2, KITE_AT.z), myKite.position]), new THREE.LineBasicMaterial({ color: 0xffffff }));
scene.add(kiteString); kiteString.visible = false;
// Ganesha pandal (Vinayaka Chavithi)
const GANESHA = new THREE.Vector3(18, 0, -8);
const GANESHA_FRONT = new THREE.Vector3(GANESHA.x - 2.6, 0, GANESHA.z);
{
  const g = fest.pandal; g.position.copy(GANESHA); g.rotation.y = -Math.PI / 2;
  for (const [px, pz] of [[-1.4, -1.2], [1.4, -1.2], [-1.4, 1.2], [1.4, 1.2]]) box(0.1, 2.7, 0.1, 0xc8a860, px, 1.35, pz, g);
  for (let i = 0; i < 6; i++) box(0.53, 0.12, 2.9, i % 2 ? 0xffc83d : 0xe8443a, -1.32 + i * 0.53, 2.75, 0, g).castShadow = false;
  box(1.8, 0.5, 1.3, 0xffffff, 0, 0.25, -0.2, g);
  const skin = 0xffc4a0, y0 = 0.5;
  mesh(new THREE.SphereGeometry(0.42, 14, 12), skin, 0, y0 + 0.45, -0.2, g).scale.y = 1.05;
  mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.3, 14), 0xffd23d, 0, y0 + 0.18, -0.2, g);
  mesh(new THREE.SphereGeometry(0.3, 14, 12), skin, 0, y0 + 1.05, -0.15, g);
  for (const ex of [-0.3, 0.3]) mesh(new THREE.SphereGeometry(0.2, 10, 8), skin, ex, y0 + 1.08, -0.2, g).scale.set(0.35, 1, 1);
  const trunk = mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.5, 8), skin, 0.05, y0 + 0.82, 0.12, g); trunk.rotation.x = 0.35; trunk.rotation.z = -0.3;
  mesh(new THREE.ConeGeometry(0.18, 0.4, 8), 0xffc83d, 0, y0 + 1.45, -0.15, g);
  for (const ex of [-0.1, 0.1]) mesh(new THREE.SphereGeometry(0.035, 6, 4), 0x111111, ex, y0 + 1.12, 0.12, g);
  for (let i = 0; i < 9; i++) mesh(new THREE.SphereGeometry(0.07, 6, 5), i % 2 ? 0xff8a1a : 0xffd23d, -0.8 + i * 0.2, 0.55, 0.5, g);
}
const pandalCollider = { x: GANESHA.x, z: GANESHA.z, r: -9 };
colliders.push(pandalCollider);
// Diyas along the home step and around the muggu (Deepavali)
const diyaLight = new THREE.PointLight(0xffa040, 0, 12, 1.6); diyaLight.position.set(0, 1, 4.8); scene.add(diyaLight);
{
  const spots = [];
  for (let i = 0; i < 9; i++) spots.push([-2.8 + i * 0.7, 3.42, 0.27]);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; spots.push([Math.cos(a) * 1.7, 5 + Math.sin(a) * 1.7, 0.05]); }
  for (const [x, z, y] of spots) {
    mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.07, 8), 0xa0522d, x, y + 0.035, z, fest.diyas).castShadow = false;
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6), new THREE.MeshBasicMaterial({ color: 0xffb02a }));
    fl.position.set(x, y + 0.13, z); fest.diyas.add(fl); fest.flames.push(fl);
  }
}
// Fireworks: bursts of glowing points that fall and fade
const sparks = [];
// Soft round dot so the sparks glow instead of drawing squares
const sparkTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const k = c.getContext('2d'), gr = k.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  k.fillStyle = gr; k.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
})();
function burst(x, y, z) {
  const n = 70, pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) {
    pos.set([x, y, z], i * 3);
    const v = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(5, 8));
    vel.push(v);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const col = new THREE.Color().setHSL(Math.random(), 1, 0.6);
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: col, map: sparkTex, size: 0.8, transparent: true, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(p); sparks.push({ p, vel, life: 1.6 });
  const d = Math.hypot(x - player.position.x, z - player.position.z);
  setTimeout(() => { noise(0.35, Math.max(0.04, 0.3 - d * 0.004), 500); }, d * 12);
}
let fireAcc = 0;
function updateFireworks(dt) {
  const h = S.time / 60;
  if (playing && isFest('deepavali') && h >= 18.5 && h < 23.5) {
    fireAcc -= dt;
    const mine = S.crackersUntil > S.time;
    if (fireAcc <= 0) {
      fireAcc = mine ? rand(0.3, 0.7) : rand(1.5, 4);
      if (mine) burst(rand(-6, 6), rand(9, 15), rand(-6, 4));
      else { const a = rand(0, 6.28), r = rand(18, 40); burst(Math.cos(a) * r, rand(18, 28), Math.sin(a) * r); }
    }
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i], pos = s.p.geometry.attributes.position.array;
    s.life -= dt;
    s.vel.forEach((v, k) => { v.y -= 5 * dt; v.multiplyScalar(0.985); pos[k * 3] += v.x * dt; pos[k * 3 + 1] += v.y * dt; pos[k * 3 + 2] += v.z * dt; });
    s.p.geometry.attributes.position.needsUpdate = true;
    s.p.material.opacity = Math.max(0, s.life / 1.6);
    if (s.life <= 0) { scene.remove(s.p); s.p.geometry.dispose(); s.p.material.dispose(); sparks.splice(i, 1); }
  }
}
function updateFestivals(dt) {
  const h = S.time / 60, t = performance.now() / 1000;
  if (fest.kites.visible) fest.kites.children.forEach(k => { k.position.y += Math.sin(t + k.userData.p) * dt * 0.6; k.rotation.z = Math.sin(t * 0.8 + k.userData.p) * 0.3; });
  if (myKite.visible) { myKite.rotation.z = Math.sin(t * 1.1) * 0.25; myKite.position.y = 17 + Math.sin(t * 0.7) * 0.6; kiteString.geometry.setFromPoints([new THREE.Vector3(KITE_AT.x, 1.2, KITE_AT.z), myKite.position]); }
  const lit = fest.diyas.visible && (h >= 17.5 || h < 5);
  fest.flames.forEach(f => { f.visible = lit; f.scale.y = 0.8 + Math.random() * 0.4; });
  diyaLight.intensity = lit ? 1.4 : 0;
  updateFireworks(dt);
}

// Village pond (cheruvu) with reeds and lily pads
const POND = new THREE.Vector3(-24, 0, -4), POND_R = 3.8;
{
  mesh(new THREE.CircleGeometry(POND_R + 0.7, 28), 0x7a5a3a, POND.x, 0.035, POND.z).rotation.x = -Math.PI / 2;
  const w = mesh(new THREE.CircleGeometry(POND_R, 28), new THREE.MeshLambertMaterial({ color: 0x3a7aa0, transparent: true, opacity: 0.9 }), POND.x, 0.06, POND.z);
  w.rotation.x = -Math.PI / 2; w.castShadow = false;
  for (let i = 0; i < 14; i++) {
    const a = rand(0, 6.28), r = POND_R + rand(-0.2, 0.4);
    mesh(new THREE.ConeGeometry(0.05, rand(0.6, 1.1), 4), 0x4f8f2a, POND.x + Math.cos(a) * r, 0.4, POND.z + Math.sin(a) * r).castShadow = false;
  }
  for (let i = 0; i < 6; i++) {
    const a = rand(0, 6.28), r = rand(0.8, 2.8);
    const p = mesh(new THREE.CircleGeometry(0.28, 10), 0x3f9a3a, POND.x + Math.cos(a) * r, 0.07, POND.z + Math.sin(a) * r); p.rotation.x = -Math.PI / 2; p.castShadow = false;
  }
  colliders.push({ x: POND.x, z: POND.z, r: POND_R - 0.2 });
}
const DUCK_SPOT = new THREE.Vector3(POND.x, 0, POND.z + POND_R + 0.9);
const FISH_SPOT = new THREE.Vector3(POND.x + POND_R + 0.9, 0, POND.z);

// Mini-games (fishing, cricket) take over the action button while they run
let mini = null;
// Fishing: cast, wait for the float to dip, then pull at the right moment
const rod = new THREE.Group();
{
  const stick = mesh(new THREE.CylinderGeometry(0.012, 0.025, 1.7, 6), 0x8a5a2a, 0, 0, 0, rod);
  stick.rotation.x = -1.0; stick.castShadow = false;
  rod.position.set(0.32, -0.32, -0.55);
  rod.tip = new THREE.Object3D(); rod.tip.position.set(0, 0.46, -0.715); rod.add(rod.tip);
  rod.visible = false;
}
const bobber = mesh(new THREE.SphereGeometry(0.07, 10, 8), 0xff3030, 0, 0, 0);
bobber.visible = false;
const fishLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffffff }));
fishLine.visible = false; fishLine.frustumCulled = false; scene.add(fishLine);
const tipPos = new THREE.Vector3();
function startFishing() {
  const dir = POND.clone().sub(player.position); dir.y = 0; dir.normalize();
  bobber.position.copy(player.position).addScaledVector(dir, 2.6); bobber.position.y = 0.08;
  rod.visible = bobber.visible = fishLine.visible = true;
  noise(0.25, 0.1, 900);
  mini = {
    phase: 'wait', t: 0, biteAt: rand(2, 6), cancelOnMove: true,
    prompt() { return this.phase === 'bite' ? { text: tr('🐟 A bite! Pull now!', '🐟 చేప పట్టింది! లాగండి!'), btn: tr('Pull!', 'లాగు!'), hot: true } : { text: tr('Waiting for a bite… (pulling early scares the fish)', 'చేప కోసం ఎదురుచూపు… (ముందే లాగితే పారిపోతుంది)'), btn: tr('Pull', 'లాగు') }; },
    update(dt) {
      this.t += dt;
      const bob = Math.sin(performance.now() / 300) * 0.015;
      if (this.phase === 'wait') { bobber.position.y = 0.08 + bob; if (this.t >= this.biteAt) { this.phase = 'bite'; this.t = 0; noise(0.2, 0.15, 1400); updatePrompt(); } }
      else { bobber.position.y = -0.02 + Math.sin(performance.now() / 40) * 0.03; if (this.t > 1.1) endFishing(tr('🐟 It got away! Try again.', '🐟 చేప తప్పించుకుంది! మళ్ళీ ప్రయత్నించండి.')); }
      rod.tip.getWorldPosition(tipPos);
      fishLine.geometry.setFromPoints([tipPos, bobber.position]);
    },
    action() {
      if (this.phase !== 'bite') { endFishing(tr('Too early! The fish swam away.', 'చాలా తొందరగా లాగారు! చేప పారిపోయింది.')); return; }
      const r = Math.random();
      S.fishing.n++;
      if (r < 0.06) { endFishing(tr('👡 You caught… an old chappal! 😂', '👡 పట్టింది… పాత చెప్పు! 😂')); return; }
      const big = r > 0.72;
      S.inv[big ? 'bigfish' : 'fish']++; stat('fish'); if (big) stat('bigfish');
      SFX.good(); renderInventory(big ? 'bigfish' : 'fish');
      endFishing(big ? tr('🐠 A big fish! (₹40)', '🐠 పెద్ద చేప! (₹40)') : tr('🐟 Caught a fish! (₹15)', '🐟 చేప పట్టారు! (₹15)'), 'good');
    },
  };
}
// Cricket ground behind the north-west houses: you bat, Chintu bowls
const PITCH = { bat: new THREE.Vector3(-25, 0, 26), bowl: new THREE.Vector3(-35, 0, 26) };
{
  const p = mesh(new THREE.PlaneGeometry(12.5, 2.4), 0xc8a46a, -30, 0.035, 26); p.rotation.x = -Math.PI / 2; p.castShadow = false;
  for (const x of [-25.8, -34.2]) { const l = mesh(new THREE.PlaneGeometry(0.06, 2.4), 0xffffff, x, 0.04, 26); l.rotation.x = -Math.PI / 2; l.castShadow = false; }
  for (const x of [-24.3, -35.7]) {
    for (const dz of [-0.11, 0, 0.11]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.72, 6), 0xf2ead6, x, 0.36, 26 + dz);
    box(0.03, 0.03, 0.26, 0xf2ead6, x, 0.73, 26);
  }
}
const bat = new THREE.Group();
{
  box(0.035, 0.32, 0.035, 0x5a3418, 0, 0.16, 0, bat);
  box(0.11, 0.55, 0.03, 0xe8c890, 0, -0.27, 0, bat);
  bat.position.set(0.32, -0.4, -0.6); bat.rotation.set(0, -0.9, 0.5);
  bat.visible = false;
}
const cball = mesh(new THREE.SphereGeometry(0.07, 10, 8), 0xb01818, 0, 0, 0);
cball.visible = false;
const BALL_FROM = new THREE.Vector3(-34.6, 2.0, 26);
function startCricket() {
  const chintu = villagers.find(v => v.id === 'chintu');
  chintu.override = true;
  chintu.g.position.set(PITCH.bowl.x - 1.5, 0, PITCH.bowl.z + 0.4); chintu.g.rotation.y = Math.PI / 2;
  player.position.copy(PITCH.bat); yaw = Math.PI / 2; pitch = -0.06;
  bat.visible = true; fade();
  const TARGET = 12;
  mini = {
    phase: 'runup', t: 0, ball: 0, runs: 0, swing: 0,
    prompt() {
      const score = `${tr('Ball', 'బాల్')} ${Math.min(6, this.ball + 1)}/6 · ${tr('Runs', 'పరుగులు')} ${this.runs}/${TARGET}`;
      if (this.phase === 'flight' && !this.swung) return { text: `🏏 ${score} — ${tr('Swing!', 'కొట్టు!')}`, btn: tr('Swing', 'కొట్టు'), hot: true };
      return { text: `🏏 ${score} — ${this.phase === 'runup' ? tr('Chintu is running in…', 'చింటు బౌలింగ్ చేస్తున్నాడు…') : tr('Watch the ball…', 'బంతిని చూడండి…')}`, btn: tr('Swing', 'కొట్టు') };
    },
    update(dt) {
      this.t += dt;
      this.swing = Math.max(0, this.swing - dt);
      bat.rotation.z = this.swing > 0 ? 0.5 - (1 - this.swing / 0.3) * 2.2 : 0.5;
      bat.rotation.x = this.swing > 0 ? -0.6 : 0;
      chintu.legs[0].rotation.x = this.phase === 'runup' ? Math.sin(this.t * 14) * 0.6 : 0; chintu.legs[1].rotation.x = -chintu.legs[0].rotation.x;
      if (this.phase === 'runup') {
        chintu.g.position.x = PITCH.bowl.x - 1.5 + this.t * 1.2;
        if (this.t > 1.1) { this.phase = 'flight'; this.t = 0; this.T = rand(0.85, 1.15); this.zoff = rand(-0.28, 0.28); this.swung = false; cball.visible = true; updatePrompt(); }
      } else if (this.phase === 'flight') {
        const u = this.t / this.T, ub = 0.7;
        cball.position.x = BALL_FROM.x + (PITCH.bat.x + 0.6 - BALL_FROM.x) * u;
        cball.position.z = BALL_FROM.z + this.zoff * u;
        cball.position.y = u < ub ? BALL_FROM.y * (1 - u / ub) ** 1.4 + 0.07 : 0.07 + (u - ub) / (1 - ub) * 0.8;
        if (u > 1.12) {
          if (Math.abs(this.zoff) < 0.14) { toast(tr('💥 Bowled! Chintu got you out!', '💥 బౌల్డ్! చింటు ఔట్ చేశాడు!'), 'bad'); noise(0.15, 0.2, 2500); this.finish(); return; }
          toast(tr('Dot ball.', 'డాట్ బాల్.'));
          this.next();
        }
      } else if (this.phase === 'hit') {
        this.vel.y -= 9.8 * dt;
        cball.position.addScaledVector(this.vel, dt);
        if (cball.position.y < 0.07) { cball.position.y = 0.07; this.vel.y *= -0.4; this.vel.multiplyScalar(0.7); }
        if (this.t > 1.8) this.next();
      }
    },
    action() {
      if (this.phase !== 'flight' || this.swung) return;
      this.swung = true; this.swing = 0.3;
      const u = this.t / this.T, e = Math.abs(u - 0.93);
      const runs = e < 0.035 ? 6 : e < 0.07 ? 4 : e < 0.11 ? 2 : e < 0.16 ? 1 : 0;
      if (!runs) { toast(tr('Swing and a miss!', 'బ్యాట్‌కి తగలలేదు!')); updatePrompt(); return; }
      this.runs += runs; this.phase = 'hit'; this.t = 0; if (runs === 6) stat('sixes');
      noise(0.08, 0.3, 1800); tone(900, 0.08, 'square', 0.04);
      const power = { 1: 6, 2: 9, 4: 15, 6: 19 }[runs];
      this.vel = new THREE.Vector3(-power, runs === 6 ? 11 : runs === 4 ? 3 : 4, rand(-5, 5));
      toast(runs === 6 ? tr('🔥 SIX!', '🔥 సిక్స్!') : runs === 4 ? tr('💥 FOUR!', '💥 ఫోర్!') : tr(`🏃 ${runs} run${runs > 1 ? 's' : ''}`, `🏃 ${runs} పరుగులు`), runs >= 4 ? 'good' : '');
      if (runs >= 4) SFX.good();
      updatePrompt();
    },
    next() {
      this.ball++; cball.visible = false;
      if (this.ball >= 6 || this.runs >= TARGET) { this.finish(); return; }
      this.phase = 'runup'; this.t = 0; chintu.g.position.x = PITCH.bowl.x - 1.5; updatePrompt();
    },
    finish() {
      mini = null; bat.visible = false; cball.visible = false; chintu.override = false;
      S.cricketDay = S.day;
      if (this.runs >= TARGET) {
        S.money += 25; S.energy = Math.min(100, S.energy + 10); SFX.good(); renderHud(); stat('cricketWins');
        toast(tr(`🏆 You won with ${this.runs} runs! Chintu gives you ₹25. Energy +10`, `🏆 ${this.runs} పరుగులతో గెలిచారు! చింటు ₹25 ఇచ్చాడు. శక్తి +10`), 'good');
      } else toast(tr(`Chintu wins! You made ${this.runs} runs. Play again tomorrow!`, `చింటు గెలిచాడు! మీరు ${this.runs} పరుగులు చేశారు. రేపు మళ్ళీ ఆడండి!`));
      updatePrompt();
    },
  };
  updatePrompt();
}
function endFishing(msg, type = '') {
  mini = null;
  rod.visible = bobber.visible = fishLine.visible = false;
  if (msg) toast(msg, type);
  updatePrompt();
}

// Animal pen (pashuvula dodi) with a feeding trough
const PEN = new THREE.Vector3(22, 0, 22), PEN_GATE = new THREE.Vector3(22, 0, 17.6);
const trough = { hay: null };
{
  const h = 3.5;
  for (let i = -h; i <= h; i += 1) for (const [x, z] of [[i, -h], [i, h], [-h, i], [h, i]]) {
    if (z === -h && Math.abs(x) < 1.1) continue; // gate gap
    box(0.12, 1, 0.12, 0x8a6a3a, PEN.x + x, 0.5, PEN.z + z).castShadow = false;
    colliders.push({ x: PEN.x + x, z: PEN.z + z, r: 0.3 });
  }
  for (const [w, d, x, z] of [[2.5, 0.06, -2.25, -h], [2.5, 0.06, 2.25, -h], [7, 0.06, 0, h], [0.06, 7, -h, 0], [0.06, 7, h, 0]]) {
    box(w, 0.08, d, 0x9a7a4a, PEN.x + x, 0.75, PEN.z + z).castShadow = false;
    box(w, 0.08, d, 0x9a7a4a, PEN.x + x, 0.4, PEN.z + z).castShadow = false;
  }
  box(1.8, 0.4, 0.6, 0x6b4426, PEN.x - 2, 0.2, PEN.z + 2.6);
  trough.hay = box(1.6, 0.12, 0.45, 0xd8c060, PEN.x - 2, 0.42, PEN.z + 2.6);
  colliders.push({ x: PEN.x - 2, z: PEN.z + 2.6, r: 0.6 });
  // A small shade roof
  for (const [x, z] of [[1, 1.5], [3.2, 1.5], [1, 3.4], [3.2, 3.4]]) box(0.1, 2, 0.1, 0x6b4426, PEN.x + x, 1, PEN.z + z);
  thatchedRoof(2.8, 2.4, 0.8, PEN.x + 2.1, 2, PEN.z + 2.45);
}
// Four-legged animals built from boxes; model faces +z
function makeBeast({ color, body, legH, head, horns, hornColor = 0xd8d0c0 }) {
  const g = new THREE.Group(), legs = [];
  const [w, h, l] = body;
  box(w, h, l, color, 0, legH + h / 2, 0, g);
  box(head[0], head[1], head[2], color, 0, legH + h * 0.9, l / 2 + head[2] / 2 - 0.05, g);
  if (horns) for (const sx of [-1, 1]) { const hn = mesh(new THREE.ConeGeometry(0.035, horns, 5), hornColor, sx * head[0] * 0.35, legH + h * 0.9 + head[1] / 2 + horns / 2 - 0.05, l / 2 + 0.05, g); hn.rotation.z = -sx * 0.6; hn.rotation.x = -0.4; }
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const p = new THREE.Group(); p.position.set(sx * w * 0.32, legH, sz * l * 0.36); g.add(p);
    box(w * 0.22, legH, w * 0.22, color, 0, -legH / 2, 0, p); legs.push(p);
  }
  scene.add(g);
  return { g, legs, target: new THREE.Vector3(), wait: rand(0, 3), phase: 0 };
}
const pens = { goat: [], buffalo: [], ducks: [] };
function spawnAnimals() {
  const want = { goat: S.animals.goat, buffalo: S.animals.buffalo, ducks: S.animals.ducks ? 3 : 0 };
  while (pens.goat.length < want.goat) pens.goat.push(makeBeast({ color: [0xe8dcc8, 0x6b4a2a][pens.goat.length % 2], body: [0.36, 0.38, 0.75], legH: 0.42, head: [0.22, 0.24, 0.3], horns: 0.22 }));
  while (pens.buffalo.length < want.buffalo) pens.buffalo.push(makeBeast({ color: 0x2a2a2e, body: [0.75, 0.75, 1.7], legH: 0.62, head: [0.4, 0.4, 0.55], horns: 0.45, hornColor: 0x555555 }));
  while (pens.ducks.length < want.ducks) {
    const g = new THREE.Group();
    mesh(new THREE.SphereGeometry(0.16, 8, 6), 0xffffff, 0, 0.12, 0, g).scale.set(1, 0.75, 1.4);
    mesh(new THREE.SphereGeometry(0.09, 8, 6), 0xffffff, 0, 0.27, 0.17, g);
    box(0.06, 0.03, 0.1, 0xff9a1a, 0, 0.26, 0.28, g);
    scene.add(g);
    pens.ducks.push({ g, a: rand(0, 6.28), r: rand(1, 2.8), speed: rand(0.15, 0.3) * (Math.random() < 0.5 ? -1 : 1) });
  }
  [...pens.goat, ...pens.buffalo].forEach(b => { if (!b.placed) { b.placed = true; b.g.position.set(PEN.x + rand(-2.5, 2.5), 0, PEN.z + rand(-2.5, 1)); b.target.copy(b.g.position); } });
  trough.hay.visible = S.animals.fedDay === S.day;
}
function updateAnimals(dt) {
  for (const b of [...pens.goat, ...pens.buffalo]) {
    b.wait -= dt;
    const to = b.target.clone().sub(b.g.position); to.y = 0;
    let moving = false;
    if (to.length() < 0.1) { if (b.wait <= 0) { b.target.set(PEN.x + rand(-2.8, 2.8), 0, PEN.z + rand(-2.8, 0.8)); b.wait = rand(2, 6); } }
    else { to.normalize(); b.g.position.addScaledVector(to, dt * 0.6); b.g.rotation.y = Math.atan2(to.x, to.z); moving = true; }
    b.phase = moving ? b.phase + dt * 7 : 0;
    b.legs.forEach((l, i) => { l.rotation.x = Math.sin(b.phase + (i % 2 ? Math.PI : 0)) * 0.4; });
  }
  for (const d of pens.ducks) {
    d.a += d.speed * dt;
    d.g.position.set(POND.x + Math.cos(d.a) * d.r, 0.04 + Math.sin(performance.now() / 400 + d.r) * 0.02, POND.z + Math.sin(d.a) * d.r);
    d.g.rotation.y = -d.a + (d.speed > 0 ? Math.PI : 0);
  }
}
const ANIMALS = {
  goat: { emoji: '🐐', name: ['Goat', 'మేక'], price: 150, max: 2 },
  buffalo: { emoji: '🐃', name: ['Buffalo', 'బర్రె'], price: 400, max: 1 },
  ducks: { emoji: '🦆', name: ['3 Ducks', '3 బాతులు'], price: 120, max: 1 },
};

// Weekly santa: market stalls and a giant wheel east of the temple
const SANTA = new THREE.Vector3(14, 0, -30);
const santa = { g: new THREE.Group(), colliders: [], wheel: new THREE.Group(), cabins: [], spots: {} };
scene.add(santa.g);
function stall(x, z, awning, lines, cloth) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(SANTA.x - x, SANTA.z - z); santa.g.add(g);
  box(2.2, 0.9, 0.7, 0x8a5a2a, 0, 0.45, 0, g);
  for (const [px, pz] of [[-1, -0.9], [1, -0.9], [-1, 0.35], [1, 0.35]]) box(0.07, 2.3, 0.07, 0x6b4426, px, 1.15, pz, g);
  const aw = mesh(new THREE.BoxGeometry(2.4, 0.07, 1.6), awning, 0, 2.3, -0.25, g); aw.rotation.x = 0.15;
  const t = () => textTexture(lines, 512, 140, '#fff3d0', '#7a2a00');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.5), new THREE.MeshBasicMaterial({ map: t() })); sign.position.set(0, 2.0, 0.56); g.add(sign);
  document.fonts.load('700 48px "Baloo Tammudu 2"').then(() => { sign.material.map = t(); sign.material.needsUpdate = true; });
  const p = makePerson({ cloth }); scene.remove(p.g); p.g.position.set(0, 0, -0.75); g.add(p.g);
  const c = { x, z, r: 1.2 }; colliders.push(c); santa.colliders.push(c);
  const front = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)).multiplyScalar(1.6).add(new THREE.Vector3(x, 0, z));
  return { g, front };
}
santa.spots.bajji = stall(9.6, -27.4, 0xe8443a, ['మిర్చి బజ్జీ', 'Mirchi Bajji'], 0xffc83d).front;
santa.spots.tools = stall(14, -25.8, 0x2f6ad0, ['కుండలు • పనిముట్లు', 'Pots & Tools'], 0x7a9a5a).front;
santa.spots.buyer = stall(18.6, -27.6, 0x2fb35a, ['కూరగాయల వ్యాపారి', 'Produce buyer ×1.3'], 0xd0306a).front;
// Giant wheel (jaint wheel): the wheel turns about the z axis, cabins stay level
const WHEEL = new THREE.Vector3(14.5, 4.8, -35.5), WHEEL_R = 3.8;
{
  for (const sx of [-1, 1]) for (const sz of [-0.9, 0.9]) { const leg = box(0.15, 5.6, 0.15, 0xd84a3a, WHEEL.x + sx * 1.6, 2.6, WHEEL.z + sz, santa.g); leg.rotation.z = -sx * 0.3; }
  santa.wheel.position.copy(WHEEL); santa.g.add(santa.wheel);
  for (const zz of [-0.45, 0.45]) {
    const rim = mesh(new THREE.TorusGeometry(WHEEL_R, 0.06, 6, 40), 0xffc83d, 0, 0, zz, santa.wheel); rim.castShadow = false;
    for (let i = 0; i < 8; i++) { const sp = box(0.05, WHEEL_R * 2, 0.05, 0xffffff, 0, 0, zz, santa.wheel); sp.rotation.z = i * Math.PI / 8; sp.castShadow = false; }
  }
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Group(); santa.g.add(c);
    box(0.9, 0.6, 0.8, [0xe8443a, 0x4da3ff, 0x3ccf6e, 0xff8ad8][i % 4], 0, -0.4, 0, c);
    box(0.05, 0.4, 0.05, 0x888888, 0, 0.05, 0, c);
    santa.cabins.push(c);
  }
  const cl = { x: WHEEL.x, z: WHEEL.z, r: 2.0 }; colliders.push(cl); santa.colliders.push(cl);
}
const WHEEL_SPOT = new THREE.Vector3(WHEEL.x, 0, WHEEL.z + 2.4);
let wheelAngle = 0;
function updateSanta(dt) {
  if (!santa.g.visible) return;
  wheelAngle += dt * (mini && mini.ride ? 0.45 : 0.18);
  santa.wheel.rotation.z = wheelAngle;
  santa.cabins.forEach((c, i) => { const a = wheelAngle + i * Math.PI / 4; c.position.set(WHEEL.x + Math.cos(a) * WHEEL_R, WHEEL.y + Math.sin(a) * WHEEL_R, WHEEL.z); });
}
function applySanta() {
  const on = santaOpen();
  santa.g.visible = on;
  santa.colliders.forEach((c, i) => { c.r = on ? (i === santa.colliders.length - 1 ? 2.0 : 1.2) : -9; });
}
function rideWheel() {
  const cab = santa.cabins[0];
  yaw = Math.PI; pitch = -0.2; // look out over the village
  mini = {
    ride: true, t: 0, phase: 'ride',
    prompt() { return { text: tr('🎡 Wheee! Enjoy the view of Mana Palle…', '🎡 హాయ్! మన పల్లె అందాలు చూడండి…'), btn: '🎡' }; },
    update(dt) {
      this.t += dt;
      player.position.set(cab.position.x, cab.position.y - 1.75, cab.position.z + 1.0);
      if (this.t > 14) this.finish();
    },
    action() {},
    finish() {
      mini = null; player.position.set(WHEEL_SPOT.x, 0, WHEEL_SPOT.z + 0.6); S.energy = Math.min(100, S.energy + 15);
      SFX.good(); toast(tr('🎡 What a ride! Energy +15', '🎡 భలే ఉంది! శక్తి +15'), 'good'); updatePrompt();
    },
  };
  updatePrompt();
}

// Season colours and festival decorations for today
function applyDay() {
  const se = season(), f = festival(), id = f && f.id;
  groundMat.color.set(se.ground);
  fest.all.visible = !!f;
  fest.muggulu.visible = id === 'sankranti' || id === 'deepavali';
  fest.kites.visible = id === 'sankranti';
  myKite.visible = kiteString.visible = id === 'sankranti' && !!S.done.fest;
  fest.pandal.visible = id === 'chavithi';
  pandalCollider.r = id === 'chavithi' ? 1.9 : -9;
  fest.diyas.visible = id === 'deepavali';
  cow.userData.deco.visible = id === 'sankranti';
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
  if ((x > -30.5 && x < -13.5 && z > -24.5 && z < -11.5) || Math.hypot(x + 24, z + 4) < 5.5 || (Math.abs(x - 22) < 4.5 && Math.abs(z - 22) < 4.5)) continue; // keep the pond and the pen clear
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
  thunder: () => { noise(2.2, 0.5, 70); setTimeout(() => noise(1.4, 0.3, 110), 250); },
  jingle: () => { tone(2600, 0.1, 'triangle', 0.025); setTimeout(() => tone(3100, 0.08, 'triangle', 0.02), 70); },
  talk: () => { tone(520, 0.07, 'triangle', 0.04); setTimeout(() => tone(620, 0.07, 'triangle', 0.04), 80); },
};
// Steady rain hiss: a looping noise buffer whose volume follows the rain
let rainSnd = null;
function rainSound(level) {
  if (!actx || !S.sound) level = 0;
  if (!rainSnd && level > 0.01) {
    try {
      const c = ac(), b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = b; s.loop = true; f.type = 'lowpass'; f.frequency.value = 1500; g.gain.value = 0;
      s.connect(f).connect(g).connect(c.destination); s.start();
      rainSnd = { g };
    } catch (e) { return; }
  }
  if (rainSnd) rainSnd.g.gain.setTargetAtTime(level * 0.1, actx.currentTime, 0.4);
}
let ambientAcc = 0;
function ambient(dt) {
  ambientAcc -= dt;
  if (ambientAcc > 0 || !actx) return;
  ambientAcc = rand(1.5, 4);
  const h = S.time / 60;
  if (h > 6 && h < 18.5) { const f = rand(2200, 3400); tone(f, 0.08, 'sine', 0.02, 1.3); setTimeout(() => tone(f * 1.1, 0.06, 'sine', 0.015, 1.2), 120); }
  else {
    for (let i = 0; i < 3; i++) setTimeout(() => tone(4200, 0.03, 'square', 0.006), i * 60);
    const r = Math.random();
    if (r < 0.15) { tone(420, 0.35, 'sine', 0.03, 0.85); setTimeout(() => tone(380, 0.5, 'sine', 0.03, 0.8), 450); } // owl
    else if (r < 0.45 && Math.hypot(player.position.x - POND.x, player.position.z - POND.z) < 16) for (let i = 0; i < 2; i++) setTimeout(() => tone(140, 0.12, 'square', 0.02, 1.4), i * 180); // frogs
  }
}

/* ============================== UI ==================================== */
function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type; t.textContent = msg;
  $('toasts').appendChild(t);
  while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
  setTimeout(() => t.remove(), 3200);
}
const INV_ORDER = [['water', '💧'], ['wood', '🪵'], ['tea', '🌿'], ['seed', '🌱'], ['milk', '🥛'], ['egg', '🥚'], ['veg', '🍅'], ['brinjal', '🍆'], ['chilli', '🌶️'], ['corn', '🌽'], ['gmilk', '🐐'], ['fodder', '🌾'], ['ricebag', '🍚'], ['sapling', '🪴'], ['letter', '✉️'], ['fish', '🐟'], ['bigfish', '🐠'], ['rod', '🎣'], ['ball', '⚽'], ['kite', '🪁'], ['fireworks', '🎆'], ['bowl', '🥣'], ['flower', '🌼'], ['chai', '🍵']];
let invShown = '';
function renderInventory(changed) {
  const count = k => k === 'seed' ? Object.values(S.seeds).reduce((a, b) => a + b, 0) : S.inv[k];
  const html = INV_ORDER.filter(([k]) => count(k) > 0).map(([k]) => `<div class="inv ${k === changed ? 'pop' : ''}">${ico(k)}${count(k)}</div>`).join('');
  if (html !== invShown || changed) { $('inventory').innerHTML = html; invShown = html; }
}
const TASKS = [
  ['water', ['Fetch water from the well', 'బావి నుంచి నీళ్ళు తేవాలి']],
  ['wood', ['Collect firewood', 'కట్టెలు తేవాలి']],
  ['chai', ['Make chai on the chulha', 'పొయ్యి మీద చాయ్ చేయాలి']],
  ['eggs', ['Collect 3 eggs from the coop', 'కోళ్ల గూడు నుంచి 3 గుడ్లు']],
  ['milk', ['Milk the cow', 'ఆవు పాలు పితకాలి']],
  ['farm', ['Work on the farm (plant / water / harvest)', 'పొలం పని (నాటు / నీళ్ళు / కోత)']],
  ['sell', ['Sell at the kirana shop', 'కిరాణా షాప్‌లో అమ్మాలి']],
  ['pray', ['Pray at the temple', 'గుడిలో దండం పెట్టాలి']],
];
let tasksOpen = !IS_TOUCH;
function renderTasks() {
  const el = $('tasks');
  el.classList.toggle('hidden', !tasksOpen);
  if (!tasksOpen) return;
  const se = season(), f = festival();
  el.innerHTML = `<h3>${tr(`Day ${S.day} · ${se.name[0]}`, `రోజు ${S.day} · ${se.name[1]}`)}</h3>` +
    (isSantaDay() ? `<div class="fest-line">🎡 ${tr('Sunday santa near the temple, 8 AM – 6 PM', 'ఆదివారం సంత: గుడి దగ్గర, ఉ. 8 – సా. 6')}</div>` : '') +
    (f ? `<div class="fest-line">${ico(f.icon)} ${tr(`Happy ${f.name[0]}!`, `${f.name[1]} శుభాకాంక్షలు!`)}</div>` : '') +
    todayTasks().map(([id, t]) => `<div class="task ${S.done[id] ? 'done' : ''}"><span class="box">${S.done[id] ? '✓' : ''}</span>${tr(...t)}</div>`).join('');
}
// Stats and achievements
function stat(k, n = 1) { S.stats[k] = (S.stats[k] || 0) + n; }
const stv = k => S.stats[k] || 0;
const ACHIEVEMENTS = [
  { id: 'chai1', e: '🍵', n: ['First chai', 'మొదటి చాయ్'], d: ['Drink a cup of chai', 'ఒక కప్పు చాయ్ తాగండి'], p: () => [stv('chai'), 1], r: 10 },
  { id: 'water50', e: '💧', n: ['Water carrier', 'నీళ్ళ మోత'], d: ['Draw 50 pots of water', '50 బిందెల నీళ్ళు తోడండి'], p: () => [stv('water'), 50], r: 30 },
  { id: 'wood50', e: '🪵', n: ['Woodcutter', 'కట్టెలు కొట్టేవాడు'], d: ['Collect 50 firewood', '50 కట్టెలు తీసుకోండి'], p: () => [stv('wood'), 50], r: 30 },
  { id: 'crops50', e: '🧺', n: ['Green fingers', 'పంటల మాస్టర్'], d: ['Harvest 50 vegetables', '50 కూరగాయలు కోయండి'], p: () => [stv('crops'), 50], r: 40 },
  { id: 'rice', e: '🍚', n: ['Rice farmer', 'వరి రైతు'], d: ['Harvest the paddy field', 'వరి పొలం కోత కోయండి'], p: () => [stv('rice'), 6], r: 30 },
  { id: 'eggs50', e: '🥚', n: ['Egg basket', 'గుడ్ల బుట్ట'], d: ['Collect 50 eggs', '50 గుడ్లు ఏరండి'], p: () => [stv('eggs'), 50], r: 30 },
  { id: 'milk30', e: '🥛', n: ['Milkman', 'పాలవాడు'], d: ['Get 30 milk from your animals', 'పశువుల నుంచి 30 పాలు'], p: () => [stv('milk'), 30], r: 30 },
  { id: 'fish10', e: '🐟', n: ['Fisher', 'జాలరి'], d: ['Catch 10 fish', '10 చేపలు పట్టండి'], p: () => [stv('fish'), 10], r: 30 },
  { id: 'bigfish', e: '🐠', n: ['The big one', 'పెద్ద చేప'], d: ['Catch a big fish', 'ఒక పెద్ద చేప పట్టండి'], p: () => [stv('bigfish'), 1], r: 20 },
  { id: 'six', e: '🏏', n: ['Sixer!', 'సిక్సర్!'], d: ['Hit a six', 'ఒక సిక్స్ కొట్టండి'], p: () => [stv('sixes'), 1], r: 20 },
  { id: 'cricket', e: '🏆', n: ['Beat Chintu', 'చింటుని ఓడించు'], d: ['Win a cricket match', 'క్రికెట్ మ్యాచ్ గెలవండి'], p: () => [stv('cricketWins'), 1], r: 30 },
  { id: 'earn1000', e: '🪙', n: ['Trader', 'వ్యాపారి'], d: ['Earn ₹1000 from sales', 'అమ్మకాలతో ₹1000 సంపాదించండి'], p: () => [stv('earned'), 1000], r: 50 },
  { id: 'town5', e: '🐂', n: ['Town regular', 'పట్నం ప్రయాణికుడు'], d: ['Make 5 town market trips', '5 సార్లు పట్నం సంతకి వెళ్ళండి'], p: () => [stv('town'), 5], r: 40 },
  { id: 'fests', e: '🪔', n: ['Festival lover', 'పండుగల ప్రియుడు'], d: ['Celebrate all 4 festivals', '4 పండుగలూ జరుపుకోండి'], p: () => [['deepavali', 'sankranti', 'ugadi', 'chavithi'].filter(k => stv('fest_' + k)).length, 4], r: 100 },
  { id: 'helper', e: '🤝', n: ['Village helper', 'ఊరి సహాయకుడు'], d: ['Finish 10 villager quests', '10 ఊరి పనులు పూర్తి చేయండి'], p: () => [stv('quests'), 10], r: 50 },
  { id: 'stories', e: '🔥', n: ['Story listener', 'కథల ప్రియుడు'], d: ['Hear all 6 bonfire stories', 'మంట దగ్గర 6 కథలూ వినండి'], p: () => [S.storiesHeard, 6], r: 30 },
  { id: 'pakka', e: '🏠', n: ['Pakka illu', 'పక్కా ఇల్లు'], d: ['Build a concrete house', 'పక్కా ఇల్లు కట్టండి'], p: () => [S.home.level, 2], r: 50 },
  { id: 'herd', e: '🐃', n: ['Full pen', 'నిండు దొడ్డి'], d: ['Own a goat, a buffalo and ducks', 'మేక, బర్రె, బాతులు ఉండాలి'], p: () => [(S.animals.goat ? 1 : 0) + (S.animals.buffalo ? 1 : 0) + (S.animals.ducks ? 1 : 0), 3], r: 50 },
  { id: 'village', e: '🏅', n: ['Best Village', 'ఉత్తమ గ్రామం'], d: ['Finish the sarpanch\'s story', 'సర్పంచ్ గారి కథ పూర్తి చేయండి'], p: () => [S.story.step, 4], r: 50 },
  { id: 'year', e: '📅', n: ['One village year', 'ఒక పల్లె సంవత్సరం'], d: ['Live through all 21 days of a year', '21 రోజుల సంవత్సరం గడపండి'], p: () => [S.day - 1, 21], r: 100 },
];
function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (S.ach[a.id]) continue;
    const [have, need] = a.p();
    if (have >= need) {
      S.ach[a.id] = true; S.money += a.r; SFX.good();
      toast(tr(`🏆 Achievement: ${a.e} ${a.n[0]}! +₹${a.r}`, `🏆 అచీవ్‌మెంట్: ${a.e} ${a.n[1]}! +₹${a.r}`), 'good');
    }
  }
}
function renderAchievements() {
  const got = ACHIEVEMENTS.filter(a => S.ach[a.id]).length;
  $('achBox').innerHTML = `<h3>🏆 ${tr('Achievements', 'అచీవ్‌మెంట్లు')} ${got}/${ACHIEVEMENTS.length}</h3>` +
    ACHIEVEMENTS.map(a => { const [h, n] = a.p(), done = S.ach[a.id];
      return `<div class="ach ${done ? 'done' : ''}"><span class="ach-e">${a.e}</span><div><b>${tr(...a.n)}</b><small>${tr(...a.d)} · ${done ? '✓' : `${Math.min(h, n)}/${n}`} · ₹${a.r}</small></div></div>`; }).join('') +
    `<p class="ach-stats">${tr('Days lived', 'గడిపిన రోజులు')}: ${S.day} · ${tr('Earned from sales', 'అమ్మకాల సంపాదన')}: ₹${stv('earned')} · ${tr('Fish', 'చేపలు')}: ${stv('fish')} · ${tr('Sixes', 'సిక్సులు')}: ${stv('sixes')}</p>`;
}
function todayTasks() { const f = festival(); return f ? [...TASKS, ['fest', f.task]] : TASKS; }
function completeTask(id) {
  if (S.done[id]) return;
  S.done[id] = true;
  renderTasks();
  if (id === 'fest') {
    const f = festival();
    stat('fest_' + f.id);
    S.money += 40; S.energy = Math.min(100, S.energy + 20); SFX.good();
    toast(tr(`${f.emoji} Happy ${f.name[0]}! Festival gift ₹40, energy +20`, `${f.emoji} ${f.name[1]} శుభాకాంక్షలు! పండుగ కానుక ₹40, శక్తి +20`), 'good');
  }
  if (todayTasks().every(([t]) => S.done[t])) {
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
  const sky = isRaining() ? (S.weather.storm ? 'storm' : 'rain') : h > 6 && h < 18.5 ? 'sun' : 'moon';
  $('clock').innerHTML = `${ico(sky)}${ico(season().icon)} ${tr('Day', 'రోజు')} ${S.day} · ${fmtTime()}`;
  $('money').innerHTML = `${ico('coin')} ₹${Math.floor(S.money)}`;
  $('energyFill').style.width = S.energy + '%';
  $('energyFill').classList.toggle('low', S.energy < 25);
}
function fmtHour(min) {
  const h = Math.floor(min / 60) % 24, h12 = ((h + 11) % 12) + 1;
  return isTe() ? `${h < 12 ? 'ఉ.' : 'సా.'} ${h12}` : `${h12} ${h < 12 ? 'AM' : 'PM'}`;
}

// Weather: some days bring rain (sometimes with thunder) for a few hours
function rollWeather(day) {
  if (day <= 1 || Math.random() > season(day).rain) return { rain: false };
  const start = Math.round(rand(9.5, 15) * 60);
  return { rain: true, start, end: start + Math.round(rand(80, 200)), storm: Math.random() < (season(day).id === 'monsoon' ? 0.5 : 0.2) };
}
function isRaining() { const w = S.weather; return !!(w && w.rain && S.time >= w.start && S.time < w.end); }

// Dialog panel used by the shop and by villagers
let panelOpen = false, panelOpts = [], panelTitle = '';
function openPanel({ icon, title, text, options = [] }) {
  panelOpen = true; panelTitle = title;
  if (document.pointerLockElement) document.exitPointerLock();
  panelOpts = [...options, { label: tr('Close', 'మూసివేయి'), fn: closePanel, close: true }];
  $('panel').innerHTML = `<div class="panel-head">${ico(icon)}<b>${title}</b></div><p>${text}</p><div class="panel-btns">` +
    panelOpts.map((o, i) => `<button data-act="pick" data-id="${i}" class="${o.close ? 'ghost' : ''}" ${o.disabled ? 'disabled' : ''}>${IS_TOUCH ? '' : `<kbd>${i + 1}</kbd>`}${o.label}</button>`).join('') + '</div>';
  $('panel').classList.remove('hidden');
  $('prompt').classList.add('hidden'); $('actBtn').classList.add('hidden');
}
function closePanel() {
  panelOpen = false;
  $('panel').classList.add('hidden');
  if (!IS_TOUCH && playing) lockPointer();
}
function pickOption(i) { const o = panelOpts[i]; if (o && !o.disabled) o.fn(); }

const PRICE = { egg: 8, milk: 25, veg: 12, brinjal: 15, chilli: 8, corn: 35, gmilk: 20, fish: 15, bigfish: 40, ricebag: 40 }; // everything the shop buys
function produceValue() { return Object.keys(PRICE).reduce((t, k) => t + (S.inv[k] || 0) * PRICE[k], 0); }
function sellAll(mult = 1) { const v = Math.round(produceValue() * mult); for (const k in PRICE) S.inv[k] = 0; S.money += v; stat('earned', v); return v; }
const VEG = ['veg', 'brinjal', 'chilli', 'corn'];
const vegCount = () => VEG.reduce((t, k) => t + S.inv[k], 0);
function takeVeg(n) { for (const k of VEG) while (n > 0 && S.inv[k] > 0) { S.inv[k]--; n--; } }
function openShop() {
  const value = produceValue(), f = festival();
  openPanel({
    icon: 'shop', title: tr('Kirana Shop', 'కిరాణా షాప్'),
    text: tr(`"Namaskaram! I buy eggs ₹${PRICE.egg}, milk ₹${PRICE.milk}, tomatoes ₹${PRICE.veg}, brinjal ₹${PRICE.brinjal}, chilli ₹${PRICE.chilli} and corn ₹${PRICE.corn}."`,
      `"నమస్కారం! గుడ్డు ₹${PRICE.egg}, పాలు ₹${PRICE.milk}, టమాటా ₹${PRICE.veg}, వంకాయ ₹${PRICE.brinjal}, మిరపకాయ ₹${PRICE.chilli}, మొక్కజొన్న ₹${PRICE.corn}."`),
    options: [
      { label: value ? tr(`Sell everything · ₹${value}`, `అన్నీ అమ్ము · ₹${value}`) : tr('Nothing to sell', 'అమ్మడానికి ఏమీ లేదు'), disabled: !value,
        fn: () => {
          sellAll();
          SFX.coin(); renderInventory(); completeTask('sell');
          toast(tr(`🪙 Sold for ₹${value}`, `🪙 ₹${value} కి అమ్మారు`), 'good');
          openShop();
        } },
      ...(S.inv.rod ? [] : [{ label: tr('🎣 Fishing rod · ₹40', '🎣 గాలం · ₹40'), disabled: S.money < 40,
        fn: () => { S.money -= 40; S.inv.rod = 1; SFX.coin(); renderInventory('rod'); toast(tr('🎣 Go fishing at the pond, west of the coop!', '🎣 కోళ్ల గూడు పడమర వైపు చెరువులో చేపలు పట్టండి!'), 'good'); openShop(); } }]),
      ...(S.paddy.stage < 0 && !S.inv.sapling ? [{ label: tr('🪴 Paddy saplings for the field · ₹30', '🪴 పొలానికి వరి నారు · ₹30'), disabled: S.money < 30,
        fn: () => { S.money -= 30; S.inv.sapling = 1; SFX.coin(); renderInventory('sapling'); openShop(); } }] : []),
      { label: tr('🌾 Fodder bundle · ₹5', '🌾 గడ్డి కట్ట · ₹5'), disabled: S.money < 5,
        fn: () => { S.money -= 5; S.inv.fodder++; SFX.coin(); renderInventory('fodder'); openShop(); } },
      { label: tr('Buy tea powder · ₹15', 'టీ పొడి కొను · ₹15'), disabled: S.money < 15,
        fn: () => { S.money -= 15; S.inv.tea++; SFX.coin(); renderInventory('tea'); openShop(); } },
      ...seasonCrops().map(k => { const c = CROPS[k]; return { label: `${c.emoji} ${tr(`6 ${c.name[0]} seeds`, `6 ${c.name[1]} విత్తనాలు`)} · ₹${c.seedPrice}`, disabled: S.money < c.seedPrice,
        fn: () => { S.money -= c.seedPrice; S.seeds[k] += 6; SFX.coin(); renderInventory('seed'); openShop(); } }; }),
      ...(f ? [{ label: `${f.emoji} ${tr(f.itemName[0], f.itemName[1])} · ₹${f.price}`, disabled: S.money < f.price || S.inv[f.item] > 0 || !!S.done.fest,
        fn: () => { S.money -= f.price; S.inv[f.item] = 1; SFX.coin(); renderInventory(f.item); openShop(); } }] : []),
    ],
  });
  renderHud();
}

// Home panel: sleep, watch TV, upgrade the house, buy furniture
function canSleep() { return S.time >= 19 * 60 || S.energy <= 20; }
function openHome() {
  const H = S.home, L = HOME_LEVELS[H.level], next = HOME_LEVELS[H.level + 1], h = S.time / 60;
  const perks = [L.perk, ...FURNITURE.filter(f => H[f.id]).map(f => f.perk)].filter(Boolean).map(p => '• ' + tr(...p));
  const options = [
    { label: canSleep() ? tr('🛏️ Sleep', '🛏️ నిద్రపో') : tr('🛏️ Sleep (after 7 PM or when tired)', '🛏️ నిద్ర (రాత్రి 7 తర్వాత / అలసినప్పుడు)'), disabled: !canSleep(),
      fn: () => { closePanel(); busy = { s: { label: () => tr('Sleep', 'నిద్రపో'), time: 1.2, done: sleep }, t: 0, total: 1.2, tickAcc: 0 }; $('progressLabel').textContent = tr('Sleeping…', 'నిద్ర…'); $('progress').classList.remove('hidden'); } },
  ];
  if (H.tv) options.push({ label: H.tvDay === S.day ? tr('📺 Already watched TV today', '📺 ఈ రోజు టీవీ చూశారు') : h < 17 ? tr('📺 TV shows start at 5 PM', '📺 టీవీ సాయంత్రం 5 నుంచి') : tr('📺 Watch TV (energy +20)', '📺 టీవీ చూడు (శక్తి +20)'),
    disabled: H.tvDay === S.day || h < 17,
    fn: () => { H.tvDay = S.day; S.energy = Math.min(100, S.energy + 20); S.time += 30; tvGlow = 6; SFX.good(); toast(tr('📺 A fun Telugu movie song! Energy +20', '📺 సరదా తెలుగు సినిమా పాట! శక్తి +20'), 'good'); openHome(); } });
  if (next) options.push({ label: `🏠 ${tr('Upgrade to', 'అప్‌గ్రేడ్:')} ${tr(...next.name)} · ₹${next.price}`, disabled: S.money < next.price,
    fn: () => { S.money -= next.price; H.level++; applyHome(); fade(); SFX.good(); toast(tr(`🏠 New home: ${next.name[0]}!`, `🏠 కొత్త ఇల్లు: ${next.name[1]}!`), 'good'); renderHud(); save(); openHome(); } });
  for (const f of FURNITURE) if (!H[f.id]) options.push({ label: `${f.emoji} ${tr('Buy', 'కొను:')} ${tr(...f.name)} · ₹${f.price}`, disabled: S.money < f.price,
    fn: () => { S.money -= f.price; H[f.id] = true; applyHome(); SFX.coin(); toast(`${f.emoji} ${tr(...f.perk)}`, 'good'); renderHud(); save(); openHome(); } });
  openPanel({ icon: 'home', title: tr(...L.name), text: perks.length ? perks.join('<br>') : tr('A simple hut. Earn money to make it better!', 'చిన్న గుడిసె. డబ్బు సంపాదించి బాగు చేసుకోండి!'), options });
}
let tvGlow = 0, radioAcc = 4, hudSanta = 0;
// The radio plays a short folk tune now and then while you are near home
const TUNE = [523, 587, 659, 784, 880, 1047];
function updateHome(dt) {
  if (S.home.fan) homeUp.blades.rotation.y += dt * 9;
  const h = S.time / 60;
  if (homeUp.tv.visible) {
    tvGlow = Math.max(0, tvGlow - dt);
    const on = tvGlow > 0 || (h >= 18 && h < 22);
    homeUp.screen.material.color.setHSL(on ? (performance.now() / 1500) % 1 : 0.6, on ? 0.5 : 0.2, on ? 0.45 + Math.random() * 0.1 : 0.12);
  }
  if (S.home.radio && playing && h > 6 && h < 21 && Math.hypot(player.position.x, player.position.z - 2) < 9) {
    radioAcc -= dt;
    if (radioAcc <= 0) {
      radioAcc = rand(6, 10);
      for (let i = 0; i < 6; i++) setTimeout(() => tone(TUNE[Math.floor(Math.random() * TUNE.length)], 0.22, 'triangle', 0.025), i * 230);
    }
  }
}
// Santa tools stall: permanent upgrades
function openTools() {
  const T = S.tools, options = [];
  options.push({ label: T.pot ? tr('🏺 Big water pot (bought)', '🏺 పెద్ద బిందె (కొన్నారు)') : tr('🏺 Big water pot: carry 4 water · ₹60', '🏺 పెద్ద బిందె: 4 నీళ్ళు · ₹60'), disabled: T.pot || S.money < 60,
    fn: () => { S.money -= 60; T.pot = true; SFX.coin(); renderHud(); openTools(); } });
  options.push({ label: T.axe ? tr('🪓 Sharp axe (bought)', '🪓 పదునైన గొడ్డలి (కొన్నారు)') : tr('🪓 Sharp axe: faster, carry 5 wood · ₹50', '🪓 పదునైన గొడ్డలి: వేగంగా, 5 కట్టెలు · ₹50'), disabled: T.axe || S.money < 50,
    fn: () => { S.money -= 50; T.axe = true; SFX.coin(); renderHud(); openTools(); } });
  openPanel({ icon: 'axe', title: tr('Pots & tools', 'కుండలు • పనిముట్లు'), text: tr('"Good things last for years! Only on Sundays."', '"మంచి వస్తువులు ఏళ్ళు ఉంటాయి! ఆదివారం మాత్రమే."'), options });
}
// Animal pen: feed, milk and buy animals
function openPen() {
  const A = S.animals, fed = A.fedDay === S.day, grazers = A.goat + A.buffalo;
  const lines = [
    `🐐 ${tr('Goats', 'మేకలు')}: ${A.goat}  ·  🐃 ${tr('Buffalo', 'బర్రె')}: ${A.buffalo}  ·  🦆 ${tr('Ducks', 'బాతులు')}: ${A.ducks ? 3 : 0}`,
    grazers ? (fed ? tr('✅ Fed today', '✅ ఈ రోజు మేత వేశారు') : tr('Feed them with a fodder bundle (shop) before milking.', 'పాలు పితికే ముందు మేత (గడ్డి కట్ట) వేయండి. గడ్డి షాప్‌లో దొరుకుతుంది.')) : tr('Buy animals for milk every day!', 'రోజూ పాల కోసం పశువులను కొనండి!'),
  ];
  const options = [];
  if (grazers && !fed) options.push({ label: S.inv.fodder ? tr('🌾 Feed the animals', '🌾 మేత వేయి') : tr('🌾 Feed (need fodder from the shop)', '🌾 మేత (షాప్‌లో గడ్డి కొనండి)'), disabled: !S.inv.fodder,
    fn: () => { S.inv.fodder--; A.fedDay = S.day; trough.hay.visible = true; SFX.good(); renderInventory(); toast(tr('🌾 The animals are happy and full!', '🌾 పశువులు కడుపు నిండా తిన్నాయి!'), 'good'); openPen(); } });
  if (A.goat && fed && A.goatDay !== S.day) options.push({ label: tr(`🐐 Milk the goats (+${A.goat})`, `🐐 మేక పాలు పితుకు (+${A.goat})`),
    fn: () => { A.goatDay = S.day; S.inv.gmilk += A.goat; stat('milk', A.goat); SFX.good(); renderInventory('gmilk'); openPen(); } });
  if (A.buffalo && fed && A.buffaloDay !== S.day) options.push({ label: tr('🐃 Milk the buffalo (+2 milk)', '🐃 బర్రె పాలు పితుకు (+2 పాలు)'),
    fn: () => { A.buffaloDay = S.day; S.inv.milk += 2; stat('milk', 2); SFX.moo(); renderInventory('milk'); openPen(); } });
  for (const [k, a] of Object.entries(ANIMALS)) {
    const have = k === 'ducks' ? A.ducks : A[k];
    if (have < a.max) options.push({ label: `${a.emoji} ${tr('Buy', 'కొను:')} ${tr(...a.name)} · ₹${a.price}`, disabled: S.money < a.price,
      fn: () => { S.money -= a.price; A[k]++; spawnAnimals(); SFX.coin(); renderHud(); toast(`${a.emoji} ${tr(`New ${a.name[0]} at home!`, `కొత్త ${a.name[1]} వచ్చింది!`)}`, 'good'); save(); openPen(); } });
  }
  openPanel({ icon: 'goat', title: tr('Animal pen', 'పశువుల దొడ్డి'), text: lines.join('<br>'), options });
}
// What each villager says, depending on their quest
const FARM_TIPS = [
  ['Keep the paddy field flooded from the canal every day. In five days it turns golden: 6 bags of rice and straw for your animals!', 'వరి పొలానికి రోజూ కాలువ నీళ్ళు పెట్టు. ఐదు రోజుల్లో బంగారు రంగు: 6 బస్తాల బియ్యం, పశువులకు గడ్డి!'],
  ['Water your plants every day. They only grow on days they got water.', 'మొక్కలకు రోజూ నీళ్ళు పోయి బాబు. నీళ్ళు పోసిన రోజే పెరుగుతాయి.'],
  ['When it rains, the sky waters your farm for free!', 'వర్షం పడితే నీ పొలానికి దేవుడే నీళ్ళు పోస్తాడు!'],
  ['Each season has its own crops: winter tomato and brinjal, summer chilli, monsoon corn. Seeds are at the kirana shop.', 'ప్రతి కాలానికి వేరే పంట: చలికాలం టమాటా, వంకాయ; ఎండాకాలం మిరపకాయ; వర్షాకాలం మొక్కజొన్న. విత్తనాలు కిరాణా షాప్‌లో.'],
  ['Three watered days and the tomatoes turn red. Corn needs four. Then harvest!', 'మూడు రోజులు నీళ్ళు పోస్తే టమాటాలు ఎర్రబడతాయి. మొక్కజొన్నకి నాలుగు రోజులు. అప్పుడు కోయి!'],
];
const PROVERBS = [
  ['"Rain on time, crops on time: that is a happy village."', '"సమయానికి వాన, సమయానికి పంట — అదే సంతోషమైన పల్లె."'],
  ['"Work in the morning, rest under the tree in the afternoon. That is life, babu."', '"పొద్దున పని, మధ్యాహ్నం చెట్టు కింద విశ్రాంతి. అదే జీవితం బాబు."'],
];
let tipIdx = 0;
const LESSONS = [
  ['📚 You taught the Telugu alphabet: అ ఆ ఇ ఈ!', '📚 తెలుగు అక్షరాలు నేర్పారు: అ ఆ ఇ ఈ!'],
  ['📚 You taught counting to 10: ఒకటి, రెండు, మూడు…', '📚 పది వరకు లెక్కలు నేర్పారు: ఒకటి, రెండు, మూడు…'],
  ['📚 You read a Panchatantra story about the clever rabbit.', '📚 తెలివైన కుందేలు పంచతంత్ర కథ చదివి వినిపించారు.'],
  ['📚 You taught why we should save water.', '📚 నీళ్ళు ఎందుకు పొదుపు చేయాలో నేర్పారు.'],
];
const GOSSIP = [
  ['"Did you hear? Big fish bite in the pond by the coop. Buy a rod at the kirana shop!"', '"విన్నావా? కోళ్ల గూడు దగ్గర చెరువులో పెద్ద చేపలు పడుతున్నాయి. కిరాణా షాప్‌లో గాలం కొను!"'],
  ['"Chintu says nobody can score 12 runs off his bowling. Prove him wrong!"', '"తన బౌలింగ్‌లో 12 పరుగులు ఎవరూ కొట్టలేరని చింటు అంటున్నాడు. చూపించు!"'],
  ['"The town market pays one and a half times. Take your produce in the bullock cart."', '"పట్నం సంతలో ఒకటిన్నర రెట్లు ఇస్తారు. ఎడ్ల బండిలో సరుకు తీసుకెళ్ళు."'],
  ['"The sarpanch wants to make our village the best in the district. Go and help him."', '"సర్పంచ్ గారు మన ఊరిని జిల్లాలోనే బెస్ట్ చేయాలనుకుంటున్నారు. వెళ్ళి సాయం చెయ్."'],
  ['"A buffalo gives two milk a day, if you feed her. Straw from the paddy field is free fodder!"', '"మేత వేస్తే బర్రె రోజుకు రెండు పాలు ఇస్తుంది. వరి గడ్డి ఉచిత మేత!"'],
];
// The sarpanch's village development story, one step at a time
function sarpanchTalk(v) {
  const st = S.story.step, done = () => { S.story.step++; stat('quests'); applyStory(); SFX.good(); renderInventory(); renderHud(); save(); openTalk(v); };
  const T = [
    { text: ['"Our school has no benches; the children sit on the floor. Bring me 3 logs of firewood for the carpenter."', '"మన బడిలో బెంచీలు లేవు, పిల్లలు నేల మీద కూర్చుంటున్నారు. వడ్రంగికి 3 కట్టెలు తెచ్చివ్వు."'],
      ok: () => S.inv.wood >= 3, give: ['🪵 Give 3 firewood', '🪵 3 కట్టెలు ఇవ్వు'],
      done: () => { S.inv.wood -= 3; S.money += 30; toast(tr('🏫 New benches for the school! ₹30 from the panchayat.', '🏫 బడికి కొత్త బెంచీలు! పంచాయతీ నుంచి ₹30.'), 'good'); } },
    { text: ['"The old temple bell cracked. Will you donate ₹100 for a new one?"', '"గుడి గంట పగిలిపోయింది. కొత్త గంటకు ₹100 విరాళం ఇస్తావా?"'],
      ok: () => S.money >= 100, give: ['🔔 Donate ₹100', '🔔 ₹100 విరాళం'],
      done: () => { S.money -= 100; toast(tr('🔔 The new bell rings at the temple! Praying now gives more energy.', '🔔 గుడిలో కొత్త గంట! ఇప్పుడు దండం పెడితే ఎక్కువ శక్తి.'), 'good'); } },
    { text: ['"We need street lights on the main road. Bring 4 bags of rice from your paddy field to raise the money."', '"మెయిన్ రోడ్డు మీద వీధి దీపాలు కావాలి. డబ్బు కోసం మీ వరి పొలం నుంచి 4 బస్తాల బియ్యం తీసుకురా."'],
      ok: () => S.inv.ricebag >= 4, give: ['🍚 Give 4 bags of rice', '🍚 4 బస్తాల బియ్యం ఇవ్వు'],
      done: () => { S.inv.ricebag -= 4; S.money += 50; toast(tr('💡 Street lights on the main road! ₹50 left over for you.', '💡 మెయిన్ రోడ్డుకి వీధి దీపాలు! మిగిలిన ₹50 మీకు.'), 'good'); } },
    { text: ['"Last step: the inspectors visit soon. Clean up the 5 litter piles around the village and come back."', '"చివరి పని: ఇన్‌స్పెక్టర్లు త్వరలో వస్తారు. ఊరిలో ఉన్న 5 చెత్త కుప్పలు శుభ్రం చేసి రా."'],
      ok: () => S.story.litter.every(Boolean), give: ['🧹 All clean!', '🧹 అంతా శుభ్రం!'],
      done: () => { S.money += 200; toast(tr('🏆 Mana Palle is the Best Village of the district! ₹200 award.', '🏆 మన పల్లె జిల్లాలోనే ఉత్తమ గ్రామం! ₹200 బహుమతి.'), 'good'); fade(); } },
  ];
  if (st >= T.length) return { text: tr('"Best Village of the district, thanks to you! The whole village is proud."', '"మీ వల్లే జిల్లాలో ఉత్తమ గ్రామం! ఊరంతా గర్వపడుతోంది."'), options: [] };
  const q = T[st], litterLeft = S.story.litter.filter(x => !x).length;
  let text = tr(...q.text);
  if (st === 3) text += tr(` (${litterLeft} left)`, ` (${litterLeft} మిగిలాయి)`);
  return { text: `<b>${tr(`Village story ${st + 1}/4`, `ఊరి కథ ${st + 1}/4`)}</b><br>${text}`, options: [{ label: tr(...q.give), disabled: !q.ok(), fn: () => { q.done(); done(); } }] };
}
function openTalk(v) {
  SFX.talk();
  const name = tr(v.names[1], v.names[0]);
  const Q = S.quests;
  let text = '', options = [];
  if (v.id === 'ram') {
    if (Q.ram === 'new') {
      text = tr('"Orey babu! My knees hurt and I can\'t go to the market. Bring me 2 vegetables from your farm and I\'ll give you ₹40."',
        '"ఒరేయ్ బాబు! మోకాళ్ళ నొప్పి, సంతకి వెళ్ళలేను. నీ పొలం నుంచి 2 కూరగాయలు తెచ్చి పెట్టు, ₹40 ఇస్తాను."');
      options = [{ label: tr('Sure, tatha!', 'సరే తాతా!'), fn: () => { Q.ram = 'active'; toast(tr('📜 Quest: 2 vegetables for Ramayya', '📜 పని: రామయ్య తాతకి 2 కూరగాయలు')); openTalk(v); } }];
    } else if (Q.ram === 'active') {
      text = vegCount() >= 2 ? tr('"Ah, fresh vegetables! Give them here."', '"ఆహా, తాజా కూరగాయలు! ఇటివ్వు."')
        : tr('"Still waiting for 2 vegetables, babu. Grow them on the farm next to the well."', '"ఇంకా 2 కూరగాయల కోసం చూస్తున్నా బాబు. బావి పక్కన పొలంలో పండించు."');
      if (vegCount() >= 2) options = [{ label: tr('Give 2 vegetables', '2 కూరగాయలు ఇవ్వు'), fn: () => {
        takeVeg(2); S.money += 40; Q.ram = 'done'; stat('quests'); SFX.coin(); renderInventory(); renderHud();
        toast(tr('🎉 Ramayya gave you ₹40!', '🎉 రామయ్య తాత ₹40 ఇచ్చారు!'), 'good'); openTalk(v); } }];
    } else text = tr(...PROVERBS[S.day % PROVERBS.length]);
  } else if (v.id === 'lak') {
    if (Q.lak === 'new') {
      text = tr('"Ayyo, my calf drank all our milk today! Can you bring me 1 milk? I\'ll give you ₹35."',
        '"అయ్యో, మా దూడ ఈ రోజు పాలన్నీ తాగేసింది! ఒక్క పాలు తెచ్చిస్తావా? ₹35 ఇస్తాను."');
      options = [{ label: tr('I\'ll bring it, akka', 'తెస్తాను అక్కా'), fn: () => { Q.lak = 'active'; toast(tr('📜 Quest: 1 milk for Lakshmi', '📜 పని: లక్ష్మి అక్కకి పాలు')); openTalk(v); } }];
    } else if (Q.lak === 'active') {
      text = S.inv.milk ? tr('"You brought milk? Thank god!"', '"పాలు తెచ్చావా? దేవుడి దయ!"')
        : tr('"Milk your cow near the house and bring me some, please."', '"మీ ఇంటి దగ్గర ఆవు పాలు పితికి తెచ్చిపెట్టు."');
      if (S.inv.milk) options = [{ label: tr('Give 1 milk', 'పాలు ఇవ్వు'), fn: () => {
        S.inv.milk--; S.money += 35; Q.lak = 'done'; stat('quests'); SFX.coin(); renderInventory(); renderHud();
        toast(tr('🎉 Lakshmi gave you ₹35!', '🎉 లక్ష్మి అక్క ₹35 ఇచ్చారు!'), 'good'); openTalk(v); } }];
    } else text = tr('"Thank you! Come home for Sankranti, I\'ll make ariselu for you."', '"థాంక్యూ! సంక్రాంతికి మా ఇంటికి రా, అరిసెలు చేసి పెడతా."');
  } else if (v.id === 'chintu') {
    if (Q.ball === 'new') {
      text = tr('"Anna! I hit a six and lost my cricket ball! Will you find it for me?"', '"అన్నా! సిక్స్ కొట్టాను, నా క్రికెట్ బంతి పోయింది! వెతికి పెడతావా?"');
      options = [{ label: tr('Let\'s find it!', 'వెతుకుదాం!'), fn: () => {
        Q.ball = 'active'; S.ballSpot = Math.floor(Math.random() * BALL_SPOTS.length); placeBall();
        toast(tr('📜 Quest: find Chintu\'s ball', '📜 పని: చింటు బంతి వెతకాలి')); openTalk(v); } }];
    } else if (Q.ball === 'active') {
      const hint = BALL_SPOTS[S.ballSpot % BALL_SPOTS.length][2];
      text = S.inv.ball ? tr('"My ball! You found it!"', '"నా బంతి! దొరికిందా!"')
        : tr(`"I think it went ${hint[0]}."`, `"${hint[1]} పడింది అనుకుంటా."`);
      if (S.inv.ball) options = [{ label: tr('Give the ball', 'బంతి ఇవ్వు'), fn: () => {
        S.inv.ball = 0; S.money += 10; S.energy = Math.min(100, S.energy + 10); Q.ball = 'done'; stat('quests'); SFX.good(); renderInventory(); renderHud();
        toast(tr('🎉 Chintu gave you ₹10 and a big smile! Energy +10', '🎉 చింటు ₹10 ఇచ్చాడు! శక్తి +10'), 'good'); openTalk(v); } }];
    } else text = tr('"Thanks anna! Want to play cricket?"', '"థాంక్స్ అన్నా! క్రికెట్ ఆడదామా?"');
    if (S.cricketDay !== S.day && S.time < 18 * 60) options.push({ label: tr('🏏 Play cricket (score 12 in 6 balls)', '🏏 క్రికెట్ ఆడు (6 బాల్స్‌లో 12 పరుగులు)'), fn: () => { closePanel(); startCricket(); } });
    else if (S.cricketDay === S.day) text += tr(' "Good game today!"', ' "ఈ రోజు మంచి ఆట!"');
  } else if (v.id === 'sar') ({ text, options } = sarpanchTalk(v));
  else if (v.id === 'teacher') {
    text = tr('"Namaste! The children love visitors. Come to the school front between 9 AM and 4 PM and help me teach. The school pays ₹20."', '"నమస్తే! పిల్లలకు కొత్తవాళ్ళు వస్తే ఇష్టం. ఉ. 9 – సా. 4 మధ్య బడి ముందుకు వచ్చి పాఠం చెప్పడంలో సాయం చేయండి. బడి ₹20 ఇస్తుంది."');
    if (S.teachDay === S.day) text = tr('"Thank you for today\'s class! The children are still talking about it."', '"ఈ రోజు క్లాస్‌కి థాంక్స్! పిల్లలు ఇంకా దాని గురించే మాట్లాడుకుంటున్నారు."');
  } else if (v.id === 'post') {
    const P = S.post;
    if (P.day !== S.day) {
      text = tr('"Namaskaram! I have one letter left today. Can you deliver it for me? ₹15 for your trouble."', '"నమస్కారం! ఈ రోజు ఒక ఉత్తరం మిగిలింది. మీరు ఇచ్చి వస్తారా? ₹15 ఇస్తాను."');
      options = [{ label: tr('✉️ Take the letter', '✉️ ఉత్తరం తీసుకో'), fn: () => {
        const who = villagers.filter(o => !['post', 'chintu'].includes(o.id)); const to = who[Math.floor(Math.random() * who.length)];
        Object.assign(P, { day: S.day, to: to.id, done: false }); S.inv.letter = 1; renderInventory('letter');
        toast(tr(`✉️ Deliver the letter to ${to.names[1]}`, `✉️ ఉత్తరం ${to.names[0]}కి ఇవ్వండి`)); openTalk(v); } }];
    } else if (!P.done) {
      const to = villagers.find(o => o.id === P.to);
      text = tr(`"The letter is for ${to.names[1]}. Thank you!"`, `"ఉత్తరం ${to.names[0]}కి. థాంక్యూ!"`);
    } else text = tr('"All letters delivered. See you tomorrow!"', '"అన్ని ఉత్తరాలు అందాయి. రేపు కలుద్దాం!"');
  } else if (v.id === 'chai') {
    const C = S.chaiStall; if (C.day !== S.day) Object.assign(C, { day: S.day, n: 0 });
    text = tr(...GOSSIP[(S.day + C.n) % GOSSIP.length]);
    options = [{ label: C.n >= 3 ? tr('🍵 Stall is out of milk for today', '🍵 ఈ రోజుకి పాలు అయిపోయాయి') : tr('🍵 One chai · ₹10 (energy +30)', '🍵 ఒక చాయ్ · ₹10 (శక్తి +30)'), disabled: C.n >= 3 || S.money < 10,
      fn: () => { S.money -= 10; C.n++; stat('chai'); S.energy = Math.min(100, S.energy + 30); SFX.good(); renderHud(); toast(tr('🍵 Hot chai! Energy +30', '🍵 వేడి చాయ్! శక్తి +30'), 'good'); openTalk(v); } }];
  } else {
    text = tr(...FARM_TIPS[tipIdx % FARM_TIPS.length]);
    options = [{ label: tr('Another tip', 'ఇంకో సలహా'), fn: () => { tipIdx++; openTalk(v); } }];
  }
  // Anyone can be the one the postman's letter is for
  if (S.post.to === v.id && S.inv.letter && S.post.day === S.day) options.unshift({ label: tr('✉️ Give the letter', '✉️ ఉత్తరం ఇవ్వు'), fn: () => {
    S.inv.letter = 0; S.post.done = true; S.money += 15; stat('quests'); SFX.coin(); renderInventory(); renderHud();
    toast(tr('✉️ Letter delivered! ₹15 from the postman.', '✉️ ఉత్తరం అందింది! పోస్ట్‌మ్యాన్ నుంచి ₹15.'), 'good'); openTalk(v); } });
  openPanel({ icon: v.icon, title: name, text, options });
}

/* ============================== INTERACTIONS ========================== */
// The farm does one thing at a time: harvest ripe plots, else plant empty ones, else water dry ones
function farmAction() {
  const F = S.farm;
  const ripe = F.filter(isRipe).length, empty = F.filter(p => p.stage < 0).length;
  const dry = F.filter(p => isGrowing(p) && !p.watered).length;
  const idle = (need) => ({ id: 'none', label: tr('Farm', 'పొలం'), need, time: 0 });
  const usable = seasonCrops().filter(k => S.seeds[k] > 0);
  if (ripe) return { id: 'harvest', label: tr(`Harvest (${ripe} plots)`, `పంట కోయి (${ripe} మడులు)`), need: '', time: 1.8 };
  if (empty && usable.length) return { id: 'plant', label: tr('Plant seeds', 'విత్తనాలు నాటు'), need: '', time: usable.length > 1 ? 0.2 : 2, choose: usable.length > 1, usable };
  if (dry) return { id: 'water', label: tr('Water the crops', 'మొక్కలకు నీళ్ళు పోయి'), need: S.inv.water ? '' : tr('Need water (well)', 'నీళ్ళు కావాలి (బావి)'), time: 2 };
  if (empty === F.length) return idle(Object.values(S.seeds).some(n => n) ? tr(`These seeds don't grow in ${season().name[0]}`, `ఈ విత్తనాలు ${season().name[1]}లో పెరగవు`) : tr('Buy seeds at the shop', 'షాప్‌లో విత్తనాలు కొనండి'));
  return idle(tr('All watered. Plants grow overnight', 'నీళ్ళు పోశారు. రాత్రికి పెరుగుతాయి'));
}
// Paddy: plant saplings, flood the field from the canal each day, cut when golden
function paddyAction() {
  const P = S.paddy, idle = need => ({ id: 'none', label: tr('Paddy field', 'వరి పొలం'), need, time: 0 });
  if (P.stage >= 4) return { id: 'cut', label: tr('Harvest the paddy', 'వరి కోత కోయి'), need: '', time: 4 };
  if (P.stage < 0) return S.inv.sapling ? { id: 'plant', label: tr('Plant paddy saplings (naatlu)', 'వరి నాట్లు వేయి'), need: '', time: 4 } : idle(tr('Buy saplings at the shop', 'షాప్‌లో నారు కొనండి'));
  if (!P.watered) return { id: 'water', label: tr('Open the canal to flood the field', 'కాలువ తెరిచి పొలానికి నీళ్ళు పెట్టు'), need: '', time: 2.5 };
  return idle(tr(`Field is flooded. Ready in ${4 - P.stage} day(s)`, `పొలంలో నీళ్ళు ఉన్నాయి. ${4 - P.stage} రోజుల్లో పంట`));
}
function plantCrop(k) {
  const empty = S.farm.filter(p => p.stage < 0).slice(0, S.seeds[k]);
  empty.forEach(p => { p.stage = 0; p.crop = k; p.watered = wet > 0.5; });
  S.seeds[k] -= empty.length;
  toast(tr(`🌱 Planted ${CROPS[k].name[0]} in ${empty.length} plots. Water them every day!`, `🌱 ${empty.length} మడుల్లో ${CROPS[k].name[1]} నాటారు. రోజూ నీళ్ళు పోయండి!`), 'good');
  renderFarm(); renderInventory(); completeTask('farm');
}
// Each spot: where it is, what the prompt says, whether it can be used now and what it does.
const spots = [
  { at: WELL, r: 2.6, label: () => tr('Draw water', 'నీళ్ళు తోడు'),
    need: () => S.inv.water >= (S.tools.pot ? 4 : 2) ? tr(`Pot is full (${S.tools.pot ? 4 : 2} max)`, `బిందె నిండింది (${S.tools.pot ? 4 : 2} వరకు)`) : '',
    time: 2.2, start: SFX.water,
    done: () => { S.inv.water++; stat('water'); renderInventory('water'); completeTask('water'); toast(tr('💧 Got a pot of water', '💧 బిందె నీళ్ళు తెచ్చారు'), 'good'); } },
  { at: WOODPILE, r: 2.4, label: () => tr('Collect firewood', 'కట్టెలు తీసుకో'),
    need: () => S.inv.wood >= (S.tools.axe ? 5 : 3) ? tr(`Carrying enough wood (${S.tools.axe ? 5 : 3} max)`, `కట్టెలు చాలు (${S.tools.axe ? 5 : 3} వరకు)`) : '',
    get time() { return S.tools.axe ? 0.9 : 1.6; }, start: SFX.chop, tick: () => SFX.chop(),
    done: () => { S.inv.wood++; stat('wood'); renderInventory('wood'); completeTask('wood'); } },
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
        S.inv.chai++; stat('chai');
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
    done: () => { S.milked = true; S.inv.milk++; stat('milk'); renderInventory('milk'); completeTask('milk'); toast(tr('🥛 Fresh milk! Use it in chai or sell it.', '🥛 తాజా పాలు! చాయ్‌లో వేయండి లేదా అమ్మండి.'), 'good'); } },
  { at: SHOP_FRONT, r: 2.8, label: () => tr('Kirana shop', 'కిరాణా షాప్'), need: () => '', time: 0.2, done: openShop },
  { at: FARM_C, r: 3.6, label: () => farmAction().label, need: () => farmAction().need,
    get time() { return farmAction().time; },
    start: () => { if (farmAction().id === 'water') SFX.water(); },
    done: () => {
      const a = farmAction(), F = S.farm;
      if (a.id === 'harvest') {
        const got = {};
        F.filter(isRipe).forEach(p => { const c = cropOf(p); S.inv[c.item] += c.yield; stat('crops', c.yield); got[p.crop] = (got[p.crop] || 0) + c.yield; p.stage = -1; p.watered = false; });
        SFX.good();
        toast(Object.entries(got).map(([k, n]) => `${CROPS[k].emoji} ${n} ${tr(CROPS[k].name[0], CROPS[k].name[1])}`).join(' · ') + tr(' harvested!', ' కోశారు!'), 'good');
      } else if (a.id === 'plant') {
        if (a.choose) {
          openPanel({ icon: 'seed', title: tr('Which crop?', 'ఏ పంట వేయాలి?'), text: tr(`${season().name[0]} crops`, `${season().name[1]} పంటలు`),
            options: a.usable.map(k => ({ label: `${CROPS[k].emoji} ${tr(...CROPS[k].name)} (${S.seeds[k]} ${tr('seeds', 'విత్తనాలు')})`, fn: () => { closePanel(); plantCrop(k); } })) });
          return;
        }
        plantCrop(a.usable[0]);
        return;
      } else if (a.id === 'water') {
        S.inv.water--;
        F.forEach(p => { if (isGrowing(p)) p.watered = true; });
        toast(tr('💧 Crops watered. They will grow tonight.', '💧 మొక్కలకు నీళ్ళు పోశారు. రాత్రికి పెరుగుతాయి.'), 'good');
      }
      renderFarm(); renderInventory(); completeTask('farm');
    } },
  { at: cart.g.position, r: 2.6, label: () => tr('Ride the bullock cart', 'ఎడ్ల బండి ఎక్కు'), need: () => '', time: 0.5, start: SFX.jingle, done: () => mountCart() },
  { at: TOWN, r: 5, ride: true, label: () => tr('Sell at the town market (×1.5)', 'పట్నం సంతలో అమ్ము (×1.5)'),
    need: () => !riding ? tr('Come with the bullock cart', 'ఎడ్ల బండి మీద రండి')
      : S.townDay === S.day ? tr('Already went to town today', 'ఈ రోజు పట్నం వెళ్ళారు')
      : !produceValue() ? tr('Nothing to sell', 'అమ్మడానికి ఏమీ లేదు') : '',
    time: 1, start: SFX.jingle,
    done: () => {
      const value = sellAll(1.5); S.townDay = S.day; stat('town');
      S.time = Math.min(S.time + 90, 22.9 * 60); fade();
      SFX.coin(); renderInventory(); renderHud(); completeTask('sell');
      toast(tr(`🐂 Town market trip! Sold for ₹${value} (+1.5 hours)`, `🐂 పట్నం సంత! ₹${value} కి అమ్మారు (+1.5 గంటలు)`), 'good');
    } },
  { at: KITE_AT, r: 3.2, hidden: () => !isFest('sankranti'), label: () => tr('Fly a kite', 'గాలిపటం ఎగరేయి'),
    need: () => S.done.fest ? tr('Your kite is flying high!', 'మీ గాలిపటం ఎగురుతోంది!') : !S.inv.kite ? tr('Buy a kite at the shop', 'షాప్‌లో గాలిపటం కొనండి') : '',
    time: 3, start: SFX.good,
    done: () => { S.inv.kite = 0; myKite.visible = kiteString.visible = true; renderInventory(); completeTask('fest'); } },
  { at: GANESHA_FRONT, r: 3, hidden: () => !isFest('chavithi'), label: () => tr('Do Ganesha pooja', 'వినాయక పూజ చేయి'),
    need: () => S.done.fest ? tr('Pooja done. Jai Ganesha!', 'పూజ అయింది. జై గణేశ!') : !S.inv.flower ? tr('Buy pooja items at the shop', 'షాప్‌లో పూజ సామాను కొనండి') : '',
    time: 3, start: SFX.bell,
    done: () => { S.inv.flower = 0; renderInventory(); completeTask('fest'); } },
  { at: new THREE.Vector3(0, 0, 5), r: 2.3, hidden: () => !isFest('deepavali'), label: () => tr('Burst crackers', 'టపాకాయలు కాల్చు'),
    need: () => S.done.fest ? tr('Happy Deepavali!', 'దీపావళి శుభాకాంక్షలు!') : !S.inv.fireworks ? tr('Buy crackers at the shop', 'షాప్‌లో టపాకాయలు కొనండి')
      : S.time < 18 * 60 ? tr('Wait for the evening (after 6 PM)', 'సాయంత్రం 6 తర్వాత కాల్చండి') : '',
    time: 1.2,
    done: () => { S.inv.fireworks = 0; S.crackersUntil = S.time + 25; fireAcc = 0; renderInventory(); completeTask('fest'); } },
  { at: PEN_GATE, r: 3, label: () => tr('Animal pen', 'పశువుల దొడ్డి'), need: () => '', time: 0.2, done: openPen },
  { at: DUCK_SPOT, r: 2.4, hidden: () => !S.animals.ducks, label: () => tr('Collect duck eggs', 'బాతు గుడ్లు ఏరు'),
    need: () => S.animals.duckDay === S.day ? tr('Already collected today', 'ఈ రోజు ఏరారు') : '', time: 1.2, start: SFX.cluck,
    done: () => { S.animals.duckDay = S.day; S.inv.egg += 2; stat('eggs', 2); renderInventory('egg'); toast(tr('🦆 2 duck eggs!', '🦆 2 బాతు గుడ్లు!'), 'good'); } },
  { at: PADDY_SPOT, r: 3.2, label: () => paddyAction().label, need: () => paddyAction().need,
    get time() { return paddyAction().time; },
    start: () => { const a = paddyAction().id; if (a === 'water') SFX.water(); if (a === 'cut') SFX.chop(); },
    tick: () => { if (paddyAction().id === 'cut') SFX.chop(); },
    done: () => {
      const a = paddyAction().id, P = S.paddy;
      if (a === 'cut') { P.stage = -1; P.watered = false; S.inv.ricebag += 6; S.inv.fodder += 6; stat('rice', 6); SFX.good(); toast(tr('🍚 6 bags of rice and 🌾 6 bundles of straw for the animals!', '🍚 6 బస్తాల బియ్యం, 🌾 పశువులకు 6 గడ్డి కట్టలు!'), 'good'); }
      else if (a === 'plant') { S.inv.sapling--; P.stage = 0; P.watered = wet > 0.5; toast(tr('🌱 Saplings planted! Keep the field flooded every day.', '🌱 నాట్లు వేశారు! రోజూ పొలంలో నీళ్ళు ఉంచండి.'), 'good'); }
      else if (a === 'water') { P.watered = true; toast(tr('💧 The field is flooded. The paddy will grow tonight.', '💧 పొలంలో నీళ్ళు నిండాయి. రాత్రికి వరి పెరుగుతుంది.'), 'good'); }
      renderPaddy(); renderInventory();
    } },
  { at: FISH_SPOT, r: 2.6, label: () => tr('Go fishing', 'చేపలు పట్టు'),
    need: () => !S.inv.rod ? tr('Buy a fishing rod at the shop', 'షాప్‌లో గాలం కొనండి')
      : (S.fishing.day === S.day && S.fishing.n >= 6) ? tr('The fish are resting. Come back tomorrow', 'చేపలు విశ్రాంతి తీసుకుంటున్నాయి. రేపు రండి') : '',
    time: 0.4, done: () => { if (S.fishing.day !== S.day) S.fishing = { day: S.day, n: 0 }; S.energy = Math.max(0, S.energy - 2); startFishing(); } },
  { at: SCHOOL_SPOT, r: 2.6, label: () => tr('Help teach the class', 'పాఠం చెప్పడంలో సాయం'),
    need: () => S.teachDay === S.day ? tr('Class is over for today', 'ఈ రోజు క్లాస్ అయిపోయింది') : (S.time < 9 * 60 || S.time > 16 * 60) ? tr('School is open 9 AM – 4 PM', 'బడి ఉ. 9 – సా. 4') : '',
    time: 4, start: SFX.bell,
    done: () => { S.teachDay = S.day; S.money += 20; SFX.good(); renderHud(); toast(tr(...LESSONS[S.day % LESSONS.length]) + tr(' ₹20 from the school.', ' బడి నుంచి ₹20.'), 'good'); } },
  { at: TEA_SPOT, r: 2.2, label: () => tr('Tea stall', 'టీ కొట్టు'), need: () => '', time: 0.2, done: () => openTalk(villagers.find(v => v.id === 'chai')) },
  ...LITTER.map((at, i) => ({ at, r: 1.8, hidden: () => !upgrades.litter[i].visible, label: () => tr('Clean up the litter', 'చెత్త ఎత్తు'), need: () => '', time: 2, start: SFX.chop,
    done: () => { S.story.litter[i] = true; applyStory(); const left = S.story.litter.filter(x => !x).length; toast(left ? tr(`🧹 Clean! ${left} more to go`, `🧹 శుభ్రం! ఇంకా ${left}`) : tr('🧹 All clean! Go tell the sarpanch.', '🧹 అంతా శుభ్రం! సర్పంచ్ గారికి చెప్పండి.'), 'good'); } })),
  { at: BONFIRE, r: 3.4, hidden: () => !isGathering(), label: () => tr('Listen to Ramayya\'s story', 'రామయ్య తాత కథ విను'),
    need: () => S.storyDay === S.day ? tr('Tomorrow, another story!', 'రేపు ఇంకో కథ!') : '', time: 0.4,
    done: () => {
      const st = STORIES[S.storiesHeard % STORIES.length];
      S.storyDay = S.day; S.storiesHeard++; S.energy = Math.min(100, S.energy + 10); SFX.good();
      openPanel({ icon: 'oldman', title: '🔥 ' + tr(st[0], st[1]), text: tr(st[2], st[3]) + '<br><br>' + tr('(Energy +10 by the warm fire)', '(వెచ్చని మంట దగ్గర శక్తి +10)') });
    } },
  { at: santa.spots.bajji, r: 2, hidden: () => !santa.g.visible, label: () => tr('Mirchi bajji stall', 'మిర్చి బజ్జీ కొట్టు'),
    need: () => (S.santa.day === S.day && S.santa.snacks >= 2) ? tr('Sold out! Come next Sunday', 'అయిపోయాయి! వచ్చే ఆదివారం రండి') : S.money < 15 ? tr('Bajji costs ₹15', 'బజ్జీ ₹15') : '',
    time: 0.8, done: () => { if (S.santa.day !== S.day) Object.assign(S.santa, { day: S.day, snacks: 0, sold: 0, rides: 0 }); S.santa.snacks++; S.money -= 15; S.energy = Math.min(100, S.energy + 40); SFX.good(); renderHud(); toast(tr('🌶️ Hot mirchi bajji! Energy +40', '🌶️ వేడి మిర్చి బజ్జీ! శక్తి +40'), 'good'); } },
  { at: santa.spots.tools, r: 2, hidden: () => !santa.g.visible, label: () => tr('Pots & tools stall', 'కుండలు • పనిముట్ల కొట్టు'), need: () => '', time: 0.2, done: () => openTools() },
  { at: santa.spots.buyer, r: 2, hidden: () => !santa.g.visible, label: () => tr('Sell to the produce buyer (×1.3)', 'వ్యాపారికి అమ్ము (×1.3)'),
    need: () => !produceValue() ? tr('Nothing to sell', 'అమ్మడానికి ఏమీ లేదు') : '', time: 0.6,
    done: () => { const v = sellAll(1.3); SFX.coin(); renderInventory(); renderHud(); completeTask('sell'); toast(tr(`🪙 The buyer paid ₹${v}`, `🪙 వ్యాపారి ₹${v} ఇచ్చాడు`), 'good'); } },
  { at: WHEEL_SPOT, r: 2.2, hidden: () => !santa.g.visible, label: () => tr('Ride the giant wheel · ₹10', 'జెయింట్ వీల్ ఎక్కు · ₹10'),
    need: () => S.money < 10 ? tr('Need ₹10', '₹10 కావాలి') : '', time: 0.3, done: () => { S.money -= 10; renderHud(); rideWheel(); } },
  { at: BALL_AT, r: 1.8, hidden: () => !ballMesh.visible, label: () => tr('Pick up the ball', 'బంతి తీసుకో'), need: () => '', time: 0.4,
    done: () => { S.inv.ball = 1; ballMesh.visible = false; SFX.good(); renderInventory('ball'); toast(tr('⚽ Found it! Take it to Chintu.', '⚽ దొరికింది! చింటుకి ఇవ్వండి.'), 'good'); } },
  ...villagers.map(v => ({ at: v.g.position, r: 2.6, hidden: () => !v.g.visible, label: () => tr(`Talk to ${v.names[1]}`, `${v.names[0]}తో మాట్లాడు`),
    need: () => '', time: 0.2, done: () => openTalk(v) })),
  { at: TEMPLE_FRONT, r: 3.2, label: () => tr('Pray', 'దండం పెట్టు'), tick: () => { if (S.story.step >= 2) { bellMesh.rotation.z = Math.sin(performance.now() / 80) * 0.3; tone(880, 0.6, 'sine', 0.04); } },
    need: () => S.prayed ? tr('Already prayed today', 'ఈ రోజు దండం పెట్టారు') : '',
    time: 2.5, start: SFX.bell,
    done: () => { const e = S.story.step >= 2 ? 25 : 15; S.prayed = true; S.energy = Math.min(100, S.energy + e); completeTask('pray'); toast(tr(`🙏 Blessed! Energy +${e}`, `🙏 దేవుడి దీవెన! శక్తి +${e}`), 'good'); } },
  { at: new THREE.Vector3(0, 0, 3.3), r: 1.9, label: () => tr('Home', 'ఇల్లు'), need: () => '', time: 0.2, done: () => openHome() },
];
// Ugadi pachadi takes over the chulha while you hold the items, so it goes first
spots.unshift({ at: CHULHA, r: 2.3, hidden: () => !(isFest('ugadi') && S.inv.bowl && !S.done.fest), label: () => tr('Make Ugadi pachadi', 'ఉగాది పచ్చడి చేయి'),
  need: () => '', time: 2.5, start: SFX.chop,
  done: () => { S.inv.bowl = 0; renderInventory(); toast(tr('🥭 Sweet, sour, bitter, spicy: the taste of a new year!', '🥭 తీపి, పులుపు, చేదు, కారం: కొత్త సంవత్సరం రుచి!')); completeTask('fest'); } });
const DISMOUNT = { at: new THREE.Vector3(), r: 9, label: () => tr('Get down', 'బండి దిగు'), need: () => '', time: 0.3, done: () => dismountCart() };
let riding = false;
function mountCart() {
  riding = true; cart.speed = 0;
  yaw = cart.g.rotation.y + Math.PI; pitch = -0.12;
  toast(IS_TOUCH ? tr('🐂 Joystick: up = go, sideways = turn', '🐂 జాయ్‌స్టిక్: పైకి = ముందుకు, పక్కకి = తిరగడం') : tr('🐂 W/S: go/back · A/D: turn · E: get down', '🐂 W/S: ముందుకు/వెనక్కి · A/D: తిరగడం · E: దిగు'));
}
function dismountCart() {
  riding = false; cart.speed = 0;
  const r = cart.g.rotation.y;
  player.position.set(cart.g.position.x + Math.cos(r) * 1.9, 0, cart.g.position.z - Math.sin(r) * 1.9);
  collide(player.position);
  camera.position.y = 1.62;
  save();
}
function driveCart(dt, fx, fz) {
  const g = cart.g, rot = g.rotation.y;
  const throttle = Math.max(-1, Math.min(1, -fz));
  cart.speed += ((throttle > 0 ? throttle * 6.5 : throttle * 2.5) - cart.speed) * Math.min(1, dt * 2.2);
  if (Math.abs(cart.speed) < 0.02 && !throttle) cart.speed = 0;
  const dRot = -Math.max(-1, Math.min(1, fx)) * 1.2 * dt * Math.min(1, Math.abs(cart.speed) / 1.5) * Math.sign(cart.speed);
  const nr = rot + dRot, nx = g.position.x + Math.sin(nr) * cart.speed * dt, nz = g.position.z + Math.cos(nr) * cart.speed * dt;
  if (!cartBlocked(nx, nz, nr) || cartBlocked(g.position.x, g.position.z, rot)) { g.position.x = nx; g.position.z = nz; g.rotation.y = nr; yaw += dRot; }
  else cart.speed = 0;
  const r = g.rotation.y;
  player.position.set(g.position.x + Math.sin(r) * 0.3, 0, g.position.z + Math.cos(r) * 0.3);
  cart.phase += dt * cart.speed * 2.4;
  camera.position.y = 2.45 + Math.abs(Math.sin(cart.phase)) * 0.04 * Math.min(1, Math.abs(cart.speed));
  if (Math.abs(cart.speed) > 0.5) { stepAcc += dt; if (stepAcc > 0.5) { stepAcc = 0; SFX.jingle(); } }
}
EGG_SPOTS.forEach(([x, z], i) => spots.push({
  at: new THREE.Vector3(x, 0, z), r: 1.5, egg: i, label: () => tr('Pick up egg', 'గుడ్డు తీసుకో'), need: () => '', time: 0.5, start: SFX.cluck,
  hidden: () => !S.eggsLeft[i],
  done: () => {
    S.eggsLeft[i] = false; eggMeshes[i].visible = false; S.inv.egg++; stat('eggs'); renderInventory('egg');
    if (S.eggsLeft.every(e => !e)) completeTask('eggs');
  },
}));

let busy = null, focus = null;
function nearestSpot() {
  let best = null, bestD = Infinity;
  const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  for (const s of spots) {
    if (riding ? !s.ride : false) continue;
    if (s.hidden && s.hidden()) continue;
    const dx = s.at.x - player.position.x, dz = s.at.z - player.position.z, d = Math.hypot(dx, dz);
    if (d > s.r) continue;
    const facing = (dx * fwd.x + dz * fwd.z) / (d || 1);
    if (d > 1.2 && facing < 0.2) continue;
    if (d < bestD) { bestD = d; best = s; }
  }
  if (riding && (!best || best.need())) return DISMOUNT;
  return best;
}
function updatePrompt() {
  const p = $('prompt'), btn = $('actBtn');
  if (mini) {
    const m = mini.prompt(); focus = null;
    p.classList.remove('hidden'); p.classList.toggle('hot', !!m.hot);
    p.innerHTML = `${IS_TOUCH ? '' : '<kbd>E</kbd>'}${m.text}`;
    btn.classList.remove('hidden'); btn.textContent = m.btn;
    return;
  }
  p.classList.remove('hot');
  focus = busy || panelOpen ? null : nearestSpot();
  if (!focus) { p.classList.add('hidden'); btn.classList.add('hidden'); return; }
  const need = focus.need();
  p.classList.remove('hidden');
  p.innerHTML = need ? `${focus.label()} <span class="need">— ${need}</span>` : `${IS_TOUCH ? '' : '<kbd>E</kbd>'}${focus.label()}`;
  btn.classList.toggle('hidden', !!need);
  btn.textContent = focus.label();
}
function interact() {
  if (mini && !panelOpen) { mini.action(); return; }
  if (busy || !focus || panelOpen) return;
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
  // Watered plants grow one stage overnight
  S.farm.forEach(p => { if (p.watered && isGrowing(p)) p.stage++; p.watered = false; });
  if (S.paddy.watered && S.paddy.stage >= 0 && S.paddy.stage < 4) S.paddy.stage++;
  S.paddy.watered = false;
  renderPaddy();
  renderFarm();
  // Finished quests come back the next day; unfinished ones wait
  for (const k in S.quests) if (S.quests[k] === 'done') S.quests[k] = 'new';
  S.weather = rollWeather(S.day);
  if (panelOpen) closePanel();
  if (mini) (mini.finish ? mini.finish() : endFishing());
  if (riding) dismountCart();
  trough.hay.visible = false;
  S.crackersUntil = 0;
  applyDay();
  // Wake up on the doorstep, looking out at the village
  player.position.set(0, 0, 5.4); yaw = Math.PI; pitch = 0;
  if (S.stove.state === 'cooking') S.stove.state = 'ready';
  renderTasks(); renderInventory();
  fade();
  SFX.good();
  const se = season(), f = festival(), newSeason = (dayOfYear() - 1) % 7 === 0;
  if (isSantaDay()) toast(tr('🎡 It\'s Sunday! The santa is set up near the temple.', '🎡 ఈ రోజు ఆదివారం! గుడి దగ్గర సంత పెట్టారు.'), 'good');
  if (f) toast(tr(`${f.emoji} Happy ${f.name[0]}! Day ${S.day}`, `${f.emoji} ${f.name[1]} శుభాకాంక్షలు! రోజు ${S.day}`), 'good');
  else toast(tr(`🌅 Good morning! Day ${S.day}`, `🌅 శుభోదయం! రోజు ${S.day}`) + (newSeason ? tr(` · ${se.name[0]} begins`, ` · ${se.name[1]} మొదలైంది`) : ''), 'good');
  if (S.weather.rain && (S.home.radio || S.home.tv)) toast(tr(`🌦️ Rain expected around ${fmtHour(S.weather.start)} today`, `🌦️ ఈ రోజు ${fmtHour(S.weather.start)} కి వర్షం వచ్చేలా ఉంది`));
  if (S.farm.some(isRipe)) toast(tr('🧺 Your crops are ripe! Harvest them.', '🧺 పంట పండింది! కోయండి.'), 'good');
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
  if (panelOpen) {
    if (e.code === 'Escape') closePanel();
    else if (/^Digit[1-9]$/.test(e.code)) pickOption(Number(e.code.slice(5)) - 1);
    return;
  }
  if (e.code === 'KeyE' && playing) interact();
  if (e.code === 'KeyT' && playing) { tasksOpen = !tasksOpen; renderTasks(); }
  if (e.code === 'Escape' && playing && !document.pointerLockElement) openMenu();
});
addEventListener('keyup', e => { keys[e.code] = false; });
// Pointer lock can be refused (e.g. inside some embedded browsers); dragging with the mouse still works then
function lockPointer() { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* drag to look instead */ } }
canvas.addEventListener('click', () => { if (playing && !IS_TOUCH && !document.pointerLockElement) lockPointer(); });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && playing && !IS_TOUCH && !panelOpen) openMenu(); });
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
    if (t.target.closest('button, .panel')) continue;
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
    case 'pick': pickOption(Number(el.dataset.id)); break;
    case 'run': running = !running; el.classList.toggle('on', running); break;
    case 'tasks': tasksOpen = !tasksOpen; renderTasks(); break;
    case 'lang': S.lang = el.dataset.id; renderMenu(); renderTasks(); renderHud(); save(); break;
    case 'sound': S.sound = !S.sound; renderMenu(); save(); break;
    case 'ach': renderAchievements(); $('achBox').classList.toggle('hidden'); break;
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
  $('menuText').textContent = tr('Live in a Telugu village: fetch water from the well, make chai on the chulha, grow tomatoes, help the villagers, ride the bullock cart to town and celebrate Sankranti, Ugadi and more through the seasons.',
    'తెలుగు పల్లెటూరిలో జీవించండి: బావి నీళ్ళు, పొయ్యి మీద చాయ్, పొలంలో టమాటాలు, ఊరి వాళ్ళకి సాయం, ఎడ్ల బండి మీద పట్నం, కాలాలతో పాటు సంక్రాంతి, ఉగాది పండుగలు.');
  $('playBtn').textContent = S.day > 1 || S.done.water ? tr('▶ Continue', '▶ కొనసాగించు') : tr('▶ Play', '▶ ఆడండి');
  $('soundBtn').textContent = (S.sound ? '🔊 ' : '🔇 ') + tr('Sound', 'సౌండ్');
  $('resetBtn').textContent = '🗑️ ' + tr('New game', 'కొత్త గేమ్');
  $('achBtn').textContent = '🏆 ' + tr('Achievements', 'అచీవ్‌మెంట్లు');
  $('achBox').classList.add('hidden');
  confirmReset = false;
  $('controlsHelp').innerHTML = IS_TOUCH
    ? tr('<b>Left side</b>: move · <b>Right side</b>: look around · <b>Yellow button</b>: do the task', '<b>ఎడమ వైపు</b>: నడవండి · <b>కుడి వైపు</b>: చుట్టూ చూడండి · <b>పసుపు బటన్</b>: పని చేయండి')
    : tr('<b>W A S D</b>: walk · <b>Mouse</b>: look · <b>Shift</b>: run · <b>E</b>: do the task · <b>T</b>: chores list · <b>Esc</b>: menu',
      '<b>W A S D</b>: నడవండి · <b>మౌస్</b>: చూడండి · <b>Shift</b>: పరుగు · <b>E</b>: పని · <b>T</b>: పనుల లిస్ట్ · <b>Esc</b>: మెనూ');
}
function openMenu() {
  playing = false;
  if (panelOpen) { panelOpen = false; $('panel').classList.add('hidden'); }
  rainSound(0);
  if (mini) (mini.finish ? mini.finish() : endFishing());
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
  if (!riding) for (const [cx, cz, cr] of cartCircles(cart.g.position.x, cart.g.position.z, cart.g.rotation.y)) {
    const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz), min = cr + 0.35;
    if (d < min && d > 0.0001) { p.x = cx + dx / d * min; p.z = cz + dz / d * min; }
  }
  for (const v of villagers) {
    if (!v.g.visible) continue;
    const dx = p.x - v.g.position.x, dz = p.z - v.g.position.z, d = Math.hypot(dx, dz), min = 0.7;
    if (d < min && d > 0.0001) { p.x = v.g.position.x + dx / d * min; p.z = v.g.position.z + dz / d * min; }
  }
  const r = Math.hypot(p.x, p.z);
  if (r > 58) { p.x *= 58 / r; p.z *= 58 / r; }
}
// Rain fades in and out, waters the farm and sometimes brings thunder
let wasRaining = false, soilWet = false, thunderAcc = 6;
function updateWeather(dt) {
  const raining = playing && isRaining();
  if (raining !== wasRaining && playing) {
    wasRaining = raining;
    toast(raining ? tr('🌧️ It\'s raining! The farm gets watered.', '🌧️ వర్షం పడుతోంది! పొలానికి నీళ్ళు అందుతాయి.') : tr('☀️ The rain has stopped.', '☀️ వర్షం ఆగింది.'));
  }
  wet += ((raining ? 1 : 0) - wet) * Math.min(1, dt * 0.35);
  if (wet < 0.001) wet = 0;
  if ((wet > 0.5) !== soilWet) {
    soilWet = wet > 0.5;
    if (soilWet) {
      let n = 0;
      S.farm.forEach(p => { if (isGrowing(p) && !p.watered) { p.watered = true; n++; } });
      if (S.paddy.stage >= 0 && S.paddy.stage < 4) S.paddy.watered = true;
      if (n) { completeTask('farm'); toast(tr('🌱 The rain watered your crops!', '🌱 వర్షం మీ మొక్కలకు నీళ్ళు పోసింది!'), 'good'); }
    }
    renderFarm(); renderPaddy();
  }
  flash = Math.max(0, flash - dt * 2);
  if (raining && S.weather.storm && wet > 0.7) {
    thunderAcc -= dt;
    if (thunderAcc <= 0) { thunderAcc = rand(7, 16); flash = 0.35; setTimeout(SFX.thunder, rand(300, 1400)); }
  }
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
    if (mini && mini.cancelOnMove && len > 0.1) endFishing(tr('You put the rod away.', 'గాలం పక్కన పెట్టారు.'));
    if (mini) mini.update(dt);
    if (riding) driveCart(dt, busy || panelOpen ? 0 : fx, busy || panelOpen ? 0 : fz);
    else if (len > 0.1 && !busy && !panelOpen && !mini) {
      const run = (running || keys.ShiftLeft || keys.ShiftRight) && S.energy > 0;
      const speed = (S.energy <= 0 ? 1.8 : run ? 5.6 : 3.4) * Math.min(1, len);
      move.set(fx / len, 0, fz / len).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiplyScalar(speed * dt);
      player.position.add(move);
      collide(player.position);
      const hour = S.time / 60, heat = season().id === 'summer' && hour > 11 && hour < 16 && wet < 0.3 && !S.home.fan ? 1.6 : 1; // summer afternoons tire you faster
      S.energy = Math.max(0, S.energy - dt * (run ? 0.6 : 0.18) * heat * homeComfort());
      bob += dt * (run ? 13 : 9);
      stepAcc += dt * (run ? 1.6 : 1);
      if (stepAcc > 0.45) { stepAcc = 0; SFX.step(); }
    }
    if (!riding) camera.position.y = 1.62 + Math.sin(bob) * 0.035;
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
  updateVillagers(dt);
  // Cart wheels turn and the bulls walk
  cart.wheels.forEach(w => { w.rotation.x += cart.speed * dt / 0.7; });
  cart.legs.forEach((l, i) => { l.rotation.x = Math.sin(cart.phase * 2 + (i % 2 ? Math.PI : 0) + (i > 3 ? 1 : 0)) * 0.4 * Math.min(1, Math.abs(cart.speed)); });
  cart.tails.forEach((t, i) => { t.rotation.z = Math.sin(performance.now() / 500 + i) * 0.25; });
  updateFestivals(dt);
  updateHome(dt);
  hudSanta = (hudSanta || 0) + dt; if (hudSanta > 1) { hudSanta = 0; if (playing) checkAchievements(); if (santa.g.visible !== santaOpen()) applySanta(); }
  updateSanta(dt);
  updateBonfire(dt);
  updateFlies();
  if (upgrades.lamps.visible) { const hh = S.time / 60, on = hh > 18.3 || hh < 5.8; lampHead.color.set(on ? 0xfff2b0 : 0x555544); streetLight.intensity = on ? 1.5 : 0; }
  updateAnimals(dt);
  updateWeather(dt);
  updateRain(dt);

  updateSky();
  hudAcc += dt;
  if (hudAcc > 0.2) { hudAcc = 0; if (playing) { renderHud(); updatePrompt(); rainSound(wet); } }
  saveAcc += dt;
  if (saveAcc > 10 && playing) { saveAcc = 0; save(); }
  renderer.render(scene, camera);
}

/* ============================== BOOT ================================== */
hydrateIcons();
S.eggsLeft.forEach((left, i) => { eggMeshes[i].visible = left; });
camera.add(rod, bat);
applyStory();
applySanta();
renderFarm();
renderPaddy();
placeBall();
applyDay();
applyHome();
spawnAnimals();
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
    // Stand in front of a villager, looking at them
    goNear(id) { const p = villagers.find(v => v.id === id).g.position; return this.goTo(p.x + 1.5, p.z, p.x, p.z); },
    pick: pickOption,
    get panel() { return panelOpen ? { title: panelTitle, text: $('panel').querySelector('p').textContent, options: panelOpts.map(o => o.label + (o.disabled ? ' (off)' : '')) } : null; },
    closePanel,
    sleep,
    setRain(on, storm = true) { S.weather = on ? { rain: true, start: S.time - 1, end: S.time + 240, storm } : { rain: false }; },
    get wet() { return wet; },
    get riding() { return riding; },
    cartAt() { return [cart.g.position.x, cart.g.position.z, cart.g.rotation.y]; },
    // Drive the cart with steady input for some seconds
    drive(fx, fz, secs) { return new Promise(res => { const t0 = performance.now(); keys.KeyW = fz < 0; keys.KeyS = fz > 0; keys.KeyA = fx < 0; keys.KeyD = fx > 0;
      const tick = () => { if (performance.now() - t0 > secs * 1000) { keys.KeyW = keys.KeyS = keys.KeyA = keys.KeyD = false; res(); } else setTimeout(tick, 50); }; tick(); }); },
    setDay(d) { S.day = d; S.done = {}; applyDay(); renderTasks(); },
    get sparks() { return sparks.length; },
    get mini() { return mini ? mini.phase : null; },
    checkAch: checkAchievements,
    get santaOn() { return santa.g.visible; },
    get santaSpots() { const o = {}; for (const [k, v] of Object.entries(santa.spots)) o[k] = [v.x, v.z, SANTA.x, SANTA.z]; o.wheel = [WHEEL_SPOT.x, WHEEL_SPOT.z + 0.5, WHEEL.x, WHEEL.z]; return o; },
    get miniState() { return mini ? { phase: mini.phase, t: mini.t, T: mini.T, ball: mini.ball, runs: mini.runs, swung: mini.swung } : null; },
    refresh() { applySanta(); applyStory(); spawnAnimals(); renderFarm(); renderPaddy(); renderInventory(); applyDay(); applyHome(); renderTasks(); renderHud(); },
    ballAt() { return [BALL_AT.x, BALL_AT.z]; },
  };
}
