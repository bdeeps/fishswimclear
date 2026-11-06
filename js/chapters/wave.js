// Chapter 2: the body wave. Muscles shorten in a wave down each side, the body bends in a travelling
// wave that grows towards the tail, and the tail throws water backwards, leaving a trail of
// swirls (a reverse Kármán street). Speed, Strouhal number and slip come from swimModel() in fish.js:
//   U = k f L g(A): stride per beat after Bainbridge (1958, J Exp Biol 35: 109), about 0.75 L per beat
//                   for carp-like fish beating their tails through about 0.2 L.
//   St = f A / U:   Taylor, Nudds & Thomas (2003, Nature 425: 707): cruising swimmers and fliers sit at
//                   St 0.2–0.4, where propulsive efficiency peaks.
//   slip = U / (f λ): how much of the backward wave speed turns into forward speed (Gray 1933; Videler 1993).
// The fish is 30 cm long in every body type so you compare like with like. The picture is slowed
// down whenever the tail beats faster than 1.5 times a second.
import { THREE, M, approach, clamp } from '../kit.js';
import { Fish, TYPES, swimModel, waveZ, effShape, makeSpecks, makeWake, board, panel, head, txt, COL, placeBoards, layoutOf, viewFixer, fitBoard, reelZoom } from '../fish.js';

const S = 4.4, LF = 0.3;      // scene length and real length (m)
const fmtSt = (St) => St.toFixed(2);
const verdict = (St) => (St < 0.2 ? 'too low: little thrust' : St > 0.4 ? 'too high: wasted swirls' : 'efficient zone');

