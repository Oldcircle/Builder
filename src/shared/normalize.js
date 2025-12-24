function stripLineNumber(line) {
  return line.replace(/^\s*\d+\s*[>|:]?\s*/, '');
}

function stripPrompt(line) {
  return line.replace(/^\s*(\$|#|>|PS\s+[^>]*>|[A-Za-z]:\\[^>]*>)\s*/, '');
}

function stripUiNoise(line) {
  return line
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/[\u2500-\u257F]/g, '');
}

function hasContinuation(line) {
  return /[\\`^]\s*$/.test(line);
}

function removeContinuationMarker(line) {
  return line.replace(/[\\`^]\s*$/, '');
}

function shouldSoftJoin(line, nextLine) {
  if (!line || !nextLine) {
    return false;
  }
  const trimmedNext = nextLine.trimLeft();
  if (/^(-{1,2}|\/|\")/.test(trimmedNext)) {
    return /[A-Za-z0-9)\]]$/.test(line.trimRight());
  }
  return false;
}

function mergeContinuations(lines) {
  const merged = [];
  for (let i = 0; i < lines.length; i += 1) {
    let current = lines[i] || '';
    while (hasContinuation(current) && i + 1 < lines.length) {
      current = removeContinuationMarker(current) + lines[i + 1].trimLeft();
      i += 1;
    }

    if (i + 1 < lines.length && shouldSoftJoin(current, lines[i + 1])) {
      current = current.trimRight() + ' ' + lines[i + 1].trimLeft();
      i += 1;
    }

    merged.push(current);
  }
  return merged;
}

function normalizeCommandText(text) {
  if (!text) {
    return { cleaned: '', lines: [] };
  }
  let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  const lines = cleaned.split('\n').map((line) => {
    const withoutLineNo = stripLineNumber(line);
    const withoutPrompt = stripPrompt(withoutLineNo);
    return stripUiNoise(withoutPrompt).trimRight();
  });

  const merged = mergeContinuations(lines).map((line) => line.trimRight());

  return {
    cleaned: merged.join('\n').trim(),
    lines: merged,
  };
}

function extractBlocks(cleanedText) {
  if (!cleanedText) {
    return [];
  }
  const lines = cleanedText.split('\n');
  const blocks = [];
  let buffer = [];

  lines.forEach((line) => {
    if (line.trim() === '') {
      if (buffer.length) {
        blocks.push(buffer.join('\n').trim());
        buffer = [];
      }
      return;
    }
    buffer.push(line);
  });

  if (buffer.length) {
    blocks.push(buffer.join('\n').trim());
  }

  return blocks;
}

module.exports = {
  normalizeCommandText,
  extractBlocks,
};
