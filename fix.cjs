const fs = require('fs');
let content = fs.readFileSync('src/pages/AIEnginePage.tsx', 'utf8');
content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('src/pages/AIEnginePage.tsx', content);
console.log('Fixed file');
