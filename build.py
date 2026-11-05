#!/usr/bin/env python3
"""Sestaví web: pages/* + partials -> ../site (výstup pro GitHub Pages)."""
import pathlib, shutil, sys

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

for page in (ROOT / "pages").rglob("*.html"):
    rel = page.relative_to(ROOT / "pages")
    depth = len(rel.parts) - 1
    # 404 se servíruje z libovolné cesty -> absolutní cesty
    prefix = "/" if rel.name == "404.html" else "../" * depth
    html = page.read_text().replace("{{HEADER}}", header).replace("{{FOOTER}}", footer)
    html = html.replace("{{P}}./", prefix or "./").replace("{{P}}", prefix)
    dst = OUT / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(html)
print("OK ->", OUT)
