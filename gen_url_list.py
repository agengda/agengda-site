import os, csv

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")
SITE = "https://agengda-industrial-chiller.com"

# Priority by filename (the 9 real templates; everything else is language shells).
PRIORITY = {
    "index": "P0-home",
    "products": "P1-products",
    "contact": "P1-contact",
    "factory": "P2-factory",
    "calculator": "P2-calculator",
    "distributors": "P2-distributors",
    "cases": "P2-cases",
}
SERIES_APPS = {"air-cooled-chiller", "water-cooled-chiller", "low-temp-chiller",
               "screw-chiller", "injection-molding", "blow-molding",
               "laser", "rubber-extrusion"}

rows = []
for lang in sorted(os.listdir(DIST)):
    ldir = os.path.join(DIST, lang)
    if not os.path.isdir(ldir) or lang in ("choose.html",):
        continue
    if lang.endswith(".html"):
        # root-level html (index.html, choose.html, utm-builder.html)
        url = f"{SITE}/{lang}"
        base = lang
        pr = "P0-home" if base == "index.html" else ("P3-other" if base == "choose.html" else "P3-other")
        rows.append((pr, url))
        continue
    for fn in sorted(os.listdir(ldir)):
        if not fn.endswith(".html"):
            continue
        fbase = fn[:-5]
        if fbase in PRIORITY:
            pr = PRIORITY[fbase]
        elif fbase in SERIES_APPS:
            pr = "P1-series-app"
        else:
            pr = "P3-other"
        url = f"{SITE}/{lang}/{fn}"
        rows.append((pr, url))

order = {"P0-home":0,"P1-products":1,"P1-contact":1,"P1-series-app":1,
         "P2-factory":2,"P2-calculator":2,"P2-distributors":2,"P2-cases":2,"P3-other":3}
rows.sort(key=lambda r: (order.get(r[0],9), r[1]))

out = os.path.join(ROOT, "gsc_submit_urls.csv")
with open(out, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["priority", "url"])
    for pr, url in rows:
        w.writerow([pr, url])
print(f"wrote {len(rows)} urls -> {out}")
from collections import Counter
print(Counter(r[0] for r in rows))
