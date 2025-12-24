const electron = require('electron');
const contextBridge = electron.contextBridge;
const ipcRenderer = electron.ipcRenderer;
let desktopCapturer = electron.desktopCapturer;

if (!desktopCapturer || typeof desktopCapturer.getSources !== 'function') {
  try {
    const rendererModule = require('electron/renderer');
    desktopCapturer = rendererModule.desktopCapturer;
  } catch (e) {
    desktopCapturer = null;
  }
}

function getCaptureSourceViaIpc({ width, height, scaleFactor }) {
  return ipcRenderer.invoke('desktop-capture-source', {
    width,
    height,
    scaleFactor,
  });
}

contextBridge.exposeInMainWorld('builderCapture', {
  getLocale: () => ipcRenderer.invoke('get-locale'),
  getSourceForActiveDisplay: async () => {
    let width = 1920;
    let height = 1080;
    let scaleFactor = 1;

    try {
      if (typeof window !== 'undefined') {
        const innerW = window.innerWidth || 0;
        const innerH = window.innerHeight || 0;
        const screenW = window.screen && window.screen.width ? window.screen.width : 0;
        const screenH = window.screen && window.screen.height ? window.screen.height : 0;
        width = innerW || screenW || width;
        height = innerH || screenH || height;
        scaleFactor = window.devicePixelRatio || 1;
      }
    } catch (e) {
      width = 1920;
      height = 1080;
      scaleFactor = 1;
    }

    if (desktopCapturer && typeof desktopCapturer.getSources === 'function') {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: Math.floor(width * scaleFactor),
          height: Math.floor(height * scaleFactor),
        },
      });
      const source = sources[0];
      if (!source) {
        throw new Error('No screen sources available');
      }
      return {
        dataUrl: source.thumbnail.toDataURL(),
        scaleFactor,
      };
    }

    const fallback = await getCaptureSourceViaIpc({ width, height, scaleFactor });
    if (!fallback || !fallback.dataUrl) {
      const message = fallback && fallback.error ? fallback.error : 'Desktop capture unavailable';
      throw new Error(message);
    }
    return fallback;
  },
  ocrImage: async (payload) => ipcRenderer.invoke('ocr-image', payload),
  sendOcrResult: (payload) => ipcRenderer.send('ocr-result', payload),
  cancelCapture: () => ipcRenderer.send('capture-cancel'),
});
