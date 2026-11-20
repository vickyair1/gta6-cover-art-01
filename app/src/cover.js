// Neon Coast Cover Studio v5 — cover renderer.
// Draws multi-panel poster art onto any 2D canvas: panels filled from the
// user's photos, a colour grade per preset, inked cream frames, halftone +
// grain, character callout tags on people panels (black angled tag, white
// condensed caps + place/time/flavour subline), place chips on scene
// panels, a full billing block along the bottom edge, a stars + press
// quote strip at the very top, a starburst badge, a wanted chip, and a
// big sunset-gradient title block with a neon script tagline. Pure canvas,
// no network, no libraries.
export const LAYOUTS = [
  { id: 'keyart', label: 'Key Art', hint: 'Full-bleed 6-panel, title over the art' },
  { id: 'grid', label: '9-Panel Grid', hint: 'Classic poster grid' },
  { id: 'poster', label: 'Poster Hero', hint: 'Big hero + 2x2, title block below' },
  { id: 'hero', label: 'Hero + Three', hint: 'One big moment, three beats' },
  { id: 'full', label: 'Full Bleed', hint: 'One photo, edge to edge' },
  { id: 'collage', label: 'Tilted Collage', hint: 'Snapshot pile, taped corners' },
  { id: 'strip', label: 'Story Strip', hint: 'Tall stacked panels' },
];

export const GRADES = [
  { id: 'vice', label: 'Vice Sunset', filter: 'saturate(1.38) contrast(1.12) brightness(1.04)', sky: '#ff7a3c', deep: '#ff2e88' },
  { id: 'neon', label: 'Neon Night', filter: 'saturate(1.55) contrast(1.22) brightness(0.94)', sky: '#2b6cff', deep: '#ff2bd6' },
  { id: 'palm', label: 'Palm Gold', filter: 'saturate(1.28) contrast(1.08) brightness(1.07) sepia(0.22)', sky: '#ffc357', deep: '#e2600a' },
  { id: 'teal', label: 'Teal Noir', filter: 'saturate(1.12) contrast(1.18) brightness(0.97)', sky: '#19d3c5', deep: '#0b3d5c' },
  { id: 'mono', label: 'Mono Pop', filter: 'grayscale(1) contrast(1.28) brightness(1.05)', sky: '#ffffff', deep: '#ff2e88' },
  { id: 'candy', label: 'Candy Pop', filter: 'saturate(1.7) contrast(1.06) brightness(1.05)', sky: '#ff5db1', deep: '#22d3ee' },
  { id: 'ink', label: 'Poster Ink', filter: 'saturate(1.6) contrast(1.38) brightness(1.02)', sky: '#ff7a3c', deep: '#2a0a4a', ink: true },
  { id: 'dusk', label: 'Dusk Heat', filter: 'saturate(1.5) contrast(1.2) brightness(1.02)', sky: '#ff8a3c', deep: '#8a0f5c' },
];

export const FONTS = [
  { id: 'anton', label: 'Anton Heavy', family: 'Anton, sans-serif' },
  { id: 'bebas', label: 'Bebas Tall', family: "'Bebas Neue', sans-serif" },
  { id: 'pacifico', label: 'Pacifico Script', family: 'Pacifico, cursive' },
];

const BADGES = ['EST. 2026', 'NEON COAST', 'LEONIDA BAY', 'VICE SUNSET', 'PALM ROW', 'TURBO HEAT', 'MIDNIGHT DRIVE'];

// Per-photo subject focus (fractions of the photo's width/height), measured
// from the real sample photos: where the face or hero object sits, so the
// default framing aims the visible window at the subject.
const PHOTO_FOCUS = [
  { x: 0.42, y: 0.18 }, // boulevard: woman's face, upper centre-left
  { x: 0.35, y: 0.20 }, // pier: fisherman's face, upper left
  { x: 0.62, y: 0.30 }, // rooftop: bearded man, right of frame
  { x: 0.48, y: 0.38 }, // neon: two friends laughing, centre
  { x: 0.55, y: 0.72 }, // car: orange sports car, low in the frame
  { x: 0.43, y: 0.45 }, // bike: rider + motorcycle, centre-left
  { x: 0.50, y: 0.50 }, // boat: speedboat + wake, centre
];

// Per-panel place captions: invented place + time + flavour. Panel i gets
// entry i; the editor lets the user rewrite the selected panel's caption.
// Ordered for the Key Art photo sequence [boulevard, rooftop, neon, car,
// pier, bike], so each visible chip names the photo it sits on. Only scene
// panels (car, boat) show these — people panels show their cast callout.
// The boat entry sits at index 6 for the layouts that still show it.
export const PANEL_CAPTIONS = [
  'OCEAN DRIVE — 6:42 PM · LOOKING FOR TROUBLE',
  'TOWER 2 — 6:10 PM · LAST SWIM',
  'NEON ROW — 12:04 AM · OPEN ALL NIGHT',
  'INTERSTATE 6 — 11:59 PM · FULL THROTTLE',
  'PIER 26 — 5:30 AM · GONE FISHING',
  'VICE POINT — 8:05 PM · NO TURNING BACK',
  'MARINA DEL SOL — 7:40 PM · NO WITNESSES',
  'PALM BOULEVARD — 9:15 PM · LIGHTS OUT',
  'SUNSET HEIGHTS — 6:30 PM · BIG MONEY',
];

// Character roles for the cast callouts — one role per photo, each used
// role appears once per cover (the billing block dedupes).
export const ROLE_POOL = [
  'THE DRIVER', 'THE BOSS', 'THE INSIDER', 'THE FIXER', 'THE RIDER',
  'THE LOOKOUT', 'THE MECHANIC', 'THE COURIER', 'THE CLOSER',
  'THE NAVIGATOR', 'THE CAPTAIN', 'THE WHEELMAN',
];

// Default cast, indexed by photo slot (0 boulevard, 1 pier, 2 rooftop,
// 3 neon, 4 car, 5 bike, 6 boat). role '' marks a scene panel: it keeps
// the place/time chip instead of a callout, and stays out of the billing
// block. The hero's subline is place + time only, kept short so her tag
// stays clear of the title; the other people panels get place + time +
// flavour. The bike counts as a people panel — the rider is visible.
export const DEFAULT_CAST = [
  { role: 'THE DRIVER', line: 'OCEAN DRIVE · 6:42 PM · TROUBLE' },
  { role: 'THE CAPTAIN', line: 'PIER 26 · 5:30 AM · GONE FISHING' },
  { role: 'THE BOSS', line: 'ROOFTOP BAR · 8:05 PM · RUNS THIS TOWN' },
  { role: 'THE INSIDER', line: 'NEON ROW · 12:04 AM · OPEN ALL NIGHT' },
  { role: '', line: 'INTERSTATE 6 · 11:59 PM · FULL THROTTLE' },
  { role: 'THE RIDER', line: 'NEON ROW · 2:15 AM · NEVER BRAKES' },
  { role: '', line: 'MARINA DEL SOL · 7:40 PM · NO WITNESSES' },
];

