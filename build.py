"""Build one marketing site per client.

Every client gets the same Beranda, Media Intelligence and Laporan Strategis pages.
Only the Dinamika Korporasi top story and the article it opens come from
clients/<client>/client.json, so each site carries that client's own story.

Usage:
    python3 build.py            # build every client
    python3 build.py uob        # build only clients/uob
    python3 build.py --site     # build everything into _site/ for GitHub Pages

Output: dist/<client>/ — a complete static site, ready to upload.
"""

import html
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEMPLATES = ROOT / "templates"
CLIENTS = ROOT / "clients"
DIST = ROOT / "dist"
SITE = ROOT / "_site"

# Pages and files shared by every client site, copied as they are.
SHARED_FILES = [
    "beranda.html",
    "media-intelligence.html",
    "laporan-strategis.html",
    "artikel-kartu-plastik-paylater.html",
    "artikel-universal-banking.html",
    "artikel-koreksi-ihsg.html",
    "artikel-asuransi-syariah.html",
    "finance.css",
    "finance.js",
    "media-intelligence.js",
]
SHARED_DIRS = ["assets/finance", "assets/icons"]

NOINDEX = '<meta name="robots" content="noindex, nofollow">'

# The three cards under the top story, used when a client sets no top_story_cards.
DEFAULT_CARDS = [
    {"title": "Memilih KPR yang Tepat di tengah Ketidakpastian", "image": "assets/finance/dk-card-1.png", "framed": True},
    {"title": "Ekonomi Indonesia Diproyeksikan Tetap Tumbuh Resilien di Tengah Dinamika Pasar Keuangan", "image": "assets/finance/dk-card-2.png"},
    {"title": "Ketika IHSG Bergejolak, Apa Benar Emas Bisa Menjadi Perlindungan Keuangan yang Paling Ampuh?", "image": "assets/finance/dk-card-3.png"},
]

# The main site's own Dinamika Korporasi page (no client story).
MAIN_TOP_STORY = {
    "title": "Guncangan Bursa Jadi Momentum Perbaikan",
    "dek": "Guncangan di Bursa Efek Indonesia sulit dilepaskan dari faktor geopolitik. Guncangan itu momentum perbaikan tata kelola Indonesia.",
    "image": "assets/finance/dk-guncangan-bursa.jpg",
}
MAIN_CARDS = [
    {"title": "Danantara, Jembatan Investasi Perancis di Indonesia", "image": "assets/finance/dk-danantara-1.jpg"},
    {"title": "Danantara Klaim Kepercayaan Investor Mulai Pulih", "image": "assets/finance/dk-danantara-2.jpg"},
    {"title": "Harapan Perbaikan Ekonomi lewat Bursa Kerja", "image": "assets/finance/dk-danantara-3.jpg"},
]


def text(value):
    """Escape plain text, then allow *italic* and **bold** from the client file."""
    out = html.escape(value, quote=False)
    out = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", out)
    out = re.sub(r"\*(.+?)\*", r"<i>\1</i>", out)
    return out


def attr(value):
    return html.escape(value, quote=True)


def client_image(path):
    return f"assets/client/{Path(path).name}"


def image_src(path):
    """Client photos live in images/; anything else is a shared asset path."""
    return client_image(path) if path.startswith("images/") else path


def render_lead(href, title, dek, image):
    return (
        f'          <a class="lead lead--image-first" href="{attr(href)}">\n'
        '            <div class="lead__text">\n'
        f'              <h2 class="title-xl hover-title">{text(title)}</h2>\n'
        f'              <p class="dek">{text(dek)}</p>\n'
        "            </div>\n"
        f'            <div class="cover lead__image"><img src="{image_src(image)}" alt=""></div>\n'
        "          </a>"
    )


def render_dinamika(top_story, cards):
    return fill(
        (TEMPLATES / "dinamika-korporasi.html").read_text(),
        {"TOP_STORY": top_story, "TOP_STORY_CARDS": render_cards(cards)},
    )


def render_cards(cards):
    parts = []
    for card in cards:
        image = image_src(card["image"])
        cls = "cover card__image card__image--framed" if card.get("framed") else "cover card__image"
        parts.append(
            f'            <a class="card" href="{attr(card.get("href", "#"))}">\n'
            f'              <div class="{cls}"><img src="{image}" alt=""></div>\n'
            f'              <h2 class="title hover-title">{text(card["title"])}</h2>\n'
            "            </a>"
        )
    return "\n".join(parts)


def render_body(blocks):
    parts, prose = [], []
    first = True

    def flush():
        nonlocal first
        if prose:
            cls = "prose prose--dropcap" if first else "prose"
            first = False
            parts.append(f'        <div class="{cls}">\n' + "\n".join(prose) + "\n        </div>")
            prose.clear()

    for block in blocks:
        if "p" in block:
            prose.append(f"          <p>{text(block['p'])}</p>")
        elif "h2" in block:
            prose.append(f"          <h2>{text(block['h2'])}</h2>")
        elif "quote" in block:
            flush()
            parts.append(f'        <blockquote class="pull-quote">\n          <p>{text(block["quote"])}</p>\n        </blockquote>')
        elif "photo" in block:
            flush()
            caption = block.get("caption", "")
            parts.append(
                '        <figure class="article-figure">\n'
                f'          <div class="cover article-figure__image"><img src="{client_image(block["photo"])}" alt="{attr(caption)}" loading="lazy"></div>\n'
                f'          <p class="article-figure__credit">{text(block.get("credit", ""))}</p>\n'
                + (f"          <figcaption>{text(caption)}</figcaption>\n" if caption else "")
                + "        </figure>"
            )
        else:
            raise ValueError(f"Unknown body block: {block}")
    prose.append('          <img class="end-mark" src="assets/finance/art-end-mark.svg" alt="">')
    flush()
    return "\n\n".join(parts)


