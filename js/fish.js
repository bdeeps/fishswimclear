// Shared parts for FishSwimClear: a bendable fish (skin, muscle, backbone, fins, swim bladder),
// the body-wave model and its speed and Strouhal numbers, chart boards, water particles and a
// vortex wake, and small layout helpers for phones and the tall reel.
import { THREE, M, sphere, swarm, clamp, lerp } from './kit.js';

export const TAU = Math.PI * 2;

// ---------------------------------------------------------------- body types
// Body outlines as fractions of total length L (snout to tail tip). The body (with its tail stalk,
// the peduncle) runs from ξ = 0 to ξ = BODY; the caudal fin fills the rest.
//   H: greatest half-depth, W: greatest half-width, at ξ = peak; hp, wp: half-depth and half-width
//   at the peduncle. Shapes drawn from photographs of a rohu (Labeo rohita), a European eel
//   (Anguilla anguilla) and a skipjack tuna (Katsuwonus pelamis); they are generic, not measured.
// Body wave (all approximate, from the swimming literature):
//   lam: wavelength of the body wave in body lengths. Eels carry about 0.6 of a wave on the body,
//        carp-like fish about one, tunas a little more (Videler 1993, Fish Swimming, Chapman & Hall;
//        Lauder & Tytell 2006, Fish Physiology 23).
//   env(ξ): how big the sideways swing is along the body, 1 at the tail tip. Eel: the whole body
//        swings, the head about a third as much as the tail. Carangiform: a quadratic, smallest just
//        behind the head (Videler & Hess 1984, J Exp Biol 109: 209, fitted to saithe and mackerel).
//        Thunniform: almost only the tail stalk and tail swing.
//   k: stride, the distance travelled per tail beat in body lengths when the tail sweeps 0.2 L.
//        Bainbridge (1958, J Exp Biol 35: 109) found V = ¼ L (3f − 4) for dace, trout and goldfish,
//        about 0.75 L per beat at higher beat rates, with the tail amplitude then about one fifth of
//        the length. The eel and tuna strides here are rounded, illustrative values (eels go less
//        far per beat, tunas a little further); see Videler 1993.
export const TYPES = {
  eel: { name: 'Eel-like (anguilliform)', short: 'Eel', BODY: 0.97, peak: 0.22, H: 0.042, W: 0.038, hp: 0.03, wp: 0.012, lam: 0.62, k: 0.45,
    env: (x) => 0.3 + 0.7 * x * x, skin: ['#4a4a2c', '#8a7a44', '#d8c98a'], fin: 'eel' },
  carp: { name: 'Carp-like (carangiform)', short: 'Carp (rohu)', BODY: 0.79, peak: 0.36, H: 0.13, W: 0.066, hp: 0.042, wp: 0.018, lam: 1.0, k: 0.75,
    env: (x) => 0.1 - 0.3 * x + 1.2 * x * x, skin: ['#3e5566', '#9fb2bd', '#eef1f2'], fin: 'fork' },
  tuna: { name: 'Tuna-like (thunniform)', short: 'Tuna', BODY: 0.8, peak: 0.4, H: 0.12, W: 0.095, hp: 0.014, wp: 0.016, lam: 1.25, k: 0.9,
    env: (x) => 0.04 + 0.96 * Math.pow(x, 4), skin: ['#1d2f56', '#5a6f8f', '#e6ecf2'], fin: 'lunate' },
  // A generic requiem-type shark: no swim bladder, a big oily liver, an upturned (heterocercal) tail.
  shark: { name: 'Shark', short: 'Shark', BODY: 0.78, peak: 0.33, H: 0.075, W: 0.07, hp: 0.018, wp: 0.016, lam: 1.0, k: 0.7,
    env: (x) => 0.1 - 0.3 * x + 1.2 * x * x, skin: ['#4d5966', '#8d98a3', '#e9edf0'], fin: 'shark' },
  // A mudskipper (Periophthalmus / Boleophthalmus): a big blunt head with eyes on top, a long body.
  mudskipper: { name: 'Mudskipper', short: 'Mudskipper', BODY: 0.86, peak: 0.16, H: 0.075, W: 0.07, hp: 0.03, wp: 0.016, lam: 0.8, k: 0.5,
    env: (x) => 0.2 + 0.8 * x * x, skin: ['#5a4a32', '#8f7a56', '#cdbf9c'], fin: 'round' },
};

// Half-depth and half-width at ξ along the body (fractions of L).
export function section(T, xi) {
  const s = clamp(xi / T.BODY, 0, 1), p = T.peak;
  let kH;
  if (s < p) { const q = s / p; kH = Math.sqrt(Math.max(0, 1 - (1 - q) * (1 - q))); }
  else { const q = (s - p) / (1 - p); kH = Math.cos(q * Math.PI / 2) ** 2; }
  const h = s < p ? T.H * kH : T.hp + (T.H - T.hp) * kH;
  const w = s < p ? T.W * kH : T.wp + (T.W - T.wp) * kH;
  return [Math.max(0.002, h), Math.max(0.002, w)];
}

