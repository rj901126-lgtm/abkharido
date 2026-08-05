const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedFiles = 0;

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Fix start of line comments
    content = content.replace(/^([ \t]*)\/ (.*)$/gm, '$1// $2');
    
    // Fix comments immediately after a semicolon
    content = content.replace(/(;[ \t]*)\/ (.*)$/gm, '$1// $2');

    // Fix comments immediately after a comma
    content = content.replace(/(,[ \t]*)\/ (.*)$/gm, '$1// $2');

    // Fix comments like ` / eslint-disable-next-line`
    content = content.replace(/([ \t]+)\/ (eslint-disable.*)$/gm, '$1// $2');

    // Edge cases explicitly found in errors:
    // ` / ──`
    content = content.replace(/([ \t]+)\/ (──.*)$/gm, '$1// $2');
    
    // ` / ---`
    content = content.replace(/([ \t]+)\/ (---.*)$/gm, '$1// $2');

    // ` / 'overview'`
    content = content.replace(/([ \t]+)\/ ('overview'.*)$/gm, '$1// $2');

    // ` / 'analytics'`
    content = content.replace(/([ \t]+)\/ ('analytics'.*)$/gm, '$1// $2');
    
    // ` / 1: Address` (After parenthesis from useState)
    content = content.replace(/(\)[ \t]*)\/ (1: Address.*)$/gm, '$1// $2');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFiles++;
      console.log('Fixed:', filePath);
    }
  }
});

console.log(`Fixed ${modifiedFiles} files.`);
