// Neon Coast Cover Studio — cover renderer.
// Draws multi-panel poster art onto any 2D canvas: panels filled from the
// user's photos, a colour grade per preset, inked borders, halftone + grain,
// and bold caption lettering. Pure canvas, no network, no libraries.
export const LAYOUTS = [
  { id: 'grid', label: '9-Panel Grid', hint: 'Classic poster grid' },
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
];

export const FONTS = [
  { id: 'anton', label: 'Anton Heavy', family: 'Anton, sans-serif' },
  { id: 'bebas', label: 'Bebas Tall', family: "'Bebas Neue', sans-serif" },
  { id: 'pacifico', label: 'Pacifico Script', family: 'Pacifico, cursive' },
];

const BADGES = ['NEON COAST', 'LEONIDA BAY', 'VICE SUNSET', 'PALM ROW', 'TURBO HEAT', 'MIDNIGHT DRIVE'];

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
  const band = placement === 'none' ? 0 : (placement === 'top' ? H * 0.15 : H * 0.19);
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
  return layout === 'grid' ? 9 : layout === 'hero' ? 4 : layout === 'full' ? 1 : layout === 'collage' ? 5 : 4;
}

export function defaultPanels(layout, photoCount, photos, dims) {
  const n = panelCount(layout);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ photo: photoCount ? i % photoCount : 0, zoom: 1, ox: 0, oy: 0 });
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
      out[i].oy = (dy - (r.h - ph) / 2) / (r.h * 0.4);
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

// Draw one photo into a panel rect, graded, with halftone + grain.
function drawPanel(ctx, rect, img, panel, grade, opts) {
  const { x, y, w, h, rot } = rect;
  const pad = opts.collagePad && rect.rot ? Math.max(8, w * 0.03) : 0;
  ctx.save();
  if (rot) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);
    ctx.translate(-w / 2, -h / 2);
  } else {
    ctx.translate(x, y);
  }
  // Polaroid-style white frame for the collage, shadow under every panel.
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = Math.max(6, w * 0.03);
  ctx.shadowOffsetY = Math.max(3, w * 0.012);
  ctx.fillStyle = rot ? '#fdf8ee' : '#0d0d12';
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
      if (opts.halftone) {
        s.fillStyle = 'rgba(255,255,255,0.10)';
        const step = Math.max(7, Math.round(sw / 90));
        for (let yy = 0; yy < sh * 0.4; yy += step) {
          for (let xx = (yy / step % 2) * step / 2; xx < sw; xx += step) {
            s.beginPath(); s.arc(xx, yy, Math.max(1, step * 0.18), 0, 7); s.fill();
          }
        }
      }
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

  // Inked divider around the panel.
  ctx.save();
  if (rot) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2); }
  else ctx.translate(x, y);
  ctx.lineWidth = Math.max(3, w * 0.012);
  ctx.strokeStyle = rot ? '#fdf8ee' : '#0d0d12';
  ctx.strokeRect(-pad, -pad, w + pad * 2, h + pad * 2);
  ctx.lineWidth = Math.max(1, w * 0.003);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.strokeRect(Math.max(2, w * 0.01), Math.max(2, w * 0.01), w - Math.max(4, w * 0.02), h - Math.max(4, w * 0.02));
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

function drawBadge(ctx, W, H, badge, grade) {
  if (!badge) return;
  const text = badge.trim().toUpperCase();
  if (!text) return;
  const px = Math.max(18, W * 0.028);
  ctx.save();
  ctx.font = `bold ${px}px Anton, sans-serif`;
  const tw = ctx.measureText(text).width + px * 1.6;
  const th = px * 1.9;
  ctx.translate(W * 0.09, H * 0.055);
  ctx.rotate(-0.06);
  ctx.fillStyle = grade.deep;
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = px * 0.5; ctx.shadowOffsetY = px * 0.12;
  ctx.fillRect(-tw / 2, -th / 2, tw, th);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, px * 0.08);
  ctx.strokeRect(-tw / 2 + px * 0.14, -th / 2 + px * 0.14, tw - px * 0.28, th - px * 0.28);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, px * 0.06);
  ctx.restore();
}

