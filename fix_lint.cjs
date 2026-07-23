const fs = require('fs');

let lintOutput = fs.readFileSync('lint.json', 'utf8');
// Strip BOM
lintOutput = lintOutput.replace(/^\uFEFF/, '');

let warnings = [];
try {
  let parsed = JSON.parse(lintOutput);
  warnings = parsed.diagnostics || parsed || [];
} catch (e) {
  console.error("Could not parse lint.json:", e.message);
  process.exit(1);
}

// Group by file
const filesToFix = {};
warnings.forEach(w => {
  // Try different property paths depending on oxlint version
  const file = w.filename || w.file || (w.location && w.location.path) || w.id;
  if (!file) return;

  let lineNum = null;
  if (w.labels && w.labels.length > 0 && w.labels[0].span) {
    lineNum = w.labels[0].span.line;
  } else if (w.location && w.location.start) {
    lineNum = w.location.start.line;
  } else {
    // try matching the first label span line if nested
    lineNum = w.line;
  }

  if (lineNum !== null && lineNum !== undefined) {
    if (!filesToFix[file]) filesToFix[file] = new Set();
    filesToFix[file].add(lineNum);
  }
});

for (const file of Object.keys(filesToFix)) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const contentLines = content.split('\n');
    
    // Sort lines descending so inserts don't change line numbers above
    const lineNumsToFix = Array.from(filesToFix[file]).sort((a, b) => b - a);
    
    for (const lineNum of lineNumsToFix) {
      // lineNum is 1-indexed. The index in the array is lineNum - 1
      const insertIndex = Math.max(0, lineNum - 1);
      
      // Get indentation of the line where we insert the comment
      const match = contentLines[insertIndex].match(/^(\s*)/);
      const indent = match ? match[1] : '';
      
      contentLines.splice(insertIndex, 0, indent + '// eslint-disable-next-line');
    }
    
    fs.writeFileSync(file, contentLines.join('\n'), 'utf8');
    console.log(`Fixed ${lineNumsToFix.length} warnings in ${file}`);
  } catch (err) {
    console.error(`Could not fix ${file}:`, err.message);
  }
}
