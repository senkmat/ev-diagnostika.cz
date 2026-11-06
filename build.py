#!/usr/bin/env python3
"""Sestaví web: pages/* + partials -> ../site (výstup pro GitHub Pages)."""
import hashlib, pathlib, shutil, sys

ROOT = pathlib.Path(__file__).parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "site"

header = (ROOT / "partials/header.html").read_text()
footer = (ROOT / "partials/footer.html").read_text()

if OUT.exists():
    for item in OUT.iterdir():
        if item.name == ".git":
            continue
        shutil.rmtree(item) if item.is_dir() else item.unlink()
OUT.mkdir(parents=True, exist_ok=True)
shutil.copytree(ROOT / "static", OUT, dirs_exist_ok=True)

def ver(rel):
    return hashlib.md5((ROOT / "static" / rel).read_bytes()).hexdigest()[:8]
CSS_V, JS_V = ver("css/style.css"), ver("js/main.js")

for page in (ROOT / "pages").rglob("*.html"):
    rel = page.relative_to(ROOT / "pages")
    depth = len(rel.parts) - 1
    # 404 se servíruje z libovolné cesty -> absolutní cesty
    prefix = "/" if rel.name == "404.html" else "../" * depth
    html = page.read_text().replace("{{HEADER}}", header).replace("{{FOOTER}}", footer)
    html = html.replace("{{P}}./", prefix or "./").replace("{{P}}", prefix)
    # verze v adrese -> prohlížeč po změně vždy stáhne nový soubor
    html = html.replace('css/style.css"', f'css/style.css?v={CSS_V}"').replace('js/main.js"', f'js/main.js?v={JS_V}"')
    dst = OUT / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(html)
print("OK ->", OUT)
