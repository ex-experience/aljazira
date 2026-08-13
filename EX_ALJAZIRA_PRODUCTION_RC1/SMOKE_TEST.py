from pathlib import Path
import json, re, subprocess, sys

root = Path(__file__).resolve().parent
required = [
    "index.html","game.js","bootstrap.js","service-worker.js",
    "manifest.webmanifest","version.json",
    "assets/icon-192.png","assets/icon-512.png"
]
missing = [x for x in required if not (root/x).exists()]
if missing:
    raise SystemExit("Missing files: " + ", ".join(missing))

json.loads((root/"manifest.webmanifest").read_text(encoding="utf-8"))
json.loads((root/"version.json").read_text(encoding="utf-8"))

html=(root/"index.html").read_text(encoding="utf-8")
game=(root/"game.js").read_text(encoding="utf-8")
for element_id in ["start","newWorld","fireBtn","reloadBtn","swapBtn","saveBtn","resumeBtn","resetBtn","hpBar","ammo"]:
    if f'id="{element_id}"' not in html:
        raise SystemExit(f"Missing DOM element #{element_id}")

for js in ["game.js","bootstrap.js","service-worker.js"]:
    subprocess.run(["node","--check",str(root/js)],check=True)

print("EX ALJAZIRA Production RC1 static smoke test: PASS")
