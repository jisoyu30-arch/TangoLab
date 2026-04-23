#!/usr/bin/env node
// 파싱 실패한 영상 분석
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const CH_FILE = path.join(__dirname, '..', 'data-sources', 'playlists', 'korea-tango-cooperative.txt');

const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
const lines = fs.readFileSync(CH_FILE, 'utf-8').split('\n').filter(Boolean);

// 이미 DB에 들어있는 video_id 수집
const existingIds = new Set();
for (const r of db.rounds) for (const v of (r.videos || [])) existingIds.add(v.video_id);

// 채널에서 DB에 없는 영상 찾기
const unparsed = [];
for (const line of lines) {
  const parts = line.split('|');
  if (parts.length < 2) continue;
  const [videoId, ...titleParts] = parts;
  const title = titleParts.join('|').trim();
  if (!videoId || !title) continue;
  if (existingIds.has(videoId.trim())) continue;
  unparsed.push({ videoId: videoId.trim(), title });
}

// 카테고리 분류
const buckets = {
  ktc: [],
  ptc: [],
  show: [],
  lesson: [],
  other: [],
};
for (const u of unparsed) {
  const t = u.title.toLowerCase();
  if (/gala party|교육|수업|lesson|class|tutorial|milonga do|do milonga|year-end|performance|show|대구|vietnam|seoul milonga/i.test(t)) {
    if (/gala|show|performance/i.test(t)) buckets.show.push(u);
    else if (/lesson|class|tutorial|수업/i.test(t)) buckets.lesson.push(u);
    else buckets.other.push(u);
  } else if (/ktc|korea tango championship/i.test(t)) {
    buckets.ktc.push(u);
  } else if (/ptc|pacific tango championship/i.test(t)) {
    buckets.ptc.push(u);
  } else {
    buckets.other.push(u);
  }
}

console.log('📊 파싱 실패 영상 분류:');
console.log('  KTC:', buckets.ktc.length);
console.log('  PTC:', buckets.ptc.length);
console.log('  쇼/갈라:', buckets.show.length);
console.log('  레슨/수업:', buckets.lesson.length);
console.log('  기타:', buckets.other.length);
console.log('  합계:', unparsed.length);

console.log('\n=== KTC 실패 ===');
for (const u of buckets.ktc.slice(0, 30)) console.log(' ', u.videoId, '|', u.title.slice(0, 80));

console.log('\n=== PTC 실패 ===');
for (const u of buckets.ptc.slice(0, 30)) console.log(' ', u.videoId, '|', u.title.slice(0, 80));

console.log('\n=== 기타 실패 (앞 20개) ===');
for (const u of buckets.other.slice(0, 20)) console.log(' ', u.videoId, '|', u.title.slice(0, 80));