def fill(template, values):
    for key, value in values.items():
        template = template.replace("{{" + key + "}}", value)
    missing = re.findall(r"\{\{[A-Z_]+\}\}", template)
    if missing:
        raise ValueError(f"Template slots left empty: {missing}")
    return template


def add_noindex(page):
    if NOINDEX in page:
        return page
    return page.replace('<meta name="viewport"', NOINDEX + '\n  <meta name="viewport"', 1)


def write_index(folder):
    """The site opens on Beranda."""
    (folder / "index.html").write_text(
        "<!doctype html>\n<html lang=\"id\">\n<head>\n  <meta charset=\"utf-8\">\n  "
        + NOINDEX
        + '\n  <meta http-equiv="refresh" content="0; url=beranda.html">\n'
        "  <title>Kompas Professional Finance</title>\n</head>\n<body>\n"
        '  <a href="beranda.html">Kompas Professional Finance</a>\n</body>\n</html>\n'
    )


def build(client_dir):
    client = json.loads((client_dir / "client.json").read_text())
    slug = client["slug"]
    article = client["article"]
    out = DIST / slug
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    for name in SHARED_FILES:
        shutil.copy2(ROOT / name, out / name)
    for folder in SHARED_DIRS:
        shutil.copytree(ROOT / folder, out / folder)
    shutil.copytree(client_dir / "images", out / "assets/client")

    article_file = f"artikel-{slug}-{article['slug']}.html"

    # Article page.
    crew = "\n            <span class=\"crew__divider\" aria-hidden=\"true\"></span>\n".join(
        f"            <p><b>{text(c['role'])}:</b> {text(c['names'])}</p>" for c in article.get("crew", [])
    )
    page = fill(
        (TEMPLATES / "artikel-klien.html").read_text(),
        {
            "TITLE": text(article["title"]),
            "DESCRIPTION": attr(article["dek"]),
            "HERO_IMAGE": client_image(article["hero"]["image"]),
            "HERO_CREDIT": text(article["hero"].get("credit", "")),
            "KICKER": text(article["kicker"].upper()),
            "DEK": text(article["dek"]),
            "DISCLOSURE": f'\n        <p class="article-head__note">{text(article["disclosure"])}</p>' if article.get("disclosure") else "",
            "AUTHOR": text(article["author"]),
            "DATE": text(article["date"]),
            "BODY": render_body(article["body"]),
            "CREW": crew,
            "TAGS": "\n".join(f'          <a class="tag" href="#">{text(t)}</a>' for t in article.get("tags", [])),
        },
    )
    if not crew:
        page = re.sub(r'\s*<section class="crew">.*?</section>', "", page, count=1, flags=re.S)
    if not article.get("tags"):
        page = re.sub(r'\s*<div class="tag-list">\s*</div>', "", page, count=1)
    (out / article_file).write_text(page)

    # Dinamika Korporasi: the client's story is the top story.
    top = client.get("top_story") or {}
    top_story = render_lead(
        article_file,
        top.get("title", article["title"]),
        top.get("dek", article["dek"]),
        top.get("image", article["hero"]["image"]),
    )
    (out / "dinamika-korporasi.html").write_text(
        render_dinamika(top_story, client.get("top_story_cards") or DEFAULT_CARDS)
    )

    write_index(out)

    # Demo sites stay out of search engines.
    for page_path in out.glob("*.html"):
        page_path.write_text(add_noindex(page_path.read_text()))

    print(f"{client['name']}: dist/{slug}/ (artikel: {article_file})")


def build_main():
    """The project root is the main site; its Dinamika Korporasi page comes from the same template."""
    top = MAIN_TOP_STORY
    (ROOT / "dinamika-korporasi.html").write_text(
        render_dinamika(render_lead("#", top["title"], top["dek"], top["image"]), MAIN_CARDS)
    )
    print("Main site: dinamika-korporasi.html")


def assemble_site():
    """Put every site in one folder for GitHub Pages: the main site at the top, each client in /<slug>/."""
    # Clear the old build but keep _site/.git, which publishes to the gh-pages branch.
    SITE.mkdir(exist_ok=True)
    for path in SITE.iterdir():
        if path.name == ".git":
            continue
        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink()
    shutil.copytree(ROOT / "assets", SITE / "assets")
    for pattern in ("*.html", "*.css", "*.js"):
        for path in ROOT.glob(pattern):
            shutil.copy2(path, SITE / path.name)
    for page_path in SITE.glob("*.html"):
        page_path.write_text(add_noindex(page_path.read_text()))
    write_index(SITE)
    for client_site in sorted(p for p in DIST.iterdir() if p.is_dir()):
        shutil.copytree(client_site, SITE / client_site.name)
    (SITE / ".nojekyll").touch()
    print(f"GitHub Pages site: {SITE.name}/")


def main():
    if sys.argv[1:] == ["--site"]:
        build_main()
        for client_dir in sorted(p for p in CLIENTS.iterdir() if (p / "client.json").exists()):
            build(client_dir)
        assemble_site()
        return

    wanted = sys.argv[1:]
    if not wanted:
        build_main()
    clients = sorted(p for p in CLIENTS.iterdir() if (p / "client.json").exists())
    if wanted:
        clients = [p for p in clients if p.name in wanted]
        if not clients:
            sys.exit(f"No client folder matches: {', '.join(wanted)}")
    for client_dir in clients:
        build(client_dir)


if __name__ == "__main__":
    main()
