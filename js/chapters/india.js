// Chapter 4: India's fish. Three scenes:
// 1. A carp pond. India's "composite fish culture" stocks the three Indian major carps together
//    because they feed at different depths: catla at the surface (zooplankton), rohu in the middle
//    (plants and plankton), mrigal on the bottom (detritus). ICAR extension guidance gives a stocking
//    ratio of catla : rohu : mrigal = 4 : 3 : 3 (ICAR-KVK North Goa, "Composite fish culture";
//    TNAU Agritech). Hatchery seed became possible after Hiralal Chaudhuri and K. H. Alikunhi bred
//    Indian major carps by pituitary injection on 10 July 1957 in Odisha, now National Fish Farmers'
//    Day (ICAR; Vikaspedia).
// 2. The hilsa's river run. Hilsa (Tenualosa ilisha) live in the sea and swim up rivers to spawn;
//    in the Ganga the peak upstream run comes with the monsoon, July–August, continuing to
//    October–November (ICAR-CIFRI, as reported). Hilsa once reached Prayagraj (Allahabad); after the Farakka barrage began working in 1975 the catch upstream fell almost to
//    zero (ICAR news, "Joint efforts towards re-establishing hilsa fishery in river Ganga after
//    four decades"). From 2019 the Inland Waterways Authority opened the Farakka navigation lock at
//    night during the run to let hilsa through, and CIFRI has released young hilsa above the barrage.
//    Distances on the model are schematic.
// 3. Mudskippers of the Sundarbans mudflats (e.g. the blue-spotted mudskipper Boleophthalmus
//    boddarti, studied there). On land they "crutch": both pectoral fins swing forward together and
//    lift the body (barred mudskipper study, J Anat 2024). Out of water they take in oxygen through
//    the skin and the lining of the mouth and gill chambers, so they must stay moist.
import { THREE, M, approach, clamp, swarm, box } from '../kit.js';
import { Fish, waveZ, board, panel, head, txt, wrap, COL, focuser, layoutOf, fitBoard, reelZoom } from '../fish.js';

