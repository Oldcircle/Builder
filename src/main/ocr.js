const { createWorker } = require('tesseract.js');

let workerPromise = null;
let workerLang = 'eng';

const DEFAULT_RECOGNIZE_PARAMS = {
  tessedit_pageseg_mode: '6',
  preserve_interword_spaces: '1',
  user_defined_dpi: '300',
};

function normalizeOcrLang(lang) {
  const raw = String(lang || '').toLowerCase().trim();
  if (raw === 'zh' || raw === 'zh-cn' || raw === 'zh-hans') {
    return 'chi_sim';
  }
  return 'eng';
}

async function resetWorker() {
  if (!workerPromise) {
    workerLang = 'eng';
    return;
  }
  try {
    const worker = await workerPromise;
    if (worker && typeof worker.terminate === 'function') {
      await worker.terminate();
    }
  } catch (e) {
  }
  workerPromise = null;
  workerLang = 'eng';
}

async function getWorker(lang) {
  if (!workerPromise) {
    const langPath = process.env.BUILDER_TESSDATA_PATH;
    const targetLang = normalizeOcrLang(lang);
    workerPromise = createWorker(targetLang, 1, langPath ? { langPath } : {});
    workerLang = targetLang;
  }
  let worker = null;
  try {
    worker = await workerPromise;
  } catch (e) {
    workerPromise = null;
    workerLang = 'eng';
    throw e;
  }
  const targetLang = normalizeOcrLang(lang);
  if (workerLang !== targetLang) {
    await worker.reinitialize(targetLang);
    workerLang = targetLang;
  }
  return worker;
}

function buildInputList(primary, variants) {
  const inputs = [];
  const seen = new Set();
  const pushInput = (value) => {
    if (!value || typeof value !== 'string') {
      return;
    }
    if (seen.has(value)) {
      return;
    }
    seen.add(value);
    inputs.push(value);
  };

  if (Array.isArray(primary)) {
    primary.forEach((item) => pushInput(item));
  } else {
    pushInput(primary);
  }

  if (Array.isArray(variants)) {
    variants.forEach((item) => pushInput(item));
  }

  return inputs;
}

async function recognizeImage(dataUrl, options = {}) {
  if (!dataUrl) {
    return { text: '', confidence: 0 };
  }

  const inputs = buildInputList(dataUrl, options.variants);
  if (!inputs.length) {
    return { text: '', confidence: 0 };
  }

  try {
    const worker = await getWorker(options.lang);
    let best = null;

    for (const input of inputs) {
      const { data } = await worker.recognize(input, DEFAULT_RECOGNIZE_PARAMS);
      const text = String((data && data.text) || '');
      const trimmed = text.replace(/\s+/g, ' ').trim();
      const confidence = (data && typeof data.confidence === 'number' ? data.confidence : 0) / 100;
      const score = (trimmed ? trimmed.length : 0) + confidence * 5;

      if (!best || score > best.score) {
        best = {
          text,
          confidence,
          trimmed,
          score,
        };
      }
    }

    if (!best) {
      return { text: '', confidence: 0 };
    }

    if (!best.trimmed) {
      return {
        text: best.text,
        confidence: best.confidence,
        error:
          options.lang && normalizeOcrLang(options.lang) === 'chi_sim'
            ? 'OCR 结果为空（可尝试截取更清晰的文字）'
            : 'OCR returned empty text',
      };
    }

    return {
      text: best.text,
      confidence: best.confidence,
    };
  } catch (error) {
    const message = error && error.message ? error.message : 'OCR failed';
    try {
      await resetWorker();
    } catch (e) {
    }
    return {
      text: '',
      confidence: 0,
      error: message,
    };
  }
}

module.exports = {
  recognizeImage,
};
