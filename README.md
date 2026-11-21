[![competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01) [![rank](https://make.fun/badge/gta6-cover-art-01/vickyair1/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01) [![reward](https://make.fun/badge/gta6-cover-art-01/vickyair1/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Neon Coast Cover Studio

A web app that turns your own photos and a caption into multi-panel poster-style cover art — the sunset / neon look, built from scratch in original artwork and fonts. No Rockstar logo, artwork or font anywhere; all lettering uses SIL OFL fonts shipped under `app/fonts/`.

Serve it with `node serve.ts` and open http://localhost:8080. Everything runs offline in the browser; photos are read on your machine and never uploaded.

## What it does

- **7 layouts** — Key Art (full-bleed 7-panel with the title over the art, the default), 9-Panel Grid, Poster Hero (big hero + 2×2), Hero + Three, Full Bleed, Tilted Collage, Story Strip — with a live preview.
- **Up to 7 photos** — file upload or drag & drop; click any panel to select it, drag inside it to reposition, sliders for zoom and pan, per-panel photo picker. Seven free sample photos ship with the app (Boulevard, Pier, Rooftop, Neon Street, Sports Car, Night Bike, Speedboat) and the Key Art defaults use all seven distinct photos, never repeating one — five character panels plus the orange Corvette and the speedboat, every panel visible around the title.
- **Face-aware hero close-up** — the Key Art hero panel zooms ~1.6× onto the photo's face focus point, so the hero face dominates the poster like a real box-art close-up. Every panel's default framing aims at its photo's measured subject (face or hero object), never a blind centre crop.
- **8 colour grades** — Vice Sunset, Neon Night, Palm Gold, Teal Noir, Mono Pop, Candy Pop, Poster Ink (heavy posterize + halftone duotone), Dusk Heat — gradient-map / duotone tint + contrast and saturation on canvas, plus halftone dots, grain, vignette, thin cream panel frames with a dark inner line (GTA poster style) and neon glow.
- **Caption editing** — title + tagline, Anton / Bebas Neue / Pacifico fonts, size, top / bottom / no title-block / title-over-art placement, outline + drop shadow, colour pickers. The title-over-art block is the real box-art look: panels fill the whole canvas, a scrim fades up from the bottom, and a huge sunset-gradient title (white → gold → orange → magenta) with a thick dark outline and magenta offset shadow sits over the photos, spanning the middle of the poster so the bottom side panels peek around it, with a neon Pacifico script tagline overlapping it, a 5-star press-quote strip across the very top, a palm-silhouette strip ("ONE COAST • NO RULES • COMING SOON"), a full billing block, a large barcode and a rating box along the bottom edge.
- **Character callouts** — every people panel gets a black angled role tag, bottom-left inside the panel: the role in big white condensed caps ("THE DRIVER", "THE BOSS", "THE INSIDER", "THE CAPTAIN", "THE RIDER") with a magenta edge, role only — the place/time/flavour subline stays in the Cast editor. Scene panels (the car, the boat) keep the place chip instead ("INTERSTATE 6", "MARINA DEL SOL"). Tags clamp above the palm strip, so nothing collides with the title.
- **Billing block** — two lines of small white caps centred at the very bottom, full movie-credits style: "A NEON COAST PICTURES PRODUCTION IN ASSOCIATION WITH PALM ROW SYNDICATE · A K. MARLOWE FILM · NEON COAST · MUSIC BY THE PALM ROW ORCHESTRA" over "EDITED BY J. OKONKWO · WRITTEN BY L. VASQUEZ & D. RAHMAN · DIRECTED BY K. MARLOWE · STARRING THE DRIVER · THE BOSS · THE INSIDER · THE CAPTAIN · THE RIDER". All names are invented.
- **Cast editor** — a compact Cast section in the Photos group: one row per photo with a role select from the twelve-role pool (or "— Scene —") and a place/time/flavour line input. Recasting a photo re-tags its panels.
- **Per-panel captions** — every scene panel gets a place chip; edit the selected panel's full place + time + flavour caption in the editor, or toggle all callouts and chips off.
- **Poster furniture** — a spiky gold starburst badge ("EST. 2026", editable text or presets) overlapping the right edge at upper-mid poster, a "WANTED ★★★★★" heat chip, a "VOL. 06" chip plus "COLLECTOR'S EDITION" ribbon stickered on the boat panel, a large legible barcode with digits bottom-right, and an MPAA-style "RATED R · SUNSET MAYHEM" rating box bottom-left.
- **Export** — one-click PNG at 1080×1080, 1080×1350 or 1920×1080, plus “Export all 3 sizes”.
- **Polish** — undo/redo, reset, “Surprise me” shuffle, hold-to-compare before/after grade, keyboard shortcuts (Ctrl+Z / Ctrl+Y, S, E, G, 1–7), one-click sample photos so the first cover is one click away.

## Screenshots

- `1-cover.jpg` — exported wide cover, Key Art layout, Vice Sunset, title over art (1920×1080)
- `2-editor.jpg` — the editor with all seven photos loaded
- `3-cover-story.jpg` — exported story cover, Key Art, Dusk Heat, title over art (1080×1350)
- `4-cover-square.jpg` — exported square cover, Key Art, Neon Night, title over art (1080×1080)

## License

MIT — see [LICENSE](LICENSE).
