import fs from 'fs';
const appPath = 'src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');
content = content.replace(/\bUSER_ID\b/g, "(currentUser?.id || '')");
fs.writeFileSync(appPath, content);
console.log('Replaced USER_ID with currentUser?.id');
