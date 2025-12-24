const inputText = document.getElementById('inputText');
const btnAnalyze = document.getElementById('btnAnalyze');
const btnClear = document.getElementById('btnClear');
const btnCapture = document.getElementById('btnCapture');
const btnActive = document.getElementById('btnActive');
const btnCollapse = document.getElementById('btnCollapse');
const btnHelp = document.getElementById('btnHelp');
const btnModels = document.getElementById('btnModels');
const btnLang = document.getElementById('btnLang');
const btnExpand = document.getElementById('btnExpand');

const riskBadge = document.getElementById('riskBadge');
const shellValue = document.getElementById('shellValue');
const sourceValue = document.getElementById('sourceValue');
const ocrValue = document.getElementById('ocrValue');
const warnings = document.getElementById('warnings');
const llmOutput = document.getElementById('llmOutput');
const blocks = document.getElementById('blocks');
const rules = document.getElementById('rules');

const manualCapture = document.getElementById('manualCapture');
const manualInput = document.getElementById('manualInput');
const btnManualPaste = document.getElementById('btnManualPaste');
const btnManualAnalyze = document.getElementById('btnManualAnalyze');
const btnManualCancel = document.getElementById('btnManualCancel');

const helpModal = document.getElementById('helpModal');
const btnHelpClose = document.getElementById('btnHelpClose');

const modelModal = document.getElementById('modelModal');
const modelList = document.getElementById('modelList');
const btnModelAdd = document.getElementById('btnModelAdd');
const btnModelSave = document.getElementById('btnModelSave');
const btnModelDelete = document.getElementById('btnModelDelete');
const btnModelClose = document.getElementById('btnModelClose');
const modelNameInput = document.getElementById('modelNameInput');
const modelProviderSelect = document.getElementById('modelProviderSelect');
const modelApiKeyInput = document.getElementById('modelApiKeyInput');
const modelBaseUrlInput = document.getElementById('modelBaseUrlInput');
const modelModelNameInput = document.getElementById('modelModelNameInput');
const modelProxyEnabledInput = document.getElementById('modelProxyEnabled');
const modelProxyPortInput = document.getElementById('modelProxyPort');

