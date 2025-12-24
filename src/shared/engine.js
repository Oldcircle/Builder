const { detectShell } = require('./shellDetect');
const { extractBlocks, normalizeCommandText } = require('./normalize');
const { RULES, SEVERITY_ORDER } = require('./rules');

function evaluateRules(blocks) {
  const findings = [];
  blocks.forEach((blockText, blockIndex) => {
    RULES.forEach((rule) => {
      for (let i = 0; i < rule.patterns.length; i += 1) {
        const pattern = rule.patterns[i];
        const match = blockText.match(pattern);
        if (match) {
          findings.push({
            ruleId: rule.id,
            severity: rule.severity,
            description: rule.description,
            descriptionZh: rule.descriptionZh,
            impacts: rule.impacts || [],
            alternatives: rule.alternatives || [],
            blockIndex,
            match: match[0],
          });
          break;
        }
      }
    });
  });
  return findings;
}

function computeRisk(findings) {
  if (!findings.length) {
    return { level: 'none', score: 0 };
  }
  let maxSeverity = 'low';
  let maxScore = 0;
  findings.forEach((finding) => {
    const score = SEVERITY_ORDER[finding.severity] || 0;
    if (score > maxScore) {
      maxScore = score;
      maxSeverity = finding.severity;
    }
  });
  return { level: maxSeverity, score: maxScore };
}

function analyzeText(text, options = {}) {
  const source = options.source || 'manual';
  const ocrConfidence =
    typeof options.ocrConfidence === 'number' ? options.ocrConfidence : null;

  const trimmed = (text || '').trim();
  if (!trimmed) {
    return {
      source,
      detectedShell: { shell: 'unknown', confidence: 0, scores: {} },
      blocks: [],
      findings: [],
      risk: { level: 'none', score: 0 },
      warningCodes: ['no_input'],
      warnings: ['No input detected.'],
      ocr: { confidence: ocrConfidence, lowConfidence: false },
    };
  }

  const normalized = normalizeCommandText(trimmed);
  const blockTexts = extractBlocks(normalized.cleaned);
  const detectedShell = detectShell(normalized.cleaned);

  const blocks = blockTexts.map((blockText) => ({
    raw: blockText,
    normalized: blockText,
    detectedShell: detectShell(blockText),
  }));

  const findings = evaluateRules(blockTexts);
  const risk = computeRisk(findings);

  const warningCodes = [];
  const warnings = [];
  if (!blockTexts.length) {
    warningCodes.push('no_blocks');
    warnings.push('No command blocks detected.');
  }

  if (source === 'ocr' && ocrConfidence !== null && ocrConfidence < 0.6) {
    warningCodes.push('low_ocr');
    warnings.push('Low OCR confidence. Confirm the command before executing.');
  }

  return {
    source,
    detectedShell,
    blocks,
    findings,
    risk,
    warnings,
    warningCodes,
    ocr: {
      confidence: ocrConfidence,
      lowConfidence: ocrConfidence !== null && ocrConfidence < 0.6,
    },
  };
}

module.exports = {
  analyzeText,
};
