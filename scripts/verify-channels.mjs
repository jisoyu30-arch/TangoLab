#!/usr/bin/env node
// AiresDeMilonga 라벨된 영상의 실제 채널 일괄 검증 및 수정
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const CACHE = path.join(__dirname, '..', 'data-sources', 'channel-verify-cache.json');

const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
let cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf-8')) : {};

// Thanh Dang 스타일 제목 패턴 (음악 플레이리스트)
const MUSIC_TITLE = /\b(Final|Semi Final|Semifinal|Cuartos|Clasificatoria|Preliminar) - Ronda\b|^\d+ (Final|Semi|Cuartos|Clasificatoria) Ronda/i;

// 의심 영상 추출: AiresDeMilonga 라벨 + 음악 스타일 제목 or 2022/2023 Final
const suspects = [];
for (const r of db.rounds) {
  for (const v of (r.videos || [])) {
    if (v.channel === 'AiresDeMilonga' && MUSIC_TITLE.test(v.title || '')) {
      suspects.push({ videoId: v.video_id, round: r.round_id, currentChannel: v.channel, title: v.title });
    }
  }
}
console.log(`의심 영상: ${suspects.length}개`);

const uncached = suspects.filter(s => !cache[s.videoId]);
console.log(`  캐시됨: ${suspects.length - uncached.length} / 조회 필요: ${uncached.length}`);

const BATCH = 30;
for (let i = 0; i < uncached.length; i += BATCH) {
  const batch = uncached.slice(i, i + BATCH);
  const urls = batch.map(s => `"https://youtu.be/${s.videoId}"`).join(' ');
  try {
    const ytdlp = 'C:/Users/njell/AppData/Local/Programs/Python/Python313/Scripts/yt-dlp.exe';
    const cmd = `"${ytdlp}" --skip-download --print "###ENTRY###%(id)s|||%(channel)s" ${urls}`;
    const out = execSync(cmd, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, shell: 'bash' });
    const entries = out.split('###ENTRY###').filter(x => x.trim());
    for (const e of entries) {
      const [id, ch] = e.split('|||');
      if (id && ch) cache[id.trim()] = ch.trim();
    }
    console.log(`  fetched ${Math.min(i + BATCH, uncached.length)}/${uncached.length}`);
  } catch (err) {
    console.warn(`batch ${i} 실패:`, String(err).slice(0, 80));
  }
}

fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2), 'utf-8');

// 실제 채널로 교체
let changed = 0, unchanged = 0;
for (const r of db.rounds) {
  for (const v of (r.videos || [])) {
    if (cache[v.video_id] && cache[v.video_id] !== v.channel) {
      v.channel = cache[v.video_id];
      changed++;
    } else {
      unchanged++;
    }
  }
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log(`\n✓ 채널 수정: ${changed}개`);
console.log(`  유지: ${unchanged}`);

// 최종 채널 분포
const byCh = {};
for (const r of db.rounds) for (const v of (r.videos || [])) byCh[v.channel] = (byCh[v.channel] || 0) + 1;
console.log('\n📊 최종 채널 분포:');
for (const [k, n] of Object.entries(byCh).sort((a, b) => b[1] - a[1])) console.log('  ', k.padEnd(30), n);