// Default bottom strip + press quote (invented, no real publication).
export const DEFAULT_TAGLINE2 = 'ONE COAST • NO RULES • COMING SOON';
export const DEFAULT_QUOTE = '"A FEVER DREAM IN NEON" — THE COAST HERALD';

// Deterministic pseudo-random, so grain and halftone are stable per panel.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function fitFont(ctx, text, family, maxW, startPx, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 14 && ctx.measureText(text).width > maxW) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

// Panel rectangles for a layout, inside W x H, leaving room for the title band.
// 'none' and 'overlap' reserve no band: the panels fill the whole canvas and
// the title draws over them.
export function layoutPanels(layout, W, H, placement) {
  const band = (placement === 'none' || placement === 'overlap') ? 0 : (placement === 'top' ? H * 0.15 : H * 0.36);
  const top = placement === 'top' ? band : 0;
  const areaH = H - band;
  const gap = Math.max(6, Math.round(W * 0.008));
  const x0 = gap, y0 = top + gap, w = W - gap * 2, h = areaH - gap * 2;
  const cell = (cols, rows, i) => {
    const cw = (w - gap * (cols - 1)) / cols;
    const ch = (h - gap * (rows - 1)) / rows;
    const c = i % cols, r = Math.floor(i / cols);
    return { x: x0 + c * (cw + gap), y: y0 + r * (ch + gap), w: cw, h: ch, rot: 0 };
  };
  switch (layout) {
    case 'grid': {
      const out = [];
      for (let i = 0; i < 9; i++) out.push(cell(3, 3, i));
      return out;
    }
    case 'keyart': {
      // Rank-1 geometry: hero left (~55% width, full panel-area height);
      // right side stacks a 2-panel top row (~32% height), one wide middle
      // panel (~30%) and a 2-panel bottom row (~32%). Fractions only, so the
      // same geometry works for wide, story and square.
      const heroW = w * 0.55;
      const sideX = x0 + heroW + gap, sideW = w - heroW - gap;
      const cw = (sideW - gap) / 2;
      const rowsH = h - gap * 2;
      const topH = rowsH * 32 / 94, midH = rowsH * 30 / 94, botH = rowsH * 32 / 94;
      const yTop = y0, yMid = y0 + topH + gap, yBot = y0 + topH + midH + gap * 2;
      return [
        { x: x0, y: y0, w: heroW, h, rot: 0 },
        { x: sideX, y: yTop, w: cw, h: topH, rot: 0 },
        { x: sideX + cw + gap, y: yTop, w: cw, h: topH, rot: 0 },
        { x: sideX, y: yMid, w: sideW, h: midH, rot: 0 },
        { x: sideX, y: yBot, w: cw, h: botH, rot: 0 },
        { x: sideX + cw + gap, y: yBot, w: cw, h: botH, rot: 0 },
      ];
    }
    case 'poster': {
      // Rank-2 geometry: big hero left (~55% width, full panel-area height),
      // 2x2 smaller panels right.
      const heroW = w * 0.55;
      const sideX = x0 + heroW + gap, sideW = w - heroW - gap;
      const cw = (sideW - gap) / 2, ch = (h - gap) / 2;
      return [
        { x: x0, y: y0, w: heroW, h, rot: 0 },
        { x: sideX, y: y0, w: cw, h: ch, rot: 0 },
        { x: sideX + cw + gap, y: y0, w: cw, h: ch, rot: 0 },
        { x: sideX, y: y0 + ch + gap, w: cw, h: ch, rot: 0 },
        { x: sideX + cw + gap, y: y0 + ch + gap, w: cw, h: ch, rot: 0 },
      ];
    }
    case 'hero': {
      const heroW = w * 0.62;
      const sideX = x0 + heroW + gap, sideW = w - heroW - gap;
      const sh = (h - gap * 2) / 3;
      return [
        { x: x0, y: y0, w: heroW, h, rot: 0 },
        { x: sideX, y: y0, w: sideW, h: sh, rot: 0 },
        { x: sideX, y: y0 + sh + gap, w: sideW, h: sh, rot: 0 },
        { x: sideX, y: y0 + 2 * (sh + gap), w: sideW, h: sh, rot: 0 },
      ];
    }
    case 'full':
      return [{ x: x0, y: y0, w, h, rot: 0 }];
    case 'collage': {
      const rot = [-0.05, 0.045, -0.03, 0.06, -0.055];
      const spots = [
        { x: x0 + w * 0.02, y: y0 + h * 0.02, w: w * 0.52, h: h * 0.56 },
        { x: x0 + w * 0.48, y: y0 + h * 0.05, w: w * 0.48, h: h * 0.42 },
        { x: x0 + w * 0.06, y: y0 + h * 0.58, w: w * 0.4, h: h * 0.38 },
        { x: x0 + w * 0.5, y: y0 + h * 0.5, w: w * 0.46, h: h * 0.46 },
        { x: x0 + w * 0.3, y: y0 + h * 0.3, w: w * 0.34, h: h * 0.34 },
      ];
      return spots.map((s, i) => ({ ...s, rot: rot[i % rot.length] }));
    }
    case 'strip': {
      const out = [];
      for (let i = 0; i < 4; i++) out.push(cell(1, 4, i));
      return out;
    }
    default:
      return [{ x: x0, y: y0, w, h, rot: 0 }];
  }
}

function panelCount(layout) {
  return layout === 'grid' ? 9 : layout === 'keyart' ? 6 : layout === 'poster' ? 5 : layout === 'hero' ? 4 : layout === 'full' ? 1 : layout === 'collage' ? 5 : 4;
}

// Photo assignment with NO adjacent repeats: the 9-panel grid cycles
// [0,1,2,3,0,1,2,3,0] — every row and column differs, each photo at most 3x.
// Poster/hero/collage/strip use all four photos once, plus one extra that
// never sits next to its twin. Zoom and pan vary per panel so a repeated
// photo never looks identical twice.
// Key Art is people-first: five of the six panels show a person (hero
// boulevard, rooftop, neon, pier, bike rider) and only one is a vehicle
// (the orange Corvette, mid-wide). The boat cove sits out of Key Art.
const PHOTO_SEQ = {
  grid: [0, 1, 2, 3, 0, 1, 2, 3, 0],
  keyart: [0, 2, 3, 4, 1, 5],
  poster: [0, 1, 2, 3, 1],
  hero: [0, 1, 2, 3],
  collage: [0, 1, 2, 3, 1],
  strip: [0, 1, 2, 3],
  full: [0],
};