// ---------------------------------------------------------------- the swimming model
// A: peak-to-peak tail amplitude as a fraction of L. f: tail beats per second. Lfish: metres.
// Stride grows with amplitude and levels off: g(a) = tanh(1.2 a/0.2)/tanh(1.2), 1 at a = 0.2 L.
// Speed U = k f L g(a). Strouhal number St = f A / U (Taylor, Nudds & Thomas 2003, Nature 425: 707:
// cruising fish, dolphins and sharks sit between 0.2 and 0.4, where propulsive efficiency peaks).
export function swimModel(type, f, A, Lfish = 0.3) {
  const T = TYPES[type];
  const g = Math.tanh((1.2 * A) / 0.2) / Math.tanh(1.2);
  const U = T.k * f * Lfish * g;
  const St = U > 1e-6 ? (f * A * Lfish) / U : 0;
  const bls = U / Lfish;
  // Wave speed c = f λ L; slip U / c says how much of the wave's speed becomes forward speed.
  const c = f * T.lam * Lfish;
  return { U, St, bls, c, slip: c > 0 ? U / c : 0, g, stride: T.k * g };
}
// A gentle efficiency curve against St for the gauge: 1 inside 0.25–0.35, falling outside.
export const effShape = (St) => Math.exp(-(((St - 0.3) / 0.12) ** 2));

// Lateral displacement of the midline (fraction of L) at ξ and time t for a travelling wave.
export function waveZ(type, A, f, t, xi, phase = 0) {
  const T = TYPES[type];
  return 0.5 * A * T.env(xi) * Math.sin(TAU * (xi / T.lam - f * t) + phase);
}

// ---------------------------------------------------------------- textures
function skinCanvas(T, scales = true, colors = null) {
  const w = 1024, h = 512, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  // v: 0 = back (dorsal), 0.25 = +z side, 0.5 = belly, 0.75 = −z side, 1 = back again.
  const grad = g.createLinearGradient(0, 0, 0, h);
  const [d, m, b] = colors || T.skin;
  grad.addColorStop(0, d); grad.addColorStop(0.17, m); grad.addColorStop(0.36, b); grad.addColorStop(0.5, b);
  grad.addColorStop(0.64, b); grad.addColorStop(0.83, m); grad.addColorStop(1, d);
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  if (scales && T !== TYPES.eel && T !== TYPES.mudskipper) {
    // Overlapping cycloid scales, as on a carp: rows of arcs open towards the head.
    const n = T === TYPES.tuna ? 70 : 34, rows = T === TYPES.tuna ? 40 : 22;
    g.lineWidth = T === TYPES.tuna ? 1 : 1.6;
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      const x = (i + (r % 2) * 0.5) * (w / n) + w * 0.2, y = (r + 0.5) * (h / rows);
      if (x > w * 0.98) continue;
      g.strokeStyle = T === TYPES.carp ? 'rgba(150,60,70,.32)' : 'rgba(20,30,50,.25)';
      g.beginPath(); g.arc(x, y, (w / n) * 0.62, -Math.PI / 2.2, Math.PI / 2.2); g.stroke();
    }
  }
  if (T === TYPES.tuna) { // dark stripes on the belly of a skipjack
    g.strokeStyle = 'rgba(40,50,80,.45)'; g.lineWidth = 6;
    for (const v of [0.4, 0.44, 0.48, 0.52, 0.56, 0.6]) { g.beginPath(); g.moveTo(w * 0.3, v * h); g.lineTo(w * 0.92, v * h); g.stroke(); }
  }
  return { c, g, w, h };
}
// The gill cover and the lateral line, drawn on top so chapters can light the line up.
function drawHeadAndLine(g, w, h, T, lineCol = 'rgba(30,40,50,.75)') {
  if (T === TYPES.shark) {
    g.strokeStyle = 'rgba(30,30,40,.6)'; g.lineWidth = 4;
    for (const v0 of [0.25, 0.75]) for (let k = 0; k < 5; k++) { const x = w * (0.2 + k * 0.022); g.beginPath(); g.moveTo(x, (v0 - 0.08) * h); g.lineTo(x - 4, (v0 + 0.08) * h); g.stroke(); }
  } else if (T !== TYPES.eel) {
    g.strokeStyle = 'rgba(30,30,40,.55)'; g.lineWidth = 5;
    for (const v0 of [0.25, 0.75]) { g.beginPath(); g.ellipse(w * 0.2, v0 * h, w * 0.05, h * 0.2, 0, -Math.PI / 2, Math.PI / 2); g.stroke(); }
  }
  // Lateral line: a row of pored scales along each side, curving down a little in carps.
  g.fillStyle = lineCol;
  for (const side of [1, -1]) for (let u = 0.25; u < 0.985; u += 0.012) {
    const dip = T === TYPES.carp ? 0.04 * Math.sin(Math.PI * clamp((u - 0.25) / 0.6, 0, 1)) : 0;
    const v = 0.5 - side * (0.25 - dip);
    g.beginPath(); g.arc(u * w, v * h, 3.2, 0, TAU); g.fill();
  }
}
export function skinTexture(type, { line = false, colors = null } = {}) {
  const T = TYPES[type], s = skinCanvas(T, true, colors);
  if (T === TYPES.mudskipper) { // speckles
    let seed = 11; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 500; i++) { s.g.fillStyle = r() > 0.5 ? 'rgba(40,30,20,.5)' : 'rgba(120,200,255,.55)'; s.g.beginPath(); s.g.arc(r() * s.w, r() * s.h, 2 + r() * 3, 0, TAU); s.g.fill(); }
  }
  drawHeadAndLine(s.g, s.w, s.h, T, line ? '#8ef0ff' : 'rgba(30,40,50,.7)');
  const tex = new THREE.CanvasTexture(s.c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}