function drawTitleBlock(ctx, W, H, state, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const tag = (state.tagline || '').trim();
  const font = FONTS.find((f) => f.id === state.font) || FONTS[0];
  const placement = state.placement || 'bottom';
  const bandH = placement === 'top' ? H * 0.15 : H * 0.19;
  const bandY = placement === 'top' ? 0 : H - bandH;
  if (placement !== 'none') {
    const g = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
    if (placement === 'top') { g.addColorStop(0, 'rgba(8,6,16,0.92)'); g.addColorStop(1, 'rgba(8,6,16,0)'); }
    else { g.addColorStop(0, 'rgba(8,6,16,0)'); g.addColorStop(1, 'rgba(8,6,16,0.94)'); }
    ctx.fillStyle = g;
    ctx.fillRect(0, bandY, W, bandH);
    // Neon rule line at the band edge.
    ctx.fillStyle = grade.deep;
    const ly = placement === 'top' ? bandY + bandH - Math.max(3, H * 0.004) : bandY;
    ctx.fillRect(0, ly, W, Math.max(3, H * 0.004));
  }
  const cx = W / 2;
  const baseY = placement === 'top' ? H * 0.115 : H - H * 0.055;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // Measure the title first so the tagline sits clear of it.
  let titlePx = 0;
  if (title) {
    const sizeScale = (state.titleSize || 100) / 100;
    titlePx = fitFont(ctx, title, font.family, W * 0.94, Math.max(20, H * 0.115 * sizeScale), '400');
  }
  if (tag) {
    const tagFont = state.tagFont === 'script' ? 'Pacifico, cursive' : "'Bebas Neue', sans-serif";
    const tagPx = fitFont(ctx, tag, tagFont, W * 0.72, Math.max(16, H * 0.042), '400');
    ctx.font = `${tagPx}px ${tagFont}`;
    ctx.fillStyle = state.tagColor || '#ffd166';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = tagPx * 0.3;
    const ty = placement === 'top'
      ? baseY + titlePx * 0.42
      : baseY - titlePx - Math.max(6, H * 0.012);
    ctx.fillText(tag, cx, ty);
    ctx.shadowBlur = 0;
  }
  if (title) {
    const px = titlePx;
    ctx.font = `${px}px ${font.family}`;
    ctx.lineJoin = 'round';
    if (state.outline !== false) {
      ctx.strokeStyle = state.outlineColor || '#0d0d12';
      ctx.lineWidth = Math.max(2, px * 0.14);
      ctx.strokeText(title, cx, baseY);
    }
    ctx.shadowColor = state.shadow === false ? 'transparent' : 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = px * 0.18;
    ctx.shadowOffsetY = px * 0.07;
    // Sunset fill: warm gradient through the letters.
    const tg = ctx.createLinearGradient(0, baseY - px, 0, baseY);
    tg.addColorStop(0, state.titleColor || '#ffffff');
    tg.addColorStop(0.55, state.titleColor || '#ffffff');
    tg.addColorStop(1, grade.sky);
    ctx.fillStyle = tg;
    ctx.fillText(title, cx, baseY);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }
  // Footer strip: invented place words only, never a real trademark.
  ctx.font = `bold ${Math.max(11, H * 0.016)}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'center';
  if (placement === 'bottom') ctx.fillText('NEON COAST  •  MADE WITH NEON COAST COVER STUDIO', cx, H - Math.max(8, H * 0.012));
  else if (placement === 'top') ctx.fillText('NEON COAST  •  MADE WITH NEON COAST COVER STUDIO', cx, H - Math.max(8, H * 0.012));
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
  const panels = layoutPanels(state.layout || 'grid', W, H, state.placement || 'bottom');
  const rects = panels.map((rect, i) => {
    const p = (state.panels && state.panels[i]) || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = state.photos && state.photos[p.photo] ? state.photos[p.photo].img : null;
    return drawPanel(ctx, rect, img, p, grade, { ...o, collagePad: state.layout === 'collage' });
  });
  // Vignette over everything.
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(5,2,12,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  drawBadge(ctx, W, H, state.badge, grade);
  drawTitleBlock(ctx, W, H, state, grade);
  ctx.restore();
  return rects;
}

export { BADGES, panelCount };
