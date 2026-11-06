// Chapter 6: how people worked out fish swimming. Three scenes:
// 1. Breder's modes (Zoologica 4, 1926): anguilliform (after the eel Anguilla), carangiform (after
//    the jack Caranx) and ostraciiform (boxfish, a stiff body wagging only the tail). Later authors
//    added subcarangiform and thunniform (Lindsey 1978, Fish Physiology vol. 7), and today the modes
//    are seen as points along a smooth range (Lauder & Tytell 2006).
// 2. Gray's paradox (1936). Gray estimated the power a dolphin would need for a burst of speed seen from a ship if water
//    flowed past it turbulently, found it far more than its muscles seemed able to give (he used
//    figures for human oarsmen), and suggested the flow must stay smooth (laminar). Here we compute
//    skin-friction power for a 2 m dolphin with flat-plate formulas: laminar Cf = 1.328 / √Re,
//    turbulent Cf = 0.074 / Re^0.2 (Prandtl–Schlichting; standard textbook values), wetted area
//    about 2 m² (a rough figure), sea water 1025 kg/m³, kinematic viscosity 1.0 × 10⁻⁶ m²/s.
//    Fish & Lauder (2006, Annu Rev Fluid Mech 38: 193) explain the flaws: the speed was probably
//    overestimated, it was a short sprint, and sprint muscle gives far more power than sustained
//    human rowing. Later measurements on swimming dolphins found their muscles are strong enough.
// 3. Robot fish. MIT's RoboTuna "Charlie" (about 1.2 m, a segmented backbone and Lycra skin) first
//    swam in mid-July 1994 (MIT News, 1994). Robots like it test ideas such as wake control.
//    Lighthill's elongated-body theory (J Fluid Mech 9: 305, 1960) gave engineers the maths.
import { THREE, M, approach, clamp, box, sphere } from '../kit.js';
import { Fish, waveZ, TYPES, board, panel, head, txt, wrap, COL, focuser, layoutOf, fitBoard, reelZoom } from '../fish.js';

const VIEWS = {
  modes: { pos: [-1.0, 8.6, 6.6], target: [-1.0, 1.0, 0.4] },
  gray: { pos: [-0.8, 3.2, 9.0], target: [-1.0, 1.8, 0] },
  robot: { pos: [-0.8, 6.2, 6.8], target: [-1.0, 1.2, 0] },
};
const RHO = 1025, NU = 1.0e-6, LD = 2.0, SW = 2.0;   // dolphin length (m) and wetted area (m², rough)
export function grayPower(U) {
  const Re = Math.max(1, (U * LD) / NU), q = 0.5 * RHO * U * U * U * SW;
  return { Re, lam: q * 1.328 / Math.sqrt(Re), turb: q * 0.074 / Math.pow(Re, 0.2) };
}

