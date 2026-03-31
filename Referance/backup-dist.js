const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const backupDir = path.join(distDir, 'backup');

if (!fs.existsSync(distDir)) {
  console.log('[backup] dist/ 없음 — 건너뜀');
  process.exit(0);
}

// dist/ 내 exe 파일 찾기
const exeFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.exe') && f !== 'backup');

if (exeFiles.length === 0) {
  console.log('[backup] exe 파일 없음 — 건너뜀');
  process.exit(0);
}

fs.mkdirSync(backupDir, { recursive: true });

let count = 0;
for (const file of exeFiles) {
  const src = path.join(distDir, file);
  const dest = path.join(backupDir, file);
  fs.copyFileSync(src, dest);
  console.log(`[backup] ${file} → backup/${file}`);
  count++;
}

console.log(`[backup] ${count}개 exe 백업 완료`);