// Muscle: white muscle with the thin strip of red muscle along each side, and the W-shaped
// myosepta between muscle blocks (myomeres). A carp has about 35–40 myomeres, one per vertebra.
export function muscleTexture(n = 36) {
  const w = 1024, h = 512, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#f1d8cf'; g.fillRect(0, 0, w, h);
  for (const v0 of [0.25, 0.75]) {
    const gr = g.createLinearGradient(0, (v0 - 0.06) * h, 0, (v0 + 0.06) * h);
    gr.addColorStop(0, 'rgba(176,32,40,0)'); gr.addColorStop(0.25, 'rgba(176,32,40,.95)'); gr.addColorStop(0.75, 'rgba(176,32,40,.95)'); gr.addColorStop(1, 'rgba(176,32,40,0)');
    g.fillStyle = gr; g.fillRect(w * 0.18, (v0 - 0.06) * h, w * 0.82, 0.12 * h);
  }
  g.strokeStyle = 'rgba(120,70,70,.85)'; g.lineWidth = 3;
  const W = [[0, 0], [0.1, -0.03], [0.25, 0.025], [0.4, -0.03], [0.5, 0]];
  for (let k = 0; k < n; k++) {
    const u0 = 0.2 + (k / n) * 0.79;
    for (const flip of [false, true]) {
      g.beginPath();
      W.forEach(([v, du], i) => { const x = (u0 + du * (1 - 0.5 * (k / n))) * w, y = (flip ? 1 - v : v) * h; i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

// ---------------------------------------------------------------- fin shapes (in the x–y plane)
function finGeo(points) {
  const sh = new THREE.Shape(); points.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  const geo = new THREE.ShapeGeometry(sh, 8); return geo;
}
// Caudal fin, origin at the tail stalk, pointing −x, scaled by L.
function caudalGeo(kind, L) {
  const s = (pts) => finGeo(pts.map(([x, y]) => [x * L, y * L]));
  if (kind === 'fork') return s([[0.01, 0.03], [-0.07, 0.07], [-0.2, 0.13], [-0.19, 0.1], [-0.13, 0.03], [-0.12, 0], [-0.13, -0.03], [-0.19, -0.1], [-0.2, -0.13], [-0.07, -0.07], [0.01, -0.03]]);
  if (kind === 'lunate') return s([[0.01, 0.012], [-0.08, 0.1], [-0.2, 0.2], [-0.17, 0.12], [-0.13, 0.03], [-0.12, 0], [-0.13, -0.03], [-0.17, -0.12], [-0.2, -0.2], [-0.08, -0.1], [0.01, -0.012]]);
  if (kind === 'round') return s([[0.01, 0.03], [-0.05, 0.06], [-0.12, 0.05], [-0.14, 0], [-0.12, -0.05], [-0.05, -0.06], [0.01, -0.03]]);
  if (kind === 'shark') return s([[0.02, 0.02], [-0.1, 0.12], [-0.22, 0.2], [-0.2, 0.15], [-0.12, 0.02], [-0.1, -0.02], [-0.07, -0.08], [-0.03, -0.07], [0.02, -0.02]]);
  return s([[0.01, 0.03], [-0.02, 0.035], [-0.035, 0.0], [-0.02, -0.035], [0.01, -0.03]]);
}

// ---------------------------------------------------------------- the bendable fish
// A fish along +x (snout at +x), length S in scene units. pose(zfn) bends it: zfn(ξ) gives the
// sideways shift of the midline at ξ (fraction of L, + is towards +z). Everything (skin, muscle,
// backbone, fins, organs) follows the bent midline.
export class Fish {
  constructor({ type = 'carp', S = 4, rings = 64, seg = 26, inner = false, skin = null, opacity = 1, fins = 0xd9a07a, lineGlow = false, colors = null } = {}) {
    this.T = TYPES[type]; this.type = type; this.S = S; this.N = rings; this.seg = seg;
    this.group = new THREE.Group();
    this.skinMat = new THREE.MeshStandardMaterial({ map: skin || skinTexture(type, { line: lineGlow, colors }), roughness: 0.38, metalness: 0.25, side: THREE.DoubleSide, transparent: opacity < 1, opacity });
    this.skin = this._tubeMesh(this.skinMat, 1);
    this.group.add(this.skin);
    const fm = (this.finMat = M.plastic(type === 'carp' || type === 'mudskipper' ? fins : type === 'tuna' ? 0x3a4d78 : type === 'shark' ? 0x67727e : 0x6d5f38, { side: THREE.DoubleSide, transparent: true, opacity: 0.88, roughness: 0.5 }));
    // Fins: [ξ along body, height factor, mesh]. Dorsal and anal stand in the x–y plane.
    this.fins = {};
    const L = S, T = this.T;
    const add = (name, geo, xi, yk, side = 0) => { const m = new THREE.Mesh(geo, fm); m.castShadow = true; const p = new THREE.Group(); p.add(m); this.group.add(p); this.fins[name] = { g: p, m, xi, yk, side }; return m; };
    if (T.fin === 'eel') {
      // One long fin frill along the back and belly, joined round the tail.
      this.frill = [];
    } else {
      const dor = type === 'shark' ? [[0.06, 0], [-0.0, 0.11], [-0.04, 0.1], [-0.03, 0.0]] : type === 'tuna' ? [[0.05, 0], [0.02, 0.08], [-0.03, 0.05], [-0.07, 0]] : [[0.06, 0], [0.035, 0.1], [0.0, 0.08], [-0.09, 0.025], [-0.1, 0]];
      add('dorsal', finGeo(dor.map(([x, y]) => [x * L, y * L])), type === 'tuna' ? 0.32 : 0.36, 0.95);
      add('anal', finGeo([[0.04, 0], [0.01, -0.07], [-0.04, -0.06], [-0.05, 0]].map(([x, y]) => [x * L, y * L])), 0.6, -0.92);
      add('pelvic', finGeo([[0.03, 0], [-0.02, -0.06], [-0.04, -0.045], [-0.03, 0]].map(([x, y]) => [x * L, y * L])), 0.42, -0.9);
      const pk = type === 'shark' ? 1.9 : 1;
      for (const sd of [1, -1]) add(sd > 0 ? 'pecL' : 'pecR', finGeo([[0.0, 0.006], [-0.03, 0.02], [-0.085, -0.012], [-0.07, -0.03], [0.0, -0.006]].map(([x, y]) => [x * L * pk, y * L * pk])), type === 'shark' ? 0.27 : 0.2, -0.45, sd);
    }
    add('caudal', caudalGeo(T.fin, L), T.BODY, 0);
    if (T.fin === 'eel') {
      // Frill: a ribbon along the top and bottom of the rear two thirds, rebuilt with the body.
      const n = 40, pos = new Float32Array(n * 2 * 3 * 2);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const idx = []; for (let side = 0; side < 2; side++) for (let i = 0; i < n - 1; i++) { const a = side * n * 2 + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      geo.setIndex(idx);
      this.frillMesh = new THREE.Mesh(geo, fm); this.frillMesh.frustumCulled = false; this.group.add(this.frillMesh); this.frillN = n;
    }
    const eyeR = (type === 'eel' ? 0.012 : 0.022) * L;
    this.eyes = [1, -1].map((sd) => { const e = sphere(eyeR, M.plastic(0x0d0f14, { roughness: 0.15 }), 16); const ring = sphere(eyeR * 1.35, M.metal(0xe6c98a, { roughness: 0.3 }), 16); ring.scale.z = 0.4; e.add(ring); ring.position.z = -sd * eyeR * 0.5; this.group.add(e); return { m: e, sd }; });
    this.inner = null;
    if (inner) this._buildInner();
    this.cx = new Float32Array(rings + 1); this.cz = new Float32Array(rings + 1); this.ca = new Float32Array(rings + 1);
    this.pose(() => 0);
  }

  _tubeMesh(mat, k) {
    const N = this.N, G = this.seg, pos = new Float32Array((N + 1) * (G + 1) * 3), uv = new Float32Array((N + 1) * (G + 1) * 2), idx = [];
    for (let i = 0; i <= N; i++) for (let j = 0; j <= G; j++) { const o = (i * (G + 1) + j) * 2; uv[o] = i / N; uv[o + 1] = 1 - j / G; }
    for (let i = 0; i < N; i++) for (let j = 0; j < G; j++) { const a = i * (G + 1) + j, b = a + G + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.userData.k = k;
    return m;
  }

  _buildInner() {
    const S = this.S, T = this.T, inn = (this.inner = { group: new THREE.Group() });
    this.group.add(inn.group);
    inn.muscleMat = new THREE.MeshStandardMaterial({ map: muscleTexture(), roughness: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 1 });
    inn.muscle = this._tubeMesh(inn.muscleMat, 0.9); inn.group.add(inn.muscle);
    // Backbone: one vertebra per myomere.
    inn.nV = 36;
    inn.spine = swarm(inn.nV, new THREE.CylinderGeometry(0.012 * S, 0.012 * S, 0.016 * S, 12).rotateZ(Math.PI / 2), M.matte(0xf3eee0));
    inn.ribs = swarm(inn.nV * 2, new THREE.CylinderGeometry(0.0018 * S, 0.0018 * S, 1, 5), M.matte(0xf3eee0));
    inn.group.add(inn.spine, inn.ribs);
    // Two-chambered swim bladder of a carp, below the backbone.
    inn.bladderMat = new THREE.MeshStandardMaterial({ color: 0xe9f2ff, roughness: 0.18, metalness: 0.35, transparent: true, opacity: 0.92 });
    inn.bladder = new THREE.Group();
    inn.b1 = sphere(1, inn.bladderMat, 28); inn.b1.scale.set(0.07 * S, 0.036 * S, 0.03 * S); inn.b1.position.x = 0.04 * S;
    inn.b2 = sphere(1, inn.bladderMat, 28); inn.b2.scale.set(0.1 * S, 0.034 * S, 0.028 * S); inn.b2.position.x = -0.12 * S;
    inn.bladder.add(inn.b1, inn.b2); inn.group.add(inn.bladder);
    // Gills: four red arches each side behind the head.
    inn.gills = new THREE.Group();
    const gm = M.matte(0xc8323c);
    for (const sd of [1, -1]) for (let k = 0; k < 4; k++) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.045 * S, 0.006 * S, 6, 24, Math.PI), gm);
      arch.rotation.set(0, sd * 0.35, Math.PI / 2); arch.position.set(-k * 0.012 * S, -0.005 * S, sd * 0.02 * S); inn.gills.add(arch);
    }
    inn.group.add(inn.gills);
    // Gut, roughly, under the bladder.
    inn.gut = sphere(1, M.matte(0xb88a5a), 20); inn.gut.scale.set(0.13 * S, 0.035 * S, 0.035 * S); inn.group.add(inn.gut);
    // Brain and the two big Mauthner cells in the hindbrain (chapter 3 lights them up).
    inn.brain = sphere(0.018 * S, M.matte(0xf0b8c0), 16); inn.brain.scale.set(1.6, 0.8, 0.9); inn.group.add(inn.brain);
    inn.explode = 0;
  }

  // Midline at ξ: position (x, z) and heading angle. Interpolates the cached samples.
  at(xi) {
    const N = this.N, T = this.T, f = clamp(xi / T.BODY, 0, 1) * N, i = Math.min(N - 1, Math.floor(f)), k = f - i;
    if (xi > T.BODY) { const d = (xi - T.BODY) * this.S, a = this.ca[N]; return { x: this.cx[N] - Math.cos(a) * d, z: this.cz[N] - Math.sin(a) * d, a }; }
    return { x: lerp(this.cx[i], this.cx[i + 1], k), z: lerp(this.cz[i], this.cz[i + 1], k), a: lerp(this.ca[i], this.ca[i + 1], k) };
  }

  pose(zfn) {
    const N = this.N, T = this.T, S = this.S, cx = this.cx, cz = this.cz, ca = this.ca;
    // Lay out the midline with constant arc length so the body does not stretch.
    const dxi = T.BODY / N;
    let x = S / 2, z = zfn(0) * S;
    for (let i = 0; i <= N; i++) {
      const xi = i * dxi;
      const z0 = zfn(xi) * S, z1 = zfn(Math.min(1, xi + dxi)) * S;
      const slope = (z1 - z0) / (dxi * S), a = Math.atan(slope);
      if (i === 0) { x = S / 2; z = z0; } else { const ap = Math.atan((z0 - cz[i - 1]) / (dxi * S)); x -= Math.cos(ap) * dxi * S; z = z0; }
      cx[i] = x; cz[i] = z; ca[i] = a;
    }
    // Heading angle: the tail-to-head direction is (cos ca, sin ca) in (x, z).
    for (let i = 0; i <= N; i++) { const a = Math.max(0, i - 1), b = Math.min(N, i + 1); ca[i] = Math.atan2(cz[a] - cz[b], cx[a] - cx[b]); }
    this._ring(this.skin);
    if (this.inner) this._poseInner();
    this._poseFins(zfn);
  }

  // Normal (sideways) direction at ring i: perpendicular to the midline in the x–z plane.
  _nrm(i) { const a = this.ca[i]; return [-Math.sin(a), Math.cos(a)]; }

  _ring(mesh) {
    const N = this.N, G = this.seg, T = this.T, S = this.S, k = mesh.userData.k, p = mesh.geometry.attributes.position.array;
    for (let i = 0; i <= N; i++) {
      const xi = (i / N) * T.BODY;
      let [h, w] = section(T, xi); h *= S * k; w *= S * k;
      // A rounder, blunter snout: keep a little radius at ξ = 0 for the eel and carp.
      const [nx, nz] = this._nrm(i);
      for (let j = 0; j <= G; j++) {
        const ph = (j / G) * TAU, cy = Math.cos(ph) * h, sn = Math.sin(ph) * w;
        const yOff = T === TYPES.carp ? -0.012 * S * k * Math.sin(Math.PI * clamp(xi / T.BODY, 0, 1)) * (Math.cos(ph) < 0 ? 0.6 : 0) : 0;
        const o = (i * (G + 1) + j) * 3;
        p[o] = this.cx[i] + nx * sn; p[o + 1] = cy + yOff; p[o + 2] = this.cz[i] + nz * sn;
      }
    }
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  }

  // Yaw of the body at ξ (radians about +y): 0 when the fish points along +x.
  yaw(xi) { const [dx, dz] = this._dir(xi); return Math.atan2(-dz, dx); }
  // Unit vector from tail towards head at ξ, in (x, z).
  _dir(xi) { const a = this.at(Math.max(0, xi - 0.01)), b = this.at(Math.min(1, xi + 0.01)); const dx = a.x - b.x, dz = a.z - b.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; }
  nrmAt(xi) { const [dx, dz] = this._dir(xi); return [-dz, dx]; }

  _poseFins(zfn) {
    const T = this.T, S = this.S;
    for (const k in this.fins) {
      const F = this.fins[k], c = this.at(F.xi), [h, w] = section(T, Math.min(F.xi, T.BODY));
      F.g.position.set(c.x, F.yk * h * S, c.z);
      F.g.rotation.set(0, this.yaw(F.xi), 0);
      if (F.side) {
        const [nx, nz] = this.nrmAt(F.xi);
        F.g.position.x += nx * F.side * w * S * 0.85; F.g.position.z += nz * F.side * w * S * 0.85;
        F.m.rotation.set(F.side * (0.35 + (this.pecSpread || 0) * 1.0), F.side * (0.25 + (this.pecSpread || 0) * 0.9), -0.15 - (this.pecDown || 0));
      }
    }
    // The caudal fin trails the tail stalk, bent a little more (it is flexible).
    const cf = this.fins.caudal;
    if (cf) cf.g.rotation.set(0, this.yaw(T.BODY - 0.005), 0);
    for (const e of this.eyes) {
      const xi = this.type === 'eel' ? 0.03 : 0.07, c = this.at(xi), [h, w] = section(T, xi), [nx, nz] = this.nrmAt(xi);
      e.m.position.set(c.x + nx * e.sd * w * S * 0.82, h * S * 0.3, c.z + nz * e.sd * w * S * 0.82);
    }
    if (this.frillMesh) {
      const n = this.frillN, p = this.frillMesh.geometry.attributes.position.array;
      for (let side = 0; side < 2; side++) for (let i = 0; i < n; i++) {
        const xi = 0.3 + (i / (n - 1)) * (T.BODY + 0.03 - 0.3), c = this.at(xi), [h] = section(T, Math.min(xi, T.BODY));
        const sg = side ? -1 : 1, base = h * S * 0.9 * sg, tip = sg * (h * S + 0.022 * S * Math.sin(Math.PI * Math.min(1, (i + 2) / n)));
        const o = (side * n * 2 + i * 2) * 3;
        p[o] = c.x; p[o + 1] = base; p[o + 2] = c.z; p[o + 3] = c.x; p[o + 4] = tip; p[o + 5] = c.z;
      }
      this.frillMesh.geometry.attributes.position.needsUpdate = true; this.frillMesh.geometry.computeVertexNormals();
    }
  }

  _poseInner() {
    const inn = this.inner, S = this.S, T = this.T, e = inn.explode;
    this._ring(inn.muscle);
    inn.muscle.position.y = 0;
    // Exploded view: lift the muscle up, drop the skeleton and organs down.
    const yM = e * 0.75 * S * 0.12, ySp = -e * 1.6 * S * 0.12, yOrg = -e * 3.0 * S * 0.12;
    inn.muscle.position.y = yM;
    for (let k = 0; k < inn.nV; k++) {
      const xi = 0.13 + (k / (inn.nV - 1)) * (T.BODY - 0.15), c = this.at(xi), [h] = section(T, xi);
      inn.spine.place(k, [c.x, ySp + 0.01 * S, c.z], [0, this.yaw(xi), 0]);
      const rl = h * S * 0.55;
      // Ribs on the front half arc round the body cavity; spines above and below further back.
      inn.ribs.setMatrixAt(k * 2, new THREE.Matrix4().compose(new THREE.Vector3(c.x, ySp + 0.01 * S + rl * 0.5, c.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.yaw(xi), 0.25)), new THREE.Vector3(1, rl, 1)));
      inn.ribs.setMatrixAt(k * 2 + 1, new THREE.Matrix4().compose(new THREE.Vector3(c.x, ySp + 0.01 * S - rl * 0.5, c.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.yaw(xi), -0.25)), new THREE.Vector3(1, rl, 1)));
    }
    inn.spine.done(); inn.ribs.done();
    const cb = this.at(0.33);
    inn.bladder.position.set(cb.x, yOrg - 0.012 * S, cb.z); inn.bladder.rotation.y = this.yaw(0.33);
    const cg = this.at(0.4);
    inn.gut.position.set(cg.x, yOrg - 0.06 * S, cg.z); inn.gut.rotation.y = this.yaw(0.4);
    const ch = this.at(0.16);
    inn.gills.position.set(ch.x, yOrg * 0.6, ch.z); inn.gills.rotation.y = this.yaw(0.16);
    const cr = this.at(0.09);
    inn.brain.position.set(cr.x, 0.03 * S + e * 0.2 * S, cr.z);
  }

  // Set the swim bladder's size, 1 = the size that makes the fish hover in fresh water.
  setBladder(k) { if (!this.inner) return; const s = Math.cbrt(Math.max(0.01, k)); this.inner.bladder.scale.setScalar(s); }
  setExplode(k) { if (this.inner) this.inner.explode = k; }
}

// ---------------------------------------------------------------- water and wake
// Drifting specks of silt, in a box, moved by a velocity field.
export function makeSpecks(n, box, col = 0xbfe6ff, r = 0.022) {
  const m = swarm(n, new THREE.SphereGeometry(r, 6, 4), M.glow(col, { transparent: true, opacity: 0.7 }));
  m.castShadow = false;
  const p = new Float32Array(n * 3), [x0, x1, y0, y1, z0, z1] = box;
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) { p[i * 3] = x0 + rnd() * (x1 - x0); p[i * 3 + 1] = y0 + rnd() * (y1 - y0); p[i * 3 + 2] = z0 + rnd() * (z1 - z0); }
  return {
    mesh: m, p,
    update(dt, vel) {
      for (let i = 0; i < n; i++) {
        const o = i * 3; const v = vel(p[o], p[o + 1], p[o + 2]);
        p[o] += v[0] * dt; p[o + 1] += v[1] * dt; p[o + 2] += v[2] * dt;
        if (p[o] < x0) p[o] += x1 - x0; if (p[o] > x1) p[o] -= x1 - x0;
        if (p[o + 2] < z0) p[o + 2] += z1 - z0; if (p[o + 2] > z1) p[o + 2] -= z1 - z0;
        m.place(i, [p[o], p[o + 1], p[o + 2]]);
      }
      m.done();
    },
  };
}

// A reverse Kármán street: the tail sheds one vortex at each side of every beat (Müller et al.
// 1997, J Exp Biol 200: 2893). Here each vortex is a ring of glowing dots that drifts back and slowly
// fades; red ones turn clockwise seen from above, blue ones anticlockwise. Between each pair the
// water is pushed back in a jet, drawn as an arrow.
export function makeWake(max = 14) {
  const g = new THREE.Group();
  const ringGeo = new THREE.TorusGeometry(1, 0.06, 6, 40); ringGeo.rotateX(Math.PI / 2);
  const mats = [M.glow(0xff7a59, { transparent: true, opacity: 0.8, depthWrite: false }), M.glow(0x6cc4ff, { transparent: true, opacity: 0.8, depthWrite: false })];
  const pool = [];
  for (let i = 0; i < max; i++) {
    const v = new THREE.Group();
    const r = new THREE.Mesh(ringGeo, mats[i % 2].clone()); v.add(r);
    // A little curved arrow head on the ring shows which way it spins.
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 10), r.material); head.rotation.z = -Math.PI / 2; head.position.set(0, 0, 1); v.add(head);
    v.visible = false; v.userData = { age: 0, life: 1, ring: r, head }; g.add(v); pool.push(v);
  }
  const jets = [];
  for (let i = 0; i < max; i++) {
    const a = new THREE.Group(), m = M.glow(0xffb547, { transparent: true, opacity: 0.85, depthWrite: false });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), m); shaft.rotation.z = Math.PI / 2; a.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 10), m); tip.rotation.z = Math.PI / 2; tip.position.x = -0.6; a.add(tip);
    a.visible = false; a.userData = { m }; g.add(a); jets.push(a);
  }
  let next = 0, last = null;
  return {
    group: g,
    // Shed a vortex at (x, y, z), spin +1 or −1, radius r.
    shed(x, y, z, spin, r) {
      const v = pool[next]; next = (next + 1) % max;
      v.visible = true; v.position.set(x, y, z); v.scale.setScalar(r); v.userData.age = 0; v.userData.spin = spin; v.userData.r = r;
      v.userData.ring.material.color.setHex(spin > 0 ? 0xff7a59 : 0x6cc4ff);
      v.userData.head.rotation.set(0, 0, spin > 0 ? -Math.PI / 2 : Math.PI / 2);
      if (last) {
        const j = jets[next % max]; j.visible = true; j.userData.a = last; j.userData.b = v; j.userData.age = 0;
      }
      last = v;
    },
    update(dt, drift, life = 3) {
      for (const v of pool) {
        if (!v.visible) continue;
        v.userData.age += dt; v.position.x -= drift * dt; v.rotation.y -= v.userData.spin * dt * 2.2;
        const k = 1 - v.userData.age / life;
        if (k <= 0) { v.visible = false; continue; }
        v.userData.ring.material.opacity = 0.85 * k; v.scale.setScalar(v.userData.r * (1 + 0.25 * (1 - k)));
      }
      for (const j of jets) {
        if (!j.visible) continue;
        const a = j.userData.a, b = j.userData.b;
        if (!a.visible || !b.visible) { j.visible = false; continue; }
        j.position.set((a.position.x + b.position.x) / 2, a.position.y, (a.position.z + b.position.z) / 2);
        const len = Math.max(0.3, Math.min(1.2, Math.abs(a.position.z - b.position.z) * 0.9));
        j.scale.set(len, 1, 1);
        j.userData.m.opacity = Math.min(a.userData.ring.material.opacity, b.userData.ring.material.opacity);
      }
    },
    clear() { pool.forEach((v) => { v.visible = false; }); jets.forEach((j) => { j.visible = false; }); last = null; },
  };
}