// Per-photo horizontal bias: the rooftop sample's face sits on the right of
// the frame, so its panels pan left (negative ox shows the right side).
const PHOTO_OX = [0, 0, -0.45, 0, 0, 0, 0];

export function defaultPanels(layout, photoCount, photos, dims, placement = 'bottom') {
  const n = panelCount(layout);
  const seq = PHOTO_SEQ[layout] || PHOTO_SEQ.grid;
  const out = [];
  for (let i = 0; i < n; i++) {
    const photo = photoCount ? seq[i % seq.length] % photoCount : 0;
    out.push({
      photo,
      zoom: 1 + (i % 3) * 0.1,
      ox: PHOTO_OX[photo] || 0,
      oy: (((i * 0.37 + photo * 0.13) % 1) - 0.5) * 0.5,
    });
  }
  if (photos && photos.length && dims && dims.w && dims.h) {
    // Subject-safe default framing, aimed from the real photos: cover-fit
    // crops a photo to the panel, so the visible window is centred on each
    // photo's subject (face or hero object, PHOTO_FOCUS) instead of the
    // photo's centre — a centred crop cuts the face out of a wide panel,
    // and a top-anchored crop cuts the car out of its panel entirely. The
    // pan values are derived from drawPanel's own offset formula, so the
    // default framing is exactly what the renderer draws.
    const rects = layoutPanels(layout, dims.w, dims.h, placement);
    for (let i = 0; i < n; i++) {
      const img = photos[out[i].photo] && photos[out[i].photo].img;
      if (!img || !img.naturalWidth || !img.naturalHeight) continue;
      const r = rects[i];
      const focus = PHOTO_FOCUS[out[i].photo] || { x: 0.5, y: 0.3 };
      const zBase = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight) * (out[i].zoom || 1);
      const zPw = img.naturalWidth * zBase, zPh = img.naturalHeight * zBase;
      if (zPw > r.w) {
        const dx = clamp(r.w / 2 - focus.x * zPw, r.w - zPw, 0);
        out[i].ox = clamp((dx - (r.w - zPw) / 2) / (r.w * 0.4), -1, 1);
      }
      if (zPh > r.h) {
        const dy = clamp(r.h / 2 - focus.y * zPh, r.h - zPh, 0);
        out[i].oy = clamp((dy - (r.h - zPh) / 2) / (r.h * 0.4) + out[i].oy * 0.4, -1, 1);
      }
      // Top-visibility guard, face photos only: never crop more than ~6%
      // of the photo's height from the top, or faces that start near the
      // frame edge (the rooftop sample) get cut out of short wide panels.
      // Object photos (car, bike, boat) keep their low focus — the subject
      // sits at the bottom of the frame.
      if (focus.y < 0.5 && zPh > r.h) {
        const rawDy = (r.h - zPh) / 2 + out[i].oy * r.h * 0.4;
        const shownDy = clamp(rawDy, r.h - zPh, 0);
        if (shownDy < -0.06 * zPh) {
          out[i].oy = clamp((-0.06 * zPh - (r.h - zPh) / 2) / (r.h * 0.4), -1, 1);
        }
      }
    }
    return out;
  }
  // No photo geometry to aim with: a modest top-weighted nudge. (The old
  // negative values pushed the photo UP, cropping the face out — the sign
  // was backwards: a negative oy moves the image up, hiding its top.)
  if (layout === 'hero') { out[0].oy = 0.5; out[2].oy = 0.5; }
  if (layout === 'collage') { out[0].oy = 0.3; }
  return out;
}

// Cover-fit offsets for a photo inside a panel, clamped so the photo always
// covers the panel: panning reframes the shot, it never exposes bare panel.
// A zoomed-out photo (smaller than the panel) stays centred instead.
function coverOffsets(w, h, pw, ph, ox, oy) {
  const rawDx = (w - pw) / 2 + (ox || 0) * w * 0.4;
  const rawDy = (h - ph) / 2 + (oy || 0) * h * 0.4;
  const dx = pw >= w ? clamp(rawDx, w - pw, 0) : rawDx;
  const dy = ph >= h ? clamp(rawDy, h - ph, 0) : rawDy;
  return { dx, dy };
}

// Halftone dot field on a scratch context: poster-ink grade gets big dots
// over the whole panel, other grades get a light dot band across the sky.
function halftoneDots(s, sw, sh, ink) {
  const step = ink ? Math.max(6, Math.round(sw / 70)) : Math.max(7, Math.round(sw / 90));
  const rows = ink ? sh : sh * 0.4;
  s.fillStyle = ink ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.10)';
  for (let yy = 0; yy < rows; yy += step) {
    for (let xx = (yy / step % 2) * step / 2; xx < sw; xx += step) {
      s.beginPath(); s.arc(xx, yy, Math.max(1, step * (ink ? 0.26 : 0.18)), 0, 7); s.fill();
    }
  }
  if (ink) {
    // Dark dots in the highlights for a printed-poster duotone feel.
    s.fillStyle = 'rgba(20,4,40,0.12)';
    for (let yy = step / 2; yy < rows; yy += step) {
      for (let xx = step / 2 + (yy / step % 2) * step / 2; xx < sw; xx += step) {
        s.beginPath(); s.arc(xx, yy, Math.max(1, step * 0.16), 0, 7); s.fill();
      }
    }
  }
}