export default {
  id: 'wave',
  short: 'The body wave',
  title: 'The wave that pushes a fish',
  subtitle: 'A bend that runs down the body to the tail, and pushes water back.',
  view: { pos: [-2.0, 9.4, 3.6], target: [-2.0, 1.0, -0.9], narrow: { pos: [0.4, 4.2, 9.0], target: [0.4, 1.9, 0] } },
  learn: `<p>A fish does not paddle. It <b>bends</b>. The myomeres on one side shorten, then the ones just behind them, then the next, so a bend runs down the body from head to tail like a ripple down a rope. A moment later the other side does the same. This is the <b>body wave</b>.</p>
    <p>The wave travels <b>backwards</b> faster than the fish moves forwards, and it grows bigger towards the tail. Each part of the body slides sideways against the water at a slant, a bit like a hand pushing water behind you. The water is shoved back, so the fish goes forward: Newton’s third law.</p>
    <p>Fish use this wave in different ways. An <b>eel</b> throws its whole body into the wave. A <b>carp</b> like the rohu keeps its head steady and bends mostly the back half. A <b>tuna</b> keeps a stiff, torpedo body and flicks only a narrow tail stalk and a sickle-shaped tail.</p>
    <p>Every flick leaves a <b>swirl</b> (a vortex) in the water, alternating left and right. Between them squirts a <b>jet</b> of water going backwards. Good swimmers time their tail beats so that tail beats × tail swing ÷ speed, the <b>Strouhal number</b>, stays between about <b>0.2 and 0.4</b>. Dolphins, sharks, fish and even birds land in that zone. (<a href="/waveclear/">WaveClear</a> has more on travelling waves.)</p>
    <p class="tip"><b>Try it:</b> turn up the tail beats and watch the speed. Then make the swing very small or very large and watch the Strouhal number leave the green zone.</p>`,
  terms: [
    { t: 'Body wave', d: 'A bend that travels from head to tail along a swimming fish, growing as it goes.' },
    { t: 'Tail-beat frequency', d: 'How many times a second the tail swings left and right and back.' },
    { t: 'Vortex', d: 'A swirl of spinning water. A swimming fish leaves a trail of them behind its tail.' },
    { t: 'Strouhal number', d: 'Tail beats per second × width of the tail swing ÷ speed. Efficient swimmers keep it between about 0.2 and 0.4.' },
    { t: 'Anguilliform, carangiform, thunniform', d: 'Eel-like, jack-like and tuna-like swimming: from the whole body bending to only the tail.' },
  ],
  defaults: { body: 'carp', f: 3, A: 0.2, wake: true, muscles: true },
  controls: [
    { key: 'body', type: 'seg', label: 'Body type', options: [{ v: 'eel', label: 'Eel' }, { v: 'carp', label: 'Carp' }, { v: 'tuna', label: 'Tuna' }], fmt: (v) => TYPES[v].name },
    { key: 'f', type: 'range', label: 'Tail beats per second', min: 0.5, max: 10, step: 0.1, fmt: (v) => v.toFixed(1) + ' Hz' },
    { key: 'A', type: 'range', label: 'Tail swing (side to side)', min: 0.04, max: 0.36, step: 0.01, fmt: (v) => Math.round(v * 100) + '% of length', hint: 'Bainbridge found most fish swing the tail about one fifth of their length.' },
    { key: 'wake', type: 'toggle', label: 'Show the swirls in the wake' },
    { key: 'muscles', type: 'toggle', label: 'Show which side is pulling' },
  ],
  quiz: [
    { q: 'Which way does the body wave travel along a swimming fish?', options: ['From tail to head', 'From head to tail', 'It stays in one place', 'Up and down'], answer: 1, why: 'The bend runs backwards, from head to tail, and pushes water back. The fish goes the other way.' },
    { q: 'A tuna swims mostly by…', options: ['Bending its whole body like an eel', 'Flicking a narrow tail stalk and stiff tail', 'Flapping its pectoral fins', 'Squirting water from its gills'], answer: 1, why: 'Tunas keep a stiff body and swing only the tail stalk and a sickle-shaped tail. It suits fast, long cruising.' },
    { q: 'A fish beats its tail 4 times a second with a 6 cm swing and swims at 0.8 m/s. What is its Strouhal number?', options: ['0.03', '0.3', '3', '30'], answer: 1, why: 'St = 4 × 0.06 ÷ 0.8 = 0.3, right in the efficient zone of 0.2 to 0.4.' },
  ],
  reel: [
    { ms: 5400, caption: 'A fish swims by bending: a wave runs down its body and grows towards the tail.', set: { body: 'carp', A: 0.2, wake: false, muscles: true }, anim: { f: [1, 3] }, view: { pos: [0.6, 3.6, 6.4], target: [-0.2, 1.2, 0] }, spin: 0 },
    { ms: 5200, caption: 'Every flick sheds a swirl, and a jet of water between them pushes the fish forward.', set: { body: 'carp', f: 3, A: 0.2, wake: true, muscles: false }, anim: {}, view: { pos: [-0.5, 7.6, 4.0], target: [-0.5, 1.0, 0] }, spin: 0 },
    { ms: 5600, caption: 'Eels bend all over, tunas flick just the tail, and good swimmers keep Strouhal near 0.3.', set: { body: 'tuna', f: 4, wake: true, muscles: false }, anim: { A: [0.08, 0.22] }, view: { pos: [-0.8, 4.2, 7.6], target: [-1.4, 1.4, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const fishes = {};
    for (const k of ['eel', 'carp', 'tuna']) { const f = new Fish({ type: k, S }); f.group.position.y = 1.4; f.group.visible = false; root.add(f.group); fishes[k] = f; }
    // Water: a glassy flow tank with drifting specks.
    const tank = new THREE.Mesh(new THREE.BoxGeometry(14, 3.2, 4.4), M.clear(0x5fb4ff, 0.06)); tank.position.set(-2, 1.4, 0); tank.castShadow = false; tank.receiveShadow = false; root.add(tank);
    const specks = makeSpecks(260, [-9, 5, 0.1, 2.9, -2.1, 2.1]); root.add(specks.mesh);
    const wake = makeWake(16); wake.group.position.y = 1.4; root.add(wake.group);
    // Muscle activity: dots along each side that swell where that side is shortening.
    const NM = 22, act = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 10, 6), M.glow(0xff5a5a, { transparent: true, opacity: 0.95 }), NM * 2);
    act.instanceMatrix.setUsage(THREE.DynamicDrawUsage); act.position.y = 1.4; root.add(act);
    const tmp = new THREE.Object3D();
    const lbl = {
      head: stage.label('Head: small swing', [0, 0, 0], root), tail: stage.label('Tail: big swing', [0, 0, 0], root, 'hot'),
      flow: stage.label('Water flows past (flow tank)', [3.8, 2.9, 1.6], root), wake: stage.label('Swirls and backward jet', [-5.6, 2.4, 0], root, 'hot'),
    };

    // Board: the midline at eight moments of one beat, and the Strouhal gauge.
    const cur = { type: 'carp', A: 0.2, St: 0.3 };
    const chart = board(root, 4.6, 2.9, 760, 480, (g, w, h) => {
      panel(g, w, h);
      const T = TYPES[cur.type];
      head(g, 'One tail beat, eight moments', `${T.name}: the bend grows towards the tail`);
      const x0 = 40, x1 = w - 40, yc = 190, sc = 620;
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, yc); g.lineTo(x1, yc); g.stroke();
      // envelope
      g.strokeStyle = 'rgba(255,181,71,.6)'; g.setLineDash([8, 6]);
      for (const sg of [1, -1]) { g.beginPath(); for (let i = 0; i <= 60; i++) { const xi = i / 60, x = x0 + (x1 - x0) * xi, y = yc - sg * sc * 0.5 * cur.A * T.env(xi); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      g.setLineDash([]);
      for (let k = 0; k < 8; k++) {
        g.strokeStyle = `hsla(${190 + k * 12},90%,${55 + k * 3}%,.85)`; g.lineWidth = 3; g.beginPath();
        for (let i = 0; i <= 60; i++) { const xi = i / 60, x = x0 + (x1 - x0) * xi, y = yc - sc * waveZ(cur.type, cur.A, 1, k / 8, xi); i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      }
      txt(g, 'head', x0, yc + 26, COL.soft, '17px sans-serif'); txt(g, 'tail', x1 - 30, yc + 26, COL.soft, '17px sans-serif');
      // Strouhal gauge 0–0.8
      const gx0 = 40, gx1 = w - 40, gy = 360, X = (v) => gx0 + (gx1 - gx0) * clamp(v / 0.8, 0, 1);
      txt(g, 'Strouhal number = tail beats × swing ÷ speed', gx0, gy - 26, COL.text, 'bold 20px sans-serif');
      g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(gx0, gy, gx1 - gx0, 26);
      g.fillStyle = 'rgba(92,225,169,.45)'; g.fillRect(X(0.2), gy, X(0.4) - X(0.2), 26);
      for (const v of [0, 0.2, 0.4, 0.6, 0.8]) txt(g, v.toFixed(1), X(v) - 12, gy + 52, COL.soft, '17px sans-serif');
      txt(g, 'efficient 0.2–0.4', X(0.2) + 6, gy + 19, '#0b1a12', 'bold 16px sans-serif');
      const xs = X(cur.St); g.fillStyle = cur.St >= 0.2 && cur.St <= 0.4 ? COL.up : COL.down;
      g.beginPath(); g.moveTo(xs, gy - 4); g.lineTo(xs - 10, gy - 18); g.lineTo(xs + 10, gy - 18); g.fill(); g.fillRect(xs - 2, gy, 4, 26);
      txt(g, `St ${fmtSt(cur.St)}: ${verdict(cur.St)}`, gx0, gy + 92, cur.St >= 0.2 && cur.St <= 0.4 ? COL.up : COL.down, 'bold 21px sans-serif');
    }, [2.2, 4.4, -1.6]);
    let drawn = '';

    let tt = 0, prevV = 0, prevZ = 0, shown = '';
    const fixView = viewFixer(stage, this.view);
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        reelZoom(stage, 1.3);
        fixView();
        const lay = placeBoards(stage, [[chart, { wide: [0.9, 2.2, -3.5, 1.0, 0], narrow: [0.4, 4.95, -1.2, 0.95], tall: [-0.2, 4.3, -1.4, 0.95] }]]);
        chart.mesh.rotation.x = lay === 'wide' ? -1.0 : 0;
        fitBoard(stage, chart.mesh, chart.mesh.position.toArray(), chart.mesh.scale.x);
        if (shown !== s.body) { for (const k in fishes) fishes[k].group.visible = k === s.body; shown = s.body; wake.clear(); }
        const fish = fishes[s.body];
        const slow = Math.min(1, 1.5 / s.f);
        tt += dt * slow;
        fish.pose((xi) => waveZ(s.body, s.A, s.f, tt, xi));
        const m = swimModel(s.body, s.f, s.A, LF);
        const Ud = (m.U / LF) * S * slow;          // scene units per second, slowed like the picture
        specks.update(dt, () => [-Ud, 0, 0]);
        // Shed a vortex each time the tail tip turns round.
        const tip = fish.at(1.0), v = (tip.z - prevZ) / Math.max(1e-4, dt);
        if (dt > 0 && Math.sign(v) !== Math.sign(prevV) && Math.abs(tip.z) > 0.05 && s.wake) {
          const side = Math.sign(tip.z);
          wake.shed(tip.x - 0.1, 0, tip.z, side, clamp(0.16 * s.A * S + 0.05, 0.1, 0.4));
        }
        if (dt > 0) { prevV = v; prevZ = tip.z; }
        wake.group.visible = s.wake;
        wake.update(dt, Ud * 0.85 + 0.2, 2.6 / Math.max(0.5, s.f * slow));
        // Muscle dots
        act.visible = s.muscles;
        if (s.muscles) {
          const T = TYPES[s.body];
          const cv = [];
          for (let i = 0; i < NM; i++) {
            const xi = 0.12 + (i / (NM - 1)) * (T.BODY - 0.14), d = 0.012;
            cv.push((waveZ(s.body, s.A, s.f, tt, xi - d) - 2 * waveZ(s.body, s.A, s.f, tt, xi) + waveZ(s.body, s.A, s.f, tt, xi + d)) / (d * d) / Math.max(0.05, T.env(xi)));
          }
          const cmax = Math.max(1e-6, ...cv.map(Math.abs));
          for (let i = 0; i < NM; i++) {
            const xi = 0.12 + (i / (NM - 1)) * (T.BODY - 0.14), c = fish.at(xi), [nx, nz] = fish.nrmAt(xi);
            const curv = cv[i] / cmax;           // > 0: bent with the +z side on the inside (that side shortens)
            const wd = (s.body === 'eel' ? 0.04 : 0.07) * S;
            for (const sd of [1, -1]) {
              const on = clamp(sd * curv, 0, 1);
              tmp.position.set(c.x + nx * sd * wd * 0.9, 0.02, c.z + nz * sd * wd * 0.9); tmp.scale.setScalar(on > 0.25 ? 0.3 + 0.6 * on : 0.001); tmp.updateMatrix();
              act.setMatrixAt(i * 2 + (sd > 0 ? 0 : 1), tmp.matrix);
            }
          }
          act.instanceMatrix.needsUpdate = true;
        }
        const h0 = fish.at(0.02), t1 = fish.at(1);
        lbl.head.position.set(h0.x + 0.2, 1.4 + 0.75, h0.z); lbl.tail.position.set(t1.x, 1.4 + (s.body === 'tuna' ? 1.15 : 0.9), t1.z);
        lbl.wake.visible = s.wake && lay !== 'narrow'; lbl.flow.visible = lay === 'wide';
        cur.type = s.body; cur.A = s.A; cur.St = m.St;
        const key = s.body + s.A.toFixed(3) + m.St.toFixed(3);
        if (key !== drawn) { chart.redraw(); drawn = key; }
      },
      readout: (s) => {
        const m = swimModel(s.body, s.f, s.A, LF), slow = Math.min(1, 1.5 / s.f);
        const muscle = m.bls < 3 ? 'red muscle: cruising' : m.bls < 6 ? 'white muscle joining in' : 'white muscle: a sprint';
        return `<div class="big">${m.U.toFixed(2)} m/s, ${(m.U * 3.6).toFixed(1)} km/h</div>
          <div class="row"><span>Body lengths a second</span><b>${m.bls.toFixed(1)}</b></div>
          <div class="row"><span>Distance per tail beat</span><b>${(m.stride * 100).toFixed(0)}% of length</b></div>
          <div class="row"><span>Strouhal number</span><b>${fmtSt(m.St)} (${verdict(m.St)})</b></div>
          <div class="row"><span>Body wave runs back at</span><b>${m.c.toFixed(2)} m/s (fish keeps ${Math.round(m.slip * 100)}%)</b></div>
          <div class="row"><span>Muscle at work</span><b>${muscle}</b></div>
          <small>A 30 cm fish. Speed model after Bainbridge (1958); eel and tuna strides approximate.${slow < 1 ? ` Shown ${(1 / slow).toFixed(1)}× slower.` : ''}</small>`;
      },
    };
  },
};