// ---------------------------------------------------------------- boards and layout
export const COL = { hot: '#ffb547', cool: '#8ef0ff', up: '#5ce1a9', down: '#ff7a59', water: '#6cc4ff', red: '#ff5a8a', gold: '#f2c24b', soft: 'rgba(255,255,255,.6)', text: '#e8eef8' };
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = (...a) => { draw(g, pxW, pxH, ...a); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }));
  m.position.set(...pos); m.renderOrder = 10; root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function panel(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.88)'; g.beginPath(); g.roundRect(0, 0, w, h, 18); g.fill(); }
export function head(g, t, sub = '') {
  g.fillStyle = COL.text; g.font = 'bold 26px sans-serif'; g.fillText(t, 22, 38);
  if (sub) { g.font = '18px sans-serif'; g.fillStyle = COL.soft; g.fillText(sub, 22, 64); }
}
export function txt(g, s, x, y, col = 'rgba(255,255,255,.78)', font = '19px sans-serif') { g.fillStyle = col; g.font = font; g.fillText(s, x, y); }
// Wrap text into lines no wider than maxW.
export function wrap(g, s, x, y, maxW, lh = 24, col = 'rgba(255,255,255,.78)', font = '19px sans-serif') {
  g.fillStyle = col; g.font = font; let line = '', yy = y;
  for (const word of s.split(' ')) { const t = line ? line + ' ' + word : word; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = word; yy += lh; } else line = t; }
  if (line) g.fillText(line, x, yy);
  return yy + lh;
}

