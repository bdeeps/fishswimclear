// Chapter 5: fish and people. Three scenes:
// 1. Overfishing, with the textbook surplus-production model (Schaefer 1954): the stock B grows as
//    dB/dt = r B (1 − B/K) − F B, where F is the share of the stock caught each year. At steady state
//    B = K (1 − F/r) and the catch is F B, largest (the maximum sustainable yield, r K / 4) when
//    F = r/2. Numbers here are illustrative (r = 0.6 a year, K = 100 units), not any real stock.
// 2. India's uniform fishing ban: 61 days a year in the EEZ beyond territorial waters, mechanised
//    and motorised boats only (traditional non-motorised craft exempt): east coast 15 April–14 June,
//    west coast 1 June–31 July (Department of Fisheries orders, e.g. 2026; Lok Sabha replies).
//    States set their own bans within territorial waters (12 nautical miles), on similar dates.
// 3. Dams and fish passes: a dam blocks fish swimming upstream to breed; a fish pass (fish ladder)
//    is a staircase of pools with small drops that fish can leap or swim up. The golden mahseer,
//    hurt by Himalayan dams, is listed Endangered by IUCN (2018 assessment).
import { THREE, M, approach, clamp, swarm, box } from '../kit.js';
import { Fish, waveZ, board, panel, head, txt, wrap, COL, focuser, layoutOf, fitBoard, reelZoom } from '../fish.js';

const R = 0.6, K = 100;
const VIEWS = {
  fishing: { pos: [-0.8, 4.6, 10.5], target: [-1.2, 1.6, 0] },
  ban: { pos: [-0.6, 4.0, 9.5], target: [-0.8, 1.8, 0] },
  dam: { pos: [-1.0, 4.5, 10.0], target: [-1.2, 1.4, 0] },
};
const DOY = (m, d) => [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][m - 1] + d;   // day of year (non-leap)
const EAST = [DOY(4, 15), DOY(6, 14)], WEST = [DOY(6, 1), DOY(7, 31)];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dateOf = (doy) => { const c = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; let m = 0; while (doy > c[m]) { doy -= c[m]; m++; } return `${Math.round(doy)} ${MON[m]}`; };

