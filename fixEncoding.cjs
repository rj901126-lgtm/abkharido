const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        processDirectory(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      // Read the file as a buffer
      const buffer = fs.readFileSync(fullPath);
      // Check for UTF-16 LE BOM (FF FE)
      if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        console.log('Converting UTF-16 file:', fullPath);
        // Read as UTF-16LE, excluding the BOM
        const content = buffer.toString('utf16le', 2);
        // Write back as UTF-8
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

processDirectory(path.join(__dirname, 'server'));
processDirectory(path.join(__dirname, 'src'));
console.log('Conversion complete.');
