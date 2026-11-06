// Chapter 1: inside a fish. A generic rohu-shaped fish (Labeo rohita, India's best-loved carp)
// with its fins, scales, lateral line, W-shaped muscle blocks, red and white muscle, backbone,
// two-chambered swim bladder and gills. Take it apart, peel the skin, let it swim gently.
// Numbers:
//  - Myomeres: one muscle block per vertebra; carps have roughly 35–40 vertebrae (FishBase gives
//    vertebral counts per species), so 36 are drawn.
//  - Red and white muscle: in jack mackerel, red muscle is about 5% and white muscle about 61% of
//    body weight, and only the red muscle works in steady cruising (Xu et al. 1993, Nippon Suisan
//    Gakkaishi 59: 745). Red muscle sits in a thin strip just under the skin along the lateral line.
//  - Mucus: fish skin is covered in a slimy mucus layer made by goblet cells. Claims that mucus cuts
//    drag a lot are measured for a few fast fish only, so the text says "may".
import { THREE, M, approach, clamp } from '../kit.js';
import { toast } from '../ui.js';
import { Fish, waveZ, layoutOf, reelZoom } from '../fish.js';

const S = 4.4;              // the model is 4.4 units long; a real rohu is often 40–60 cm in markets

const INFO = {
  caudal: 'The <b>caudal fin</b> (tail fin) is where most of the push leaves the body.',
  dorsal: 'The <b>dorsal fin</b> on the back stops the fish rolling, like a keel.',
  anal: 'The <b>anal fin</b> underneath steadies the fish too.',
  pecL: 'The <b>pectoral fins</b> behind the head brake, steer and hover.',
  pecR: 'The <b>pectoral fins</b> behind the head brake, steer and hover.',
  pelvic: 'The <b>pelvic fins</b> on the belly help with pitch and stopping.',
  bladder: 'The <b>swim bladder</b> is a bag of gas that makes the fish weigh almost nothing in water. A carp’s has two chambers.',
  skin: 'Overlapping <b>scales</b> covered in slimy <b>mucus</b> protect the fish. The dotted line along the side is the <b>lateral line</b>, which feels water moving.',
  muscle: 'The swimming muscle is cut into W-shaped blocks called <b>myomeres</b>. The dark red strip is <b>red muscle</b> for cruising; the pale bulk is <b>white muscle</b> for sprints.',
  gills: 'The red <b>gills</b> take oxygen from the water that flows in through the mouth and out under the gill cover.',
};

