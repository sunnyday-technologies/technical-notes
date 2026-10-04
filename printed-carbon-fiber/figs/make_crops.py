"""Crop and rescale the CC BY comparison micrographs to known scales (px per um).

Sources (both CC BY 4.0; changes: cropped and rescaled):
  Lupone F. et al., Polymers 14(3):426 (2022), doi:10.3390/polym14030426, Figs. 4a and 6b.
  Drilea et al., arXiv:2512.12826v2 (2026), Fig. 9.

Scale bars were measured in pixels on the downloaded originals:
  lupone2022-fig4.jpg  40 um bar   = 29 px    -> 0.725 px/um
  lupone2022-fig6.jpg  panel (b) 50 um bar = ~17.5 px -> 0.35 px/um (matches 125 um layer lines at ~43 px)
  drilea2026-fig9.png  1000 um bar = 1275 px  -> 1.275 px/um
"""
import json
from PIL import Image

CROPS = [
    # name, source, native px/um, crop box (native px), output px/um
    ("markforged-strand", "lupone2022-fig4.jpg", 0.725, (12, 12, 346, 300), 0.6),
    ("anisoprint-pair", "drilea2026-fig9.png", 1.275, (420, 330, 1580, 1400), 0.6),
    ("markforged-laminate", "lupone2022-fig6.jpg", 0.35, (118, 292, 407, 517), 0.35),
]
meta = {}
for name, src, k_in, box, k_out in CROPS:
    im = Image.open(src).convert("RGB").crop(box)
    f = k_out / k_in
    out = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
    out.save(f"{name}.jpg", quality=86)
    meta[name] = {"file": f"{name}.jpg", "px_per_um": k_out, "width_um": round(out.width / k_out),
                  "height_um": round(out.height / k_out), "source": src, "box": box}
json.dump(meta, open("crops.json", "w"), indent=1)
print(json.dumps(meta, indent=1))