export const inReel = () => document.body.classList.contains('gb-reel');
// 'wide' on a laptop, 'narrow' on a phone, 'tall' in the 9:16 reel.
export function layoutOf(stage) {
  const w = stage.host.clientWidth, h = stage.host.clientHeight || 1;
  if (inReel() && w / h < 0.8) return 'tall';
  return w < 560 ? 'narrow' : 'wide';
}
// Move boards for the current layout: spots = { wide: [x,y,z,scale,rotY], narrow: [...], tall: [...] }.
export function placeBoards(stage, list) {
  const lay = layoutOf(stage);
  list.forEach(([b, spots]) => { const s = spots[lay] || spots.wide; b.mesh.position.set(s[0], s[1], s[2]); b.mesh.scale.setScalar(s[3] ?? 1); b.mesh.rotation.y = s[4] ?? 0; b.mesh.visible = s[3] !== 0; });
  return lay;
}
// Pick a camera view by layout: v = { pos, target, narrow?: {pos, target}, tall?: {pos, target} }.
export function viewFor(stage, v) { const lay = layoutOf(stage); return v[lay] || v; }

// Apply a chapter's phone view once, after the app has set the wide one.
export function viewFixer(stage, view) {
  let done = false;
  return () => {
    if (done) return; done = true;
    const lay = layoutOf(stage);
    if (lay !== 'wide' && view[lay] && !inReel()) stage.setView(view[lay].pos, view[lay].target, 0.01);
  };
}

