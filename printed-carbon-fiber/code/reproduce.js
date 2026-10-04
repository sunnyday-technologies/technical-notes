// Reproduces Table 3 (default case) and Table 4 (sensitivity) of the technical note.
// Usage: node reproduce.js
// Mirrors the model and first-damage logic in the interactive page.
const { feaSolve } = require('./fea-solver.js');

const LBF = 4.44822, IN = 25.4;
const G = { L: 101.6, b: 12.7, dy: 0.12, ny: 52, nx: 120, P: 30 * LBF, loadHalf: 2.5 };
const PLASTIC = { PLA: { E: 3500, st: 50, sc: 65 }, PETG: { E: 2000, st: 45, sc: 55 }, PA: { E: 1700, st: 60, sc: 60 } };
const CF = { E: 230000, s: 3500, etaE: 0.85, etaS: 0.55 };
const AF = Math.PI / 4 * 0.24 * 0.24, AB = 0.70 * 0.24, BEADS = 15, COVER = BEADS * 0.7 / 12.7;

function model(st) {
  const m = PLASTIC[st.mat], Vc = AF / AB * st.vf, Eb = CF.etaE * Vc * CF.E + (1 - Vc) * m.E, ExL = COVER * Eb + (1 - COVER) * m.E;
  const sbT = CF.etaS * Vc * CF.s, sbC = st.cf * sbT;
  const mats = [{ Ex: m.E, Ey: m.E, nxy: 0.35, G: m.E / 2.7 }, { Ex: ExL, Ey: m.E * 1.1, nxy: 0.3, G: m.E / 2.6 }];
  const bot = [0, 0]; for (let k = 0; k < st.nf; k++) bot.push(1, 1, 0);
  const plans = {
    none: Array(G.ny).fill(0),
    both: bot.concat(Array(G.ny - 2 * bot.length).fill(0), bot.slice().reverse()),
    bottom: bot.concat(Array(G.ny - bot.length).fill(0)),
  };
  return { m, Vc, Eb, ExL, sbT, sbC, mats, plans };
}
function util(M, rows, sx, i, j) {
  const s = sx[i * G.ny + j];
  if (rows[j] === 1) { const sb = s * M.Eb / M.ExL; return sb > 0 ? sb / M.sbT : -sb / M.sbC; }
  return s > 0 ? s / M.m.st : -s / M.m.sc;
}
function summarize(M, rows, r) {
  const dx = G.L / G.nx; let um = 0;
  for (let i = 0; i < G.nx; i++) {
    const x = (i + 0.5) * dx, a = Math.abs(x - G.L / 2);
    if (a < 6 || x < 4 || x > G.L - 4) continue;          // contact zones excluded
    const k = (G.L / 2) / (G.L / 2 - a);                  // scale to peak midspan moment
    for (let j = 0; j < G.ny; j++) um = Math.max(um, k * util(M, rows, r.sx, i, j));
  }
  return { sag: r.mid, failP: G.P / um, carbon: rows.filter(v => v === 1).length / G.ny * COVER * M.Vc };
}
function run(st) {
  const M = model(st);
  return ['none', 'both', 'bottom'].map(key => summarize(M, M.plans[key], feaSolve({ L: G.L, nx: G.nx, dy: G.dy, rows: M.plans[key], mats: M.mats, b: G.b, P: G.P, loadHalf: G.loadHalf })));
}
function row(label, st) {
  const [a, b, c] = run(st);
  const f = (s) => `${(a.sag / s.sag).toFixed(1)}x stiffness, ${(s.failP / a.failP).toFixed(1)}x load`;
  console.log(`${label.padEnd(28)} plain ${(a.sag / IN).toFixed(3)} in, ${(a.failP / LBF).toFixed(0)} lbf | both faces ${f(b)} (${(b.carbon * 100).toFixed(1)}% C) | tension face ${f(c)}`);
}

const D = { mat: 'PETG', nf: 3, vf: 0.60, cf: 0.34 };
console.log('Table 3 (default case)');
row('default', D);
console.log('\nTable 4 (sensitivity)');
for (const cf of [0.25, 0.34, 0.50, 0.70, 1.00]) row(`compression ${cf * 100}%`, { ...D, cf });
for (const vf of [0.30, 0.60, 0.85]) row(`carbon in strand ${vf * 100}%`, { ...D, vf });
for (const mat of ['PLA', 'PA']) row(`polymer ${mat}`, { ...D, mat });
row('4 layers per face', { ...D, nf: 4 });
