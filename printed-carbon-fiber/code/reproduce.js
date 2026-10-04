// Reproduces Table 3 (default case) and Table 4 (sensitivity) of the technical note.
// Usage: node reproduce.js
// Mirrors the model and first-damage logic in the interactive page. Fiber layers use peer-reviewed coupon calibration.
const { feaSolve } = require('./fea-solver.js');

const LBF = 4.44822, IN = 25.4;
const G = { L: 101.6, b: 12.7, dy: 0.12, ny: 52, nx: 120, P: 30 * LBF, loadHalf: 2.5 };
// Matrix polymers (Table 1). PETG: Faidallah et al. 2023 (D3039 0 deg, peer reviewed); compression Amza et al. 2021.
// PLA, PA: manufacturer ISO 527 data. cf: FibreSeek X-CCF compressive / tensile strength for that matrix.
const PLASTIC = { PLA: { E: 2300, st: 51, sc: 78.1, ey: 0.029, eu: 0.063, cf: 0.33 }, PETG: { E: 1620, st: 28.3, sc: 65.9, ey: 0.042, eu: 0.075, cf: 0.24 }, PA: { E: 2700, st: 78, sc: 78, ey: 0.029, eu: 0.127, cf: 0.24 } };
// Chopped carbon fiber reference: Bambu Lab PPA-CF, ISO 527 X-Y, dry; compression taken equal to tension
const PPACF = { E: 11800, st: 168, sc: 168, ey: 0.032, eu: 0.032 };
// Fiber layer calibrated to peer-reviewed 0 deg coupon data per unit carbon fraction (Iragi 2019; Smojver 2026; Adumitroaie 2019)
const CAL = { E: 161000, st: 2100, cfPR: 0.47 };
const AF = Math.PI / 4 * 0.24 * 0.24, COVER = 10.5 / 12.7;

function model(st) {
  const m = PLASTIC[st.mat], Vc = AF * st.vf / (st.pitch * 0.24), Eb = CAL.E * Vc + (1 - Vc) * m.E, ExL = COVER * Eb + (1 - COVER) * m.E;
  const sbT = (st.calSt || CAL.st) * Vc, sbC = st.cf * sbT;
  const mats = [{ Ex: m.E, Ey: m.E, nxy: 0.35, G: m.E / 2.7 }, { Ex: ExL, Ey: m.E * 1.1, nxy: 0.3, G: m.E / 2.6 }, { Ex: PPACF.E, Ey: PPACF.E, nxy: 0.35, G: PPACF.E / 2.7 }];
  const bot = [0, 0]; for (let k = 0; k < st.nf; k++) bot.push(1, 1, 0);
  const plans = {
    none: Array(G.ny).fill(0),
    both: bot.concat(Array(G.ny - 2 * bot.length).fill(0), bot.slice().reverse()),
    bottom: bot.concat(Array(G.ny - bot.length).fill(0)),
    ppacf: Array(G.ny).fill(2),
  };
  return { m, Vc, Eb, ExL, sbT, sbC, mats, plans };
}
function util(M, rows, sx, i, j) {
  const s = sx[i * G.ny + j];
  if (rows[j] === 1) { const sb = s * M.Eb / M.ExL; return sb > 0 ? sb / M.sbT : -sb / M.sbC; }
  const q = rows[j] === 2 ? PPACF : M.m;
  return s > 0 ? s / q.st : -s / q.sc;
}
function summarize(M, rows, r) {
  const dx = G.L / G.nx; let um = 0;
  for (let i = 0; i < G.nx; i++) {
    const x = (i + 0.5) * dx, a = Math.abs(x - G.L / 2);
    if (a < 6 || a > 15) continue;                         // check 6 to 15 mm from midspan: outside the load contact zone, moment factor <= 1.4
    const k = (G.L / 2) / (G.L / 2 - a);                  // scale to peak midspan moment
    for (let j = 0; j < G.ny; j++) um = Math.max(um, k * util(M, rows, r.sx, i, j));
  }
  return { sag: r.mid, failP: G.P / um, carbon: rows.filter(v => v === 1).length / G.ny * COVER * M.Vc };
}
function run(st) {
  const M = model(st);
  return ['none', 'both', 'bottom', 'ppacf'].map(key => summarize(M, M.plans[key], feaSolve({ L: G.L, nx: G.nx, dy: G.dy, rows: M.plans[key], mats: M.mats, b: G.b, P: G.P, loadHalf: G.loadHalf })));
}
function row(label, st) {
  const [a, b, c, d] = run(st);
  const f = (s) => `${(a.sag / s.sag).toFixed(1)}x stiffness, ${(s.failP / a.failP).toFixed(1)}x load`;
  console.log(`${label.padEnd(28)} plain ${(a.sag / IN).toFixed(3)} in, ${(a.failP / LBF).toFixed(0)} lbf | both faces ${f(b)} (${(b.carbon * 100).toFixed(1)}% C) | tension face ${f(c)} | PPA-CF ${f(d)}`);
}

const D = { mat: 'PLA', nf: 3, vf: 0.60, cf: 0.33, pitch: 0.70 };
console.log('Table 3 (default case)');
row('default', D);
console.log('\nTable 4 (sensitivity)');
for (const cf of [0.24, 0.33, 0.47, 0.70, 1.00]) row(`compression ${Math.round(cf * 100)}%`, { ...D, cf });
for (const pitch of [0.70, 0.50, 0.35]) row(`fiber spacing ${pitch.toFixed(2)} mm`, { ...D, pitch });
for (const pitch of [0.70, 0.35]) row(`spacing ${pitch.toFixed(2)}, compr 47%`, { ...D, pitch, cf: 0.47 });
// fiber strength calibration: Smojver et al. 2026 (Anisoprint thermoset towpreg, 236 MPa at Vf 0.25 -> 944 MPa per unit Vc)
for (const cf of [0.24, 0.33, 0.47]) row(`Smojver strength, compr ${Math.round(cf * 100)}%`, { ...D, cf, calSt: 944 });
for (const vf of [0.30, 0.60, 0.85]) row(`carbon in strand ${vf * 100}%`, { ...D, vf });
for (const mat of ['PETG', 'PA']) row(`polymer ${mat}`, { ...D, mat, cf: PLASTIC[mat].cf });
row('4 layers per face', { ...D, nf: 4 });