// Focus switcher: show one group of a chapter at a time and fly the camera there.
export function focuser(stage, groups, views) {
  let cur = '';
  return (f, force = false) => {
    if (f === cur && !force) return false;
    cur = f;
    for (const k in groups) groups[k].visible = k === f;
    if (!inReel()) { const v = viewFor(stage, views[f]); stage.setView(v.pos, v.target, 1.0); }
    return true;
  };
}

// Densities (kg/m³), the same values BuoyancyClear uses (/buoyancyclear/): fresh water 1000,
// sea water 1025; bony-fish tissue without the bladder about 1076 (Alexander 1966, Biol Rev 41: 141).
export const RHO = { fresh: 1000, sea: 1025, tissue: 1076, squalene: 858 };
export const G0 = 9.81, P_ATM = 101325;

// Put a board at base (world position) and nudge it so it stays inside the picture: off the right
// and top edges, and clear of the readout box in the upper left. Works for any screen shape.
const _v = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3();
export function fitBoard(stage, mesh, base, scale = 1) {
  const cam = stage.camera;
  // On a phone the readout fills the top of the stage, so chart boards would hide behind it: drop them.
  mesh.visible = layoutOf(stage) !== 'narrow';
  if (!mesh.visible) return;
  mesh.position.set(...base); mesh.scale.setScalar(scale); mesh.updateMatrixWorld(true);
  const p = mesh.geometry.parameters, hw = p.width / 2, hh = p.height / 2;
  cam.updateMatrixWorld(); _r.setFromMatrixColumn(cam.matrixWorld, 0); _u.setFromMatrixColumn(cam.matrixWorld, 1);
  for (let it = 0; it < 3; it++) {
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      _v.set(sx * hw, sy * hh, 0).applyMatrix4(mesh.matrixWorld).project(cam);
      x0 = Math.min(x0, _v.x); x1 = Math.max(x1, _v.x); y0 = Math.min(y0, _v.y); y1 = Math.max(y1, _v.y);
    }
    const wN = x1 - x0, hN = y1 - y0;
    if (wN > 1.25 || hN > 0.9) { const k = Math.min(1.25 / wN, 0.9 / hN); mesh.scale.multiplyScalar(k); mesh.updateMatrixWorld(true); continue; }
    let dx = 0, dy = 0;
    if (x1 > 0.97) dx = 0.97 - x1; if (x0 + dx < -0.97) dx = -0.97 - x0;
    if (y1 > 0.86) dy = 0.86 - y1;
    // Keep clear of the readout box in the upper left (roughly x < 0.2, y > 0.3 of the view).
    if (x0 + dx < 0.2 && y1 + dy > 0.3 && y0 + dy < 0.98) {
      if (wN > 0.77) { mesh.scale.multiplyScalar(0.77 / wN); mesh.updateMatrixWorld(true); continue; }
      dx = 0.2 - x0;
    }
    if (!dx && !dy) break;
    const d = mesh.position.distanceTo(cam.position), th = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * d;
    mesh.position.addScaledVector(_r, dx * th * cam.aspect).addScaledVector(_u, dy * th);
    mesh.updateMatrixWorld(true);
  }
}

// In the tall 9:16 reel the stage backs the camera off a long way; zoom in so the model fills the frame.
export function reelZoom(stage, z) {
  const lay = layoutOf(stage), want = lay === 'tall' ? z : 1;
  if (stage.camera.zoom !== want) { stage.camera.zoom = want; stage.camera.updateProjectionMatrix(); }
  // On a phone the readout covers the top of the stage, so drop the picture lower.
  const y = lay === 'narrow' ? -0.24 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
}
