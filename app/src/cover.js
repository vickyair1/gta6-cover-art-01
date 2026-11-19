// Neon Coast Cover Studio v2 — cover renderer.
// Draws multi-panel poster art onto any 2D canvas: panels filled from the
// user's photos, a colour grade per preset, inked cream frames, halftone +
// grain, per-panel place captions, a starburst badge, a wanted chip, and a
// big sunset-gradient title block with a neon script tagline. Pure canvas,
// no network, no libraries.
export const LAYOUTS = [
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
];

export const FONTS = [
  { id: 'anton', label: 'Anton Heavy', family: 'Anton, sans-serif' },
  { id: 'bebas', label: 'Bebas Tall', family: "'Bebas Neue', sans-serif" },
  { id: 'pacifico', label: 'Pacifico Script', family: 'Pacifico, cursive' },
];

const BADGES = ['EST. 2026', 'NEON COAST', 'LEONIDA BAY', 'VICE SUNSET', 'PALM ROW', 'TURBO HEAT', 'MIDNIGHT DRIVE'];

// Per-panel place captions: invented place + time + flavour. Panel i gets
// entry i; the editor lets the user rewrite the selected panel's caption.
export const PANEL_CAPTIONS = [
  'OCEAN DRIVE — 6:42 PM · LOOKING FOR TROUBLE',
  'MARINA DEL SOL — 7:40 PM · NO WITNESSES',
  'PIER 26 — 5:30 AM · GONE FISHING',
  'PALM BOULEVARD — 9:15 PM · LIGHTS OUT',
  'INTERSTATE 6 — 11:59 PM · FULL THROTTLE',
  'TOWER 2 — 6:10 PM · LAST SWIM',
  'SUNSET HEIGHTS — 6:30 PM · BIG MONEY',
  'NEON ROW — 12:04 AM · OPEN ALL NIGHT',
  'VICE POINT — 8:05 PM · NO TURNING BACK',
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
export function layoutPanels(layout, W, H, placement) {
  const band = placement === 'none' ? 0 : (placement === 'top' ? H * 0.15 : H * 0.36);
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
  return layout === 'grid' ? 9 : layout === 'poster' ? 5 : layout === 'hero' ? 4 : layout === 'full' ? 1 : layout === 'collage' ? 5 : 4;
}

// Photo assignment with NO adjacent repeats: the 9-panel grid cycles
// [0,1,2,3,0,1,2,3,0] — every row and column differs, each photo at most 3x.
// Poster/hero/collage/strip use all four photos once, plus one extra that
// never sits next to its twin. Zoom and pan vary per panel so a repeated
// photo never looks identical twice.
const PHOTO_SEQ = {
  grid: [0, 1, 2, 3, 0, 1, 2, 3, 0],
  poster: [0, 1, 2, 3, 1],
  hero: [0, 1, 2, 3],
  collage: [0, 1, 2, 3, 1],
  strip: [0, 1, 2, 3],
  full: [0],
};

// Per-photo horizontal bias: the rooftop sample's face sits on the right of
// the frame, so its panels pan left (negative ox shows the right side).
const PHOTO_OX = [0, 0, -0.45, 0];

export function defaultPanels(layout, photoCount, photos, dims) {
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
    // Face-safe default framing, aimed from the real photos: cover-fit crops
    // a portrait photo top and bottom, and faces sit in the top third, so a
    // centred crop cuts the face out of a wide panel. Anchor the visible
    // window just below the top of the photo instead. The pan value is
    // derived from drawPanel's own offset formula, so the default framing is
    // exactly what the renderer draws.
    const rects = layoutPanels(layout, dims.w, dims.h, 'bottom');
    for (let i = 0; i < n; i++) {
      const img = photos[out[i].photo] && photos[out[i].photo].img;
      if (!img || !img.naturalWidth || !img.naturalHeight) continue;
      const r = rects[i];
      const base = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight);
      const ph = img.naturalHeight * base;
      // Aim the window at 2% down the photo, never past full coverage.
      const dy = Math.max(r.h - ph, Math.min(0, -0.02 * ph));
      const anchorOy = (dy - (r.h - ph) / 2) / (r.h * 0.4);
      out[i].oy = clamp(anchorOy + out[i].oy * 0.4, -1, 1);
      // Top-visibility guard: never crop more than ~6% of the photo's
      // height from the top, or faces that start near the frame edge
      // (the rooftop sample) get cut out of short wide panels.
      const zBase = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight) * (out[i].zoom || 1);
      const zPh = img.naturalHeight * zBase;
      if (zPh > r.h) {
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

// Per-panel caption chip, bottom-left: place name + time/flavour. Drawn in
// a second pass over the panels (see drawCoverArt) so an overlapping
// collage panel never buries a neighbour's chip.
function drawCaptionChip(ctx, rect, caption) {
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
  const cx0 = Math.max(4, w * 0.03), cy0 = h - chipH - Math.max(4, h * 0.04);
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

function drawTitleBlock(ctx, W, H, state, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const tag = (state.tagline || '').trim();
  const font = FONTS.find((f) => f.id === state.font) || FONTS[0];
  const placement = state.placement || 'bottom';
  const cx = W / 2;

  if (placement === 'top') {
    // Compact top block: gradient title + script tagline, no heat row.
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
  } else {
    // Bottom poster block: ~36% of the height — heat-meter row + press
    // quote, huge gradient title, neon script tagline overlapping the
    // title, VOL. 06 chip, COLLECTOR'S EDITION ribbon, tagline strip.
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

    // Heat-meter row: 5 gold stars + invented press quote.
    const stars = Math.max(0, Math.min(5, state.stars ?? 5));
    const quote = (state.quote || DEFAULT_QUOTE).trim();
    if (state.showStars !== false || quote) {
      const qPx = Math.max(13, H * 0.021);
      ctx.font = `bold ${qPx}px 'Bebas Neue', sans-serif`;
      const starText = state.showStars === false ? '' : '★'.repeat(stars) + ' ';
      const line = `${starText}${quote}`.trim();
      const lineW = ctx.measureText(line).width;
      const lx = cx - lineW / 2;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      if (state.showStars !== false) {
        ctx.fillStyle = '#ffd166';
        ctx.fillText('★'.repeat(stars), lx, bandY + H * 0.048);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText(quote, lx + (state.showStars === false ? 0 : ctx.measureText('★'.repeat(stars) + ' ').width), bandY + H * 0.048);
    }

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

    // Bottom strip: spaced-caps tagline, then small footer credits.
    const strip = (state.tagline2 || DEFAULT_TAGLINE2).trim().toUpperCase();
    if (strip) {
      const sPx = Math.max(12, H * 0.021);
      ctx.font = `bold ${sPx}px 'Bebas Neue', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      try { ctx.letterSpacing = `${Math.max(2, H * 0.004)}px`; } catch { /* older canvas: no tracking */ }
      ctx.fillStyle = '#ffd166';
      ctx.fillText(strip, cx, H - H * 0.032);
      try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
    }
    ctx.font = `bold ${Math.max(10, H * 0.013)}px sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('NEON COAST  •  MADE WITH NEON COAST COVER STUDIO', cx, H - Math.max(7, H * 0.009));
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
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d0d12';
  ctx.fillRect(0, 0, W, H);
  const frame = state.layout === 'full' ? 'black' : 'cream';
  const panels = layoutPanels(state.layout || 'poster', W, H, state.placement || 'bottom');
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
  // Caption chips on top of everything, so an overlapping collage panel
  // never buries a neighbour's chip.
  if (state.showCaptions !== false) {
    panels.forEach((rect, i) => drawCaptionChip(ctx, rect, captions[i] || ''));
  }
  // Vignette over everything.
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(5,2,12,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  drawBadge(ctx, W, H, state.badge, grade);
  if (state.showStars !== false) drawWantedChip(ctx, W, H, state.stars ?? 5);
  drawTitleBlock(ctx, W, H, state, grade);
  ctx.restore();
  return rects;
}

export { BADGES, panelCount };
