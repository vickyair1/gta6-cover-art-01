// Neon Coast Cover Studio — editor wiring.
// Owns the state, the controls, undo/redo, drag-to-pan, uploads, the live
// preview canvas and the PNG exports. ?shot= scenes live in shots.js.
import { drawCoverArt, LAYOUTS, GRADES, FONTS, BADGES, PANEL_CAPTIONS, DEFAULT_TAGLINE2, DEFAULT_QUOTE, defaultPanels } from './cover.js';
import { runShot } from './shots.js';

export const SIZES = [
  { id: 'square', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'story', label: 'Story 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

export function freshState() {
  return {
    layout: 'keyart', grade: 'vice', font: 'anton', tagFont: 'script',
    title: 'NEON COAST', tagline: 'Sunset heist on Palm Row',
    tagline2: DEFAULT_TAGLINE2, quote: DEFAULT_QUOTE,
    badge: 'EST. 2026', stars: 5, showStars: true, showCaptions: true,
    panelCaptions: [...PANEL_CAPTIONS],
    placement: 'overlap',
    titleColor: '#ffffff', tagColor: '#ffd166', outlineColor: '#0d0d12',
    titleSize: 100, outline: true, shadow: true,
    size: 'wide', panels: defaultPanels('keyart', 7), selected: 0,
    showGrade: true,
  };
}

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');
let state = freshState();
let photos = []; // [{img, name}]
let history = [], future = [];
let panelRects = [];
let dragging = null;

function snapshot() { return JSON.stringify({ ...state, panels: state.panels }); }
function pushHistory() {
  history.push(snapshot());
  if (history.length > 60) history.shift();
  future = [];
  updateUndoButtons();
}
function restore(json) {
  const s = JSON.parse(json);
  state = { ...freshState(), ...s };
  state.panels = s.panels;
  syncControls();
  redraw();
}
function undo() {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop());
  setStatus('Undid that change');
  updateUndoButtons();
}
function redo() {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop());
  setStatus('Redid that change');
  updateUndoButtons();
}
function updateUndoButtons() {
  $('undo').disabled = !history.length;
  $('redo').disabled = !future.length;
}

function setStatus(msg) { statusEl.textContent = msg; }

function currentSize() { return SIZES.find((s) => s.id === state.size) || SIZES[2]; }

function redraw() {
  const size = currentSize();
  // Preview canvas keeps the export aspect; internal res is capped for speed.
  const scale = Math.min(1, 900 / size.w, 700 / size.h);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  const view = { ...state, photos, panels: state.panels };
  if (!state.showGrade) view.grade = 'plain';
  panelRects = drawCoverArt(canvas, view, { gradeOn: state.showGrade });
  $('panelCount').textContent = `${state.panels.length} panels · ${photos.length} photo${photos.length === 1 ? '' : 's'}`;
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) { setStatus('That was not an image file.'); return; }
  for (const f of list.slice(0, 7 - photos.length)) {
    const img = await loadImage(URL.createObjectURL(f));
    photos.push({ img, name: f.name });
  }
  if (photos.length > 7) photos = photos.slice(0, 7);
  state.panels = state.panels.map((p) => ({ ...p, photo: Math.min(p.photo, photos.length - 1) }));
  buildPhotoPickers();
  redraw();
  setStatus(`Loaded ${photos.length} photo${photos.length === 1 ? '' : 's'} — drag on the cover to reposition a panel.`);
}

async function loadSample(name) {
  pushHistory();
  const img = await loadImage(`samples/${name}.jpg`);
  const i = photos.findIndex((p) => p.name === `sample:${name}`);
  if (i >= 0) photos[i] = { img, name: `sample:${name}` };
  else if (photos.length < 7) photos.push({ img, name: `sample:${name}` });
  else photos[photos.length - 1] = { img, name: `sample:${name}` };
  state.panels = defaultPanels(state.layout, photos.length, photos, currentSize(), state.placement);
  buildPhotoPickers();
  redraw();
  setStatus(`Sample photo “${name}” loaded. Pick a layout and export.`);
}

