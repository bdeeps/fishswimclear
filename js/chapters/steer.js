// Chapter 3: staying up and steering. Five scenes, one at a time:
// 1. Swim bladder. A 1 kg bony fish with tissue of 1076 kg/m³ (the BuoyancyClear figure, after
//    Alexander 1966) has 929 cm³ of flesh. To weigh exactly as much as the water it displaces it
//    needs a bladder of m/ρw − m/ρt: 70.6 cm³ (7.1% of its volume) in fresh water at 1000 kg/m³,
//    46.2 cm³ (4.7%) in sea water at 1025 kg/m³. If it dives without adding gas, Boyle's law squeezes
//    the gas: V = V0 × P0 ÷ P, with P = 1 atm + ρ g d (SubmarineClear makes the same point).
// 2. Sharks have no swim bladder. Their big liver is rich in squalene oil, density 0.858 g/cm³
//    (a chemistry handbook value), so each litre gives (1.025 − 0.858) kg ≈ 167 g of lift in sea
//    water. In leopard sharks the pectoral fins make almost no lift in steady swimming; the body
//    tilts a little nose-up instead, and the fins are used to start turns, rises and dives
//    (Wilga & Lauder 2000, J Exp Biol 203: 2261).
// 3. Pectoral fins brake, turn and hover (drawn qualitatively).
// 4. C-start: a sudden sound or touch fires one of the two giant Mauthner cells in the hindbrain,
//    within roughly 5–10 ms (secondary sources), which bends the body into a C away from the threat,
//    then a tail stroke throws it clear. Timings drawn here are approximate.
// 5. Schooling and the lateral line: blindfolded saithe could still school, while fish with the
//    lateral line cut swam closer and sometimes bumped (Partridge & Pitcher 1980, J Comp Physiol
//    135: 315; Pitcher, Partridge & Wardle 1976, Science 194: 963).
import { THREE, M, approach, clamp, swarm, sphere } from '../kit.js';
import { Fish, waveZ, RHO, G0, P_ATM, board, panel, head, txt, wrap, COL, focuser, layoutOf, viewFor, inReel, fitBoard, reelZoom } from '../fish.js';

const MASS = 1.0;                                   // kg
const Vt = (MASS / RHO.tissue) * 1e6;               // cm³ of flesh, 929
const Vneed = (rho) => (MASS / rho) * 1e6 - Vt;     // cm³ of gas for neutral buoyancy at the surface
const pAt = (rho, d) => P_ATM + rho * G0 * d;
export function bladder(s) {
  const rho = s.water === 'sea' ? RHO.sea : RHO.fresh;
  const V0 = Vneed(rho), P = pAt(rho, s.depth);
  const V = s.adjust ? V0 : (V0 * P_ATM) / P;
  const net = (rho * (Vt + V) / 1e6 - MASS) * 1000;  // grams of upward force (positive = up)
  return { rho, V0, V, P, net, dens: MASS / ((Vt + V) / 1e6), pct: (V / (Vt + V)) * 100 };
}

const VIEWS = {
  bladder: { pos: [-0.8, 3.4, 11.5], target: [-0.8, 2.7, 0], narrow: { pos: [0.9, 3.4, 10.5], target: [0.9, 2.9, 0] } },
  shark: { pos: [-1.2, 3.0, 9.0], target: [-1.6, 1.8, 0] },
  fins: { pos: [-1.0, 7.5, 6.5], target: [-1.6, 1.4, 0] },
  cstart: { pos: [-1.0, 10.5, 3.5], target: [-1.4, 1.2, -0.6] },
  school: { pos: [-1.0, 9.5, 8.5], target: [-1.6, 1.2, 0] },
};

