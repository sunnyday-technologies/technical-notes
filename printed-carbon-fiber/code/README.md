# Code

- `fea-solver.js`: `feaSolve({L, nx, dy, rows, mats, b, P, loadHalf})`. A 2D plane-stress four-node quadrilateral FEA (2x2 Gauss integration) of a layered bar in three-point bending, with a banded Cholesky solve. Units: mm, N, MPa.
- `reproduce.js`: model inputs (Table 1), the layer layouts, the first-damage criterion and the sensitivity cases. Running `node reproduce.js` prints Table 3 and Table 4.

Verification: on a plain bar the solver matches Euler-Bernoulli beam theory within 1%. A transformed-section beam calculation with Timoshenko shear gives stiffness ratios of 5.99 and 2.08, against the FEA's 5.9 and 2.1.