// Draw one photo into a panel rect, graded, with halftone + grain + caption.
function drawPanel(ctx, rect, img, panel, grade, opts) {
  const { x, y, w, h, rot } = rect;
  const pad = opts.collagePad && rect.rot ? Math.max(8, w * 0.03) : 0;
  const frame = opts.frame === 'black' ? '#0d0d12' : '#fdf8ee';
  ctx.save();
  if (rot) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);
    ctx.translate(-w / 2, -h / 2);
  } else {
    ctx.translate(x, y);
  }
  // Cream poster frame (black only for Full Bleed), shadow under every panel.
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = Math.max(6, w * 0.03);
  ctx.shadowOffsetY = Math.max(3, w * 0.012);
  ctx.fillStyle = frame;
  ctx.fillRect(-pad, -pad, w + pad * 2, h + pad * 2);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();

  if (img) {
    const zoom = panel.zoom || 1;
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const pw = img.naturalWidth * base, ph = img.naturalHeight * base;
    const { dx, dy } = coverOffsets(w, h, pw, ph, panel.ox, panel.oy);
    if (opts.gradeOn) {
      // Grade on a scratch canvas so the filter + overlays stay inside the panel.
      const sc = drawPanel.scratch || (drawPanel.scratch = document.createElement('canvas'));
      const sw = Math.min(900, Math.max(120, Math.round(w)));
      const sh = Math.round((sw * h) / w);
      sc.width = sw; sc.height = sh;
      const s = sc.getContext('2d');
      s.filter = grade.filter;
      const bScale = Math.max(sw / img.naturalWidth, sh / img.naturalHeight) * zoom;
      const bPw = img.naturalWidth * bScale, bPh = img.naturalHeight * bScale;
      const off = coverOffsets(sw, sh, bPw, bPh, panel.ox, panel.oy);
      s.drawImage(img, off.dx, off.dy, bPw, bPh);
      s.filter = 'none';
      const g = s.createLinearGradient(0, 0, 0, sh);
      g.addColorStop(0, grade.sky + '55');
      g.addColorStop(0.55, grade.sky + '00');
      g.addColorStop(1, grade.deep + '88');
      s.globalCompositeOperation = 'overlay';
      s.fillStyle = g;
      s.fillRect(0, 0, sw, sh);
      s.globalCompositeOperation = 'source-over';
      if (grade.ink) {
        // Duotone sunset map: deep purple multiplied into the shadows.
        const d = s.createLinearGradient(0, sh * 0.4, 0, sh);
        d.addColorStop(0, grade.deep + '00');
        d.addColorStop(1, grade.deep + '55');
        s.globalCompositeOperation = 'multiply';
        s.fillStyle = d;
        s.fillRect(0, 0, sw, sh);
        s.globalCompositeOperation = 'source-over';
      }
      if (opts.halftone) halftoneDots(s, sw, sh, !!grade.ink);
      ctx.drawImage(sc, 0, 0, w, h);
    } else {
      ctx.drawImage(img, dx, dy, pw, ph);
    }
  } else {
    // Empty panel: bold placeholder stripes so the layout still reads.
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#3a2b52'); g.addColorStop(1, '#171226');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = Math.max(2, w * 0.008);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `bold ${Math.max(12, w * 0.06)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD PHOTO', w / 2, h / 2);
  }

  // Grain, seeded per panel so re-renders are identical.
  if (opts.grain) {
    const rnd = mulberry32(1234 + Math.round(x) * 7 + Math.round(y) * 13);
    const n = Math.round((w * h) / 1400);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < n; i++) ctx.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < n / 2; i++) ctx.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
  }
  ctx.restore();

  // Thin cream frame with a dark inner line (GTA poster style); Full Bleed
  // keeps the thick black gutter instead.
  ctx.save();
  if (rot) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2); }
  else ctx.translate(x, y);
  if (opts.frame === 'black') {
    ctx.lineWidth = Math.max(3, w * 0.012);
    ctx.strokeStyle = '#0d0d12';
    ctx.strokeRect(-pad, -pad, w + pad * 2, h + pad * 2);
    ctx.lineWidth = Math.max(1, w * 0.003);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.strokeRect(Math.max(2, w * 0.01), Math.max(2, w * 0.01), w - Math.max(4, w * 0.02), h - Math.max(4, w * 0.02));
  } else {
    ctx.lineWidth = Math.max(2, w * 0.008);
    ctx.strokeStyle = '#fdf8ee';
    ctx.strokeRect(-pad, -pad, w + pad * 2, h + pad * 2);
    ctx.lineWidth = Math.max(1, w * 0.003);
    ctx.strokeStyle = 'rgba(13,13,18,0.8)';
    ctx.strokeRect(Math.max(3, w * 0.014), Math.max(3, w * 0.014), w - Math.max(6, w * 0.028), h - Math.max(6, w * 0.028));
  }
  ctx.restore();

  // Tape corners on the collage.
  if (rot && opts.tape) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = 'rgba(255,235,160,0.75)';
    ctx.fillRect(w * 0.32, -pad - Math.max(6, h * 0.02), w * 0.36, Math.max(10, h * 0.05));
    ctx.restore();
  }
  return { x, y, w, h, rot };
}

// Per-panel caption chip, bottom-left: place name + time/flavour. Scene
// panels only (car, boat) — people panels get the cast callout instead.
// The chip's bottom edge is clamped to 91% of the canvas height, above
// the palm strip and the billing block; panels ending higher keep their
// natural bottom-margin position.
function drawCaptionChip(ctx, rect, caption, W, H, placement) {
  if (!caption) return;
  const { x, y, w, h, rot } = rect;
  const parts = String(caption).split(' — ');
  const name = (parts[0] || '').trim().toUpperCase();
  const rest = (parts[1] || '').trim().toUpperCase();
  if (!name) return;
  const namePx = clamp(w * 0.052, 10, 30);
  const subPx = Math.max(8, namePx * 0.58);
  ctx.save();
  if (rot) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2); }
  else ctx.translate(x, y);
  ctx.font = `bold ${namePx}px Anton, sans-serif`;
  const nameW = ctx.measureText(name).width;
  ctx.font = `bold ${subPx}px sans-serif`;
  const subW = rest ? ctx.measureText(rest).width : 0;
  const padX = namePx * 0.55, padY = namePx * 0.32;
  const chipW = Math.max(nameW, subW) + padX * 2;
  const chipH = namePx + (rest ? subPx + namePx * 0.22 : 0) + padY * 2;
  const cx0 = Math.max(4, w * 0.03);
  const naturalBottom = h - Math.max(4, h * 0.04);
  const maxBottom = H * 0.91 - y;
  const cy0 = Math.max(0, Math.min(naturalBottom - chipH, maxBottom - chipH));
  ctx.fillStyle = 'rgba(8,6,16,0.88)';
  ctx.fillRect(cx0, cy0, chipW, chipH);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(cx0, cy0 + chipH - Math.max(2, namePx * 0.12), chipW, Math.max(2, namePx * 0.12));
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${namePx}px Anton, sans-serif`;
  ctx.fillText(name, cx0 + padX, cy0 + padY + namePx * 0.82);
  if (rest) {
    ctx.fillStyle = '#ffd166';
    ctx.font = `bold ${subPx}px sans-serif`;
    ctx.fillText(rest, cx0 + padX, cy0 + padY + namePx + subPx * 0.9);
  }
  ctx.restore();
}

// Character callout tag, bottom-left of a people panel, rank-1 box-art
// style: black angled tag with a magenta edge stripe, white condensed caps
// for the role and a short gold place/time/flavour subline. The subline is
// dropped on small panels low on the poster (the title/tagline zone in
// title-over-art) and whenever the tag would outgrow its panel; the tag's
// bottom edge is clamped to 91% of the canvas height, above the palm strip
// and the billing block.
function drawCallout(ctx, rect, cast, W, H, placement) {
  const { x, y, w, h, rot } = rect;
  const role = String(cast.role || '').trim().toUpperCase();
  const line = String(cast.line || '').trim().toUpperCase();
  if (!role) return;
  const namePx = clamp(w * 0.052, 10, 30);
  const subPx = Math.max(8, namePx * 0.58);
  const padX = namePx * 0.55, padY = namePx * 0.32;
  const slant = namePx * 0.4;
  const marginX = Math.max(4, w * 0.03);
  // Small panels low on the poster sit in the title/tagline zone: role
  // only, no subline — the subline would run under the title.
  const smallLow = w < W * 0.30 && y + h > H * 0.86;
  let showLine = !!line && !smallLow;
  ctx.save();
  if (rot) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2); }
  else ctx.translate(x, y);
  const measure = (withLine) => {
    ctx.font = `bold ${namePx}px Anton, sans-serif`;
    const nameW = ctx.measureText(role).width;
    let subW = 0;
    if (withLine) {
      ctx.font = `bold ${subPx}px sans-serif`;
      subW = ctx.measureText(line).width;
    }
    const chipW = Math.max(nameW, subW) + padX * 2 + slant;
    const chipH = namePx + (withLine ? subPx + namePx * 0.22 : 0) + padY * 2;
    return { chipW, chipH };
  };
  let m = measure(showLine);
  if (showLine && m.chipW > w - marginX * 2) { showLine = false; m = measure(false); }
  const chipW = m.chipW, chipH = m.chipH;
  const cx0 = marginX;
  const naturalBottom = h - Math.max(4, h * 0.04);
  const maxBottom = H * 0.91 - y;
  const cy0 = Math.max(0, Math.min(naturalBottom - chipH, maxBottom - chipH));
  // Angled black tag (italic lean) + magenta edge stripe on the left.
  const edge = Math.max(3, namePx * 0.14);
  ctx.fillStyle = 'rgba(8,6,16,0.92)';
  ctx.beginPath();
  ctx.moveTo(cx0 + slant, cy0);
  ctx.lineTo(cx0 + chipW, cy0);
  ctx.lineTo(cx0 + chipW - slant, cy0 + chipH);
  ctx.lineTo(cx0, cy0 + chipH);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.moveTo(cx0 + slant, cy0);
  ctx.lineTo(cx0 + slant + edge, cy0);
  ctx.lineTo(cx0 + edge, cy0 + chipH);
  ctx.lineTo(cx0, cy0 + chipH);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${namePx}px Anton, sans-serif`;
  ctx.fillText(role, cx0 + slant + padX, cy0 + padY + namePx * 0.82);
  if (showLine) {
    ctx.fillStyle = '#ffd166';
    ctx.font = `bold ${subPx}px sans-serif`;
    ctx.fillText(line, cx0 + slant + padX, cy0 + padY + namePx + subPx * 0.9);
  }
  ctx.restore();
}

