const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const {
  app,
  BrowserWindow,
  clipboard,
  desktopCapturer,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  Tray,
} = require('electron');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { recognizeImage } = require('./ocr');

let mainWindow = null;
let captureWindow = null;
let tray = null;
let isQuitting = false;
let isCollapsed = false;
let lastExpandedSize = { width: 520, height: 720 };

const MIN_EXPANDED_SIZE = { width: 420, height: 560 };
const COLLAPSED_SIZE = { width: 96, height: 96 };
let pendingStateWrite = null;
let stateFilePath = null;

function ensureTessdataPath() {
  if (process.env.BUILDER_TESSDATA_PATH) {
    return;
  }
  if (!app.isPackaged) {
    return;
  }
  try {
    const candidateDir = path.join(process.resourcesPath, 'tessdata');
    const candidateFile = path.join(candidateDir, 'chi_sim.traineddata');
    if (fs.existsSync(candidateFile)) {
      process.env.BUILDER_TESSDATA_PATH = candidateDir;
    }
  } catch (e) {
  }
}

ensureTessdataPath();

function safeReadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function safeWriteJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function getStateFilePath() {
  if (stateFilePath) {
    return stateFilePath;
  }
  const dir = app.getPath('userData');
  stateFilePath = path.join(dir, 'builder-state.json');
  return stateFilePath;
}

function loadWindowState() {
  const filePath = getStateFilePath();
  const state = safeReadJson(filePath);
  if (!state || typeof state !== 'object') {
    return null;
  }
  return state;
}

function scheduleSaveWindowState(nextState) {
  if (pendingStateWrite) {
    clearTimeout(pendingStateWrite);
  }
  pendingStateWrite = setTimeout(() => {
    pendingStateWrite = null;
    safeWriteJson(getStateFilePath(), nextState);
  }, 250);
}

function createMainWindow() {
  const savedState = loadWindowState();
  if (savedState && savedState.expandedSize) {
    lastExpandedSize = savedState.expandedSize;
  }

  mainWindow = new BrowserWindow({
    width: lastExpandedSize.width,
    height: lastExpandedSize.height,
    minWidth: MIN_EXPANDED_SIZE.width,
    minHeight: MIN_EXPANDED_SIZE.height,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/legacy/index.html'));
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  if (savedState && savedState.bounds && typeof savedState.bounds === 'object') {
    const b = savedState.bounds;
    if (
      Number.isFinite(b.x) &&
      Number.isFinite(b.y) &&
      Number.isFinite(b.width) &&
      Number.isFinite(b.height)
    ) {
      mainWindow.setBounds({
        x: Math.round(b.x),
        y: Math.round(b.y),
        width: Math.max(MIN_EXPANDED_SIZE.width, Math.round(b.width)),
        height: Math.max(MIN_EXPANDED_SIZE.height, Math.round(b.height)),
      });
    }
  }

  mainWindow.once('ready-to-show', () => {
    if (savedState && savedState.collapsed) {
      setCollapsed(true);
    }
  });

  const handlePersist = () => {
    if (!mainWindow || isCollapsed) {
      return;
    }
    const bounds = mainWindow.getBounds();
    lastExpandedSize = { width: bounds.width, height: bounds.height };
    scheduleSaveWindowState({
      collapsed: false,
      bounds: {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
      expandedSize: lastExpandedSize,
    });
  };

  mainWindow.on('resize', handlePersist);
  mainWindow.on('move', handlePersist);

  mainWindow.on('close', (event) => {
    if (isQuitting) {
      return;
    }
    event.preventDefault();
    mainWindow.hide();
  });
}

function setCollapsed(collapsed) {
  if (!mainWindow) {
    return isCollapsed;
  }
  if (collapsed === isCollapsed) {
    return isCollapsed;
  }

  try {
    const bounds = mainWindow.getBounds();

    if (collapsed) {
      lastExpandedSize = {
        width: Math.max(MIN_EXPANDED_SIZE.width, bounds.width),
        height: Math.max(MIN_EXPANDED_SIZE.height, bounds.height),
      };
      mainWindow.setMinimumSize(COLLAPSED_SIZE.width, COLLAPSED_SIZE.height);
      mainWindow.setResizable(false);
      mainWindow.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: COLLAPSED_SIZE.width,
        height: COLLAPSED_SIZE.height,
      });
      scheduleSaveWindowState({
        collapsed: true,
        bounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        },
        expandedSize: lastExpandedSize,
      });
    } else {
      mainWindow.setMinimumSize(MIN_EXPANDED_SIZE.width, MIN_EXPANDED_SIZE.height);
      mainWindow.setResizable(true);
      const nextWidth = Math.max(MIN_EXPANDED_SIZE.width, lastExpandedSize.width);
      const nextHeight = Math.max(MIN_EXPANDED_SIZE.height, lastExpandedSize.height);
      mainWindow.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: nextWidth,
        height: nextHeight,
      });
      const nextBounds = mainWindow.getBounds();
      lastExpandedSize = {
        width: nextBounds.width,
        height: nextBounds.height,
      };
      scheduleSaveWindowState({
        collapsed: false,
        bounds: {
          x: nextBounds.x,
          y: nextBounds.y,
          width: nextBounds.width,
          height: nextBounds.height,
        },
        expandedSize: lastExpandedSize,
      });
    }

    isCollapsed = collapsed;
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('collapsed-state', { collapsed: isCollapsed });
    }
  } catch (e) {
    console.error('Failed to update collapsed state', e);
  }

  return isCollapsed;
}

