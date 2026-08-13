from pathlib import Path
import json, subprocess

root = Path(__file__).resolve().parent
required = [
    "index.html","game.js","bootstrap.js","menu-ui.js","service-worker.js",
    "manifest.webmanifest","version.json","assets/menu-cover.webp","assets/menu-cover.jpg",
    "assets/icon-192.png","assets/icon-512.png"
]
missing=[p for p in required if not (root/p).exists()]
if missing: raise SystemExit("Missing: "+", ".join(missing))

html=(root/"index.html").read_text(encoding="utf-8")
for eid in ["intro","coverFrame","start","newWorld","howToPlay","settingsBtn","helpModal","settingsModal","modeModal"]:
    if f'id="{eid}"' not in html: raise SystemExit(f"Missing #{eid}")

json.loads((root/"manifest.webmanifest").read_text(encoding="utf-8"))
json.loads((root/"version.json").read_text(encoding="utf-8"))

for js in ["game.js","bootstrap.js","menu-ui.js","service-worker.js"]:
    subprocess.run(["node","--check",str(root/js)],check=True)

print("EX ALJAZIRA RC2 UI smoke test: PASS")