// Spiky starburst polygon (badge / seal).
function starburstPath(ctx, cx, cy, rOuter, rInner, spikes) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawBadge(ctx, W, H, badge, grade) {
  if (!badge) return;
  const text = badge.trim().toUpperCase();
  if (!text) return;
  const cx = W * 0.085, cy = H * 0.075;
  const rOuter = Math.max(30, W * 0.048);
  const rInner = rOuter * 0.82;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.08);
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = rOuter * 0.35; ctx.shadowOffsetY = rOuter * 0.08;
  starburstPath(ctx, 0, 0, rOuter, rInner, 14);
  ctx.fillStyle = '#ffd166';
  ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.lineWidth = Math.max(2, rOuter * 0.05);
  ctx.strokeStyle = '#0d0d12';
  ctx.beginPath(); ctx.arc(0, 0, rOuter * 0.72, 0, 7); ctx.stroke();
  // Two lines when the badge has two words ("EST. 2026"), one line otherwise.
  const words = text.split(/\s+/);
  ctx.fillStyle = '#0d0d12';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (words.length === 2) {
    const px = fitFont(ctx, words[0], 'Anton, sans-serif', rOuter * 1.15, rOuter * 0.42, '400');
    ctx.font = `${px}px Anton, sans-serif`;
    ctx.fillText(words[0], 0, -px * 0.55);
    ctx.fillText(words[1], 0, px * 0.55);
  } else {
    const px = fitFont(ctx, text, 'Anton, sans-serif', rOuter * 1.35, rOuter * 0.4, '400');
    ctx.font = `${px}px Anton, sans-serif`;
    ctx.fillText(text, 0, px * 0.05);
  }
  ctx.fillStyle = '#ff2e88';
  ctx.font = `${Math.max(9, rOuter * 0.16)}px sans-serif`;
  ctx.fillText('★ ★ ★', 0, rOuter * 0.62);
  ctx.restore();
}

// "WANTED ★★★★★" heat chip, top-right.
function drawWantedChip(ctx, W, H, stars) {
  const n = Math.max(0, Math.min(5, stars || 0));
  const px = Math.max(15, W * 0.02);
  const label = `WANTED ${'★'.repeat(n)}${'☆'.repeat(5 - n)}`;
  ctx.save();
  ctx.font = `bold ${px}px Anton, sans-serif`;
  const tw = ctx.measureText(label).width + px * 1.5;
  const th = px * 1.85;
  const x = W - tw - W * 0.015, y = H * 0.028;
  ctx.fillStyle = 'rgba(8,6,16,0.92)';
  ctx.beginPath();
  ctx.roundRect(x, y, tw, th, th / 2);
  ctx.fill();
  ctx.lineWidth = Math.max(2, px * 0.1);
  ctx.strokeStyle = '#ffd166';
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + tw / 2, y + th / 2 + px * 0.05);
  ctx.restore();
}

function drawGradientTitle(ctx, title, family, cx, baseline, px, grade, state) {
  ctx.font = `${px}px ${family}`;
  ctx.lineJoin = 'round';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // Magenta offset shadow, like the top entries' poster lettering.
  ctx.fillStyle = '#ff2e88';
  ctx.fillText(title, cx + px * 0.05, baseline + px * 0.075);
  if (state.outline !== false) {
    ctx.strokeStyle = state.outlineColor || '#0d0d12';
    ctx.lineWidth = Math.max(2, px * 0.15);
    ctx.strokeText(title, cx, baseline);
  }
  ctx.shadowColor = state.shadow === false ? 'transparent' : 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = px * 0.16;
  ctx.shadowOffsetY = px * 0.06;
  // Sunset fill: white → gold → orange → magenta through the letters.
  const tg = ctx.createLinearGradient(0, baseline - px, 0, baseline);
  tg.addColorStop(0, '#ffffff');
  tg.addColorStop(0.35, '#ffd166');
  tg.addColorStop(0.7, '#ff7a3c');
  tg.addColorStop(1, '#ff2e88');
  ctx.fillStyle = tg;
  ctx.fillText(title, cx, baseline);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
}