function toggleCollapsed() {
  return setCollapsed(!isCollapsed);
}

function showWindow() {
  if (!mainWindow) {
    return;
  }
  mainWindow.show();
  mainWindow.focus();
}

function getLocaleLabels() {
  const locale = app.getLocale();
  const isZh = locale && locale.toLowerCase().startsWith('zh');
  if (isZh) {
    return {
      show: '显示',
      hide: '隐藏',
      quit: '退出',
      tooltip: 'Builder 命令分析',
    };
  }
  return {
    show: 'Show',
    hide: 'Hide',
    quit: 'Quit',
    tooltip: 'Builder',
  };
}

function createTray() {
  const labels = getLocaleLabels();
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">',
    '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">',
    '<stop offset="0" stop-color="#ff7a59"/>',
    '<stop offset="1" stop-color="#f2c94c"/>',
    '</linearGradient></defs>',
    '<circle cx="32" cy="32" r="28" fill="url(#g)"/>',
    '<text x="32" y="40" font-size="28" text-anchor="middle" fill="#1a1f24" font-family="Segoe UI, Arial">B</text>',
    '</svg>',
  ].join('');

  const trayIcon = nativeImage.createFromDataURL(
    `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  );

  tray = new Tray(trayIcon);
  tray.setToolTip(labels.tooltip);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: labels.show,
      click: () => showWindow(),
    },
    {
      label: labels.hide,
      click: () => mainWindow && mainWindow.hide(),
    },
    { type: 'separator' },
    {
      label: labels.quit,
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => showWindow());
}

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    const text = clipboard.readText() || '';
    showWindow();
    if (mainWindow) {
      mainWindow.webContents.send('hotkey-text', {
        text,
        source: 'clipboard',
      });
    }
  });

  globalShortcut.register('CommandOrControl+Shift+S', () => {
    showWindow();
    openCaptureWindow();
  });

  globalShortcut.register('CommandOrControl+Shift+A', () => {
    showWindow();
    if (mainWindow) {
      mainWindow.webContents.send('active-capture', {
        source: 'active',
      });
    }
  });
}

function openCaptureWindow() {
  if (captureWindow) {
    captureWindow.focus();
    return;
  }

  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());

  captureWindow = new BrowserWindow({
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'capturePreload.js'),
    },
  });

  captureWindow.setBounds(display.bounds);
  captureWindow.loadFile(path.join(__dirname, '../renderer/capture.html'));
  captureWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  captureWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });
  captureWindow.on('closed', () => {
    captureWindow = null;
  });
}

ipcMain.handle('toggle-collapse', () => toggleCollapsed());
ipcMain.handle('set-collapsed', (_, collapsed) => setCollapsed(Boolean(collapsed)));
ipcMain.handle('open-capture', () => {
  openCaptureWindow();
  return true;
});
ipcMain.handle('show-window', () => {
  showWindow();
  return true;
});

ipcMain.handle('get-locale', () => {
  return app.getLocale() || 'en';
});

ipcMain.handle('desktop-capture-source', async (_, payload) => {
  if (!desktopCapturer || typeof desktopCapturer.getSources !== 'function') {
    return { error: 'Desktop capturer unavailable' };
  }
  const width = payload && Number(payload.width) ? Number(payload.width) : 1920;
  const height = payload && Number(payload.height) ? Number(payload.height) : 1080;
  const scaleFactor = payload && Number(payload.scaleFactor) ? Number(payload.scaleFactor) : 1;
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.floor(width * scaleFactor),
        height: Math.floor(height * scaleFactor),
      },
    });
    const source = sources[0];
    if (!source) {
      return { error: 'No screen sources available' };
    }
    return {
      dataUrl: source.thumbnail.toDataURL(),
      scaleFactor,
    };
  } catch (e) {
    return { error: e && e.message ? e.message : 'Desktop capture failed' };
  }
});

ipcMain.handle('ocr-image', async (_, payload) => {
  const options = payload && typeof payload === 'object' ? payload : {};
  const dataUrl = options && Object.prototype.hasOwnProperty.call(options, 'dataUrl') ? options.dataUrl : payload;
  const lang = options ? options.lang : undefined;
  const variants = options ? options.variants : undefined;
  return recognizeImage(dataUrl, { lang, variants });
});

ipcMain.handle('read-clipboard', () => {
  return clipboard.readText() || '';
});

function getEnvKeyForProvider(providerId) {
  const map = {
    openai: 'OPENAI_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    gemini: 'GEMINI_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    moonshot: 'MOONSHOT_API_KEY',
    zhipu: 'ZHIPU_API_KEY',
    perplexity: 'PERPLEXITY_API_KEY',
    azure: 'AZURE_OPENAI_API_KEY',
    custom: 'OPENAI_API_KEY',
    ollama: '',
  };
  return map[providerId] || '';
}

function normalizeBaseUrl(baseUrl) {
  const trimmed = String(baseUrl || '').trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.replace(/\/+$/, '');
}

function httpRequestWithProxy(targetUrl, options, proxyAgent) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(targetUrl);
      const isHttps = urlObj.protocol === 'https:';
      const lib = isHttps ? https : http;
      const requestOptions = {
        method: (options && options.method) || 'GET',
        headers: (options && options.headers) || {},
        agent: proxyAgent || undefined,
      };
      const req = lib.request(urlObj, requestOptions, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode || 0,
            body,
          });
        });
      });
      req.on('error', (err) => reject(err));
      req.setTimeout(20000, () => {
        req.destroy(new Error('Request timeout after 20s'));
      });
      if (options && options.body) {
        req.write(options.body);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function listAvailableModels({ modelConfig }) {
  const cfg = modelConfig && typeof modelConfig === 'object' ? modelConfig : {};
  const providerId = String(cfg.providerId || 'openai');
  const baseUrl = normalizeBaseUrl(cfg.baseUrl || '');
  const explicitKey = String(cfg.apiKey || '').trim();
  const proxyEnabled = Boolean(cfg.proxyEnabled);
  const proxyPort = Number(cfg.proxyPort || 0);

  const envKeyName = getEnvKeyForProvider(providerId);
  const apiKey = explicitKey || (envKeyName ? process.env[envKeyName] : '') || '';

  const proxyUrl = proxyEnabled && proxyPort > 0 ? `http://127.0.0.1:${proxyPort}` : '';
  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;

  if (!baseUrl) {
    return { ok: false, error: 'Missing base URL' };
  }
  if (providerId === 'azure') {
    return { ok: false, error: 'Azure OpenAI model listing is not wired yet.' };
  }
  if (providerId !== 'ollama' && !apiKey) {
    return { ok: false, error: `Missing API key (${envKeyName || 'unknown env var'})` };
  }

  let url = '';
  let headers = {};

  if (providerId === 'anthropic') {
    url = `${baseUrl}/models`;
    headers = {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };
  } else if (providerId === 'gemini') {
    url = `${baseUrl}/models?key=${encodeURIComponent(apiKey)}`;
  } else {
    url = `${baseUrl}/models`;
    headers = { 'content-type': 'application/json' };
    if (providerId !== 'ollama') {
      headers.authorization = `Bearer ${apiKey}`;
    }
  }

  try {
    const resp = await httpRequestWithProxy(url, { method: 'GET', headers }, proxyAgent);
    const textBody = resp.body;
    let json = null;
    try {
      json = JSON.parse(textBody);
    } catch (e) {
      json = null;
    }
    if (!resp.ok) {
      const serverError =
        json && json.error ? JSON.stringify(json.error) : textBody.slice(0, 500) || `HTTP ${resp.status}`;
      return { ok: false, error: `HTTP ${resp.status}; ${serverError}` };
    }

    let ids = [];
    if (providerId === 'gemini') {
      const models = Array.isArray(json && json.models) ? json.models : [];
      ids = models
        .map((m) => (m && m.name ? String(m.name) : ''))
        .filter(Boolean)
        .map((name) => (name.startsWith('models/') ? name.slice('models/'.length) : name));
    } else {
      const data = Array.isArray(json && json.data) ? json.data : Array.isArray(json && json.models) ? json.models : [];
      ids = data
        .map((m) => (m && (m.id || m.name) ? String(m.id || m.name) : ''))
        .filter(Boolean);
    }

    ids = Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b));
    return { ok: true, models: ids };
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    return { ok: false, error: `Network error: ${message}` };
  }
}