const I18N = {
  en: {
    appTitle: 'Builder',
    appSubtitle: 'Command Safety Lens',
    help: 'Help',
    langToggle: '中文',
    collapse: 'Collapse',
    expand: 'Expand',
    inputTitle: 'Input',
    inputPlaceholder: 'Paste or capture a command block...',
    analyze: 'Analyze',
    clear: 'Clear',
    ocrCapture: 'OCR Capture',
    activeApp: 'Active App',
    hint: 'All analysis runs locally. OCR uses Tesseract.js.',
    summaryTitle: 'Summary',
    shellLabel: 'Shell',
    sourceLabel: 'Source',
    ocrLabel: 'OCR confidence',
    blocksTitle: 'Command Blocks',
    rulesTitle: 'Rule Hits',
    llmTitle: 'AI Explanation',
    manualHeader: 'Active App Capture',
    manualText:
      'Selection capture from other apps is not wired yet. Paste the command block here instead.',
    manualPlaceholder: 'Paste the command block...',
    manualPaste: 'Paste Clipboard',
    cancel: 'Cancel',
    helpHeader: 'Usage Guide',
    helpIntro: 'Builder analyzes command text locally and highlights risky patterns.',
    helpItemClipboard: 'Use Ctrl/Cmd+Shift+V to analyze clipboard content.',
    helpItemOcr: 'Use Ctrl/Cmd+Shift+S to capture a region, OCR, and analyze.',
    helpItemActive: 'Use Ctrl/Cmd+Shift+A to paste commands from the active app.',
    helpItemCollapse: 'Collapse to a floating ball from the top right, expand when needed.',
    helpItemPrivacy: 'No uploads. Rules and parsing stay on your device.',
    helpClose: 'Close',
    modelButton: 'Models',
    modelHeader: 'Model Settings',
    modelListLabel: 'Configurations',
    modelAdd: 'New',
    modelSave: 'Save',
    modelDelete: 'Delete',
    modelClose: 'Close',
    modelNameLabel: 'Config name',
    modelProviderLabel: 'Provider',
    modelApiKeyLabel: 'API key',
    modelApiKeyHint: 'Leave empty to use default environment variables if configured.',
    modelBaseUrlLabel: 'API base URL',
    modelBaseUrlPlaceholder: 'https://api.example.com/v1',
    modelModelNameLabel: 'Model name',
    modelProxyHeader: 'Proxy (local)',
    modelProxyToggle: 'Use HTTP proxy on localhost',
    modelProxyPortPlaceholder: 'Proxy port, e.g. 7890',
    noWarnings: 'No warnings.',
    noBlocks: 'No command blocks detected.',
    noRules: 'No risky patterns detected.',
    riskLevels: {
      none: 'none',
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical',
    },
    sources: {
      manual: 'manual',
      clipboard: 'clipboard',
      ocr: 'ocr',
      active: 'active',
    },
    severity: {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical',
    },
    warningCodes: {
      no_input: 'No input detected.',
      no_blocks: 'No command blocks detected.',
      low_ocr: 'Low OCR confidence. Confirm the command before executing.',
    },
    blockLabel: 'Block {index} - {shell}',
    ruleTitle: '{ruleId} - block {index}',
    matchLabel: 'Match',
    saferLabel: 'Safer',
    na: 'n/a',
    unknown: 'unknown',
    modelProviders: {
      openai: 'OpenAI (GPT)',
      deepseek: 'DeepSeek',
      anthropic: 'Anthropic (Claude)',
      gemini: 'Google Gemini',
      azure: 'Azure OpenAI',
      ollama: 'Ollama (local)',
      openrouter: 'OpenRouter',
      moonshot: 'Moonshot (Kimi)',
      zhipu: 'Zhipu / GLM',
      perplexity: 'Perplexity',
      custom: 'Custom / OpenAI compatible',
    },
  },
  zh: {
    appTitle: 'Builder',
    appSubtitle: '命令安全透镜',
    help: '使用说明',
    langToggle: 'EN',
    collapse: '收起',
    expand: '展开',
    inputTitle: '输入',
    inputPlaceholder: '粘贴或捕获命令块...',
    analyze: '分析',
    clear: '清空',
    ocrCapture: 'OCR 识别',
    activeApp: '活跃应用',
    hint: '所有分析本地完成。OCR 使用 Tesseract.js。',
    summaryTitle: '概要',
    shellLabel: 'Shell',
    sourceLabel: '来源',
    ocrLabel: 'OCR 置信度',
    blocksTitle: '命令块',
    rulesTitle: '命中规则',
    llmTitle: '模型解释',
    manualHeader: '活跃应用抓取',
    manualText: '暂未接入跨应用选中抓取，请在此粘贴命令块。',
    manualPlaceholder: '粘贴命令块...',
    manualPaste: '粘贴剪贴板',
    cancel: '取消',
    helpHeader: '使用说明',
    helpIntro: 'Builder 在本地分析命令文本并标记风险模式。',
    helpItemClipboard: 'Ctrl/Cmd+Shift+V：分析剪贴板内容。',
    helpItemOcr: 'Ctrl/Cmd+Shift+S：框选截图并 OCR 后分析。',
    helpItemActive: 'Ctrl/Cmd+Shift+A：从活跃应用手动粘贴命令。',
    helpItemCollapse: '右上角可收起为悬浮球，点击展开按钮恢复。',
    helpItemPrivacy: '不上传内容；规则与解析全部本地执行。',
    helpClose: '关闭',
    modelButton: '模型',
    modelHeader: '模型配置',
    modelListLabel: '配置列表',
    modelAdd: '新建',
    modelSave: '保存',
    modelDelete: '删除',
    modelClose: '关闭',
    modelNameLabel: '配置名称',
    modelProviderLabel: '服务商',
    modelApiKeyLabel: 'API 密钥',
    modelApiKeyHint: '留空以使用默认环境变量（若已配置）。',
    modelBaseUrlLabel: 'API 地址（Base URL）',
    modelBaseUrlPlaceholder: 'https://api.example.com/v1',
    modelModelNameLabel: '模型名称',
    modelProxyHeader: '代理（本地）',
    modelProxyToggle: '通过本地 HTTP 代理转发请求',
    modelProxyPortPlaceholder: '代理端口，例如 7890',
    noWarnings: '暂无提示。',
    noBlocks: '未检测到命令块。',
    noRules: '未检测到风险模式。',
    riskLevels: {
      none: '无风险',
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '严重',
    },
    sources: {
      manual: '手动',
      clipboard: '剪贴板',
      ocr: 'OCR',
      active: '活跃应用',
    },
    severity: {
      low: '低',
      medium: '中',
      high: '高',
      critical: '严重',
    },
    warningCodes: {
      no_input: '未检测到输入。',
      no_blocks: '未检测到命令块。',
      low_ocr: 'OCR 置信度较低，请确认后再执行。',
    },
    blockLabel: '命令块 {index} - {shell}',
    ruleTitle: '规则 {ruleId} - 块 {index}',
    matchLabel: '命中',
    saferLabel: '更安全建议',
    na: '无',
    unknown: '未知',
    modelProviders: {
      openai: 'OpenAI (GPT)',
      deepseek: 'DeepSeek',
      anthropic: 'Anthropic (Claude)',
      gemini: 'Google Gemini',
      azure: 'Azure OpenAI',
      ollama: 'Ollama（本地）',
      openrouter: 'OpenRouter',
      moonshot: 'Moonshot（Kimi）',
      zhipu: '智谱 / GLM',
      perplexity: 'Perplexity',
      custom: '自定义 / OpenAI 兼容',
    },
  },
};

