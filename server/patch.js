const fs = require('fs');

// Minimal unified diff applier (no context fuzz). Expects lines starting with ---/+++ then @@ hunks.
function applyUnifiedDiff(original, patchText) {
  const lines = patchText.split(/\r?\n/);
  const output = [];
  const origLines = original.split(/\r?\n/);
  let origIndex = 0;
  let i = 0;

  // Skip header lines
  while (i < lines.length && (lines[i].startsWith('---') || lines[i].startsWith('+++'))) {
    i++;
  }

  while (i < lines.length) {
    const header = lines[i++];
    const match = header.match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
    if (!match) break;
    const startOld = parseInt(match[1], 10);
    // const lenOld = parseInt(match[2] || '1', 10);
    const startNew = parseInt(match[3], 10);
    // const lenNew = parseInt(match[4] || '1', 10);

    // Push unchanged lines before hunk
    while (origIndex < startOld - 1) {
      output.push(origLines[origIndex++] || '');
    }

    // Apply hunk
    while (i < lines.length) {
      const line = lines[i];
      if (line.startsWith('@@')) break;
      if (line.startsWith('-')) {
        origIndex++;
      } else if (line.startsWith('+')) {
        output.push(line.slice(1));
      } else if (line.startsWith(' ')) {
        output.push(line.slice(1));
        origIndex++;
      }
      i++;
    }
  }

  // Append remaining original lines
  while (origIndex < origLines.length) {
    output.push(origLines[origIndex++] || '');
  }

  return output.join('\n');
}

function applyPatchFile(targetPath, patchText) {
  const original = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf-8') : '';
  const updated = applyUnifiedDiff(original, patchText);
  fs.writeFileSync(targetPath, updated, 'utf-8');
  return { updated };
}

module.exports = {
  applyUnifiedDiff,
  applyPatchFile,
};