async function llmExplain({ text, modelConfig, lang }) {
  const input = String(text || '').trim();
  if (!input) {
    return { ok: false, error: 'No input' };
  }

  const cfg = modelConfig && typeof modelConfig === 'object' ? modelConfig : {};
  const providerId = String(cfg.providerId || 'openai');
  const baseUrl = normalizeBaseUrl(cfg.baseUrl || '');
  const modelName = String(cfg.modelName || '').trim();
  const explicitKey = String(cfg.apiKey || '').trim();
  const proxyEnabled = Boolean(cfg.proxyEnabled);
  const proxyPort = Number(cfg.proxyPort || 0);

  const uiLang = lang === 'zh' ? 'zh' : 'en';
  const isZh = uiLang === 'zh';
  const promptTemplate = `你是“命令作用与风险判定助手”。我会粘贴一条终端命令。
请按以下格式输出，要求：内容精简、速度优先、每块最多 4 条要点。

【先输出一段合法 JSON（不要代码块/不要多余文字）】字段固定：
{
  "summary": "一句话目的（具体到目录/对象/动作）",
  "writes": ["会写/改的文件或目录（不确定用 '可能:' 前缀）"],
  "deletes": ["会删的文件或目录（不确定用 '可能:' 前缀）"],
  "reads": ["主要读取的文件或目录（可省略或留空数组）"],
  "network": "none|maybe|yes",
  "big_download": true|false|"maybe",
  "safe": "可以|谨慎|不要",
  "why": ["1-3条理由（必须与命令内容直接相关）"],
  "precheck": ["执行前必须检查的1-3条命令"]
}

【然后输出 4 块人类可读摘要（每块<=4条）】
A) 一句话：…
B) 影响：【会写】…【会删】…【只读】…
C) 联网与下载：…
D) 无脑执行吗：…（并列出 precheck）

规则（必须遵守）：
- 不确定就写“可能/取决于脚本”，不要编造路径。
- 出现 rm -rf / sudo / 覆盖重定向 > / docker system prune / curl|sh 时，safe 必须是“不要”。

命令如下：
`;

  const envKeyName = getEnvKeyForProvider(providerId);
  const apiKey = explicitKey || (envKeyName ? process.env[envKeyName] : '') || '';

  const debugInfo = {
    providerId,
    baseUrl,
    modelName: modelName || '',
    hasInlineKey: Boolean(explicitKey),
    hasEnvKey: Boolean(envKeyName && process.env[envKeyName]),
    envKeyName: envKeyName || '',
    proxyEnabled,
    proxyPort,
  };

    const buildError = (reason) => {
      const parts = [];
      parts.push(`provider=${debugInfo.providerId}`);
      parts.push(`baseUrl=${debugInfo.baseUrl || '(empty)'}`);
      parts.push(`model=${debugInfo.modelName || '(default)'}`);
      parts.push(
        `apiKeySource=${debugInfo.hasInlineKey ? 'inline' : debugInfo.hasEnvKey ? debugInfo.envKeyName || 'env' : 'none'}`
      );
      parts.push(`proxyEnabled=${debugInfo.proxyEnabled}`);
      parts.push(`proxyPort=${debugInfo.proxyPort}`);
      parts.push(`reason=${reason}`);
      return parts.join(' | ');
    };

  if (!baseUrl) {
    return { ok: false, error: buildError('Missing base URL') };
  }
  if (providerId !== 'ollama' && !apiKey) {
    return {
      ok: false,
      error: buildError(`Missing API key (${envKeyName || 'unknown env var'})`),
    };
  }

  const proxyUrl = proxyEnabled && proxyPort > 0 ? `http://127.0.0.1:${proxyPort}` : '';
  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;

  try {
    if (providerId === 'anthropic') {
      const url = `${baseUrl}/messages`;
      try {
        const anthropicPrompt = promptTemplate;
        const options = {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: modelName || 'claude-3-5-sonnet-latest',
            max_tokens: 320,
            messages: [{ role: 'user', content: anthropicPrompt + input }],
          }),
          };
          const resp = await httpRequestWithProxy(url, options, proxyAgent);
          const textBody = resp.body;
          let json = null;
          try {
            json = JSON.parse(textBody);
          } catch (e) {
            json = null;
        }
        if (!resp.ok) {
          const serverError =
            json && json.error ? JSON.stringify(json.error) : textBody.slice(0, 500) || `HTTP ${resp.status}`;
          return { ok: false, error: buildError(`HTTP ${resp.status}; ${serverError}`) };
        }
        const content = Array.isArray(json && json.content) ? json.content : [];
        const textPart = content.find((c) => c && c.type === 'text');
        return { ok: true, text: (textPart && textPart.text) || '' };
      } catch (e) {
        const message = e && e.message ? e.message : String(e);
        return { ok: false, error: buildError(`Network error: ${message}`) };
      }
    }

    if (providerId === 'gemini') {
      if (!apiKey) {
        return { ok: false, error: buildError('Missing API key (GEMINI_API_KEY)') };
      }
      const model = modelName || 'gemini-1.5-flash';
      const url = `${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      try {
        const geminiPrompt = promptTemplate;
        const options = {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: geminiPrompt + input }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 320 },
          }),
        };
        const resp = await httpRequestWithProxy(url, options, proxyAgent);
        const textBody = resp.body;
        let json = null;
        try {
          json = JSON.parse(textBody);
        } catch (e) {
          json = null;
        }
        if (!resp.ok) {
          const serverError =
            json && json.error ? JSON.stringify(json.error) : textBody.slice(0, 500) || `HTTP ${resp.status}`;
          return { ok: false, error: buildError(`HTTP ${resp.status}; ${serverError}`) };
        }
        const candidates = Array.isArray(json && json.candidates) ? json.candidates : [];
        const first = candidates[0];
        const parts = first && first.content && Array.isArray(first.content.parts) ? first.content.parts : [];
        const textOut = parts.map((p) => (p && p.text ? p.text : '')).join('').trim();
        return { ok: true, text: textOut };
      } catch (e) {
        const message = e && e.message ? e.message : String(e);
        return { ok: false, error: buildError(`Network error: ${message}`) };
      }
    }

    if (providerId === 'azure') {
      return { ok: false, error: buildError('Azure OpenAI requires a dedicated adapter (not wired yet).') };
    }

    const url = `${baseUrl}/chat/completions`;
    const headers = {
      'content-type': 'application/json',
    };
    if (providerId !== 'ollama') {
      headers.authorization = `Bearer ${apiKey}`;
    }

    try {
      const systemPrompt = promptTemplate;
      const effectiveModel = modelName || 'gpt-4o-mini';
      if (providerId === 'openai' && /^gpt-5/i.test(effectiveModel)) {
        const responsesUrl = `${baseUrl}/responses`;
        const options = {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: effectiveModel,
            input: `${systemPrompt}\n${input}`,
            max_output_tokens: 320,
            text: { verbosity: 'low' },
          }),
        };

        const resp = await httpRequestWithProxy(responsesUrl, options, proxyAgent);
        const textBody = resp.body;
        let json = null;
        try {
          json = JSON.parse(textBody);
        } catch (e) {
          json = null;
        }
        if (!resp.ok) {
          const serverError =
            json && json.error ? JSON.stringify(json.error) : textBody.slice(0, 500) || `HTTP ${resp.status}`;
          return { ok: false, error: buildError(`HTTP ${resp.status}; ${serverError}`) };
        }
        if (json && typeof json.output_text === 'string') {
          return { ok: true, text: json.output_text };
        }
        const output = Array.isArray(json && json.output) ? json.output : [];
        const chunks = [];
        output.forEach((item) => {
          const content = Array.isArray(item && item.content) ? item.content : [];
          content.forEach((c) => {
            if (!c) {
              return;
            }
            if (c.type === 'output_text' && typeof c.text === 'string') {
              chunks.push(c.text);
            }
            if (c.type === 'text' && typeof c.text === 'string') {
              chunks.push(c.text);
            }
          });
        });
        return { ok: true, text: chunks.join('').trim() };
      }

      const useMaxCompletionTokens =
        providerId === 'openai' && (/^o\d/i.test(effectiveModel) || /^o-/i.test(effectiveModel));
      const payload = {
        model: effectiveModel,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          { role: 'user', content: input },
        ],
      };
      if (useMaxCompletionTokens) {
        payload.max_completion_tokens = 320;
      } else {
        payload.max_tokens = 320;
      }
      const options = {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
        }),
      };
      const resp = await httpRequestWithProxy(url, options, proxyAgent);

      const textBody = resp.body;
      let json = null;
      try {
        json = JSON.parse(textBody);
      } catch (e) {
        json = null;
      }
      if (!resp.ok) {
        const serverError =
          json && json.error ? JSON.stringify(json.error) : textBody.slice(0, 500) || `HTTP ${resp.status}`;
        return { ok: false, error: buildError(`HTTP ${resp.status}; ${serverError}`) };
      }
      const content =
        json &&
        json.choices &&
        json.choices[0] &&
        json.choices[0].message &&
        typeof json.choices[0].message.content === 'string'
          ? json.choices[0].message.content
          : '';
      return { ok: true, text: content };
    } catch (e) {
      const message = e && e.message ? e.message : String(e);
      return { ok: false, error: buildError(`Network error: ${message}`) };
    }
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    return { ok: false, error: buildError(`Unhandled error: ${message}`) };
  }
}

ipcMain.handle('llm-explain', async (_, payload) => {
  try {
    return await llmExplain(payload || {});
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : 'LLM call failed' };
  }
});

ipcMain.handle('list-models', async (_, payload) => {
  try {
    return await listAvailableModels(payload || {});
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : 'List models failed' };
  }
});

ipcMain.on('ocr-result', (_, payload) => {
  if (mainWindow) {
    mainWindow.webContents.send('ocr-text', payload);
  }
  if (captureWindow) {
    captureWindow.close();
  }
});

ipcMain.on('capture-cancel', () => {
  if (captureWindow) {
    captureWindow.close();
  }
});

app.whenReady().then(() => {
  createMainWindow();
  createTray();
  registerShortcuts();

  app.on('activate', () => {
    if (!mainWindow) {
      createMainWindow();
    }
    showWindow();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