const VIEWS = {
  pond: { pos: [-0.6, 3.6, 11.0], target: [-1.0, 1.9, 0], narrow: { pos: [0, 4.4, 13.5], target: [0, 2.6, 0] } },
  river: { pos: [-2.0, 9.0, 9.0], target: [-1.5, 0, -0.5] },
  mud: { pos: [-1.6, 2.5, 5.8], target: [-1.6, 0.6, 0] },
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Share of the run under way in each month (0–1), schematic: peaks July–August, tails into November.
const RUN = [0, 0, 0, 0.05, 0.1, 0.4, 1, 1, 0.8, 0.6, 0.35, 0.05];

export default {
  id: 'india',
  short: 'India’s fish',
  title: 'India’s fish: carp ponds, hilsa and mudskippers',
  subtitle: 'Three carps sharing one pond, a fish that swims up the Ganga, and one that walks.',
  view: VIEWS.pond,
  learn: `<p>India is the world’s <b>second-largest fish producer</b>, and about three quarters of its fish come from inland waters: rivers, lakes and ponds. The stars of the ponds are three <b>Indian major carps</b>. <b>Catla</b>, with its big upturned mouth, feeds near the surface. <b>Rohu</b> feeds in the middle. <b>Mrigal</b> grubs along the bottom. Stock all three together, as ICAR’s fish scientists recommend, and they share one pond without fighting over food. This is <b>composite fish culture</b>.</p>
    <p>For centuries farmers had to catch baby carps in rivers. On <b>10 July 1957</b>, in Odisha, <b>Hiralal Chaudhuri</b> and <b>K. H. Alikunhi</b> got carps to spawn in ponds with a hormone injection. That date is now <b>National Fish Farmers’ Day</b>.</p>
    <p>The <b>hilsa</b> (ilish) lives in the sea but swims up rivers to spawn, mostly in the monsoon. In the Ganga it once reached Prayagraj. In <b>1975</b> the <b>Farakka barrage</b> began to block the river, and hilsa almost vanished upstream. Since <b>2019</b> the lock at Farakka has been opened at night in the season to let them pass. The great <b>mahseer</b> of Himalayan rivers is also hurt by dams; the golden mahseer is listed as <b>Endangered</b>.</p>
    <p>In the mangroves of the <b>Sundarbans</b>, <b>mudskippers</b> leave the water at low tide. They walk on their pectoral fins, both at once, like a person on crutches, and breathe through their wet skin and mouth.</p>
    <p class="tip"><b>Try it:</b> put only rohu in the pond and see which food goes to waste. Then slide through the year and watch the hilsa run.</p>`,
  terms: [
    { t: 'Indian major carps', d: 'Catla, rohu and mrigal: the three carps behind most of India’s pond fish.' },
    { t: 'Composite fish culture', d: 'Farming several fish species together that feed at different depths, so a pond’s food is all used.' },
    { t: 'Induced breeding', d: 'Getting fish to spawn on a farm, for example with a hormone injection.' },
    { t: 'Anadromous', d: 'Living in the sea but swimming up rivers to breed, like the hilsa.' },
    { t: 'Barrage', d: 'A low dam with gates across a river, used to hold back or divert water.' },
  ],
  defaults: { focus: 'pond', stock: 'mix', month: 8, barrage: true, lock: true, walk: true },
  onChange(s, key) {
    if (key === 'stock') s.focus = 'pond';
    if (['month', 'barrage', 'lock'].includes(key)) s.focus = 'river';
    if (key === 'walk') s.focus = 'mud';
    if (key === 'barrage' && !s.barrage) s.lock = false;
  },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'pond', label: 'Carp pond' }, { v: 'river', label: 'Hilsa run' }, { v: 'mud', label: 'Mudskipper' }] },
    { key: 'stock', type: 'seg', label: 'Pond: fish stocked', options: [{ v: 'mix', label: 'Catla + rohu + mrigal' }, { v: 'rohu', label: 'Only rohu' }] },
    { key: 'month', type: 'range', label: 'Hilsa: month', min: 1, max: 12, step: 1, fmt: (v) => MONTHS[Math.round(v) - 1] },
    { key: 'barrage', type: 'toggle', label: 'Hilsa: Farakka barrage (1975)' },
    { key: 'lock', type: 'toggle', label: 'Hilsa: lock opened for fish at night (2019)' },
    { key: 'walk', type: 'toggle', label: 'Mudskipper: walk on its fins' },
  ],
  quiz: [
    { q: 'Why do farmers stock catla, rohu and mrigal together?', options: ['They breed with each other', 'They feed at different depths, so they share the pond’s food', 'Rohu eat the other two', 'It keeps the water cold'], answer: 1, why: 'Catla feeds near the surface, rohu in the middle and mrigal on the bottom, so the pond’s food is all used.' },
    { q: 'When does the hilsa mostly swim up the Ganga?', options: ['In winter', 'In the monsoon', 'Only at night in summer', 'It never leaves the sea'], answer: 1, why: 'The upstream run peaks in the monsoon months, July and August, and goes on into autumn.' },
    { q: 'How does a mudskipper move across mud?', options: ['It rolls', 'It swings both pectoral fins forward together, like crutches', 'It slithers like a snake only', 'It glides on its tail'], answer: 1, why: 'Its strong pectoral fins move together and lift the body forward in little hops.' },
  ],
  reel: [
    { ms: 5000, caption: 'In Indian ponds, catla feed at the top, rohu in the middle and mrigal on the bottom.', set: { focus: 'pond', stock: 'mix' }, anim: {}, view: { pos: [-0.6, 3.2, 8.6], target: [-0.9, 2.0, 0] }, spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const G = { pond: new THREE.Group(), river: new THREE.Group(), mud: new THREE.Group() };
    for (const k in G) root.add(G[k]);
    const L = (html, pos, parent, cls = '') => stage.label(html, pos, parent, cls);

    // ---------------------------------------------------------------- pond
    const PW = 9, PH = 3.6, PD = 3.2, py0 = 0.2;
    const water = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, PD), M.clear(0x4f9a7a, 0.16)); water.position.set(-1, py0 + PH / 2, 0); water.castShadow = false; G.pond.add(water);
    const mudBed = box(PW, 0.25, PD, M.matte(0x5a4630)); mudBed.position.set(-1, py0 + 0.12, 0); G.pond.add(mudBed);
    const zones = [['Surface: plankton', py0 + PH - 0.55, 0x9be26a], ['Middle: plants, plankton', py0 + PH / 2, 0x6cc4ff], ['Bottom: detritus', py0 + 0.6, 0xc8955a]];
    const zl = zones.map(([t, y]) => L(t, [-5.9, y, 0], G.pond));
    const foods = zones.map(([, y, c], i) => { const m = swarm(60, new THREE.SphereGeometry(0.035, 6, 4), M.glow(c, { transparent: true, opacity: 0.8 })); m.castShadow = false; G.pond.add(m); return { m, y, used: 1 }; });
    let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const foodP = foods.map(() => Array.from({ length: 60 }, () => [rnd(), rnd(), rnd()]));
    const kinds = {
      catla: { colors: ['#3b4a55', '#8e9ba3', '#e2e6e8'], sy: 1.18, sx: 1.0, zone: 0, n: 4, S: 1.5, fins: 0x6a737a },
      rohu: { colors: ['#4a5a68', '#a7a0a0', '#f0e6e3'], sy: 1.0, sx: 1.0, zone: 1, n: 3, S: 1.4, fins: 0xc0605a },
      mrigal: { colors: ['#59626a', '#b8bcc0', '#f2f2f0'], sy: 0.82, sx: 1.0, zone: 2, n: 3, S: 1.4, fins: 0xd88a6a },
    };
    const pondFish = [];
    for (const k in kinds) for (let i = 0; i < 4; i++) {
      const kd = kinds[k], f = new Fish({ type: 'carp', S: kd.S, rings: 36, seg: 16, colors: kd.colors, fins: kd.fins });
      f.group.scale.y = kd.sy; G.pond.add(f.group);
      pondFish.push({ f, k, i, ph: rnd() * 6.28, sp: 0.25 + rnd() * 0.15, z: (rnd() - 0.5) * 1.6, x0: rnd() * 6 });
    }
    const kl = { catla: L('Catla', [0, 0, 0], G.pond, 'hot'), rohu: L('Rohu', [0, 0, 0], G.pond, 'hot'), mrigal: L('Mrigal', [0, 0, 0], G.pond, 'hot') };

    // ---------------------------------------------------------------- river (schematic)
    // The Ganga drawn as a straight ribbon from the sea (x = +5) to Prayagraj (x = −8).
    const riv = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.2), M.plastic(0x3d8fd6, { roughness: 0.2, transparent: true, opacity: 0.85 })); riv.rotation.x = -Math.PI / 2; riv.position.set(-1.5, 0.02, 0); G.river.add(riv);
    const sea = new THREE.Mesh(new THREE.CircleGeometry(2.4, 40), M.plastic(0x2a6fb8, { roughness: 0.2 })); sea.rotation.x = -Math.PI / 2; sea.position.set(6.5, 0.01, 0); G.river.add(sea);
    const banks = [1, -1].map((sd) => { const b = box(14, 0.12, 0.4, M.matte(0x6f8a4a)); b.position.set(-1.5, 0.06, sd * 0.8); G.river.add(b); return b; });
    const XF = 2.2;   // Farakka
    const barr = box(0.3, 0.5, 1.6, M.matte(0xbfc6cf)); barr.position.set(XF, 0.25, 0); G.river.add(barr);
    const gates = box(0.32, 0.3, 0.5, M.metal(0x8a96a8)); gates.position.set(XF, 0.35, 0.45); G.river.add(gates);
    const places = [['Bay of Bengal', 6.5], ['Farakka barrage', XF], ['Patna', -2.4], ['Prayagraj', -7.8]];
    const pl = places.map(([t, x]) => L(t, [x, 0.6, -1.1], G.river, t.startsWith('Farakka') ? 'hot' : ''));
    const NH = 60, hil = swarm(NH, new THREE.SphereGeometry(0.1, 10, 6).scale(1.6, 0.6, 0.5), M.metal(0xdfe7ef, { roughness: 0.2 }));
    G.river.add(hil);
    const hP = Array.from({ length: NH }, () => ({ x: 6 + rnd() * 1.5, z: (rnd() - 0.5) * 1.6, sp: 0.6 + rnd() * 0.6, go: rnd(), ph: rnd() * 6 }));
    const lblYear = L('', [-1.5, 1.4, 0], G.river);

    // ---------------------------------------------------------------- mudflat
    const mud = new THREE.Mesh(new THREE.PlaneGeometry(12, 6, 40, 20), M.matte(0x5c4a35, { roughness: 0.95 })); mud.rotation.x = -Math.PI / 2; mud.position.set(-1, 0.012, 0); G.mud.add(mud);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.6, 40), M.plastic(0x4a7090, { roughness: 0.1, transparent: true, opacity: 0.85 })); pool.rotation.x = -Math.PI / 2; pool.position.set(2.8, 0.02, -0.6); G.mud.add(pool);
    const roots = []; for (let i = 0; i < 9; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.1, 6), M.matte(0x4a3a2a)); r.position.set(-5 + rnd() * 2.2, 0.5, -2.2 + rnd() * 1.2); r.rotation.z = (rnd() - 0.5) * 0.6; G.mud.add(r); roots.push(r); }
    const ms = new Fish({ type: 'mudskipper', S: 2.4, fins: 0x7b6a4a }); G.mud.add(ms.group);
    const lblMs = L('Pectoral fins: crutches', [0, 0, 0], G.mud, 'hot');
    const lblEye = L('Eyes on top, like periscopes', [0, 0, 0], G.mud);

    // ---------------------------------------------------------------- board
    const info = board(root, 4.0, 2.2, 700, 380, (g, w, h, s) => {
      panel(g, w, h); if (!s) return;
      if (s.focus === 'river') {
        head(g, 'The hilsa’s monsoon run', 'Schematic map of the Ganga, not to scale');
        const x0 = 24, x1 = w - 24, y = 120, bw = (x1 - x0) / 12;
        MONTHS.forEach((m, i) => { g.fillStyle = `rgba(108,196,255,${0.12 + RUN[i] * 0.8})`; g.fillRect(x0 + i * bw + 2, y, bw - 4, 60); txt(g, m, x0 + i * bw + 8, y + 90, i === Math.round(s.month) - 1 ? COL.hot : COL.soft, '17px sans-serif'); });
        g.strokeStyle = COL.hot; g.lineWidth = 3; g.strokeRect(x0 + (Math.round(s.month) - 1) * bw + 1, y - 2, bw - 2, 64);
        wrap(g, !s.barrage ? 'Before 1975: the run spread far up the Ganga, as far as Prayagraj.' : s.lock ? 'Since 2019: the navigation lock is opened at night in the season, and some hilsa pass Farakka again.' : 'Barrage closed to fish: hilsa pile up below Farakka, and upstream catches fall almost to zero.', x0, 260, w - 48, 28, COL.text, '21px sans-serif');
      } else if (s.focus === 'mud') {
        head(g, 'A fish that walks', 'Sundarbans mangrove mudflats');
        wrap(g, 'Both pectoral fins swing forward together and push, lifting the body in short hops: “crutching”. Out of water a mudskipper takes oxygen through its wet skin and the lining of its mouth and gill chambers, so it rolls in puddles to stay damp.', 22, 110, w - 44, 30, COL.text, '21px sans-serif');
      } else {
        head(g, s.stock === 'mix' ? 'Composite fish culture' : 'Only rohu in the pond', 'Indian major carps, ICAR guidance');
        const rows = s.stock === 'mix' ? [['Catla', 'surface', 40, '#9be26a'], ['Rohu', 'middle', 30, '#6cc4ff'], ['Mrigal', 'bottom', 30, '#c8955a']] : [['Rohu', 'middle', 100, '#6cc4ff'], ['(none)', 'surface', 0, '#9be26a'], ['(none)', 'bottom', 0, '#c8955a']];
        rows.forEach(([n, z, p, c], i) => { const y = 110 + i * 58; txt(g, `${n}: ${z}`, 22, y, COL.text, '21px sans-serif'); g.fillStyle = c; g.fillRect(260, y - 20, p * 3.6, 26); txt(g, `${p}%`, 270 + p * 3.6, y, COL.soft, '19px sans-serif'); });
        txt(g, s.stock === 'mix' ? 'Stocking ratio 4 : 3 : 3. All three food layers eaten.' : 'Surface and bottom food goes to waste.', 22, 320, s.stock === 'mix' ? COL.up : COL.down, 'bold 21px sans-serif');
      }
    }, [2.4, 4.6, -1.8]);
    let infoKey = '';

    const focus = focuser(stage, G, VIEWS);
    let t = 0, msX = -3.5, hop = 0;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        reelZoom(stage, 1.4); t += dt;
        focus(s.focus);
        const lay = layoutOf(stage);
        const bp = { pond: [2.2, 5.0, -1.8], river: [0.6, 2.4, -3.0], mud: [1.8, 2.6, -2.6] }[s.focus];
        const nb = { pond: [-1, 6.6, -1.8], river: [-1.5, 2.6, -3.2], mud: [-1, 3.2, -2.6] }[s.focus];
        info.mesh.rotation.x = s.focus === 'river' ? -0.7 : 0; fitBoard(stage, info.mesh, lay === 'wide' ? bp : nb);
        const key = JSON.stringify([s.focus, s.stock, Math.round(s.month), s.barrage, s.lock]);
        if (key !== infoKey) { infoKey = key; info.redraw(s); }

        if (s.focus === 'pond') {
          zl.forEach((l) => { l.visible = lay !== 'narrow'; });
          pondFish.forEach((p) => {
            const kd = kinds[p.k];
            p.f.group.visible = s.stock === 'mix' ? p.i < kd.n : p.k === 'rohu';
            const zone = s.stock === 'rohu' ? 1 : kd.zone;
            const yz = zones[zone][1] + Math.sin(t * 0.6 + p.ph) * 0.18 + (s.stock === 'rohu' ? (p.i - 1.5) * 0.12 : 0);
            const x = -1 + (((p.x0 + t * p.sp) % 7) - 3.5);
            p.f.group.position.set(x, yz, p.z); p.f.pose((xi) => waveZ('carp', 0.14, 1.4, t + p.ph, xi));
          });
          // Food left over: in "only rohu", surface and bottom food piles up.
          foods.forEach((fd, i) => {
            const eaten = s.stock === 'mix' || i === 1;
            fd.used = approach(fd.used, eaten ? 0.35 : 1, 0.8, dt);
            const n = Math.round(60 * fd.used);
            for (let j = 0; j < 60; j++) { const q = foodP[i][j]; fd.m.place(j, [-5.2 + q[0] * 8.4, fd.y + (q[1] - 0.5) * 0.5 + Math.sin(t + j) * 0.03, (q[2] - 0.5) * 2.8], null, j < n ? 1 : 0.001); }
            fd.m.done();
          });
          const first = (k) => pondFish.find((p) => p.k === k && p.f.group.visible && (s.stock === 'mix' || k === 'rohu'));
          for (const k in kl) { const p = first(k); kl[k].visible = !!p && (s.stock === 'mix' || k === 'rohu'); if (p) kl[k].position.set(p.f.group.position.x, p.f.group.position.y + 0.55, p.f.group.position.z); }
        }
        if (s.focus === 'river') {
          const m = Math.round(s.month) - 1, run = RUN[m];
          const limit = !s.barrage ? -7.6 : s.lock ? -4.5 : XF + 0.3;   // how far upstream fish get (schematic)
          gates.position.y = s.lock && Math.sin(t * 0.8) > 0 ? 0.75 : 0.35;
          barr.visible = gates.visible = s.barrage;
          for (let i = 0; i < NH; i++) {
            const h = hP[i]; const active = h.go < run;
            if (active) {
              let target = limit;
              if (s.barrage && s.lock && i % 3) target = XF + 0.3;   // only some get through the lock
              h.x = Math.max(target + (i % 5) * 0.15, h.x - h.sp * dt * 1.2);
            } else h.x = Math.min(6.5 + (i % 7) * 0.2, h.x + h.sp * dt * 0.8);
            hil.place(i, [h.x, 0.1, h.z * 0.45], [0, Math.PI, 0], active || h.x < 6 ? 1 : 0.001);
          }
          hil.done();
          lblYear.element.textContent = !s.barrage ? 'Before 1975' : s.lock ? 'Since 2019' : '1975–2018';
          pl.forEach((l, i) => { l.visible = lay !== 'narrow' || i % 2 === 1; });
        }
        if (s.focus === 'mud') {
          // Crutching: fins swing forward together, then push; the body lifts and lunges.
          const cyc = s.walk ? (t * 1.4) % 1 : 0.6;
          const push = cyc < 0.45 ? Math.sin((cyc / 0.45) * Math.PI) : 0;
          if (s.walk) msX += push * dt * 1.0;
          if (msX > 1.0) msX = -3.5;
          ms.group.position.set(msX, 0.17 + push * 0.1, 0.3); ms.group.rotation.z = push * 0.08;
          ms.pecSpread = cyc < 0.45 ? 0.2 : 0.9 * Math.sin(((cyc - 0.45) / 0.55) * Math.PI);
          ms.pecDown = 0.6;
          ms.pose((xi) => (s.walk ? 0.04 * Math.sin(t * 3 + xi * 4) * xi : 0));
          // Mudskipper eyes sit on top of the head.
          ms.eyes.forEach((e) => { const c = ms.at(0.06); e.m.position.set(c.x, 0.075 * 2.4 + 0.02, c.z + e.sd * 0.06); e.m.scale.setScalar(1.6); });
          const pc = ms.at(0.22); lblMs.position.set(msX + pc.x, -0.05, 0.9); lblEye.position.set(msX + 0.8, 0.75, 0.3);
        }
      },
      readout: (s) => {
        if (s.focus === 'river') {
          const m = Math.round(s.month) - 1;
          return `<div class="big">${MONTHS[m]}: ${RUN[m] > 0.7 ? 'peak of the run' : RUN[m] > 0.2 ? 'hilsa on the move' : 'few hilsa in the river'}</div>
            <div class="row"><span>Farakka barrage</span><b>${s.barrage ? 'working since 1975' : 'not built'}</b></div>
            <div class="row"><span>How far upstream</span><b>${!s.barrage ? 'up to Prayagraj' : s.lock ? 'some get past Farakka' : 'stopped at Farakka'}</b></div>
            <small>ICAR-CIFRI. Map and fish numbers are schematic.</small>`;
        }
        if (s.focus === 'mud') return `<div class="big">Mudskipper: a fish on land</div><div class="row"><span>Walks with</span><b>both pectoral fins at once</b></div><div class="row"><span>Breathes out of water through</span><b>wet skin and mouth</b></div>`;
        return `<div class="big">${s.stock === 'mix' ? 'Three carps, three layers' : 'One carp, one layer'}</div>
          <div class="row"><span>Catla : rohu : mrigal</span><b>${s.stock === 'mix' ? '4 : 3 : 3' : '0 : 10 : 0'}</b></div>
          <div class="row"><span>Food layers used</span><b>${s.stock === 'mix' ? '3 of 3' : '1 of 3'}</b></div>
          <small>Stocking ratio from ICAR extension guidance.</small>`;
      },
    };
  },
};
