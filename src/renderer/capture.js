const selection = document.getElementById('selection');
const hint = document.getElementById('hint');

let startPoint = null;
let cachedSource = null;

const CAPTURE_I18N = {
  en: {
    hint: 'Drag to select an area. Press Esc to cancel.',
    recognizing: 'Recognizing text...',
  },
  zh: {
    hint: '拖动选择区域，按 Esc 取消。',
    recognizing: '正在识别文字...',
  },
};

function getCaptureLanguage() {
  const saved = localStorage.getItem('builder.lang');
  if (saved && CAPTURE_I18N[saved]) {
    return saved;
  }
  return 'en';
}

function getCaptureText(key) {
  const lang = getCaptureLanguage();
  return CAPTURE_I18N[lang][key] || CAPTURE_I18N.en[key];
}

hint.textContent = getCaptureText('hint');

async function getOcrLanguage() {
  const saved = localStorage.getItem('builder.lang');
  if (saved === 'zh' || saved === 'en') {
    return saved;
  }
  try {
    const locale = await window.builderCapture.getLocale();
    const lower = String(locale || '').toLowerCase();
    return lower.startsWith('zh') ? 'zh' : 'en';
  } catch (e) {
    return 'en';
  }
}

function updateSelection(rect) {
  selection.style.display = 'block';
  selection.style.left = `${rect.x}px`;
  selection.style.top = `${rect.y}px`;
  selection.style.width = `${rect.width}px`;
  selection.style.height = `${rect.height}px`;
}

function rectFromPoints(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const width = Math.abs(a.x - b.x);
  const height = Math.abs(a.y - b.y);
  return { x, y, width, height };
}

async function getSourceForActiveDisplay() {
  if (cachedSource) {
    return cachedSource;
  }
  cachedSource = await window.builderCapture.getSourceForActiveDisplay();

  return cachedSource;
}

async function cropToDataUrl(rect) {
  const source = await getSourceForActiveDisplay();
  const image = new Image();
  image.src = source.dataUrl;

  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const sx = Math.max(0, Math.round(rect.x * source.scaleFactor));
  const sy = Math.max(0, Math.round(rect.y * source.scaleFactor));
  const sw = Math.max(1, Math.round(rect.width * source.scaleFactor));
  const sh = Math.max(1, Math.round(rect.height * source.scaleFactor));

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

  return canvas.toDataURL('image/png');
}

document.addEventListener('mousedown', (event) => {
  startPoint = { x: event.clientX, y: event.clientY };
  selection.style.display = 'block';
  updateSelection({ x: startPoint.x, y: startPoint.y, width: 0, height: 0 });
});

document.addEventListener('mousemove', (event) => {
  if (!startPoint) {
    return;
  }
  const rect = rectFromPoints(startPoint, { x: event.clientX, y: event.clientY });
  updateSelection(rect);
});

document.addEventListener('mouseup', async (event) => {
  if (!startPoint) {
    return;
  }
  const rect = rectFromPoints(startPoint, { x: event.clientX, y: event.clientY });
  startPoint = null;

  if (rect.width < 8 || rect.height < 8) {
    window.builderCapture.sendOcrResult({
      text: '',
      confidence: 0,
      error:
        getCaptureLanguage() === 'zh'
          ? '选区过小，请重新框选。'
          : 'Selection too small. Drag a larger area.',
    });
    window.builderCapture.cancelCapture();
    return;
  }

  hint.textContent = getCaptureText('recognizing');

  try {
    const dataUrl = await cropToDataUrl(rect);
    const lang = await getOcrLanguage();
    const result = await window.builderCapture.ocrImage({ dataUrl, lang });
    window.builderCapture.sendOcrResult(result);
  } catch (error) {
    window.builderCapture.sendOcrResult({
      text: '',
      confidence: 0,
      error: error && error.message ? error.message : 'Capture failed',
    });
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    window.builderCapture.sendOcrResult({
      text: '',
      confidence: 0,
      error: getCaptureLanguage() === 'zh' ? '已取消 OCR。' : 'OCR cancelled.',
    });
    window.builderCapture.cancelCapture();
  }
});