export default {
  id: 'history',
  short: 'Working it out',
  title: 'How we worked out how fish swim',
  subtitle: 'Sorting swimmers, a famous dolphin puzzle, and robot fish.',
  view: VIEWS.modes,
  learn: `<p>People have always admired fish, but explaining how they swim took modern tools. In <b>1680</b> the Italian scientist <b>Giovanni Borelli</b> wrote about how fish and other animals move, and guessed that fish squeeze their swim bladder to rise and sink.</p>
    <p>In <b>1926</b> the American <b>Charles Breder</b> sorted swimmers into kinds named after typical fish: <b>anguilliform</b> (eel), <b>carangiform</b> (jack) and <b>ostraciiform</b> (boxfish). Later scientists added <b>thunniform</b> for tunas. In <b>1933</b> <b>James Gray</b> in Cambridge filmed eels and other fish against a grid and showed the body wave running back faster than the fish goes forward.</p>
    <p>In <b>1936</b> Gray posed a puzzle, <b>Gray’s paradox</b>: a dolphin seemed to swim so fast that, if water rubbed past its skin in a messy, turbulent way, it would need far more power than its muscles could give. Perhaps its skin kept the flow smooth? The puzzle drove decades of research. Today we know the speed was overestimated, it was a short sprint, and dolphin muscles are strong enough after all.</p>
    <p>In <b>1960</b> <b>James Lighthill</b> turned fish swimming into mathematics. Since the 1990s scientists have filmed the swirls behind fish with lasers, and built <b>robot fish</b>, starting with MIT’s <b>RoboTuna</b> in <b>1994</b>, to test the ideas. (Birds solve the same problem in air: see <a href="/birdflightclear/">BirdFlightClear</a>.)</p>
    <p class="tip"><b>Try it:</b> speed up the dolphin and compare smooth and turbulent drag. Then watch the robot copy the body wave with motors.</p>`,
  terms: [
    { t: 'Laminar flow', d: 'Smooth flow in neat layers. It rubs less against a surface.' },
    { t: 'Turbulent flow', d: 'Messy, swirling flow. It rubs much harder against a surface.' },
    { t: 'Gray’s paradox', d: 'Gray’s 1936 puzzle that dolphins seemed too weak for their speed. It turned out to rest on wrong guesses.' },
    { t: 'Elongated-body theory', d: 'Lighthill’s maths for the push made by a long, thin, bending body.' },
    { t: 'Ostraciiform', d: 'Swimming with a stiff body by wagging only the tail, like a boxfish.' },
  ],
  defaults: { focus: 'modes', U: 8, robot: 1.2 },
  onChange(s, key) { if (key === 'U') s.focus = 'gray'; if (key === 'robot') s.focus = 'robot'; },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'modes', label: 'Swimming modes' }, { v: 'gray', label: 'Gray’s dolphin' }, { v: 'robot', label: 'Robot fish' }] },
    { key: 'U', type: 'range', label: 'Dolphin speed', min: 1, max: 11, step: 0.1, fmt: (v) => `${v.toFixed(1)} m/s (${(v * 1.944).toFixed(0)} knots)` },
    { key: 'robot', type: 'range', label: 'Robot: tail beats per second', min: 0.2, max: 2.5, step: 0.05, fmt: (v) => v.toFixed(2) + ' Hz' },
  ],
  quiz: [
    { q: 'What did Breder do in 1926?', options: ['Built the first robot fish', 'Sorted swimming styles into kinds named after typical fish', 'Discovered the swim bladder', 'Measured a dolphin’s muscles'], answer: 1, why: 'Breder named swimming modes after fish like the eel (anguilliform) and jack (carangiform).' },
    { q: 'Why did Gray think dolphins were too weak?', options: ['He weighed their muscles wrongly', 'He assumed turbulent drag and muscle power like a human rower’s', 'Dolphins have no tail muscles', 'He measured them in fresh water'], answer: 1, why: 'Turbulent flow rubs far harder than smooth flow, and he used sustained human muscle power. The real sprint muscles give much more.' },
    { q: 'How does a robot fish like RoboTuna make its body wave?', options: ['With a jet engine', 'With a chain of motor-driven segments bending one after another', 'With a propeller', 'It doesn’t move'], answer: 1, why: 'Motors bend a segmented backbone in sequence, copying the wave that runs down a real fish.' },
  ],
  reel: [
    { ms: 5200, caption: 'Since 1994, robot fish have copied the body wave with a chain of motors.', set: { focus: 'robot', robot: 1.2 }, anim: {}, view: { pos: [-0.6, 5.2, 5.2], target: [-1.0, 1.2, 0] }, spin: 0.2 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const G = { modes: new THREE.Group(), gray: new THREE.Group(), robot: new THREE.Group() };
    for (const k in G) root.add(G[k]);
    const L = (h, p, par, c = '') => stage.label(h, p, par, c);

    // ---------------------------------------------------------------- modes: four swimmers in a row
    const rows = [['eel', 'Anguilliform (eel): Breder 1926', -3.0], ['carp', 'Carangiform (jack, carp): Breder 1926', -1.0], ['box', 'Ostraciiform (boxfish): Breder 1926', 1.0], ['tuna', 'Thunniform (tuna): added later', 3.0]];
    const mf = rows.map(([k, t, z]) => {
      let f;
      if (k === 'box') {
        // A boxfish: a stiff box body that only wags its tail.
        f = { group: new THREE.Group() };
        const body = box(1.2, 0.6, 0.55, M.plastic(0xe8c34a, { roughness: 0.4 })); f.group.add(body);
        const tail = new THREE.Group(); const fin = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), M.plastic(0xd8a23a, { side: THREE.DoubleSide })); fin.position.x = -0.28; tail.add(fin); tail.position.x = -0.6; f.group.add(tail); f.tail = tail;
        for (const sd of [1, -1]) { const e = sphere(0.06, M.plastic(0x111111), 10); e.position.set(0.5, 0.12, sd * 0.28); f.group.add(e); }
      } else f = new Fish({ type: k, S: 2.6, rings: 48, seg: 18 });
      f.group.position.set(-1, 1.0, z); G.modes.add(f.group);
      const lb = L(t, [-1, 1.0, z + 0.75], G.modes, k === 'tuna' ? '' : 'hot');
      return { f, k, lb };
    });

    // ---------------------------------------------------------------- Gray's dolphin (a mammal: its tail beats up and down)
    const dol = new THREE.Group(); dol.position.set(-1.6, 1.8, 0); G.gray.add(dol);
    const dprof = []; for (let i = 0; i <= 24; i++) { const u = i / 24, x = 1.3 - u * 2.6, r = 0.32 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.pow(u, 0.75) * 1.02)), 0.9) + 0.03; dprof.push([x, r]); }
    const body = new THREE.Mesh(new THREE.LatheGeometry(dprof.map(([x, r]) => new THREE.Vector2(r, x)), 40).rotateZ(-Math.PI / 2), M.plastic(0x7f8c99, { roughness: 0.3 }));
    body.scale.set(1, 0.95, 0.85); body.castShadow = true; dol.add(body);
    const beak = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.3, 12).rotateZ(-Math.PI / 2), M.plastic(0x7f8c99)); beak.position.x = 1.42; dol.add(beak);
    const dfin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 3).scale(1, 1, 0.3), M.plastic(0x6b7885)); dfin.position.set(0, 0.42, 0); dfin.rotation.z = 0.5; dol.add(dfin);
    const fl = new THREE.Group(); fl.position.x = -1.28; dol.add(fl);
    const fluke = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.9), M.plastic(0x6b7885)); fluke.position.x = -0.16; fl.add(fluke);
    const flowLines = []; for (let i = 0; i < 9; i++) { const pts = []; for (let k = 0; k <= 40; k++) pts.push(new THREE.Vector3(3.2 - k * 0.16, 0, 0)); const geo = new THREE.BufferGeometry().setFromPoints(pts); const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x8ef0ff, transparent: true, opacity: 0.6 })); ln.position.set(-1.6, 1.8 + (i - 4) * 0.13, 0.55); G.gray.add(ln); flowLines.push(ln); }
    const lblDol = L('Dolphin: a mammal, its tail beats up and down', [-1.6, 2.7, 0], G.gray, 'hot');
    const gchart = board(G.gray, 4.2, 2.4, 700, 400, (g, w, h, s) => {
      panel(g, w, h); if (!s) return;
      head(g, 'Power to beat skin friction, 2 m dolphin', 'Flat-plate estimate, as in Gray’s 1936 argument');
      const p = grayPower(s.U), mx = grayPower(11).turb;
      [['Smooth (laminar)', p.lam, COL.up], ['Turbulent', p.turb, COL.down]].forEach(([n, v, c], i) => {
        const y = 130 + i * 80; txt(g, n, 22, y, COL.text, '21px sans-serif'); g.fillStyle = c; g.fillRect(230, y - 22, Math.max(2, (v / mx) * 420), 30);
        txt(g, v < 1000 ? `${Math.round(v)} W` : `${(v / 1000).toFixed(1)} kW`, 240 + (v / mx) * 420 - (v / mx > 0.75 ? 120 : 0), y, v / mx > 0.75 ? '#111' : COL.text, 'bold 20px sans-serif');
      });
      wrap(g, `Turbulent flow needs ${(p.turb / p.lam).toFixed(1)} times the power. Gray thought the muscles could only manage the smooth case.`, 22, 320, w - 44, 28, COL.soft, '19px sans-serif');
    }, [2.8, 3.6, -1.6]);
    let gKey = '';

    // ---------------------------------------------------------------- robot tuna: segments driven by motors
    const NSeg = 7, links = [], segL = 0.42;
    const robot = new THREE.Group(); robot.position.set(-1.0, 1.2, 0); G.robot.add(robot);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), M.plastic(0x2a3b5f, { roughness: 0.3 })); nose.scale.set(1.5, 0.8, 0.75); nose.position.x = 1.15; robot.add(nose);
    for (let i = 0; i < NSeg; i++) {
      const g = new THREE.Group(), w = 0.36 * (1 - i / (NSeg + 1)) + 0.06;
      const plate = box(segL * 0.9, w * 1.5, w * 1.2, M.clear(0x8ec5ff, 0.35)); plate.position.x = -segL / 2; g.add(plate);
      const servo = box(0.12, 0.08, 0.16, M.plastic(0x222831)); servo.position.set(0, 0, 0); g.add(servo);
      const rib = new THREE.Mesh(new THREE.TorusGeometry(w * 0.7, 0.012, 6, 24), M.metal(0xd0d6de)); rib.rotation.y = Math.PI / 2; rib.position.x = -segL * 0.5; rib.scale.set(1, 1.2, 1); g.add(rib);
      links.push(g);
    }
    const tailR = new THREE.Mesh(new THREE.ShapeGeometry((() => { const sh = new THREE.Shape(); sh.moveTo(0, 0.03); sh.lineTo(-0.25, 0.4); sh.lineTo(-0.38, 0.45); sh.lineTo(-0.2, 0); sh.lineTo(-0.38, -0.45); sh.lineTo(-0.25, -0.4); sh.lineTo(0, -0.03); return sh; })()), M.plastic(0x2a3b5f, { side: THREE.DoubleSide }));
    const lblRob = L('Each joint has a motor; they bend one after another', [-1.0, 2.2, 0], G.robot, 'hot');
    const lblRob2 = L('MIT RoboTuna, 1994', [1.0, 1.9, 0], G.robot);

    const info = board(root, 4.0, 1.8, 700, 300, (g, w, h, s) => {
      panel(g, w, h); if (!s) return;
      if (s.focus === 'robot') { head(g, 'Robot fish', 'From RoboTuna (1994) to today’s soft robots'); wrap(g, 'A chain of motors bends one joint after another, so a wave runs to the tail. Robots let scientists change one thing at a time, such as stiffness or tail shape, and measure the swirls and the push.', 22, 105, w - 44, 28, COL.text, '20px sans-serif'); }
      else { head(g, 'Sorting the swimmers', 'Breder 1926, extended by Lindsey 1978'); wrap(g, 'From the eel at the back to the tuna at the front, less and less of the body bends. Today scientists treat these as points on a smooth range, not separate boxes.', 22, 105, w - 44, 28, COL.text, '20px sans-serif'); }
    }, [2.6, 3.2, -2.8]);
    let iKey = '';

    const focus = focuser(stage, G, VIEWS);
    let t = 0;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        reelZoom(stage, 1.5); t += dt;
        focus(s.focus);
        const lay = layoutOf(stage);
        info.mesh.visible = s.focus !== 'gray';
        info.mesh.rotation.x = -0.7; if (s.focus !== 'gray') fitBoard(stage, info.mesh, lay === 'wide' ? [1.6, 3.4, -3.2] : [-1.0, 4.4, -3.0]);
        const ik = s.focus; if (ik !== iKey) { iKey = ik; info.redraw(s); }
        if (s.focus === 'modes') {
          mf.forEach(({ f, k, lb }) => {
            if (k === 'box') { f.tail.rotation.y = Math.sin(t * 6) * 0.5; f.group.position.y = 1.0; }
            else f.pose((xi) => waveZ(k, k === 'eel' ? 0.2 : 0.2, 1.2, t, xi));
            lb.visible = lay !== 'narrow' || k !== 'box';
          });
        }
        if (s.focus === 'gray') {
          const gk = s.U.toFixed(1); if (gk !== gKey) { gKey = gk; gchart.redraw(s); }
          fitBoard(stage, gchart.mesh, lay === 'wide' ? [2.0, 3.8, -2.0] : [-1.2, 4.6, -1.6]);
          const fb = 0.6 + s.U * 0.2;
          fl.rotation.z = Math.sin(t * fb * 2 * Math.PI * 0.6) * 0.45; body.rotation.z = Math.sin(t * fb * 2 * Math.PI * 0.6 - 1) * 0.04;
          // Flow lines: smooth for low speed, wobbling more with speed (illustrating turbulence).
          const turb = clamp((s.U - 1) / 8, 0, 1);
          flowLines.forEach((ln, i) => { const a = ln.geometry.attributes.position.array; for (let k = 0; k <= 40; k++) { const x = 3.2 - k * 0.16; a[k * 3 + 1] = x < -1.0 ? turb * 0.08 * Math.sin(t * 9 + k * 1.3 + i * 2) : 0; a[k * 3] = x - ((t * s.U * 0.3) % 0.16); } ln.geometry.attributes.position.needsUpdate = true; ln.material.color.setHex(turb > 0.5 ? 0xff9a7a : 0x8ef0ff); });
        }
        if (s.focus === 'robot') {
          // Drive each joint so the link chain follows a thunniform-like wave.
          const T = TYPES.tuna; let x = 0.85, z = 0, prevA = 0;
          for (let i = 0; i < NSeg; i++) {
            const xi = 0.35 + (i / NSeg) * 0.6;
            const zA = waveZ('tuna', 0.28, s.robot, t, xi), zB = waveZ('tuna', 0.28, s.robot, t, xi + 0.6 / NSeg);
            const a = Math.atan2(zB - zA, 0.6 / NSeg) * 1.0;
            const ln = links[i]; if (!ln.parent) robot.add(ln);
            ln.position.set(x, 0, z); ln.rotation.y = a;
            x -= Math.cos(a) * segL; z -= Math.sin(a) * segL; prevA = a;
          }
          if (!tailR.parent) robot.add(tailR);
          tailR.position.set(x, 0, z); tailR.rotation.y = prevA;
        }
      },
      readout(s) {
        if (s.focus === 'gray') {
          const p = grayPower(s.U);
          return `<div class="big">${s.U.toFixed(1)} m/s: ${p.turb < 1000 ? Math.round(p.turb) + ' W' : (p.turb / 1000).toFixed(1) + ' kW'} if turbulent</div>
            <div class="row"><span>If flow stayed smooth</span><b>${Math.round(p.lam)} W</b></div>
            <div class="row"><span>Reynolds number</span><b>${(p.Re / 1e6).toFixed(1)} million</b></div>
            <small>Skin friction only, flat-plate formulas, 2 m², sea water. A rough estimate in Gray’s style.</small>`;
        }
        if (s.focus === 'robot') return `<div class="big">Robot fish: ${s.robot.toFixed(2)} beats a second</div><div class="row"><span>First RoboTuna swim</span><b>July 1994, MIT</b></div><div class="row"><span>Joints driven</span><b>${NSeg}</b></div>`;
        return `<div class="big">Four ways to wave a body</div><div class="row"><span>Breder’s modes</span><b>1926</b></div><div class="row"><span>Thunniform added</span><b>later (Lindsey 1978)</b></div>`;
      },
    };
  },
};