export default {
  id: 'steer',
  short: 'Up, down, turn',
  title: 'Staying up and steering',
  subtitle: 'A bag of gas, an oily liver, fins for brakes, a lightning escape and a sixth sense.',
  view: VIEWS.bladder,
  learn: `<p>Fish flesh and bone are a little <b>denser than water</b>, so a fish would slowly sink. Most bony fish carry a <b>swim bladder</b>, a bag of gas, just big enough to make the whole fish weigh the same as the water it pushes aside. Then it hangs still, like a submarine with its ballast tanks trimmed (<a href="/submarineclear/">SubmarineClear</a>, <a href="/buoyancyclear/">BuoyancyClear</a>). Sea water is denser than river water, so a sea fish needs a smaller bladder: about 5% of its body instead of 7%.</p>
    <p>Dive deeper and the water squeezes the gas, so the fish gets heavier and sinks unless it adds gas from its blood. That is slow, so fish that dash up and down a lot often have small bladders or none.</p>
    <p><b>Sharks</b> have no swim bladder at all. Instead they have a huge <b>liver</b> full of light oil. They also keep swimming: a slightly nose-up body and an upturned tail help hold them up. Experiments with leopard sharks found their big <b>pectoral fins</b> make almost no lift in steady swimming; they are used to start turns, climbs and dives.</p>
    <p>Bony fish use their <b>pectoral fins</b> as brakes and oars: spread both to stop, one to turn, scull them to hover. For a real emergency there is the <b>C-start</b>: a sudden noise fires one giant nerve cell, the <b>Mauthner cell</b>, the body snaps into a C away from the danger and the tail flings it clear, all in a few hundredths of a second.</p>
    <p>In a <b>school</b>, each fish keeps its place with its eyes and its <b>lateral line</b>, which feels the water pushed by its neighbours. Blindfolded fish can still school.</p>
    <p class="tip"><b>Try it:</b> take the fish deep without adding gas and watch the bladder shrink. Then startle a fish, and switch off the senses of a school.</p>`,
  terms: [
    { t: 'Neutral buoyancy', d: 'Weighing exactly as much as the water you displace, so you neither sink nor rise.' },
    { t: 'Boyle’s law', d: 'Squeeze a gas to twice the pressure and it shrinks to half the volume.' },
    { t: 'Squalene', d: 'A light oil, about 0.86 g/cm³, stored in many sharks’ livers to help them float.' },
    { t: 'C-start', d: 'A fish’s fastest escape: the body bends into a C, then the tail flicks it away.' },
    { t: 'Mauthner cell', d: 'One of a pair of giant nerve cells in a fish’s hindbrain that trigger the escape.' },
    { t: 'School', d: 'A group of fish swimming together in step, each keeping its distance from its neighbours.' },
  ],
  defaults: { focus: 'bladder', water: 'fresh', depth: 0, adjust: true, oil: 4, move: 'brake', side: 'left', senses: 'both' },
  onChange(s, key) {
    if (['water', 'depth', 'adjust'].includes(key)) s.focus = 'bladder';
    if (key === 'oil') s.focus = 'shark';
    if (key === 'move') s.focus = 'fins';
    if (key === 'side') s.focus = 'cstart';
    if (key === 'senses') s.focus = 'school';
  },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'bladder', label: 'Swim bladder' }, { v: 'shark', label: 'Shark' }, { v: 'fins', label: 'Fins' }, { v: 'cstart', label: 'Escape' }, { v: 'school', label: 'School' }] },
    { key: 'water', type: 'seg', label: 'Swim bladder: water', options: [{ v: 'fresh', label: 'River (fresh)' }, { v: 'sea', label: 'Sea' }] },
    { key: 'depth', type: 'range', label: 'Swim bladder: dive to', min: 0, max: 40, step: 0.5, fmt: (v) => v.toFixed(v < 10 ? 1 : 0) + ' m' },
    { key: 'adjust', type: 'toggle', label: 'Swim bladder: fish adds gas as it dives' },
    { key: 'oil', type: 'range', label: 'Shark: oil in its liver', min: 0, max: 10, step: 0.1, fmt: (v) => v.toFixed(1) + ' litres' },
    { key: 'move', type: 'seg', label: 'Fins: what to do', options: [{ v: 'cruise', label: 'Cruise' }, { v: 'brake', label: 'Brake' }, { v: 'turn', label: 'Turn' }, { v: 'hover', label: 'Hover' }] },
    { key: 'side', type: 'seg', label: 'Escape: noise from the', options: [{ v: 'left', label: 'Left' }, { v: 'right', label: 'Right' }] },
    { key: 'kick', type: 'buttons', label: 'Escape', items: [{ label: 'Startle the fish', act: (s, inst) => { s.focus = 'cstart'; inst.startle?.(); } }] },
    { key: 'senses', type: 'seg', label: 'School: senses working', options: [{ v: 'both', label: 'Eyes + lateral line' }, { v: 'line', label: 'Lateral line only' }, { v: 'eyes', label: 'Eyes only' }] },
  ],
  quiz: [
    { q: 'Why does a sea fish need a smaller swim bladder than a river fish?', options: ['Sea fish are lighter', 'Sea water is denser, so it holds the fish up more', 'Salt fills the bladder', 'Sea fish never sink'], answer: 1, why: 'Sea water (about 1.025 g/cm³) pushes up harder than fresh water, so less gas is needed: about 5% of the body instead of 7%.' },
    { q: 'A fish dives from the surface to 10 m in fresh water without adding gas. Its swim bladder…', options: ['Grows to twice the size', 'Shrinks to about half', 'Stays the same', 'Fills with water'], answer: 1, why: 'At 10 m the pressure is about 2 atmospheres, so by Boyle’s law the gas is squeezed to about half. The fish gets heavier.' },
    { q: 'How do most sharks avoid sinking without a swim bladder?', options: ['They breathe air into their stomach', 'An oily liver plus swimming with a slight nose-up tilt and an upturned tail', 'Their bones are full of gas', 'They never stop flapping their fins'], answer: 1, why: 'Light liver oil reduces their weight in water, and swimming does the rest. Their pectoral fins mainly steer.' },
  ],
  reel: [
    { ms: 5200, caption: 'A swim bladder is a bag of gas: dive deeper and the water squeezes it smaller.', set: { focus: 'bladder', water: 'fresh', adjust: false }, anim: { depth: [0, 30] }, view: { pos: [0.9, 3.3, 7.4], target: [0.9, 2.6, 0] }, spin: 0 },
    { ms: 5000, caption: 'Startled, a fish snaps into a C and flicks away in a few hundredths of a second.', set: { focus: 'cstart', side: 'left' }, act: (s, inst) => inst.startle?.(true), anim: {}, view: { pos: [-1.0, 8.8, 2.4], target: [-1.0, 1.2, -0.4] }, spin: 0 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    const G = {}; for (const k of Object.keys(VIEWS)) { G[k] = new THREE.Group(); root.add(G[k]); }

    // ---------------------------------------------------------------- 1. swim bladder
    const tankH = 5.2, tankY0 = 0.1;
    const TX = 0.9;
    const tank = new THREE.Mesh(new THREE.BoxGeometry(3.4, tankH, 2.4), M.clear(0x3d9be9, 0.12)); tank.position.set(TX, tankY0 + tankH / 2, 0); tank.castShadow = false; G.bladder.add(tank);
    const tankMat = tank.material;
    const bf = new Fish({ type: 'carp', S: 2.6, inner: true, opacity: 0.35 }); bf.skinMat.depthWrite = false; bf.inner.muscle.visible = false;
    bf.inner.spine.visible = bf.inner.ribs.visible = false; bf.inner.gut.visible = false; bf.inner.gills.visible = false; bf.inner.brain.visible = false;
    G.bladder.add(bf.group);
    const DMAX = 40, yOf = (d) => tankY0 + tankH - 0.6 - (d / DMAX) * (tankH - 1.2);
    for (let d = 0; d <= 40; d += 10) { const tk = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.02), M.glow(0xffffff, { transparent: true, opacity: 0.5 })); tk.position.set(TX + 1.85, yOf(d), 1.2); G.bladder.add(tk); stage.label(`${d} m`, [TX + 2.3, yOf(d), 1.2], G.bladder, 'small'); }
    const arrowMat = M.glow(0x5ce1a9); const netArrow = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10), arrowMat), tipA = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 12), arrowMat);
    netArrow.add(shaft, tipA); G.bladder.add(netArrow);
    const lblB = stage.label('', [0, 0, 0], G.bladder, 'hot');
    const lblBl = stage.label('Swim bladder', [0, 0, 0], G.bladder);

    // ---------------------------------------------------------------- 2. shark
    const shark = new Fish({ type: 'shark', S: 4.6, opacity: 0.55 }); shark.skinMat.depthWrite = false; shark.group.position.y = 1.8; G.shark.add(shark.group);
    const liver = sphere(1, M.plastic(0xd89a3a, { roughness: 0.5 }), 24); G.shark.add(liver);
    const lblLiver = stage.label('Oily liver', [0, 0, 0], G.shark, 'hot');
    const lblPec = stage.label('Pectoral fins: steer, start climbs and dives', [0, 0, 0], G.shark);
    const lblTail = stage.label('Upturned tail', [0, 0, 0], G.shark);
    const liftA = new THREE.Group(); { const m = M.glow(0x5ce1a9); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10), m), tp = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 12), m); liftA.add(sh, tp); liftA.userData = { sh, tp }; } G.shark.add(liftA);

    // ---------------------------------------------------------------- 3. fins
    const ff = new Fish({ type: 'carp', S: 3.6 }); ff.group.position.y = 1.4; G.fins.add(ff.group);
    const finArrows = [0, 1].map(() => { const g = new THREE.Group(), m = M.glow(0xffb547); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), m); sh.rotation.z = Math.PI / 2; sh.position.x = 0.5; const tp = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.25, 10), m); tp.rotation.z = -Math.PI / 2; tp.position.x = 1.1; g.add(sh, tp); G.fins.add(g); return g; });
    const lblFin = stage.label('', [0, 0, 0], G.fins, 'hot');

    // ---------------------------------------------------------------- 4. C-start
    const cf = new Fish({ type: 'carp', S: 3.4, inner: true }); cf.group.position.y = 1.2; G.cstart.add(cf.group);
    cf.inner.muscle.visible = cf.inner.spine.visible = cf.inner.ribs.visible = cf.inner.bladder.visible = cf.inner.gut.visible = cf.inner.gills.visible = false;
    const mcells = [1, -1].map((sd) => { const m = sphere(0.09, M.glow(0x8ef0ff, { transparent: true, opacity: 0.25 }), 12); G.cstart.add(m); return m; });
    const ripple = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 48), M.glow(0xffb547, { transparent: true, opacity: 0.9 })); ripple.rotation.x = Math.PI / 2; G.cstart.add(ripple);
    const lblM = stage.label('Mauthner cell fires', [0, 0, 0], G.cstart, 'hot');
    const lblC = stage.label('', [0, 0, 0], G.cstart);

    // ---------------------------------------------------------------- 5. school
    const NS = 28;
    const sBody = swarm(NS, new THREE.SphereGeometry(0.22, 14, 8).scale(1, 0.42, 0.28), M.plastic(0xb8c6cf, { roughness: 0.35, metalness: 0.3 }));
    const sTail = swarm(NS, new THREE.ConeGeometry(0.1, 0.18, 3).rotateZ(Math.PI / 2).scale(1, 1, 0.25), M.plastic(0x9aa8b2));
    G.school.add(sBody, sTail);
    const leader = new Fish({ type: 'carp', S: 0.9, lineGlow: true }); leader.group.position.y = 1.3; G.school.add(leader.group);
    const lblS = stage.label('Its lateral line feels the water its neighbours push', [0, 0, 0], G.school, 'hot');
    const slots = []; { let seed = 3; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); for (let i = 0; i < NS; i++) slots.push({ ang: (i / NS) * Math.PI * 2 + r() * 0.15, rad: 2.2 + (i % 3) * 0.45 + r() * 0.1, y: 1.0 + ((i * 7) % 5) * 0.14, ph: r() * 6.28, n: r() }); }

    // ---------------------------------------------------------------- the info board
    const info = board(root, 4.2, 2.4, 700, 400, (g, w, h, s) => {
      panel(g, w, h); if (!s) return;
      if (s.focus === 'shark') {
        head(g, 'Floating on oil', 'Squalene 0.86 g/cm³ against sea water 1.025');
        const lift = s.oil * (1.025 - 0.858) * 1000;
        txt(g, `${s.oil.toFixed(1)} L of liver oil holds up ${Math.round(lift)} g`, 22, 120, COL.up, 'bold 26px sans-serif');
        wrap(g, 'A bony fish gets the same help from a much smaller bag of gas: 1 litre of gas in the sea lifts about 1,025 g, six times as much as a litre of oil. But oil does not shrink when the shark dives deep.', 22, 170, w - 44, 28);
      } else if (s.focus === 'fins') {
        head(g, 'Pectoral fins: brakes and oars', 'Spread both to stop, one to turn, scull to hover');
        wrap(g, { cruise: 'Fins tucked flat against the body: less drag while the tail does the work.', brake: 'Both pectoral fins swing out like air brakes. Water piles up in front of them and the fish stops in about a body length.', turn: 'One pectoral fin spreads while the other stays tucked, and the body bends. The fish pivots towards the spread fin.', hover: 'The pectoral fins scull back and forth, gently, to hold the fish in one spot.' }[s.move], 22, 120, w - 44, 30, COL.text, '22px sans-serif');
      } else if (s.focus === 'school') {
        head(g, 'How a school keeps together', 'Partridge & Pitcher, saithe experiments, 1980');
        wrap(g, { both: 'With eyes and lateral line, each fish keeps a steady gap and matches its neighbours’ speed and heading.', line: 'Blindfolded, saithe still schooled, keeping almost their normal place: the lateral line was enough.', eyes: 'With the lateral line cut, fish swam closer to their neighbours and now and then bumped into them.' }[s.senses], 22, 120, w - 44, 30, COL.text, '22px sans-serif');
      } else if (s.focus === 'cstart') {
        head(g, 'The C-start escape', 'Shown about 40 times slower');
        const st = ['1. Noise or touch on one side', '2. Mauthner cell on that side fires', '3. Muscles on the far side contract: a C', '4. The tail sweeps back: away it goes'];
        st.forEach((t, i) => txt(g, t, 22, 120 + i * 40, i <= (s._stage ?? -1) ? COL.hot : COL.soft, '22px sans-serif'));
        txt(g, 'Whole escape: a few hundredths of a second', 22, 300, COL.text, 'bold 21px sans-serif');
      } else {
        const b = bladder(s);
        head(g, `Swim bladder of a 1 kg fish, ${s.water === 'sea' ? 'sea' : 'river'} water`, `${s.adjust ? 'Fish adds gas as it dives' : 'Gas fixed at the surface amount'}`);
        const bars = [['Flesh and bone', Vt, '#f1d8cf'], ['Gas needed to hover', b.V0, COL.cool], ['Gas now', b.V, b.V < b.V0 * 0.98 ? COL.down : COL.up]];
        bars.forEach(([t, v, c], i) => { const y = 100 + i * 64; txt(g, t, 22, y, COL.soft, '19px sans-serif'); g.fillStyle = c; g.fillRect(260, y - 20, (v / 1000) * 380, 26); txt(g, `${Math.round(v)} cm³`, 270 + (v / 1000) * 380, y, COL.text, 'bold 19px sans-serif'); });
        txt(g, `Pressure ${(b.P / P_ATM).toFixed(2)} atm · fish ${(b.dens / 1000).toFixed(3)} g/cm³ · water ${(b.rho / 1000).toFixed(3)}`, 22, 300, COL.text, '19px sans-serif');
        txt(g, Math.abs(b.net) < 0.5 ? 'Hovers' : b.net > 0 ? `Floats up with ${b.net.toFixed(0)} g of lift` : `Sinks: ${(-b.net).toFixed(0)} g too heavy`, 22, 350, Math.abs(b.net) < 0.5 ? COL.up : COL.down, 'bold 24px sans-serif');
      }
    }, [2.6, 3.6, -1.2]);
    let infoKey = '';

    const focus = focuser(stage, G, VIEWS);
    let t = 0, cT = -1, cPos = new THREE.Vector3(), cYaw = 0;
    const inst = {
      startle() { cT = 0; cPos.set(0, 0, 0); cYaw = 0; },
      update(dt, s) {
        dt = Math.max(0, dt);
        reelZoom(stage, 1.45); t += dt;
        focus(s.focus);
        const lay = layoutOf(stage);
        // board placement per scene and layout
        const bp = { bladder: [-3.3, 1.6, 0.6], shark: [1.6, 4.2, -2.0], fins: [1.6, 3.3, -2.6], cstart: [1.6, 2.2, -3.2], school: [1.8, 3.6, -3.6] }[s.focus];
        const nb = { bladder: [TX, 6.9, -0.5], shark: [0, 4.6, -1.6], fins: [0, 4.2, -2.6], cstart: [0, 2.4, -3.6], school: [0, 4.4, -3.6] }[s.focus];
        info.mesh.rotation.x = ['fins', 'cstart', 'school'].includes(s.focus) ? -0.9 : 0;
        fitBoard(stage, info.mesh, lay === 'wide' ? bp : nb, lay === 'wide' ? 1 : 0.95);
        const key = JSON.stringify([s.focus, s.water, s.depth.toFixed(1), s.adjust, s.oil.toFixed(1), s.move, s.senses, s._stage]);
        if (key !== infoKey) { infoKey = key; info.redraw(s); }

        if (s.focus === 'bladder') {
          const b = bladder(s);
          tankMat.color.setHex(s.water === 'sea' ? 0x2f86c8 : 0x3d9be9);
          bf.pose((xi) => waveZ('carp', 0.05, 0.8, t, xi));
          const y = yOf(s.depth); bf.group.position.set(TX, y, 0);
          bf.setBladder(b.V / Vneed(RHO.fresh));
          const n = clamp(b.net / 30, -1, 1);
          netArrow.visible = Math.abs(b.net) > 0.5;
          const len = 0.3 + Math.abs(n) * 1.2; shaft.scale.y = len; shaft.position.y = (Math.sign(n) * len) / 2; tipA.position.y = Math.sign(n) * (len + 0.15); tipA.rotation.z = n < 0 ? Math.PI : 0;
          arrowMat.color.setHex(n > 0 ? 0x5ce1a9 : 0xff7a59);
          netArrow.position.set(TX, y + (n > 0 ? 0.5 : -0.5), 0.9);
          lblB.position.set(TX - 0.6, y + 0.9, 0); lblB.element.textContent = Math.abs(b.net) < 0.5 ? 'hovers' : b.net > 0 ? 'rises' : 'sinks';
          const cb = bf.at(0.33); lblBl.position.set(TX + cb.x, y - 0.55, 0.6);
        }
        if (s.focus === 'shark') {
          shark.pose((xi) => waveZ('shark', 0.14, 0.7, t, xi));
          const c = shark.at(0.38); const r = Math.cbrt(Math.max(0.05, s.oil) / 4);
          liver.position.set(c.x, 1.8 - 0.06, c.z); liver.scale.set(0.62 * r, 0.17 * r, 0.16 * r); liver.rotation.y = shark.yaw(0.38);
          lblLiver.position.set(c.x, 1.8 - 0.7, c.z + 0.4);
          const p = shark.at(0.3); lblPec.position.set(p.x - 0.2, 1.8 - 0.55, p.z + 1.2);
          const tl = shark.at(0.98); lblTail.position.set(tl.x, 1.8 + 1.2, tl.z);
          const lift = s.oil * 0.167; liftA.visible = lift > 0.02; liftA.position.set(c.x, 1.8 + 0.25, c.z);
          liftA.userData.sh.scale.y = 0.2 + lift * 0.9; liftA.userData.sh.position.y = (0.2 + lift * 0.9) / 2; liftA.userData.tp.position.y = 0.2 + lift * 0.9 + 0.15;
          shark.group.rotation.z = 0.06;     // a little nose-up, as in steady swimming
        }
        if (s.focus === 'fins') {
          const mv = s.move;
          const spreadT = { cruise: 0, brake: 1, turn: 0, hover: 0.5 + 0.35 * Math.sin(t * 5) }[mv];
          ff.pecSpread = approach(ff.pecSpread || 0, spreadT, 6, dt);
          const bend = mv === 'turn' ? 0.35 : 0;
          ff.pose((xi) => (mv === 'cruise' ? waveZ('carp', 0.16, 1.2, t, xi) : mv === 'turn' ? bend * (xi - 0.3) * (xi - 0.3) : waveZ('carp', 0.03, 0.6, t, xi)));
          // In a turn only the outer fin (on the inside of the bend) flares.
          if (mv === 'turn') { const F = ff.fins.pecL; F.m.rotation.set(1.3, 1.1, -0.15); ff.fins.pecR.m.rotation.set(-0.2, -0.1, -0.15); }
          ff.group.rotation.y = mv === 'turn' ? Math.sin(t * 0.8) * 0.0 + (t * 0.5) % (Math.PI * 2) : 0;
          finArrows.forEach((a, i) => { const sd = i ? -1 : 1, fpos = ff.at(0.24), [nx, nz] = ff.nrmAt(0.24); a.visible = mv === 'brake' || (mv === 'turn' && i === 0); a.position.set(fpos.x + nx * sd * 0.6, 1.3, fpos.z + nz * sd * 0.6); a.rotation.set(0, 0, 0); });
          const g = ff.group; finArrows.forEach((a) => { a.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y); a.rotation.y = g.rotation.y + Math.PI; });
          lblFin.position.set(0.9, 2.2, 0.8); lblFin.element.textContent = { cruise: 'Fins tucked in', brake: 'Both fins out: brakes', turn: 'One fin out: turn', hover: 'Fins sculling: hover' }[mv];
        }
        if (s.focus === 'cstart') {
          const SLOW = 40;                         // shown 40× slower
          if (cT >= 0) cT += dt / SLOW;
          const sd = s.side === 'left' ? 1 : -1;  // the fish's left is −z; it turns away from the noise
          const ms = cT * 1000;
          // Approximate phases (ms after the sound): Mauthner cell fires ~8, C forms by ~25, tail stroke to ~50.
          let zf, stg = -1;
          const ripR = cT >= 0 ? Math.min(2.6, 0.2 + ms * 0.08) : 0;
          ripple.visible = cT >= 0 && ms < 40; ripple.scale.setScalar(ripR); ripple.material.opacity = 0.9 * (1 - ms / 40);
          ripple.position.set(cf.group.position.x + 0.6, 1.2, cf.group.position.z - sd * 2.4);
          if (cT < 0 || ms > 160) { zf = (xi) => waveZ('carp', 0.08, 0.8, t, xi); if (ms > 160) cT = -1; }
          else {
            stg = ms < 8 ? 0 : ms < 10 ? 1 : ms < 28 ? 2 : 3;
            const kC = clamp((ms - 10) / 18, 0, 1), kB = clamp((ms - 28) / 22, 0, 1);
            const C = (xi) => sd * 1.1 * (xi - 0.42) * (xi - 0.42) - sd * 0.08;
            zf = (xi) => (kB < 1 ? C(xi) * (kC - kB * 1.6 * kC) : 0) + kB * waveZ('carp', 0.22 * (1 - clamp((ms - 60) / 100, 0, 1)), 1.4, ms / 1000 * 3, xi);
            // Body turns and shoots off in the stroke phase.
            cYaw = -sd * 0.9 * clamp((ms - 12) / 30, 0, 1);
            const sp = clamp((ms - 30) / 20, 0, 1) * 0.55 * dt;   // scene units per displayed second
            cPos.x += Math.cos(cYaw) * sp; cPos.z -= Math.sin(cYaw) * sp;
          }
          if (cT < 0) { cPos.multiplyScalar(Math.max(0, 1 - dt * 2)); cYaw *= Math.max(0, 1 - dt * 2); }
          cf.group.position.set(-1.2 + cPos.x, 1.2, cPos.z); cf.group.rotation.y = cYaw;
          cf.pose(zf);
          s._stage = stg >= 0 ? stg : cT < 0 ? -1 : 3;
          const hb = cf.at(0.09);
          mcells.forEach((m, i) => { const side = i ? -1 : 1, on = stg >= 1 && stg <= 2 && side === -sd; m.position.set(hb.x, 0.15, hb.z + side * 0.08); m.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), cYaw); m.position.add(cf.group.position); m.material.opacity = on ? 1 : 0.25; m.scale.setScalar(on ? 1.6 : 1); });
          lblM.visible = stg >= 1 && stg <= 2; lblM.position.copy(mcells[sd > 0 ? 1 : 0].position).add(new THREE.Vector3(0, 0.5, 0));
          lblC.visible = cT < 0; lblC.position.set(-1.2, 2.2, 0); lblC.element.textContent = 'Press “Startle the fish”';
        }
        if (s.focus === 'school') {
          const jitter = s.senses === 'eyes' ? 0.28 : s.senses === 'line' ? 0.08 : 0.04;
          const squeeze = s.senses === 'eyes' ? 0.82 : 1;
          const tmp = new THREE.Object3D();
          for (let i = 0; i < NS; i++) {
            const sl = slots[i], a = sl.ang + t * 0.35, r = sl.rad * squeeze + jitter * Math.sin(t * (1.3 + sl.n) + sl.ph);
            const x = -1.6 + Math.cos(a) * r, z = Math.sin(a) * r, y = sl.y + jitter * 0.5 * Math.sin(t * 1.7 + sl.ph);
            const yaw = -a - Math.PI / 2 + jitter * 0.8 * Math.sin(t * 2.1 + sl.ph);
            sBody.place(i, [x, y, z], [0, yaw + Math.PI, 0]);
            const tw = Math.sin(t * 9 + sl.ph) * 0.5;
            tmp.position.set(x, y, z); tmp.rotation.set(0, yaw + Math.PI, 0); tmp.translateX(-0.27); tmp.rotation.y += tw; tmp.updateMatrix(); sTail.setMatrixAt(i, tmp.matrix);
          }
          sBody.done(); sTail.instanceMatrix.needsUpdate = true;
          const a = t * 0.35 + 0.4, r = 2.65;
          leader.group.position.set(-1.6 + Math.cos(a) * r, 1.3, Math.sin(a) * r); leader.group.rotation.y = -a - Math.PI / 2 + Math.PI;
          leader.pose((xi) => waveZ('carp', 0.18, 1.5, t, xi));
          lblS.position.copy(leader.group.position).add(new THREE.Vector3(0, 0.6, 0)); lblS.visible = lay !== 'narrow';
        }
      },
      readout: (s) => {
        if (s.focus === 'shark') {
          const lift = s.oil * (1.025 - 0.858) * 1000;
          return `<div class="big">${Math.round(lift)} g of lift from oil</div>
            <div class="row"><span>Oil in the liver</span><b>${s.oil.toFixed(1)} L</b></div>
            <div class="row"><span>Squalene vs sea water</span><b>0.858 vs 1.025 g/cm³</b></div>
            <div class="row"><span>Swim bladder</span><b>none</b></div>
            <small>Pectoral fins: almost no lift in steady swimming (Wilga &amp; Lauder 2000).</small>`;
        }
        if (s.focus === 'fins') return `<div class="big">${{ cruise: 'Cruising', brake: 'Braking', turn: 'Turning', hover: 'Hovering' }[s.move]}</div><div class="row"><span>Pectoral fins</span><b>${{ cruise: 'tucked', brake: 'both spread', turn: 'one spread', hover: 'sculling' }[s.move]}</b></div>`;
        if (s.focus === 'cstart') return `<div class="big">C-start escape</div><div class="row"><span>Nerve to muscle</span><b>one giant Mauthner cell</b></div><div class="row"><span>Whole escape</span><b>a few hundredths of a second</b></div><small>Timings in the animation are approximate.</small>`;
        if (s.focus === 'school') return `<div class="big">${{ both: 'A tight, tidy school', line: 'Blindfolded: still schooling', eyes: 'No lateral line: bumpy' }[s.senses]}</div><div class="row"><span>Senses</span><b>${{ both: 'eyes + lateral line', line: 'lateral line only', eyes: 'eyes only' }[s.senses]}</b></div>`;
        const b = bladder(s);
        return `<div class="big">${Math.abs(b.net) < 0.5 ? 'Hovering' : b.net > 0 ? 'Rising' : 'Sinking'}</div>
          <div class="row"><span>Swim bladder</span><b>${Math.round(b.V)} cm³ (${b.pct.toFixed(1)}% of the fish)</b></div>
          <div class="row"><span>Needed to hover</span><b>${Math.round(b.V0)} cm³ in ${s.water === 'sea' ? 'sea' : 'fresh'} water</b></div>
          <div class="row"><span>Water pressure</span><b>${(b.P / P_ATM).toFixed(2)} atm</b></div>
          <div class="row"><span>Net force</span><b>${Math.abs(b.net) < 0.5 ? '0' : (b.net > 0 ? '+' : '−') + Math.abs(b.net).toFixed(0)} g</b></div>
          <small>A 1 kg fish; flesh 1.076 g/cm³ as in BuoyancyClear.</small>`;
      },
    };
    return inst;
  },
};
