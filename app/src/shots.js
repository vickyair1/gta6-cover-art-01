// Fixed scenes for screenshots. Each ?shot= scene loads the free sample
// photos, picks a layout + grade + caption, draws the cover with the app's
// own renderer, and sets window.__shotReady once painted.
//   ?shot=editor       — the editor, photo loaded, panels + controls visible
//   ?shot=cover        — full-frame exported wide cover (1920 x 1080)
//   ?shot=cover-story  — full-frame exported story cover (1080 x 1350)
//   ?shot=cover-square — full-frame exported square cover (1080 x 1080)
import { drawCoverArt, defaultPanels } from './cover.js';

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('40px "Bebas Neue"'),
      document.fonts.load('40px Pacifico'),
      document.fonts.ready,
    ]);
  } catch { /* fonts fall back to system faces; the cover still draws */ }
}

function ready() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

export async function runShot(shot, query, api) {
  const canvas = document.getElementById('cover');
  const caption = query.get('caption') ?? 'Neon Coast';
  const grade = query.get('grade') ?? 'vice';
  const layout = query.get('layout') ?? 'grid';
  const sizeId = query.get('size') ?? 'wide';
  await loadFonts();

  const boulevard = await api.loadImage('samples/boulevard.jpg');
  const pier = await api.loadImage('samples/pier.jpg');
  const photos = [
    { img: boulevard, name: 'sample:boulevard' },
    { img: pier, name: 'sample:pier' },
  ];
  api.setPhotos(photos);

  const dims = sizeId === 'story' ? { w: 1080, h: 1350 }
    : sizeId === 'square' ? { w: 1080, h: 1080 } : { w: 1920, h: 1080 };
  const state = api.freshState();
  state.title = caption.toUpperCase();
  state.tagline = query.get('tagline') ?? 'Sunset heist on Palm Row';
  state.badge = query.get('badge') ?? 'NEON COAST';
  state.grade = grade;
  state.layout = layout;
  state.size = sizeId;
  state.panels = defaultPanels(layout, photos.length, photos, dims);
  state.selected = 0;
  api.setState(state);

  if (shot === 'editor') {
    document.body.classList.add('shot-editor');
    api.syncControls();
    api.buildPhotoPickers();
    api.redraw();
    ready();
    return;
  }

  // Cover scenes: hide the editor, draw the export at full size, stretched
  // to the viewport by CSS so the screenshot is the cover itself.
  document.body.classList.add('shot-cover');
  canvas.width = dims.w;
  canvas.height = dims.h;
  drawCoverArt(canvas, { ...state, photos }, { gradeOn: true });
  ready();
}
