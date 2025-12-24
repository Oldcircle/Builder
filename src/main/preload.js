const { contextBridge, ipcRenderer } = require('electron');

let engineModule = null;

function getEngine() {
  if (engineModule) {
    return engineModule;
  }
  try {
    engineModule = require('../shared/engine');
  } catch (e) {
    engineModule = null;
    console.error('Failed to load engine module', e);
  }
  return engineModule;
}

function safeAnalyzeText(text, options) {
  const engine = getEngine();
  if (engine && typeof engine.analyzeText === 'function') {
    return engine.analyzeText(text, options);
  }
  const source = options && options.source ? options.source : 'manual';
  return {
    source,
    detectedShell: { shell: 'unknown', confidence: 0, scores: {} },
    blocks: [],
    findings: [],
    risk: { level: 'none', score: 0 },
    warningCodes: ['no_input'],
    warnings: ['Engine unavailable'],
    ocr: { confidence: null, lowConfidence: false },
  };
}

contextBridge.exposeInMainWorld('builder', {
  analyzeText: (text, options) => safeAnalyzeText(text, options),
  readClipboardText: () => ipcRenderer.invoke('read-clipboard'),
  llmExplain: (text, modelConfig, lang) =>
    ipcRenderer.invoke('llm-explain', { text, modelConfig, lang }),
  listModels: (modelConfig) => ipcRenderer.invoke('list-models', { modelConfig }),
  onHotkeyText: (callback) =>
    ipcRenderer.on('hotkey-text', (_, payload) => callback(payload)),
  onOcrText: (callback) =>
    ipcRenderer.on('ocr-text', (_, payload) => callback(payload)),
  onActiveCapture: (callback) =>
    ipcRenderer.on('active-capture', (_, payload) => callback(payload)),
  onCollapsedState: (callback) =>
    ipcRenderer.on('collapsed-state', (_, payload) => callback(payload)),
  toggleCollapse: () => ipcRenderer.invoke('toggle-collapse'),
  setCollapsed: (collapsed) => ipcRenderer.invoke('set-collapsed', collapsed),
  openCapture: () => ipcRenderer.invoke('open-capture'),
  showWindow: () => ipcRenderer.invoke('show-window'),
});