// Bottom strip for the overlap title: a sunset band with ~10 procedural
// palm silhouettes (trunk line + 5 frond arcs each) and the spaced-caps
// tagline centred on it, rank-1 box-art style. The band sits at 91.5–
// 95.5% of the height, leaving the bottom strip free for the billing
// block; callout tags clamp above 91% so they never touch the band.
function drawPalmBand(ctx, W, H, stripText) {
  const bandY = H * 0.915, bandH = H * 0.04;
  const g = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  g.addColorStop(0, '#ff8a3c');
  g.addColorStop(0.55, '#ff2e88');
  g.addColorStop(1, '#5b0a6e');
  ctx.fillStyle = g;
  ctx.fillRect(0, bandY, W, bandH);
  const rnd = mulberry32(20261120);
  ctx.strokeStyle = 'rgba(16,4,28,0.92)';
  ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const px = ((i + 0.5) / 10) * W + (rnd() - 0.5) * W * 0.03;
    const ph = bandH * (0.55 + rnd() * 0.45);
    const baseY = bandY + bandH;
    const topY = baseY - ph;
    const lean = (rnd() - 0.5) * ph * 0.25;
    ctx.lineWidth = Math.max(1.5, bandH * 0.045);
    ctx.beginPath();
    ctx.moveTo(px, baseY);
    ctx.quadraticCurveTo(px + lean * 0.3, baseY - ph * 0.6, px + lean, topY);
    ctx.stroke();
    const crownX = px + lean;
    const frondLen = ph * 0.55;
    ctx.lineWidth = Math.max(1.2, bandH * 0.035);
    for (let f = 0; f < 5; f++) {
      const theta = Math.PI * (1.2 + f * 0.15);
      const dx = Math.cos(theta), dy = Math.sin(theta);
      const tipX = crownX + dx * frondLen;
      const tipY = topY + dy * frondLen + frondLen * 0.4;
      ctx.beginPath();
      ctx.moveTo(crownX, topY);
      ctx.quadraticCurveTo(crownX + dx * frondLen * 0.55, topY + dy * frondLen * 0.55 - frondLen * 0.18, tipX, tipY);
      ctx.stroke();
    }
  }
  if (stripText) {
    const sPx = Math.max(12, H * 0.021);
    ctx.font = `bold ${sPx}px 'Bebas Neue', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = `${Math.max(2, H * 0.004)}px`; } catch { /* older canvas: no tracking */ }
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = sPx * 0.4;
    ctx.fillStyle = '#fff3d6';
    ctx.fillText(stripText, W / 2, bandY + bandH / 2 + sPx * 0.05);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
}

// Small white barcode, bottom-right: ~20 seeded random-width black bars.
function drawBarcode(ctx, W, H) {
  const bw = W * 0.05, bh = H * 0.017;
  const bx = W - bw - W * 0.012, by = H - bh - H * 0.004;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx, by, bw, bh);
  const rnd = mulberry32(90210);
  ctx.fillStyle = '#0d0d12';
  let x = bx + bw * 0.08;
  while (x < bx + bw * 0.92) {
    const barW = Math.max(1, rnd() * bw * 0.045);
    if (rnd() > 0.35) ctx.fillRect(x, by + bh * 0.12, barW, bh * 0.76);
    x += barW + Math.max(1, rnd() * bw * 0.03);
  }
}

// Full billing block, rank-1 box-art style: two lines of small white caps
// centred at the very bottom — the production line names every character
// on the cover in panel order, each role once, then the camera/grade line.
// A short dark gradient behind it keeps the small type legible over any
// photo; the barcode sits to its right, clear of both lines.
function drawBillingBlock(ctx, W, H, state) {
  const cast = state.cast || DEFAULT_CAST;
  const roles = [];
  const seen = new Set();
  (state.panels || []).forEach((p) => {
    const c = cast[p.photo] || {};
    const role = String(c.role || '').trim().toUpperCase();
    if (role && !seen.has(role)) { seen.add(role); roles.push(role); }
  });
  const line1 = roles.length
    ? `A NEON COAST PICTURE · STARRING ${roles.join(' · ')}`
    : 'A NEON COAST PICTURE';
  const line2 = 'SHOT ON YOUR OWN CAMERA · GRADED BY HAND';
  const sg = ctx.createLinearGradient(0, H * 0.94, 0, H);
  sg.addColorStop(0, 'rgba(8,6,16,0)');
  sg.addColorStop(1, 'rgba(8,6,16,0.85)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, H * 0.94, W, H * 0.06);
  const px = Math.min(
    fitFont(ctx, line1, 'sans-serif', W * 0.86, Math.max(11, H * 0.014), 'bold'),
    fitFont(ctx, line2, 'sans-serif', W * 0.86, Math.max(11, H * 0.014), 'bold'),
  );
  ctx.font = `bold ${px}px sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(line1, W / 2, H * 0.968);
  ctx.fillText(line2, W / 2, H * 0.983);
}