function buildPhotoPickers() {
  const wrap = $('photoPickers');
  wrap.innerHTML = '';
  photos.forEach((p, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = `Photo ${i + 1} · ${p.name.replace('sample:', '')}`;
    chip.title = 'Use this photo in the selected panel';
    chip.addEventListener('click', () => {
      pushHistory();
      state.panels[state.selected] = { ...state.panels[state.selected], photo: i };
      redraw();
      setStatus(`Panel ${state.selected + 1} now uses photo ${i + 1}.`);
    });
    wrap.appendChild(chip);
  });
  if (!photos.length) wrap.innerHTML = '<span class="muted">No photos yet — load a sample below.</span>';
}

function buildLayoutButtons() {
  const wrap = $('layouts');
  wrap.innerHTML = '';
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'seg' + (state.layout === l.id ? ' on' : '');
    b.textContent = l.label;
    b.title = l.hint;
    b.addEventListener('click', () => {
      if (state.layout === l.id) return;
      pushHistory();
      state.layout = l.id;
      state.panels = defaultPanels(l.id, Math.max(photos.length, 1), photos, currentSize(), state.placement);
      state.selected = 0;
      buildLayoutButtons();
      syncPanelControls();
      redraw();
      setStatus(`Layout: ${l.label}.`);
    });
    wrap.appendChild(b);
  });
}

function buildGradeButtons() {
  const wrap = $('grades');
  wrap.innerHTML = '';
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (state.grade === g.id ? ' on' : '');
    b.style.background = `linear-gradient(135deg, ${g.sky}, ${g.deep})`;
    b.textContent = g.label;
    b.addEventListener('click', () => {
      if (state.grade === g.id) return;
      pushHistory();
      state.grade = g.id;
      buildGradeButtons();
      redraw();
      setStatus(`Grade: ${g.label}.`);
    });
    wrap.appendChild(b);
  });
}

function buildSizeButtons() {
  const wrap = $('sizes');
  wrap.innerHTML = '';
  SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'seg' + (state.size === s.id ? ' on' : '');
    b.textContent = s.label;
    b.addEventListener('click', () => {
      state.size = s.id;
      buildSizeButtons();
      redraw();
      setStatus(`Preview size: ${s.label}.`);
    });
    wrap.appendChild(b);
  });
}

function buildBadgeButtons() {
  const wrap = $('badges');
  wrap.innerHTML = '';
  BADGES.forEach((b) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'seg' + (state.badge === b ? ' on' : '');
    el.textContent = b;
    el.addEventListener('click', () => {
      pushHistory();
      state.badge = b;
      buildBadgeButtons();
      redraw();
    });
    wrap.appendChild(el);
  });
}

function syncPanelControls() {
  const p = state.panels[state.selected] || state.panels[0];
  $('panelLabel').textContent = `Panel ${state.selected + 1} of ${state.panels.length}`;
  $('zoom').value = p.zoom;
  $('panX').value = p.ox;
  $('panY').value = p.oy;
  $('zoomVal').textContent = `${Math.round(p.zoom * 100)}%`;
  $('panXVal').textContent = p.ox.toFixed(2);
  $('panYVal').textContent = p.oy.toFixed(2);
  $('panelCaption').value = (state.panelCaptions && state.panelCaptions[state.selected]) || '';
}

function syncControls() {
  $('title').value = state.title;
  $('tagline').value = state.tagline;
  $('tagline2').value = state.tagline2 || DEFAULT_TAGLINE2;
  $('quote').value = state.quote || DEFAULT_QUOTE;
  $('badgeText').value = state.badge;
  $('titleSize').value = state.titleSize;
  $('titleSizeVal').textContent = `${state.titleSize}%`;
  $('titleColor').value = state.titleColor;
  $('tagColor').value = state.tagColor;
  $('outlineColor').value = state.outlineColor;
  $('font').value = state.font;
  $('tagFont').value = state.tagFont;
  $('placement').value = state.placement;
  $('outline').checked = state.outline;
  $('shadow').checked = state.shadow;
  $('showGrade').checked = state.showGrade;
  $('showStars').checked = state.showStars !== false;
  $('showCaptions').checked = state.showCaptions !== false;
  buildLayoutButtons();
  buildGradeButtons();
  buildSizeButtons();
  buildBadgeButtons();
  syncPanelControls();
  updateUndoButtons();
}

