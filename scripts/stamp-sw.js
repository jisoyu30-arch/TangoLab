// 빌드 후 Service Worker 에 BUILD_ID 주입 — 매 배포마다 캐시 무효화
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const BUILD_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const swSrc = resolve(root, 'public/sw.js');
const swDist = resolve(root, 'dist/sw.js');

try {
  // dist/sw.js 가 없으면 public 에서 복사
  copyFileSync(swSrc, swDist);
} catch (e) {
  // 이미 vite가 복사했으면 무시
}

const content = readFileSync(swDist, 'utf-8');
const stamped = content.replace(/__BUILD_ID__/g, BUILD_ID);
writeFileSync(swDist, stamped, 'utf-8');

console.log(`[sw] stamped BUILD_ID = ${BUILD_ID}`);
