# How strong is 3D printed continuous carbon fiber? (Technical note v1.0)

Nick Sonnentag, Sunnyday Technologies. ORCID 0009-0002-1897-384X. Correspondence: research@sunn3d.com.
Interactive version: https://sunn3d.com/research/printed-carbon-fiber/

This archive holds the note and everything needed to reproduce its numbers and figures.

## Contents

| Path | What it is |
|---|---|
| `index.html` | The technical note, interactive (open in a browser). Static PDF and DOI: Zenodo (to follow) |
| `vendor/` | three.js r128 and OrbitControls (MIT), self-hosted |
| `code/fea-solver.js` | 2D plane-stress four-node FEA of the layered bar, identical to the solver in the page |
| `code/convergence.js` | Mesh convergence and first-damage check-region study |
| `code/reproduce.js` | Regenerates Table 3 and Table 4: `node code/reproduce.js` (Node.js 18 or newer) |
| `figs/make_crops.py` | Crops and rescales the CC BY source figures to a common scale. `crops.json` records each crop's box and scale |
| `figs/ATTRIBUTION.md` | Sources, licenses and changes for the third-party images |

## Reproducing the results

```
node code/reproduce.js
```

Expected default line (PLA, 3 fiber layers per face, 60% strand carbon, 0.70 mm spacing, compression 33%): plain bar 0.195 in deflection and 38 lbf to first damage; fiber near both faces 4.6x stiffness and 0.9x load; tension face 1.9x and 2.0x; Bambu PPA-CF solid bar 5.1x and 3.3x. `node code/convergence.js` runs the mesh and check-region study.

## License

Text, code and original figures: CC BY 4.0, Sunnyday Technologies. Third-party images keep their original CC BY 4.0 licenses (see `figs/ATTRIBUTION.md`).