export default {
  id: 'people',
  short: 'Fish and people',
  title: 'Fish and people',
  subtitle: 'Catching fish without running out, a monsoon break, and ladders round dams.',
  view: VIEWS.fishing,
  learn: `<p>Fish stocks <b>regrow</b>, but only so fast. Catch a little and the stock refills every year. Catch too much and each year there are fewer parents, fewer young and smaller catches: <b>overfishing</b>. The model here is the classic one fisheries scientists start with: the biggest catch you can take year after year, the <b>maximum sustainable yield</b>, comes from a stock kept at about <b>half</b> its natural size.</p>
    <p>Many fish breed in the monsoon. So India closes its seas to mechanised and motorised fishing boats for <b>61 days</b> a year: <b>15 April to 14 June</b> on the east coast and <b>1 June to 31 July</b> on the west coast, beyond the coastal waters that each state manages with its own ban. Traditional boats without motors may still fish.</p>
    <p><b>Dams</b> and barrages block fish that swim upriver to breed, like hilsa and mahseer. A <b>fish pass</b> or <b>fish ladder</b> is a staircase of small pools beside the dam. Each step is low enough for a fish to leap or swim up, resting in each pool.</p>
    <p class="tip"><b>Try it:</b> raise the fishing pressure past the middle and watch the catch fall even as the boats work harder. Then slide through the year to see which coast is resting.</p>`,
  terms: [
    { t: 'Stock', d: 'All the fish of one kind in one area that fishing depends on.' },
    { t: 'Maximum sustainable yield', d: 'The biggest catch that can be taken every year without shrinking the stock.' },
    { t: 'Overfishing', d: 'Catching fish faster than they can breed and grow, so the stock shrinks.' },
    { t: 'Fishing ban', d: 'A closed season when boats may not fish, to protect fish while they breed.' },
    { t: 'Fish pass', d: 'A channel or staircase of pools that lets fish get past a dam or weir.' },
  ],
  defaults: { focus: 'fishing', F: 0.2, day: DOY(6, 5), ladder: true },
  onChange(s, key) {
    if (key === 'F') s.focus = 'fishing';
    if (key === 'day') s.focus = 'ban';
    if (key === 'ladder') s.focus = 'dam';
  },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'fishing', label: 'Overfishing' }, { v: 'ban', label: 'Monsoon ban' }, { v: 'dam', label: 'Dams' }] },
    { key: 'F', type: 'range', label: 'Fishing pressure: share caught each year', min: 0, max: 0.6, step: 0.01, fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'day', type: 'range', label: 'Ban: date', min: 1, max: 365, step: 1, fmt: (v) => dateOf(v) },
    { key: 'ladder', type: 'toggle', label: 'Dam: build a fish pass' },
  ],
  quiz: [
    { q: 'In the simple fisheries model, when is the yearly catch biggest in the long run?', options: ['When almost no fish are left', 'When the stock is kept at about half its natural size', 'When nobody fishes', 'When boats fish all year at full power'], answer: 1, why: 'At about half size the stock regrows fastest, so the most fish can be taken each year without it shrinking.' },
    { q: 'When is India’s fishing ban on the west coast?', options: ['1 January to 28 February', '15 April to 14 June', '1 June to 31 July', 'All year'], answer: 2, why: 'The west coast closes from 1 June to 31 July, during the monsoon; the east coast from 15 April to 14 June.' },
    { q: 'What does a fish ladder do?', options: ['Feeds fish below the dam', 'Gives fish a staircase of pools to swim past a dam', 'Catches fish for counting only', 'Makes electricity'], answer: 1, why: 'Each step is a small climb, so fish can work their way upstream past the dam.' },
  ],
  reel: [
    { ms: 5000, caption: 'Catch more than a stock can regrow, and next year’s catch is smaller, not bigger.', set: { focus: 'fishing' }, anim: { F: [0.15, 0.55] }, view: { pos: [-0.8, 4.2, 8.0], target: [-1.0, 2.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const G = { fishing: new THREE.Group(), ban: new THREE.Group(), dam: new THREE.Group() };
    for (const k in G) root.add(G[k]);
    const L = (h, p, par, c = '') => stage.label(h, p, par, c);
    let seed = 9; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    // ---------------------------------------------------------------- fishing: a sea patch, a school and a trawler
    const sea = new THREE.Mesh(new THREE.BoxGeometry(9, 2.6, 4), M.clear(0x2f86c8, 0.12)); sea.position.set(-1.2, 1.3, 0); sea.castShadow = false; G.fishing.add(sea);
    const NF = 140, school = swarm(NF, new THREE.SphereGeometry(0.11, 10, 6).scale(1.8, 0.6, 0.5), M.metal(0xcfd8e2, { roughness: 0.25 }));
    G.fishing.add(school);
    const fp = Array.from({ length: NF }, () => ({ a: rnd() * 6.28, r: 0.3 + rnd() * 2.6, y: 0.4 + rnd() * 1.6, ph: rnd() * 6.28, k: rnd() }));
    const boat = new THREE.Group(); { const hull = box(1.4, 0.35, 0.55, M.plastic(0xd8573a)); hull.position.y = 0.18; const cab = box(0.45, 0.35, 0.4, M.plastic(0xf0f0f0)); cab.position.set(0.2, 0.52, 0); boat.add(hull, cab); } boat.position.set(1.5, 2.6, 0.5); G.fishing.add(boat);
    const net = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 16, 1, true), M.ghost(0xffffff, 0.25)); net.rotation.z = Math.PI / 2; G.fishing.add(net);
    const chart = board(G.fishing, 4.4, 2.8, 720, 460, (g, w, h, s) => {
      panel(g, w, h); if (!s) return;
      head(g, 'Catch you can take every year', 'Textbook model (Schaefer 1954), illustrative numbers');
      const x0 = 70, x1 = w - 30, y0 = h - 70, y1 = 90, X = (f) => x0 + (f / 0.6) * (x1 - x0), Y = (v) => y0 - (v / 100) * (y0 - y1);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
      for (const f of [0, 0.15, 0.3, 0.45, 0.6]) txt(g, Math.round(f * 100) + '%', X(f) - 14, y0 + 26, COL.soft, '17px sans-serif');
      txt(g, 'fishing pressure (share caught each year)', x0 + 120, y0 + 54, COL.soft, '17px sans-serif');
      const line = (fn, col, sc) => { g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); for (let i = 0; i <= 60; i++) { const f = (i / 60) * 0.6, v = fn(f) * sc; i ? g.lineTo(X(f), Y(v)) : g.moveTo(X(f), Y(v)); } g.stroke(); };
      line((f) => Math.max(0, K * (1 - f / R)), COL.cool, 1);
      line((f) => f * Math.max(0, K * (1 - f / R)), COL.hot, 100 / 15 * 0.9);
      txt(g, 'stock left', x0 + 10, Y(96), COL.cool, 'bold 19px sans-serif'); txt(g, 'yearly catch', X(0.24), Y(96), COL.hot, 'bold 19px sans-serif');
      g.setLineDash([6, 6]); g.strokeStyle = 'rgba(92,225,169,.7)'; g.beginPath(); g.moveTo(X(R / 2), y1); g.lineTo(X(R / 2), y0); g.stroke(); g.setLineDash([]);
      txt(g, 'best long-run catch', X(R / 2) + 6, y1 + 50, COL.up, '17px sans-serif');
      g.fillStyle = '#fff'; g.beginPath(); g.arc(X(s.F), Y(s.F * Math.max(0, K * (1 - s.F / R)) * (100 / 15) * 0.9), 9, 0, 6.28); g.fill();
    }, [3.2, 3.9, -1.6]);

    // ---------------------------------------------------------------- ban: a calendar and two harbours
    const cal = board(G.ban, 6.4, 2.6, 900, 360, (g, w, h, s) => {
      panel(g, w, h); if (!s) return;
      head(g, 'India’s 61-day fishing ban', 'Mechanised and motorised boats, beyond state waters');
      const x0 = 150, x1 = w - 30, X = (d) => x0 + ((d - 1) / 364) * (x1 - x0);
      MON.forEach((m, i) => txt(g, m, X(DOY(i + 1, 1)) + 4, 110, COL.soft, '17px sans-serif'));
      [['East coast', EAST, 160], ['West coast', WEST, 240]].forEach(([n, [a, b], y]) => {
        txt(g, n, 20, y + 6, COL.text, 'bold 20px sans-serif');
        g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x0, y - 18, x1 - x0, 34);
        g.fillStyle = 'rgba(255,122,89,.8)'; g.fillRect(X(a), y - 18, X(b) - X(a), 34);
        txt(g, n.startsWith('East') ? '15 Apr – 14 Jun' : '1 Jun – 31 Jul', X(b) + 10, y + 6, COL.down, '17px sans-serif');
      });
      g.strokeStyle = COL.hot; g.lineWidth = 4; g.beginPath(); g.moveTo(X(s.day), 125); g.lineTo(X(s.day), 270); g.stroke();
      txt(g, dateOf(s.day), X(s.day) - 24, 300, COL.hot, 'bold 19px sans-serif');
    }, [-0.8, 3.6, -1.5]);
    const harb = [-1, 1].map((sd) => {
      const g = new THREE.Group(); g.position.set(-0.8 + sd * 2.6, 0, 1.0); G.ban.add(g);
      const wat = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), M.plastic(0x2f6fa8, { roughness: 0.15 })); wat.rotation.x = -Math.PI / 2; wat.position.y = 0.01; g.add(wat);
      const pier = box(0.4, 0.15, 2.0, M.matte(0x8a6a4a)); pier.position.set(-sd * 1.4, 0.08, 0); g.add(pier);
      const boats = [0, 1, 2].map((i) => { const b = new THREE.Group(); const h = box(0.7, 0.2, 0.28, M.plastic([0x2f9e6a, 0x3a6fd8, 0xd8a23a][i])); h.position.y = 0.1; const c = box(0.22, 0.2, 0.2, M.plastic(0xf0f0f0)); c.position.set(0.1, 0.28, 0); b.add(h, c); g.add(b); return b; });
      return { g, boats, sd };
    });
    const lblE = L('East coast', [1.8, 0.9, 1.0], G.ban), lblW = L('West coast', [-3.4, 0.9, 1.0], G.ban);

    // ---------------------------------------------------------------- dam and fish pass
    const riverDown = new THREE.Mesh(new THREE.BoxGeometry(5, 0.6, 2.6), M.clear(0x3d9be9, 0.4)); riverDown.position.set(1.6, 0.3, 0); riverDown.castShadow = false; G.dam.add(riverDown);
    const riverUp = new THREE.Mesh(new THREE.BoxGeometry(5, 2.4, 2.6), M.clear(0x3d9be9, 0.4)); riverUp.position.set(-4.0, 1.2, 0); riverUp.castShadow = false; G.dam.add(riverUp);
    const dam = box(0.7, 2.9, 2.6, M.matte(0xb8bec6)); dam.position.set(-1.2, 1.45, 0); G.dam.add(dam);
    // Fish pass: a staircase of pools along the near side (z = +1.8), climbing from the river below to the reservoir.
    const pass = new THREE.Group(); G.dam.add(pass);
    const NSTEP = 7, steps = [];
    for (let i = 0; i < NSTEP; i++) {
      const x = 0.9 - i * 0.62, top = 0.55 + i * 0.3;
      const basin = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.7), M.clear(0x6cc4ff, 0.5)); basin.position.set(x, top - 0.12, 1.75); basin.castShadow = false; pass.add(basin);
      const wall = box(0.05, top, 0.7, M.matte(0x9aa2ac)); wall.position.set(x + 0.3, top / 2, 1.75); pass.add(wall);
      const floor = box(0.6, top - 0.25, 0.7, M.matte(0x7d858f)); floor.position.set(x, (top - 0.25) / 2, 1.75); pass.add(floor);
      steps.push([x, top]);
    }
    const ND = 14, dfish = [];
    for (let i = 0; i < ND; i++) { const f = new Fish({ type: 'carp', S: 0.45, rings: 20, seg: 10, colors: ['#5e5a40', '#c2a65a', '#efe2b0'], fins: 0xc87a4a }); G.dam.add(f.group); dfish.push({ f, p: rnd() * 1, ph: rnd() * 6.28, z: (rnd() - 0.5) * 1.6, y: 0.15 + rnd() * 0.3 }); }
    const lblDam = L('Dam', [-1.2, 3.2, 0], G.dam), lblPass = L('Fish pass: a staircase of pools', [-1.2, 2.8, 2.2], G.dam, 'hot');

    const info = board(root, 3.6, 1.6, 640, 280, (g, w, h, s) => {
      panel(g, w, h); if (!s) return;
      head(g, s.ladder ? 'With a fish pass' : 'No way past', 'Mahseer, hilsa and carps swim upriver to breed');
      wrap(g, s.ladder ? 'Fish climb from pool to pool, a small step at a time, and reach the river above the dam.' : 'Fish gather below the dam wall and cannot reach their breeding grounds upstream.', 22, 110, w - 44, 30, COL.text, '21px sans-serif');
    }, [2.4, 3.8, -1.6]);
    let infoKey = '', calKey = '', chartKey = '';

    const focus = focuser(stage, G, VIEWS);
    let t = 0, B = K * (1 - 0.2 / R);
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        reelZoom(stage, 1.35); t += dt;
        focus(s.focus);
        const lay = layoutOf(stage);
        info.mesh.visible = s.focus === 'dam';
        if (s.focus === 'dam') fitBoard(stage, info.mesh, lay === 'wide' ? [2.0, 3.8, -1.8] : [-1.0, 4.4, -1.6]);
        if (s.focus === 'fishing') {
          // Stock follows the model, one model year per second.
          const yrs = dt * 1.0; B = clamp(B + (R * B * (1 - B / K) - s.F * B) * yrs, 0.5, K);
          const n = Math.round(NF * B / K);
          for (let i = 0; i < NF; i++) { const p = fp[i], a = p.a + t * 0.3 * (p.k > 0.5 ? 1 : -1); school.place(i, [-1.2 + Math.cos(a) * p.r * 1.3, p.y + 0.1 * Math.sin(t + p.ph), Math.sin(a) * p.r * 0.55], [0, -a + (p.k > 0.5 ? -Math.PI / 2 : Math.PI / 2), 0], i < n ? 1 : 0.001); }
          school.done();
          boat.position.x = 1.5 - (t * 0.4 % 6); boat.position.y = 2.6 + Math.sin(t * 1.5) * 0.04;
          net.position.set(boat.position.x + 1.4, 1.6, 0.5); net.scale.setScalar(0.4 + s.F * 1.6); net.visible = s.F > 0.01;
          const ck = s.F.toFixed(3); if (ck !== chartKey) { chartKey = ck; chart.redraw(s); }
          fitBoard(stage, chart.mesh, lay === 'wide' ? [2.4, 3.9, -2.0] : [-1.2, 5.2, -1.6]);
        }
        if (s.focus === 'ban') {
          const ck = Math.round(s.day); if (ck !== calKey) { calKey = ck; cal.redraw(s); }
          fitBoard(stage, cal.mesh, [-0.8, 3.6, -1.5]);
          const closed = { e: s.day >= EAST[0] && s.day <= EAST[1], w: s.day >= WEST[0] && s.day <= WEST[1] };
          harb.forEach((h) => {
            const shut = h.sd > 0 ? closed.e : closed.w;
            h.boats.forEach((b, i) => {
              const tx = shut ? -h.sd * 1.0 : h.sd * (0.2 + 0.5 * i) + Math.sin(t * 0.5 + i) * 0.2, tz = shut ? -0.6 + i * 0.6 : -0.7 + i * 0.7;
              b.position.x = approach(b.position.x, tx, 1.5, dt); b.position.z = approach(b.position.z, tz, 1.5, dt); b.position.y = Math.sin(t * 2 + i) * 0.02;
            });
          });
          lblE.element.textContent = `East coast: ${closed.e ? 'ban on' : 'fishing'}`; lblW.element.textContent = `West coast: ${closed.w ? 'ban on' : 'fishing'}`;
        }
        if (s.focus === 'dam') {
          const k = String(s.ladder); if (k !== infoKey) { infoKey = k; info.redraw(s); }
          pass.visible = s.ladder; lblPass.visible = s.ladder;
          dfish.forEach((d, i) => {
            let x, y, z, yaw = Math.PI;
            if (s.ladder) {
              d.p = (d.p + dt * 0.05) % 1;
              const u = d.p * (NSTEP + 3);
              if (u < 1.5) { x = 3.2 - u * 1.4; y = d.y + 0.1; z = d.z * 0.6 + u * 0.5; }
              else if (u < NSTEP + 1.5) { const j = Math.min(NSTEP - 1, Math.floor(u - 1.5)), fr = (u - 1.5) - Math.floor(u - 1.5); const [sx, st] = steps[j]; x = sx + 0.2 - fr * 0.4; y = st - 0.05 + (fr > 0.8 ? (fr - 0.8) * 5 * 0.3 + Math.sin((fr - 0.8) * 5 * Math.PI) * 0.15 : 0); z = 1.75; }
              else { const v = u - NSTEP - 1.5; x = -3.2 - v * 1.2; y = 1.2 + d.y; z = d.z * 0.6; }
            } else { x = -0.3 + ((d.ph * 0.4 + Math.sin(t * 0.7 + d.ph) * 0.4 + 0.4)); y = d.y + 0.05; z = d.z * 0.8; yaw = Math.PI + Math.sin(t + d.ph) * 0.6; }
            d.f.group.position.set(x, y, z); d.f.group.rotation.y = yaw; d.f.pose((xi) => waveZ('carp', 0.18, 2, t + d.ph, xi));
          });
        }
      },
      readout(s) {
        if (s.focus === 'ban') {
          const e = s.day >= EAST[0] && s.day <= EAST[1], w = s.day >= WEST[0] && s.day <= WEST[1];
          return `<div class="big">${dateOf(s.day)}: ${e && w ? 'both coasts closed' : e ? 'east coast closed' : w ? 'west coast closed' : 'both coasts open'}</div>
            <div class="row"><span>East coast ban</span><b>15 Apr – 14 Jun</b></div><div class="row"><span>West coast ban</span><b>1 Jun – 31 Jul</b></div>
            <small>Department of Fisheries, Government of India. Traditional non-motorised craft are exempt.</small>`;
        }
        if (s.focus === 'dam') return `<div class="big">${s.ladder ? 'Fish get past the dam' : 'Fish blocked by the dam'}</div><div class="row"><span>Golden mahseer (IUCN)</span><b>Endangered</b></div><small>Dams are the main threat named in its 2018 assessment.</small>`;
        const Beq = Math.max(0, K * (1 - s.F / R)), Y = s.F * Beq, MSY = (R * K) / 4;
        return `<div class="big">Catch ${Y.toFixed(1)} a year (best ${MSY.toFixed(0)})</div>
          <div class="row"><span>Stock it settles at</span><b>${Math.round(Beq)}% of natural size</b></div>
          <div class="row"><span>Fishing pressure</span><b>${Math.round(s.F * 100)}% a year</b></div>
          <div class="row"><span>Verdict</span><b>${s.F > R / 2 + 0.03 ? 'overfished: less catch for more work' : s.F < R / 2 - 0.05 ? 'light: stock healthy' : 'near the best long-run catch'}</b></div>
          <small>Schaefer (1954) model, regrowth 60% a year, illustrative.</small>`;
      },
    };
  },
};