// Stars + press quote strip at the very top of the poster, rank-1 style:
// a dark gradient fading down from the top edge, gold stars and the
// invented press quote centred on it. Drawn before the badge and the
// WANTED chip, so those stay bright on top of it. Skipped for the top
// title block, where the title itself lives at the top.
function drawTopQuoteStrip(ctx, W, H, state) {
  const stars = Math.max(0, Math.min(5, state.stars ?? 5));
  const quote = (state.quote || DEFAULT_QUOTE).trim();
  if (state.showStars === false && !quote) return;
  const sg = ctx.createLinearGradient(0, 0, 0, H * 0.085);
  sg.addColorStop(0, 'rgba(8,6,16,0.88)');
  sg.addColorStop(1, 'rgba(8,6,16,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H * 0.085);
  const starText = state.showStars === false ? '' : '★'.repeat(stars) + ' ';
  const line = `${starText}${quote}`.trim();
  if (!line) return;
  const qPx = fitFont(ctx, line, "'Bebas Neue', sans-serif", W * 0.62, Math.max(13, H * 0.021), 'bold');
  ctx.font = `bold ${qPx}px 'Bebas Neue', sans-serif`;
  const lineW = ctx.measureText(line).width;
  const lx = W / 2 - lineW / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (state.showStars !== false) {
    ctx.fillStyle = '#ffd166';
    ctx.fillText('★'.repeat(stars), lx, H * 0.048);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(quote, lx + (state.showStars === false ? 0 : ctx.measureText('★'.repeat(stars) + ' ').width), H * 0.048);
}

function drawTitleBlock(ctx, W, H, state, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const tag = (state.tagline || '').trim();
  const font = FONTS.find((f) => f.id === state.font) || FONTS[0];
  const placement = state.placement || 'bottom';
  const cx = W / 2;

  if (placement === 'top') {
    // Compact top block: gradient title + script tagline, no heat row
    // (the stars + press quote live in the top strip — which this
    // placement skips, since the title itself is at the top).
    const bandH = H * 0.15;
    const g = ctx.createLinearGradient(0, 0, 0, bandH);
    g.addColorStop(0, 'rgba(8,6,16,0.92)'); g.addColorStop(1, 'rgba(8,6,16,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, bandH);
    ctx.fillStyle = grade.deep;
    ctx.fillRect(0, bandH - Math.max(3, H * 0.004), W, Math.max(3, H * 0.004));
    if (title) {
      const px = fitFont(ctx, title, font.family, W * 0.94, Math.max(20, H * 0.1 * ((state.titleSize || 100) / 100)), '400');
      drawGradientTitle(ctx, title, font.family, cx, H * 0.105, px, grade, state);
    }
    if (tag) {
      const tagPx = fitFont(ctx, tag, 'Pacifico, cursive', W * 0.72, Math.max(16, H * 0.038), '400');
      ctx.font = `${tagPx}px Pacifico, cursive`;
      ctx.fillStyle = state.tagColor || '#ffd166';
      ctx.textAlign = 'center';
      ctx.fillText(tag, cx, H * 0.145);
    }
    drawBillingBlock(ctx, W, H, state);
  } else if (placement === 'none') {
    // Title over the photo: dark scrim, same big gradient lettering.
    const scrimH = H * 0.17;
    ctx.fillStyle = 'rgba(8,6,16,0.55)';
    ctx.fillRect(0, H - scrimH, W, scrimH);
    if (title) {
      const px = fitFont(ctx, title, font.family, W * 0.94, Math.max(20, H * 0.13 * ((state.titleSize || 100) / 100)), '400');
      drawGradientTitle(ctx, title, font.family, cx, H - H * 0.055, px, grade, state);
    }
    if (tag) {
      const tagPx = fitFont(ctx, tag, 'Pacifico, cursive', W * 0.72, Math.max(16, H * 0.04), '400');
      ctx.font = `${tagPx}px Pacifico, cursive`;
      ctx.fillStyle = state.tagColor || '#ffd166';
      ctx.textAlign = 'center';
      ctx.fillText(tag, cx, H - H * 0.155);
    }
    drawBillingBlock(ctx, W, H, state);
  } else if (placement === 'overlap') {
    // Title OVER the art, rank-1 box-art style: the panels fill the whole
    // canvas (no band reserved), a scrim fades up from the bottom, and the
    // huge title, script tagline and furniture sit on top of the photos,
    // with a palm-silhouette strip, the billing block and a barcode along
    // the bottom edge. The stars + press quote live in the top strip now
    // (see drawTopQuoteStrip), not in a mid-poster heat row.
    const scrimTop = H * 0.55;
    const sg = ctx.createLinearGradient(0, scrimTop, 0, H);
    sg.addColorStop(0, 'rgba(8,6,16,0)');
    sg.addColorStop(0.35, 'rgba(8,6,16,0.45)');
    sg.addColorStop(1, 'rgba(8,6,16,0.85)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, scrimTop, W, H - scrimTop);

    // The title: cap-height ~16% of poster height, fitting 94% width.
    const titleBaseline = H * 0.83;
    let titlePx = 0;
    if (title) {
      const sizeScale = (state.titleSize || 100) / 100;
      titlePx = fitFont(ctx, title, font.family, W * 0.94, Math.max(20, H * 0.22 * sizeScale), '400');
      drawGradientTitle(ctx, title, font.family, cx, titleBaseline, titlePx, grade, state);
    }
    // Neon script tagline overlapping the bottom of the title.
    if (tag) {
      const tagPx = fitFont(ctx, tag, 'Pacifico, cursive', W * 0.72, Math.max(16, H * 0.052), '400');
      ctx.save();
      ctx.translate(cx + W * 0.06, titleBaseline + tagPx * 0.62);
      ctx.rotate(-0.02);
      ctx.font = `${tagPx}px Pacifico, cursive`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255,46,136,0.9)';
      ctx.shadowBlur = tagPx * 0.5;
      ctx.fillStyle = '#ff7ad9';
      ctx.fillText(tag, 0, 0);
      ctx.restore();
    }

    // VOL. 06 chip, top-right of the scrim zone.
    const volPx = Math.max(13, H * 0.024);
    ctx.font = `bold ${volPx}px Anton, sans-serif`;
    const volW = ctx.measureText('VOL. 06').width + volPx * 1.4;
    ctx.save();
    ctx.translate(W - volW / 2 - W * 0.02, H * 0.60);
    ctx.rotate(0.06);
    ctx.fillStyle = '#19d3c5';
    ctx.fillRect(-volW / 2, -volPx * 0.95, volW, volPx * 1.9);
    ctx.lineWidth = Math.max(2, volPx * 0.1);
    ctx.strokeStyle = '#0d0d12';
    ctx.strokeRect(-volW / 2, -volPx * 0.95, volW, volPx * 1.9);
    ctx.fillStyle = '#0d0d12';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('VOL. 06', 0, volPx * 0.05);
    ctx.restore();

    // COLLECTOR'S EDITION ribbon, stickered on the car panel's
    // bottom-right corner: the bottom row now carries character callouts,
    // so the ribbon moved up out of their way (it used to sit at 88.5% H,
    // right where the bike panel's callout goes).
    const ribPx = Math.max(11, H * 0.019);
    ctx.font = `bold ${ribPx}px Anton, sans-serif`;
    const ribW = ctx.measureText("COLLECTOR'S EDITION").width + ribPx * 1.4;
    ctx.save();
    ctx.translate(W - ribW / 2 - W * 0.015, H * 0.645);
    ctx.rotate(-0.03);
    ctx.fillStyle = '#ff2e88';
    ctx.fillRect(-ribW / 2, -ribPx * 0.95, ribW, ribPx * 1.9);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText("COLLECTOR'S EDITION", 0, ribPx * 0.05);
    ctx.restore();

    // Bottom strip: palm-silhouette band + spaced-caps tagline, then the
    // full billing block and a barcode at the bottom-right.
    const strip = (state.tagline2 || DEFAULT_TAGLINE2).trim().toUpperCase();
    drawPalmBand(ctx, W, H, strip);
    drawBillingBlock(ctx, W, H, state);
    drawBarcode(ctx, W, H);
  } else {
    // Bottom poster block: ~36% of the height — huge gradient title, neon
    // script tagline overlapping the title, VOL. 06 chip, COLLECTOR'S
    // EDITION ribbon, tagline strip and the billing block. The stars +
    // press quote live in the top strip now, not in a mid-poster heat row.
    const bandH = H * 0.36;
    const bandY = H - bandH;
    const g = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
    g.addColorStop(0, 'rgba(8,6,16,0)');
    g.addColorStop(0.22, 'rgba(8,6,16,0.88)');
    g.addColorStop(1, 'rgba(8,6,16,0.96)');
    ctx.fillStyle = g;
    ctx.fillRect(0, bandY, W, bandH);
    // Halftone-dot band behind the title block.
    ctx.save();
    ctx.beginPath(); ctx.rect(0, bandY, W, bandH); ctx.clip();
    ctx.fillStyle = 'rgba(255,46,136,0.10)';
    const step = Math.max(8, Math.round(W / 110));
    for (let yy = bandY; yy < bandY + bandH; yy += step) {
      for (let xx = (yy / step % 2) * step / 2; xx < W; xx += step) {
        ctx.beginPath(); ctx.arc(xx, yy, Math.max(1, step * 0.2), 0, 7); ctx.fill();
      }
    }
    ctx.restore();
    // Sunset rule line at the top of the band.
    const rule = ctx.createLinearGradient(0, 0, W, 0);
    rule.addColorStop(0, '#ff7a3c'); rule.addColorStop(0.5, '#ffd166'); rule.addColorStop(1, '#ff2e88');
    ctx.fillStyle = rule;
    ctx.fillRect(0, bandY, W, Math.max(3, H * 0.005));

    // The title: cap-height ~13-15% of poster height, fitting 94% width.
    let titlePx = 0;
    const titleBaseline = bandY + H * 0.245;
    if (title) {
      const sizeScale = (state.titleSize || 100) / 100;
      titlePx = fitFont(ctx, title, font.family, W * 0.94, Math.max(20, H * 0.185 * sizeScale), '400');
      drawGradientTitle(ctx, title, font.family, cx, titleBaseline, titlePx, grade, state);
    }
    // Neon script tagline overlapping the bottom of the title.
    if (tag) {
      const tagPx = fitFont(ctx, tag, 'Pacifico, cursive', W * 0.72, Math.max(16, H * 0.052), '400');
      ctx.save();
      ctx.translate(cx + W * 0.06, titleBaseline + tagPx * 0.62);
      ctx.rotate(-0.02);
      ctx.font = `${tagPx}px Pacifico, cursive`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255,46,136,0.9)';
      ctx.shadowBlur = tagPx * 0.5;
      ctx.fillStyle = '#ff7ad9';
      ctx.fillText(tag, 0, 0);
      ctx.restore();
    }

    // VOL. 06 chip, top-right of the band (measured first, so it never
    // runs off the right edge).
    const volPx = Math.max(13, H * 0.024);
    ctx.font = `bold ${volPx}px Anton, sans-serif`;
    const volW = ctx.measureText('VOL. 06').width + volPx * 1.4;
    ctx.save();
    ctx.translate(W - volW / 2 - W * 0.02, bandY + H * 0.055);
    ctx.rotate(0.06);
    ctx.fillStyle = '#19d3c5';
    ctx.fillRect(-volW / 2, -volPx * 0.95, volW, volPx * 1.9);
    ctx.lineWidth = Math.max(2, volPx * 0.1);
    ctx.strokeStyle = '#0d0d12';
    ctx.strokeRect(-volW / 2, -volPx * 0.95, volW, volPx * 1.9);
    ctx.fillStyle = '#0d0d12';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('VOL. 06', 0, volPx * 0.05);
    ctx.restore();

    // COLLECTOR'S EDITION ribbon, right edge below the title.
    const ribPx = Math.max(11, H * 0.019);
    ctx.font = `bold ${ribPx}px Anton, sans-serif`;
    const ribW = ctx.measureText("COLLECTOR'S EDITION").width + ribPx * 1.4;
    ctx.save();
    ctx.translate(W - ribW / 2 - W * 0.015, bandY + H * 0.285);
    ctx.rotate(-0.03);
    ctx.fillStyle = '#ff2e88';
    ctx.fillRect(-ribW / 2, -ribPx * 0.95, ribW, ribPx * 1.9);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText("COLLECTOR'S EDITION", 0, ribPx * 0.05);
    ctx.restore();

    // Bottom strip: spaced-caps tagline (lifted to make room for the
    // billing block below it), then the billing block.
    const strip = (state.tagline2 || DEFAULT_TAGLINE2).trim().toUpperCase();
    if (strip) {
      const sPx = Math.max(12, H * 0.021);
      ctx.font = `bold ${sPx}px 'Bebas Neue', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      try { ctx.letterSpacing = `${Math.max(2, H * 0.004)}px`; } catch { /* older canvas: no tracking */ }
      ctx.fillStyle = '#ffd166';
      ctx.fillText(strip, cx, H - H * 0.052);
      try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
    }
    drawBillingBlock(ctx, W, H, state);
  }
}

// Main entry: draw the whole cover. `state` carries layout, grade, title,
// tagline, fonts, colours, panels[] and photos[] (HTMLImageElements).
// Returns the panel rects in canvas coordinates (for click hit-testing).
export function drawCoverArt(canvas, state, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const grade = GRADES.find((g) => g.id === state.grade) || GRADES[0];
  const o = { gradeOn: true, halftone: true, grain: true, tape: true, collagePad: true, ...opts };
  const placement = state.placement || 'bottom';
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d0d12';
  ctx.fillRect(0, 0, W, H);
  const frame = state.layout === 'full' ? 'black' : 'cream';
  const panels = layoutPanels(state.layout || 'poster', W, H, placement);
  const captions = state.panelCaptions || PANEL_CAPTIONS;
  const rects = panels.map((rect, i) => {
    const p = (state.panels && state.panels[i]) || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = state.photos && state.photos[p.photo] ? state.photos[p.photo].img : null;
    return drawPanel(ctx, rect, img, p, grade, {
      ...o,
      collagePad: state.layout === 'collage',
      frame,
    });
  });
  // Callout tags + caption chips. People panels get the black role callout
  // from the cast; scene panels (car, boat) keep the place/time chip.
  // Every panel gets one: the old title-over-art suppression is gone — the
  // press-quote heat row moved to the top strip, so nothing collides with
  // the title any more, and the tags clamp above the palm strip. The tags
  // draw AFTER the title block (except in 'none' placement, where the
  // title sits over the photos and the tags must stay under it), so the
  // title scrim never washes them out — a tag drawn before the scrim
  // comes out grey, not white-on-black.
  const drawChips = () => {
    if (state.showCaptions === false) return;
    const cast = state.cast || DEFAULT_CAST;
    panels.forEach((rect, i) => {
      const p = (state.panels && state.panels[i]) || { photo: 0 };
      const c = cast[p.photo] || {};
      if (c.role) drawCallout(ctx, rect, c, W, H, placement);
      else drawCaptionChip(ctx, rect, captions[i] || '', W, H, placement);
    });
  };
  if (placement === 'none') drawChips();
  // Vignette over everything.
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(5,2,12,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  if (placement !== 'top') drawTopQuoteStrip(ctx, W, H, state);
  drawBadge(ctx, W, H, state.badge, grade);
  if (state.showStars !== false) drawWantedChip(ctx, W, H, state.stars ?? 5);
  drawTitleBlock(ctx, W, H, state, grade);
  if (placement !== 'none') drawChips();
  ctx.restore();
  return rects;
}

export { BADGES, panelCount };
