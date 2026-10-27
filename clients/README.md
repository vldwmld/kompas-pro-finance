# Client marketing sites

Each folder here is one client. Every client site shares Beranda, Media Intelligence
and Laporan Strategis; only the Dinamika Korporasi top story and its article change.

## Add a client

1. Copy an existing folder, e.g. `clients/uob` → `clients/bank-abc`.
2. Put the photos in `clients/bank-abc/images/` (the banner plus any photos in the article).
3. Edit `clients/bank-abc/client.json`:
   - `name`, `slug` — the slug names the site folder and the article file.
   - `article.slug` — short name for the article URL.
   - `article.kicker`, `title`, `dek`, `author`, `date`.
   - `article.disclosure` — partnership note, or `""` for none.
   - `article.hero` — banner `image`, photographer `credit`.
   - `article.body` — the story, top to bottom, as blocks:
     - `{"p": "Paragraph text"}` — use `*italic*` and `**bold**`.
     - `{"h2": "Subheading"}`
     - `{"quote": "Highlighted quote"}`
     - `{"photo": "images/foto-1.jpg", "credit": "DOK BANK ABC", "caption": "…"}`
   - `article.crew` — Kerabat Kerja (`[]` hides the section), `article.tags`.
   - `top_story` — leave `{}` to reuse the article's title, summary and banner on
     Dinamika Korporasi, or set `title`, `dek`, `image` to show something different.
   - `top_story_cards` — optional; the three cards under the top story, each
     `{"title": "…", "image": "images/card-1.jpg"}`. Leave it out to keep the standard three.
4. Run `python3 build.py bank-abc` from the project folder.

## Build

```
python3 build.py          # every client
python3 build.py uob      # one client
```

Each site is written to `dist/<slug>/`, opens on Beranda, and is marked `noindex`.

## Reports (Report Reader Page)

`report-reader.html?laporan=<id>` opens the PDF in `assets/reports/<id>/`:

- `laporan.pdf` — the report itself
- `cover.jpg` — page 1, used on the report cards
- `report.json` — `{"title": "…", "file": "laporan.pdf", "sizes": [[w, h], …]}`, one size per page in PDF points
- `text.json` — the plain text of each page, for "Cari kata kunci"
- `pages/` — optional images for pages pdf.js draws wrongly, listed in `report.json` as
  `"images": {"1": "pages/001.jpg"}`. The outlook's covers use this: pdf.js clips their
  "2026" lettering, so they are rendered by macOS instead.

Every site gets the reports folder, so a link like
`report-reader.html?laporan=outlook-2026` works on the main site and each client site.

## Publish

```
sh publish.sh
```

Rebuilds everything and pushes it to the `gh-pages` branch of
github.com/vldwmld/kompas-pro-finance. The live links:

- Main site: https://vldwmld.github.io/kompas-pro-finance/
- A client: https://vldwmld.github.io/kompas-pro-finance/<slug>/ (e.g. `/uob/`, `/danamon/`)

A new client folder appears there automatically after the next publish.
Commit and push source changes to `main` as usual; `main` itself is not the live site.

Shared pages are edited in the project root (and `templates/` for Dinamika Korporasi
and the article layout); rebuild afterwards so every client site picks up the change.

The main site's own `dinamika-korporasi.html` in the project root is also generated
from the template (its top story and cards are set in `build.py`), so edit the
template rather than that file. A full `python3 build.py` rewrites it.
