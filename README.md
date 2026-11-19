[![competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01) [![rank](https://make.fun/badge/gta6-cover-art-01/vickyair1/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01) [![reward](https://make.fun/badge/gta6-cover-art-01/vickyair1/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Neon Coast Cover Studio

A web app that turns your own photos and a caption into multi-panel poster-style cover art — the sunset / neon look, built from scratch in original artwork and fonts. No Rockstar logo, artwork or font anywhere; all lettering uses SIL OFL fonts shipped under `app/fonts/`.

Serve it with `node serve.ts` and open http://localhost:8080. Everything runs offline in the browser; photos are read on your machine and never uploaded.

## What it does

- **5 layouts** — 9-Panel Grid, Hero + Three, Full Bleed, Tilted Collage, Story Strip — with a live preview.
- **Up to 3 photos** — file upload or drag & drop; click any panel to select it, drag inside it to reposition, sliders for zoom and pan, per-panel photo picker.
- **6 colour grades** — Vice Sunset, Neon Night, Palm Gold, Teal Noir, Mono Pop, Candy Pop — gradient-map / duotone tint + contrast and saturation on canvas, plus halftone dots, grain, vignette, inked panel borders and neon glow.
- **Caption editing** — title + tagline, Anton / Bebas Neue / Pacifico fonts, size, top / bottom / no title-block placement, outline + drop shadow, colour pickers, and a badge ribbon with invented place words only (Neon Coast, Leonida Bay…).
- **Export** — one-click PNG at 1080×1080, 1080×1350 or 1920×1080, plus “Export all 3 sizes”.
- **Polish** — undo/redo, reset, “Surprise me” shuffle, hold-to-compare before/after grade, keyboard shortcuts (Ctrl+Z / Ctrl+Y, S, E, G, 1–5), one-click sample photos so the first cover is one click away.

## Screenshots

- `1-cover.jpg` — exported wide cover (1920×1080)
- `2-editor.jpg` — the editor with a photo loaded
- `3-cover-story.jpg` — exported story cover (1080×1350)
- `4-cover-square.jpg` — exported square cover (1080×1080)

## License

MIT — see [LICENSE](LICENSE).
