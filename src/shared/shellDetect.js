const SHELL_SIGNALS = {
  powershell: [
    { regex: /\bInvoke-Expression\b/i, weight: 3 },
    { regex: /\bIEX\b/i, weight: 3 },
    { regex: /\$env:/i, weight: 2 },
    { regex: /\bSet-Item\b/i, weight: 1 },
    { regex: /\bNew-Item\b/i, weight: 1 },
    { regex: /`\s*$/m, weight: 1 },
    { regex: /\bPowerShell\b/i, weight: 2 },
  ],
  cmd: [
    { regex: /\b(del|rmdir|copy|xcopy|type)\b/i, weight: 2 },
    { regex: /%[A-Za-z0-9_]+%/, weight: 2 },
    { regex: /\^\s*$/m, weight: 1 },
    { regex: /\bcmd\.exe\b/i, weight: 2 },
    { regex: /&&/i, weight: 1 },
  ],
  bash: [
    { regex: /\b(export|sudo|apt|yum|brew)\b/i, weight: 2 },
    { regex: /\b(curl|wget)\b/i, weight: 2 },
    { regex: /\$\([^\n]+\)/, weight: 1 },
    { regex: /\/bin\/(bash|sh)\b/i, weight: 2 },
    { regex: /\\\s*$/m, weight: 1 },
    { regex: /\bchmod\b/i, weight: 1 },
  ],
};

function detectShell(text) {
  const scores = {
    powershell: 0,
    cmd: 0,
    bash: 0,
  };

  const hits = {
    powershell: [],
    cmd: [],
    bash: [],
  };

  Object.keys(SHELL_SIGNALS).forEach((shell) => {
    SHELL_SIGNALS[shell].forEach((signal) => {
      if (signal.regex.test(text)) {
        scores[shell] += signal.weight;
        hits[shell].push(signal.regex.source);
      }
    });
  });

  let bestShell = 'unknown';
  let bestScore = 0;
  let totalScore = 0;

  Object.values(scores).forEach((value) => {
    totalScore += value;
  });

  Object.keys(scores).forEach((shell) => {
    if (scores[shell] > bestScore) {
      bestScore = scores[shell];
      bestShell = shell;
    }
  });

  const confidence = totalScore > 0 ? bestScore / totalScore : 0;

  return {
    shell: bestShell,
    scores,
    hits,
    confidence,
  };
}

module.exports = {
  detectShell,
};
