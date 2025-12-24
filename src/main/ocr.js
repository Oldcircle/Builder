const { createWorker } = require('tesseract.js');

let workerPromise = null;
let workerLang = 'eng';

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

async function recognizeImage(dataUrl, options = {}) {
  if (!dataUrl) {
    return { text: '', confidence: 0 };
  }

  try {
    const worker = await getWorker(options.lang);
    const { data } = await worker.recognize(dataUrl);
    const text = String((data && data.text) || '');
    const trimmed = text.replace(/\s+/g, ' ').trim();
    if (!trimmed) {
      return {
        text,
        confidence: (data && data.confidence ? data.confidence : 0) / 100,
        error: options.lang && normalizeOcrLang(options.lang) === 'chi_sim' ? 'OCR 结果为空（可尝试截取更清晰的文字）' : 'OCR returned empty text',
      };
    }
    return {
      text,
      confidence: (data.confidence || 0) / 100,
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
