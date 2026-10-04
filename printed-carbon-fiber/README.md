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
| `code/reproduce.js` | Regenerates Table 3 and Table 4: `node code/reproduce.js` (Node.js 18 or newer) |
| `figs/make_crops.py` | Crops and rescales the CC BY source figures to a common scale. `crops.json` records each crop's box and scale |
| `figs/ATTRIBUTION.md` | Sources, licenses and changes for the third-party images |

## Reproducing the results

```
node code/reproduce.js
```

Expected default line: plain bar 0.224 in deflection and 32 lbf to first damage. Fiber near both faces gives 5.9x stiffness and 1.0x load. Fiber on the tension face gives 2.1x stiffness and 1.7x load.

## License

Text, code and original figures: CC BY 4.0, Sunnyday Technologies. Third-party images keep their original CC BY 4.0 licenses (see `figs/ATTRIBUTION.md`).