export default {
  id: 'anatomy',
  short: 'Inside a fish',
  title: 'Inside a fish',
  subtitle: 'Fins, scales, W-shaped muscles, a backbone and a bag of gas.',
  view: { pos: [-0.6, 2.4, 8.2], target: [-1.3, 1.0, 0] },
  learn: `<p>Meet a <b>rohu</b>, the carp in many Indian fish curries. Its body is a smooth spindle, flattened from side to side, so water slips past it.</p>
    <p>Most of a fish is <b>muscle</b>, and it is built for one job: bending the body. The muscle is split into blocks called <b>myomeres</b>, shaped like a <b>W</b> lying on its side, one for each bone of the <b>backbone</b>. A thin strip of dark <b>red muscle</b> runs along each side for steady cruising. The pale <b>white muscle</b> makes up most of the fish and is for sudden sprints. (<a href="/muscleclear/">MuscleClear</a> shows the same slow and fast fibres in you.)</p>
    <p>The <b>fins</b> each have a job. The <b>tail fin</b> (caudal fin) does the pushing. The <b>dorsal</b> and <b>anal</b> fins stop it rolling. The paired <b>pectoral</b> and <b>pelvic</b> fins brake and steer. Inside sits the <b>swim bladder</b>, a bag of gas that lets it float at any depth, and the red <b>gills</b>, which take oxygen from water rather than air (compare <a href="/lungsclear/">LungsClear</a>).</p>
    <p>On the outside, overlapping <b>scales</b> wear a coat of slimy <b>mucus</b>. A dotted <b>lateral line</b> runs along each side: a row of tiny pores over sense cells that feel the water move.</p>
    <p class="tip"><b>Try it:</b> take the fish apart, then peel off the skin. Tap any part to hear what it does.</p>`,
  terms: [
    { t: 'Myomere', d: 'One W-shaped block of swimming muscle. There is one for each vertebra.' },
    { t: 'Red muscle', d: 'A thin strip of dark, tireless muscle along each side, used for steady cruising.' },
    { t: 'White muscle', d: 'The pale bulk of a fish’s muscle: powerful but quick to tire, used for bursts.' },
    { t: 'Caudal fin', d: 'The tail fin, which pushes against the water.' },
    { t: 'Swim bladder', d: 'A gas-filled sac that makes a bony fish almost weightless in water.' },
    { t: 'Lateral line', d: 'A line of sense organs along each side that detects water movement and pressure.' },
  ],
  defaults: { explode: 0, peel: false, swim: true },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'peel', type: 'toggle', label: 'Peel off the skin', hint: 'See the W-shaped muscle blocks and the red strip.' },
    { key: 'swim', type: 'toggle', label: 'Swim gently' },
  ],
  quiz: [
    { q: 'What are myomeres?', options: ['Scales on the skin', 'W-shaped blocks of swimming muscle', 'Holes in the lateral line', 'Bones in the fins'], answer: 1, why: 'The swimming muscle is split into W-shaped blocks, one per vertebra. Together they bend the body.' },
    { q: 'Which muscle does a fish use for steady, all-day cruising?', options: ['The white muscle', 'The red muscle', 'The heart', 'The fin muscles only'], answer: 1, why: 'The thin red strip along each side is full of blood and hardly tires. The big white muscle is for short sprints.' },
    { q: 'What does the lateral line do?', options: ['It helps the fish breathe', 'It senses water moving around the fish', 'It stores gas', 'It makes mucus'], answer: 1, why: 'Its sense cells feel tiny water movements and pressure changes, like touch at a distance.' },
  ],
  reel: [
    { ms: 5200, caption: 'Most of a fish is muscle, cut into W-shaped blocks along a flexible backbone.', set: { peel: false, swim: true }, anim: { explode: [0, 0.85] }, view: { pos: [1.6, 2.6, 7.4], target: [0.2, 1.1, 0] }, spin: 0.25 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const fish = new Fish({ type: 'carp', S, inner: true });
    fish.skinMat.transparent = true;
    fish.group.position.y = 1.5; root.add(fish.group);
    const L = (html, cls = '') => stage.label(html, [0, 0, 0], fish.group, cls);
    const tags = {
      caudal: L('Tail (caudal) fin'), dorsal: L('Dorsal fin'), pec: L('Pectoral fin'), pelvic: L('Pelvic fin'), anal: L('Anal fin'),
      line: L('Lateral line', 'hot'), scales: L('Scales and mucus'), gill: L('Gill cover'),
      myo: L('Myomeres (W-shaped)', 'hot'), red: L('Red muscle strip'), white: L('White muscle'), spine: L('Backbone'), bladder: L('Swim bladder (two chambers)', 'hot'), gills: L('Gills'),
    };
    const outer = ['caudal', 'dorsal', 'pec', 'pelvic', 'anal', 'line', 'scales', 'gill'], innerT = ['myo', 'red', 'white', 'spine', 'bladder', 'gills'];
    // Picking
    const pick = new Map();
    for (const k in fish.fins) { stage.pickables.push(fish.fins[k].m); pick.set(fish.fins[k].m, k); }
    stage.pickables.push(fish.skin, fish.inner.muscle, fish.inner.b1, fish.inner.b2);
    pick.set(fish.skin, 'skin'); pick.set(fish.inner.muscle, 'muscle'); pick.set(fish.inner.b1, 'bladder'); pick.set(fish.inner.b2, 'bladder');
    fish.inner.gills.children.forEach((c) => { stage.pickables.push(c); pick.set(c, 'gills'); });

    let t = 0, amp = 0, ex = 0, peel = 0;
    const sk = fish.skinMat;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        reelZoom(stage, 1.6);
        amp = approach(amp, s.swim ? 0.11 : 0, 2, dt);
        t += dt;
        ex = approach(ex, s.explode, 6, dt);
        peel = approach(peel, s.peel ? 1 : 0, 5, dt);
        fish.setExplode(ex);
        fish.pose((xi) => waveZ('carp', amp, 0.8, t, xi));
        // Skin and fins lift away when exploded; skin fades when peeled.
        const lift = ex * S * 0.27;
        fish.skin.position.y = lift;
        for (const k in fish.fins) fish.fins[k].g.position.y += lift;
        fish.eyes.forEach((e) => { e.m.position.y += lift; });
        const op = 1 - 0.92 * peel;
        sk.opacity = op; sk.depthWrite = op > 0.5;
        const gone = peel > 0.5 && ex > 0.3;   // peeled and apart: hide the skin layer entirely
        fish.skin.visible = op > 0.03 && !gone;
        for (const k in fish.fins) fish.fins[k].g.visible = !gone;
        fish.eyes.forEach((e) => { e.m.visible = !gone; });
        fish.inner.muscleMat.opacity = ex > 0.02 || peel > 0.5 ? 1 : 0.0; fish.inner.muscle.visible = ex > 0.02 || peel > 0.05;
        // Organs only show when you can see inside.
        const inside = ex > 0.05 || peel > 0.3;
        fish.inner.spine.visible = fish.inner.ribs.visible = fish.inner.bladder.visible = fish.inner.gills.visible = fish.inner.gut.visible = fish.inner.brain.visible = inside;
        // Labels follow the moving parts.
        const P = (tag, xi, y, side = 1, k = 1) => { const c = fish.at(xi), [nx, nz] = fish.nrmAt(xi); tag.position.set(c.x + nx * side * k, y, c.z + nz * side * k); };
        P(tags.caudal, 0.94, 0.75 + lift, 1, 0); P(tags.dorsal, 0.34, S * 0.17 + 0.25 + lift, 1, 0);
        P(tags.pec, 0.21, -0.25 + lift, 1, 0.5); P(tags.pelvic, 0.43, -S * 0.16 - 0.1 + lift, 1, 0.1); P(tags.anal, 0.62, -S * 0.12 - 0.2 + lift, 1, 0.1);
        P(tags.line, 0.55, 0.05 + lift, 1, 0.35); P(tags.scales, 0.4, S * 0.08 + lift, 1, 0.35); P(tags.gill, 0.16, -0.05 + lift, 1, 0.4);
        const yM = ex * 0.75 * S * 0.12, ySp = -ex * 1.6 * S * 0.12, yOrg = -ex * 3.0 * S * 0.12;
        P(tags.myo, 0.5, yM + S * 0.06, 1, 0.3); P(tags.red, 0.66, yM - 0.02, 1, 0.3); P(tags.white, 0.3, yM - S * 0.08, 1, 0.35);
        P(tags.spine, 0.7, ySp + 0.12, 1, 0.05); P(tags.bladder, 0.33, yOrg - 0.22, 1, 0.25); P(tags.gills, 0.15, yOrg * 0.6 - 0.25, 1, 0.3);
        const narrow = layoutOf(stage) === 'narrow';
        outer.forEach((k) => { tags[k].visible = !['line', 'scales', 'gill'].includes(k) || peel < 0.5; });
        innerT.forEach((k) => { tags[k].visible = inside && !(narrow && ['white', 'red'].includes(k)); });
        if (narrow) { tags.scales.visible = false; tags.anal.visible = tags.pelvic.visible = ex > 0.3; }
      },
      readout: (s) => `<div class="big">${s.peel || s.explode > 0.3 ? 'Mostly muscle' : 'A rohu, about 50 cm'}</div>
        <div class="row"><span>Muscle blocks (myomeres)</span><b>about 36, one per vertebra</b></div>
        <div class="row"><span>White muscle, for sprints</span><b>about 60% of body weight</b></div>
        <div class="row"><span>Red muscle, for cruising</span><b>about 5%</b></div>
        <small>Muscle shares measured in a jack mackerel (Xu et al. 1993). Other fish differ, but white muscle is always the bulk.</small>`,
      pick(o) { const k = pick.get(o); if (k && INFO[k]) toast(INFO[k]); },
    };
  },
};
