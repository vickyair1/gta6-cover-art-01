[![competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01) [![rank](https://make.fun/badge/gta6-cover-art-01/vickyair1/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01) [![reward](https://make.fun/badge/gta6-cover-art-01/vickyair1/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Neon Coast Cover Studio

A web app that turns your own photos and a caption into multi-panel poster-style cover art — the sunset / neon look, built from scratch in original artwork and fonts. No Rockstar logo, artwork or font anywhere; all lettering uses SIL OFL fonts shipped under `app/fonts/`.

Serve it with `node serve.ts` and open http://localhost:8080. Everything runs offline in the browser; photos are read on your machine and never uploaded.

## What it does

- **6 layouts** — 9-Panel Grid, Poster Hero (big hero + 2×2, the default), Hero + Three, Full Bleed, Tilted Collage, Story Strip — with a live preview.
- **Up to 4 photos** — file upload or drag & drop; click any panel to select it, drag inside it to reposition, sliders for zoom and pan, per-panel photo picker. Four free sample photos ship with the app (Boulevard, Pier, Rooftop, Neon Street) and the defaults use all four, never repeating a photo next to itself.
- **7 colour grades** — Vice Sunset, Neon Night, Palm Gold, Teal Noir, Mono Pop, Candy Pop, Poster Ink (heavy posterize + halftone duotone) — gradient-map / duotone tint + contrast and saturation on canvas, plus halftone dots, grain, vignette, thin cream panel frames with a dark inner line (GTA poster style) and neon glow.
- **Caption editing** — title + tagline, Anton / Bebas Neue / Pacifico fonts, size, top / bottom / no title-block placement, outline + drop shadow, colour pickers. The title block is a real poster block: huge sunset-gradient title (white → gold → orange → magenta) with a thick dark outline and magenta offset shadow, a neon Pacifico script tagline overlapping it, a 5-star heat-meter row with an invented press quote, a spaced-caps bottom strip ("ONE COAST • NO RULES • COMING SOON") and footer credits, all over a halftone-dot band.
- **Per-panel captions** — every panel gets a place + time + flavour chip ("MARINA DEL SOL — 7:40 PM · NO WITNESSES"); edit the selected panel's caption in the editor, or toggle all captions off.
- **Poster furniture** — a spiky gold starburst badge ("EST. 2026", editable text or presets), a "WANTED ★★★★★" heat chip, and a "VOL. 06" chip plus "COLLECTOR'S EDITION" ribbon in the title band.
- **Export** — one-click PNG at 1080×1080, 1080×1350 or 1920×1080, plus “Export all 3 sizes”.
- **Polish** — undo/redo, reset, “Surprise me” shuffle, hold-to-compare before/after grade, keyboard shortcuts (Ctrl+Z / Ctrl+Y, S, E, G, 1–6), one-click sample photos so the first cover is one click away.

## Screenshots

- `1-cover.jpg` — exported wide cover, Poster Hero layout, Vice Sunset (1920×1080)
- `2-editor.jpg` — the editor with all four photos loaded
- `3-cover-story.jpg` — exported story cover, 9-Panel Grid, Poster Ink (1080×1350)
- `4-cover-square.jpg` — exported square cover, Tilted Collage, Neon Night (1080×1080)

## License

MIT — see [LICENSE](LICENSE).