let currentLang = 'en';
let lastResult = null;
let lastExtraWarnings = [];
let collapsedState = false;

const MODEL_STORAGE_KEY = 'builder.models.configs';
const MODEL_SELECTED_KEY = 'builder.models.selected';

const PROVIDERS = {
  openai: {
    defaultBaseUrl: 'https://api.openai.com/v1',
  },
  deepseek: {
    defaultBaseUrl: 'https://api.deepseek.com/v1',
  },
  anthropic: {
    defaultBaseUrl: 'https://api.anthropic.com/v1',
  },
  gemini: {
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  azure: {
    defaultBaseUrl: 'https://{your-resource}.openai.azure.com/openai',
  },
  ollama: {
    defaultBaseUrl: 'http://127.0.0.1:11434/v1',
  },
  openrouter: {
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
  },
  moonshot: {
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
  },
  zhipu: {
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  },
  perplexity: {
    defaultBaseUrl: 'https://api.perplexity.ai',
  },
  custom: {
    defaultBaseUrl: 'https://api.example.com/v1',
  },
};

let modelConfigs = [];
let selectedModelId = null;

function formatTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return vars[key];
    }
    return `{${key}}`;
  });
}

function applyStaticText() {
  const dict = I18N[currentLang];
  document.title = dict.appTitle;

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (key && dict[key]) {
      node.textContent = dict[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (key && dict[key]) {
      node.placeholder = dict[key];
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach((node) => {
    const key = node.dataset.i18nTitle;
    if (key && dict[key]) {
      node.title = dict[key];
    }
  });

  btnLang.textContent = dict.langToggle;
  updateCollapseButton();
}

function updateCollapseButton() {
  const dict = I18N[currentLang];
  btnCollapse.textContent = collapsedState ? dict.expand : dict.collapse;
}

function getProviderLabel(providerId) {
  const dict = I18N[currentLang];
  if (dict.modelProviders && dict.modelProviders[providerId]) {
    return dict.modelProviders[providerId];
  }
  return providerId || '';
}

function getDefaultBaseUrl(providerId) {
  const def = PROVIDERS[providerId];
  if (def && def.defaultBaseUrl) {
    return def.defaultBaseUrl;
  }
  return PROVIDERS.custom.defaultBaseUrl;
}

function loadModelState() {
  try {
    const raw = localStorage.getItem(MODEL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        modelConfigs = parsed;
      }
    }
  } catch (e) {
    modelConfigs = [];
  }
  try {
    const rawSelected = localStorage.getItem(MODEL_SELECTED_KEY);
    if (rawSelected) {
      selectedModelId = rawSelected;
    }
  } catch (e) {
    selectedModelId = null;
  }
  if (!modelConfigs.length) {
    const id = `model-${Date.now()}`;
    const baseUrl = getDefaultBaseUrl('openai');
    modelConfigs = [
      {
        id,
        name: 'Default GPT',
        providerId: 'openai',
        apiKey: '',
        baseUrl,
        modelName: 'gpt-4.1-mini',
        proxyEnabled: false,
        proxyPort: '',
      },
    ];
    selectedModelId = id;
    saveModelState();
  }
  if (!selectedModelId && modelConfigs.length) {
    selectedModelId = modelConfigs[0].id;
  }
}

function saveModelState() {
  const snapshot = modelConfigs.map((item) => ({
    id: item.id,
    name: item.name || '',
    providerId: item.providerId || 'openai',
    apiKey: item.apiKey || '',
    baseUrl: item.baseUrl || '',
    modelName: item.modelName || '',
    proxyEnabled: Boolean(item.proxyEnabled),
    proxyPort: item.proxyPort || '',
  }));
  localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(snapshot));
  if (selectedModelId) {
    localStorage.setItem(MODEL_SELECTED_KEY, selectedModelId);
  }
}

function getCurrentModelConfig() {
  return modelConfigs.find((item) => item.id === selectedModelId) || null;
}

function renderModelList() {
  clearNode(modelList);
  if (!modelConfigs.length) {
    const empty = document.createElement('div');
    empty.className = 'model-list-item';
    empty.textContent = '-';
    modelList.appendChild(empty);
    return;
  }
  modelConfigs.forEach((config) => {
    const item = document.createElement('div');
    item.className = 'model-list-item';
    if (config.id === selectedModelId) {
      item.classList.add('active');
    }
    const name = document.createElement('div');
    name.className = 'model-list-item-name';
    name.textContent = config.name || config.modelName || config.id;
    const provider = document.createElement('div');
    provider.className = 'model-list-item-provider';
    provider.textContent = getProviderLabel(config.providerId);
    item.appendChild(name);
    item.appendChild(provider);
    item.addEventListener('click', () => {
      selectedModelId = config.id;
      applyModelForm();
      renderModelList();
      saveModelState();
    });
    modelList.appendChild(item);
  });
}

function applyModelForm() {
  const config = getCurrentModelConfig();
  if (!config) {
    modelNameInput.value = '';
    modelProviderSelect.value = 'openai';
    modelApiKeyInput.value = '';
    modelBaseUrlInput.value = '';
    modelModelNameInput.value = '';
    modelProxyEnabledInput.checked = false;
    modelProxyPortInput.value = '';
    return;
  }
  modelNameInput.value = config.name || '';
  modelProviderSelect.value = config.providerId || 'openai';
  modelApiKeyInput.value = config.apiKey || '';
  modelBaseUrlInput.value = config.baseUrl || '';
  modelModelNameInput.value = config.modelName || '';
   modelProxyEnabledInput.checked = Boolean(config.proxyEnabled);
   modelProxyPortInput.value = config.proxyPort || '';
}

function openModelModal() {
  modelModal.classList.remove('hidden');
  applyModelForm();
  renderModelList();
}

function closeModelModal() {
  modelModal.classList.add('hidden');
}

function getInitialLanguage() {
  const saved = localStorage.getItem('builder.lang');
  if (saved && I18N[saved]) {
    return saved;
  }
  const browserLang = (navigator.language || 'en').toLowerCase();
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

function setLanguage(lang) {
  currentLang = I18N[lang] ? lang : 'en';
  localStorage.setItem('builder.lang', currentLang);
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  applyStaticText();
  if (lastResult) {
    renderResult(lastResult, lastExtraWarnings);
  } else {
    renderWarnings([]);
  }
}

function clearNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function renderWarnings(list) {
  const dict = I18N[currentLang];
  if (!list.length) {
    warnings.textContent = dict.noWarnings;
    return;
  }
  warnings.textContent = list.join(' | ');
}

function renderLlmText(text) {
  llmOutput.textContent = text || '';
}

function renderBlocks(blockList) {
  const dict = I18N[currentLang];
  clearNode(blocks);
  if (!blockList.length) {
    const empty = document.createElement('div');
    empty.className = 'block-card';
    empty.textContent = dict.noBlocks;
    blocks.appendChild(empty);
    return;
  }
  blockList.forEach((block, index) => {
    const card = document.createElement('div');
    card.className = 'block-card';

    const pre = document.createElement('pre');
    pre.textContent = block.normalized || block.raw || '';

    const meta = document.createElement('div');
    meta.className = 'rule-desc';
    const shell = block.detectedShell && block.detectedShell.shell ? block.detectedShell.shell : dict.unknown;
    meta.textContent = formatTemplate(dict.blockLabel, {
      index: index + 1,
      shell,
    });

    card.appendChild(meta);
    card.appendChild(pre);
    blocks.appendChild(card);
  });
}

function renderRules(findings) {
  const dict = I18N[currentLang];
  clearNode(rules);
  if (!findings.length) {
    const empty = document.createElement('div');
    empty.className = 'rule-card';
    empty.textContent = dict.noRules;
    rules.appendChild(empty);
    return;
  }

  findings.forEach((finding) => {
    const card = document.createElement('div');
    card.className = 'rule-card';

    const meta = document.createElement('div');
    meta.className = 'rule-meta';

    const title = document.createElement('div');
    title.className = 'rule-title';
    title.textContent = formatTemplate(dict.ruleTitle, {
      ruleId: finding.ruleId,
      index: finding.blockIndex + 1,
    });

    const desc = document.createElement('div');
    desc.className = 'rule-desc';
    desc.textContent =
      currentLang === 'zh' && finding.descriptionZh
        ? finding.descriptionZh
        : finding.description;

    const matchLine = document.createElement('div');
    matchLine.className = 'rule-desc';
    const matchText = (finding.match || '').replace(/\s+/g, ' ').trim();
    matchLine.textContent = `${dict.matchLabel}: ${matchText || dict.unknown}`;

    const alternativeLine = document.createElement('div');
    alternativeLine.className = 'rule-desc';
    const alternatives = Array.isArray(finding.alternatives) ? finding.alternatives : [];
    const pick = alternatives
      .map((item) => (currentLang === 'zh' && item.titleZh ? item.titleZh : item.title))
      .filter((value) => Boolean(value))
      .slice(0, 2);
    alternativeLine.textContent = pick.length ? `${dict.saferLabel}: ${pick.join(' / ')}` : '';

    meta.appendChild(title);
    meta.appendChild(desc);
    meta.appendChild(matchLine);
    if (alternativeLine.textContent) {
      meta.appendChild(alternativeLine);
    }

    const sev = document.createElement('div');
    sev.className = 'rule-sev';
    sev.textContent = dict.severity[finding.severity] || finding.severity;

    card.appendChild(meta);
    card.appendChild(sev);
    rules.appendChild(card);
  });
}

function buildWarnings(result, extraWarnings) {
  const dict = I18N[currentLang];
  const codes = result.warningCodes || [];
  const mapped = codes
    .map((code) => dict.warningCodes[code])
    .filter((text) => Boolean(text));

  const base = mapped.length ? mapped : result.warnings || [];
  return [...base, ...extraWarnings];
}

function renderResult(result, extraWarnings = []) {
  lastResult = result;
  lastExtraWarnings = extraWarnings;

  const dict = I18N[currentLang];
  const riskLevel = result.risk.level || 'none';
  riskBadge.textContent = dict.riskLevels[riskLevel] || riskLevel;
  riskBadge.dataset.level = riskLevel;

  const shell = result.detectedShell.shell || dict.unknown;
  shellValue.textContent = shell;

  const source = dict.sources[result.source] || result.source || dict.unknown;
  sourceValue.textContent = source;

  ocrValue.textContent =
    result.ocr && result.ocr.confidence !== null
      ? result.ocr.confidence.toFixed(2)
      : dict.na;

  const mergedWarnings = buildWarnings(result, extraWarnings);
  renderWarnings(mergedWarnings);
  renderBlocks(result.blocks || []);
  renderRules(result.findings || []);
}

async function analyzeText(text, options = {}, extraWarnings = []) {
  if (!window.builder || typeof window.builder.analyzeText !== 'function') {
    renderWarnings([
      currentLang === 'zh'
        ? '渲染进程与主进程桥接未就绪（builder API 不可用）。'
        : 'Bridge not ready (builder API unavailable).',
    ]);
    return;
  }
  const result = window.builder.analyzeText(text, options);
  renderResult(result, extraWarnings);

  const trimmed = String(text || '').trim();
  if (!trimmed) {
    renderLlmText('');
    return;
  }

  const config = getCurrentModelConfig();
  if (!config) {
    renderLlmText('');
    return;
  }

  if (typeof window.builder.llmExplain !== 'function') {
    renderLlmText(currentLang === 'zh' ? '模型调用能力未就绪。' : 'LLM integration not ready.');
    return;
  }

  renderLlmText(currentLang === 'zh' ? '正在调用模型生成解释...' : 'Generating explanation...');
  const resp = await window.builder.llmExplain(trimmed, config, currentLang);
  if (!resp || !resp.ok) {
    const msg = resp && resp.error ? resp.error : 'LLM call failed';
    renderLlmText(currentLang === 'zh' ? `模型调用失败：${msg}` : `LLM error: ${msg}`);
    return;
  }
  renderLlmText(resp.text || '');
}

function openManualCapture() {
  manualCapture.classList.remove('hidden');
  manualInput.value = '';
  manualInput.focus();
}

function closeManualCapture() {
  manualCapture.classList.add('hidden');
}

function openHelpModal() {
  helpModal.classList.remove('hidden');
}

function closeHelpModal() {
  helpModal.classList.add('hidden');
}

function setCollapsedState(collapsed) {
  collapsedState = Boolean(collapsed);
  document.body.classList.toggle('collapsed', collapsedState);
  updateCollapseButton();
}

function collectModelFormValues() {
  const name = modelNameInput.value.trim();
  const providerId = modelProviderSelect.value || 'openai';
  const apiKey = modelApiKeyInput.value.trim();
  let baseUrl = modelBaseUrlInput.value.trim();
  const modelName = modelModelNameInput.value.trim();
  const proxyEnabled = Boolean(modelProxyEnabledInput.checked);
  const proxyPort = modelProxyPortInput.value.trim();
  if (!baseUrl) {
    baseUrl = getDefaultBaseUrl(providerId);
    modelBaseUrlInput.value = baseUrl;
  }
  return {
    name,
    providerId,
    apiKey,
    baseUrl,
    modelName,
    proxyEnabled,
    proxyPort,
  };
}

btnAnalyze.addEventListener('click', () => {
  analyzeText(inputText.value, { source: 'manual' });
});

btnClear.addEventListener('click', () => {
  inputText.value = '';
  analyzeText('', { source: 'manual' });
});

btnCapture.addEventListener('click', () => {
  window.builder.openCapture();
});

btnActive.addEventListener('click', () => {
  openManualCapture();
});

btnCollapse.addEventListener('click', () => {
  if (!window.builder || typeof window.builder.toggleCollapse !== 'function') {
    setCollapsedState(!collapsedState);
    return;
  }
  window.builder
    .toggleCollapse()
    .then((collapsed) => {
      setCollapsedState(collapsed);
    })
    .catch(() => {
      setCollapsedState(!collapsedState);
    });
});

btnManualAnalyze.addEventListener('click', () => {
  const text = manualInput.value;
  closeManualCapture();
  inputText.value = text;
  analyzeText(text, { source: 'active' });
});

btnManualPaste.addEventListener('click', async () => {
  const text = await window.builder.readClipboardText();
  manualInput.value = text || '';
  manualInput.focus();
});

btnManualCancel.addEventListener('click', () => {
  closeManualCapture();
});

btnHelp.addEventListener('click', () => {
  openHelpModal();
});

btnHelpClose.addEventListener('click', () => {
  closeHelpModal();
});

btnModels.addEventListener('click', () => {
  openModelModal();
});

btnModelClose.addEventListener('click', () => {
  closeModelModal();
});

btnModelAdd.addEventListener('click', () => {
  const id = `model-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const providerId = 'openai';
  const baseUrl = getDefaultBaseUrl(providerId);
  const next = {
    id,
    name: '',
    providerId,
    apiKey: '',
    baseUrl,
    modelName: '',
    proxyEnabled: false,
    proxyPort: '',
  };
  modelConfigs.push(next);
  selectedModelId = id;
  applyModelForm();
  renderModelList();
  saveModelState();
});

btnModelSave.addEventListener('click', () => {
  const values = collectModelFormValues();
  if (!selectedModelId) {
    const id = `model-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    selectedModelId = id;
    modelConfigs.push({
      id,
      ...values,
    });
  } else {
    const index = modelConfigs.findIndex((item) => item.id === selectedModelId);
    if (index >= 0) {
      modelConfigs[index] = {
        id: selectedModelId,
        ...values,
      };
    } else {
      modelConfigs.push({
        id: selectedModelId,
        ...values,
      });
    }
  }
  renderModelList();
  saveModelState();
});

btnModelDelete.addEventListener('click', () => {
  if (!selectedModelId) {
    return;
  }
  const next = modelConfigs.filter((item) => item.id !== selectedModelId);
  modelConfigs = next;
  if (modelConfigs.length) {
    selectedModelId = modelConfigs[0].id;
  } else {
    selectedModelId = null;
  }
  renderModelList();
  applyModelForm();
  saveModelState();
});

helpModal.addEventListener('click', (event) => {
  if (event.target === helpModal) {
    closeHelpModal();
  }
});

btnLang.addEventListener('click', () => {
  const nextLang = currentLang === 'en' ? 'zh' : 'en';
  setLanguage(nextLang);
});

btnExpand.addEventListener('click', (event) => {
  event.stopPropagation();
  if (!window.builder || typeof window.builder.setCollapsed !== 'function') {
    setCollapsedState(false);
    return;
  }
  window.builder
    .setCollapsed(false)
    .then((collapsed) => {
      setCollapsedState(collapsed);
    })
    .catch(() => {
      setCollapsedState(false);
    });
});

window.builder.onHotkeyText((payload) => {
  inputText.value = payload.text || '';
  analyzeText(payload.text || '', { source: payload.source || 'clipboard' });
});

window.builder.onOcrText((payload) => {
  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const text = safePayload.text || '';
  inputText.value = text;
  const extraWarnings = [];
  if (!String(text).trim() && !safePayload.error) {
    extraWarnings.push(currentLang === 'zh' ? 'OCR 未识别出内容，请截取更清晰的文字。' : 'OCR returned empty text. Try capturing clearer text.');
  }
  if (safePayload.error) {
    extraWarnings.push(safePayload.error);
  }
  analyzeText(text, { source: 'ocr', ocrConfidence: safePayload.confidence }, extraWarnings);
});

window.builder.onActiveCapture(() => {
  openManualCapture();
});

window.builder.onCollapsedState((payload) => {
  setCollapsedState(payload.collapsed);
});

currentLang = getInitialLanguage();
loadModelState();
setLanguage(currentLang);
setCollapsedState(false);
renderWarnings([]);
renderLlmText('');
analyzeText('', { source: 'manual' });