function bindControls() {
  $('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  $('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; redraw(); });
  $('tagline2').addEventListener('input', (e) => { state.tagline2 = e.target.value; redraw(); });
  $('quote').addEventListener('input', (e) => { state.quote = e.target.value; redraw(); });
  $('badgeText').addEventListener('input', (e) => {
    state.badge = e.target.value;
    buildBadgeButtons();
    redraw();
  });
  $('panelCaption').addEventListener('input', (e) => {
    if (!state.panelCaptions) state.panelCaptions = [...PANEL_CAPTIONS];
    state.panelCaptions[state.selected] = e.target.value;
    redraw();
  });
  $('showStars').addEventListener('change', (e) => { pushHistory(); state.showStars = e.target.checked; redraw(); });
  $('showCaptions').addEventListener('change', (e) => { pushHistory(); state.showCaptions = e.target.checked; redraw(); });
  $('titleSize').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value);
    $('titleSizeVal').textContent = `${state.titleSize}%`;
    redraw();
  });
  $('titleColor').addEventListener('input', (e) => { state.titleColor = e.target.value; redraw(); });
  $('tagColor').addEventListener('input', (e) => { state.tagColor = e.target.value; redraw(); });
  $('outlineColor').addEventListener('input', (e) => { state.outlineColor = e.target.value; redraw(); });
  $('font').addEventListener('change', (e) => { pushHistory(); state.font = e.target.value; redraw(); });
  $('tagFont').addEventListener('change', (e) => { pushHistory(); state.tagFont = e.target.value; redraw(); });
  $('placement').addEventListener('change', (e) => { pushHistory(); state.placement = e.target.value; redraw(); });
  $('outline').addEventListener('change', (e) => { state.outline = e.target.checked; redraw(); });
  $('shadow').addEventListener('change', (e) => { state.shadow = e.target.checked; redraw(); });
  $('showGrade').addEventListener('change', (e) => { state.showGrade = e.target.checked; redraw(); });
  $('zoom').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value);
    syncPanelControls(); redraw();
  });
  $('panX').addEventListener('input', (e) => {
    state.panels[state.selected].ox = Number(e.target.value);
    syncPanelControls(); redraw();
  });
  $('panY').addEventListener('input', (e) => {
    state.panels[state.selected].oy = Number(e.target.value);
    syncPanelControls(); redraw();
  });
  $('zoom').addEventListener('change', pushHistory);
  $('panX').addEventListener('change', pushHistory);
  $('panY').addEventListener('change', pushHistory);
  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);
  $('reset').addEventListener('click', () => {
    pushHistory();
    const keepPhotos = photos;
    state = freshState();
    photos = keepPhotos;
    state.panels = defaultPanels('keyart', Math.max(photos.length, 1), photos, currentSize(), state.placement);
    syncControls(); redraw();
    setStatus('Reset to a fresh cover.');
  });
  $('surprise').addEventListener('click', () => {
    pushHistory();
    state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
    state.grade = GRADES[Math.floor(Math.random() * GRADES.length)].id;
    state.badge = BADGES[Math.floor(Math.random() * BADGES.length)];
    state.panels = defaultPanels(state.layout, Math.max(photos.length, 1), photos, currentSize(), state.placement);
    state.selected = 0;
    syncControls(); redraw();
    setStatus(`Surprise me: ${state.layout} + ${state.grade}.`);
  });
  $('compare').addEventListener('pointerdown', () => { state.showGrade = false; $('showGrade').checked = false; redraw(); });
  $('compare').addEventListener('pointerup', () => { state.showGrade = true; $('showGrade').checked = true; redraw(); });
  $('compare').addEventListener('pointerleave', () => { if (!state.showGrade) { state.showGrade = true; $('showGrade').checked = true; redraw(); } });
  $('sampleBoulevard').addEventListener('click', () => loadSample('boulevard'));
  $('samplePier').addEventListener('click', () => loadSample('pier'));
  $('sampleRooftop').addEventListener('click', () => loadSample('rooftop'));
  $('sampleNeon').addEventListener('click', () => loadSample('neon'));
  $('sampleCar').addEventListener('click', () => loadSample('car'));
  $('sampleBike').addEventListener('click', () => loadSample('bike'));
  $('sampleBoat').addEventListener('click', () => loadSample('boat'));
  $('photo').addEventListener('change', (e) => addFiles(e.target.files));
  $('exportOne').addEventListener('click', () => exportCover(currentSize()));
  $('exportAll').addEventListener('click', async () => {
    for (const s of SIZES) await exportCover(s);
    setStatus('Exported all 3 sizes.');
  });

  // Drag & drop anywhere on the preview area.
  const drop = $('dropzone');
  ['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

  // Click a panel to select it; drag inside it to pan the photo.
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    const i = panelRects.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
    if (i < 0) return;
    state.selected = i;
    syncPanelControls();
    redraw();
    const p = state.panels[i];
    dragging = { x, y, ox: p.ox, oy: p.oy, moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    const rect = panelRects[state.selected];
    if (!rect) return;
    const p = state.panels[state.selected];
    p.ox = Math.max(-1, Math.min(1, dragging.ox + ((x - dragging.x) / rect.w) * 2.2));
    p.oy = Math.max(-1, Math.min(1, dragging.oy + ((y - dragging.y) / rect.h) * 2.2));
    if (Math.abs(x - dragging.x) + Math.abs(y - dragging.y) > 4) dragging.moved = true;
    syncPanelControls();
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging && dragging.moved) pushHistory();
    dragging = null;
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    else if (e.key.toLowerCase() === 's') { e.preventDefault(); $('surprise').click(); }
    else if (e.key.toLowerCase() === 'e') { e.preventDefault(); exportCover(currentSize()); }
    else if (e.key >= '1' && e.key <= '7') {
      const l = LAYOUTS[Number(e.key) - 1];
      if (l) { pushHistory(); state.layout = l.id; state.panels = defaultPanels(l.id, Math.max(photos.length, 1), photos, currentSize(), state.placement); syncControls(); redraw(); }
    } else if (e.key.toLowerCase() === 'g') {
      pushHistory();
      const i = GRADES.findIndex((g) => g.id === state.grade);
      state.grade = GRADES[(i + 1) % GRADES.length].id;
      syncControls(); redraw();
    }
  });
}

