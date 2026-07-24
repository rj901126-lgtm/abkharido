const fs = require('fs');
const path = require('path');

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile()) {
      callback(filepath);
    }
  }
}

walkSync('src', (filepath) => {
  if (filepath.endsWith('.jsx') || filepath.endsWith('.js')) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Replace incorrectly closed template literals
    // fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/path', {
    // to
    // fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/path`, {
    
    let original = content;
    // For calls with options
    content = content.replace(/(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| ''\}\/api\/[^']*)',/g, '$1`,');
    // For calls without options
    content = content.replace(/(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| ''\}\/api\/[^']*)'\)/g, '$1`)');
    
    // Also handle non-api routes just in case
    content = content.replace(/(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| ''\}\/[^']*)',/g, '$1`,');
    content = content.replace(/(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| ''\}\/[^']*)'\)/g, '$1`)');

    if (content !== original) {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`Fixed syntax in ${filepath}`);
    }
  }
});