export function renderExport(size, viewState, viewPhotos) {
  const off = document.createElement('canvas');
  off.width = size.w; off.height = size.h;
  drawCoverArt(off, { ...viewState, photos: viewPhotos, size: size.id }, { gradeOn: viewState.showGrade });
  return off;
}

export function exportCover(size) {
  return new Promise((resolve) => {
    const off = renderExport(size, state, photos);
    off.toBlob((blob) => {
      if (!blob) { setStatus('Export failed — try again.'); resolve(null); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-coast-cover-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setStatus(`Saved neon-coast-cover-${size.w}x${size.h}.png`);
      resolve(blob);
    }, 'image/png');
  });
}

// Exposed for the shot scenes and for tests.
export function getState() { return state; }
export function getPhotos() { return photos; }
export function setPhotos(next) { photos = next; }
export function setState(next) { state = next; }
export { redraw, syncControls, buildPhotoPickers, buildLayoutButtons, buildGradeButtons, buildSizeButtons, buildBadgeButtons };

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, { loadImage, setPhotos, setState, freshState, syncControls, redraw, currentSize, buildPhotoPickers });
} else {
  bindControls();
  syncControls();
  buildPhotoPickers();
  redraw();
  // Fast path: preload a sample so the first cover is one click away.
  loadSample('boulevard').then(() => setStatus('Sample photo loaded — pick a layout, edit the caption, export.'));
}
