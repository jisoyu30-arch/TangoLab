#!/usr/bin/env node
// Thanh Dang 영상 설명에서 곡 리스트 자동 추출 → 각 round.songs 채우기
// 포맷: "Orchestra - Vocalist - Song Title - Year"
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const SONGS = path.join(__dirname, '..', 'src', 'data', 'songs.json');
const CACHE = path.join(__dirname, '..', 'data-sources', 'thanh-dang-descriptions.json');

const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
const songsDb = JSON.parse(fs.readFileSync(SONGS, 'utf-8'));

// 1. Thanh Dang 영상 ID 수집 (round.songs가 비어있거나 <3인 round만)
const targets = [];
for (const r of db.rounds) {
  if (r.songs && r.songs.length >= 3) continue; // 이미 곡 정보 완비
  for (const v of (r.videos || [])) {
    if (v.channel === 'Thanh Dang') {
      targets.push({ videoId: v.video_id, round_id: r.round_id });
    }
  }
}
console.log(`🎯 대상: ${targets.length} 개 Thanh Dang 영상 (곡 미완비 round)`);

// 2. 캐시 로드/업데이트
let cache = {};
if (fs.existsSync(CACHE)) {
  cache = JSON.parse(fs.readFileSync(CACHE, 'utf-8'));
}

// 3. yt-dlp 배치 호출 (캐시 없는 것만)
const uncached = targets.filter(t => !cache[t.videoId]);
console.log(`  캐시됨: ${targets.length - uncached.length} / 새로 fetch: ${uncached.length}`);

const BATCH = 25;
for (let i = 0; i < uncached.length; i += BATCH) {
  const batch = uncached.slice(i, i + BATCH);
  const urls = batch.map(t => `"https://youtu.be/${t.videoId}"`).join(' ');
  try {
    const cmd = `yt-dlp --skip-download --print "###${i}###%(id)s|||%(description)s" ${urls} 2>/dev/null`;
    const out = execSync(cmd, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    // parse: separate by ###N###
    const parts = out.split(/###\d+###/).filter(x => x.trim());
    for (const p of parts) {
      const [id, ...descParts] = p.split('|||');
      if (!id) continue;
      cache[id.trim()] = descParts.join('|||').trim();
    }
    console.log(`  fetched ${Math.min(i + BATCH, uncached.length)}/${uncached.length}`);
  } catch (e) {
    console.warn(`  batch ${i} failed:`, e.message.slice(0, 100));
  }
}

fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2), 'utf-8');

// 4. Description 파싱
function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function findSongId(title, orchHint) {
  const tNorm = normalize(title);
  const oHint = normalize(orchHint || '');
  const hits = songsDb.filter(s => normalize(s.title) === tNorm);
  if (hits.length === 0) {
    // 공백 포함 부분 매칭
    const partial = songsDb.filter(s => normalize(s.title).includes(tNorm) && tNorm.length >= 6);
    if (partial.length === 1) return partial[0].song_id;
  }
  if (hits.length === 1) return hits[0].song_id;
  if (hits.length > 1 && oHint) {
    const byOrch = hits.find(s => normalize(s.orchestra || '').includes(oHint.slice(0, 6)));
    if (byOrch) return byOrch.song_id;
  }
  return hits[0]?.song_id ?? null;
}

function parseDescription(desc) {
  // 포맷: "Orchestra - Vocalist - Title - Year" 또는 "Orchestra - Title - Year" (instrumental)
  const songs = [];
  const lines = desc.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    // 곡 라인 탐지: 하이픈 2~4개 + 끝에 연도 또는 숫자
    const parts = line.split(/\s*-\s*/);
    if (parts.length < 2 || parts.length > 5) continue;
    const last = parts[parts.length - 1];
    const isYear = /^\d{4}$/.test(last.trim());
    if (!isYear && parts.length < 3) continue;

    let orchestra, vocalist = '', title, year;
    if (isYear) {
      year = parseInt(last);
      if (parts.length === 4) {
        [orchestra, vocalist, title] = parts;
      } else if (parts.length === 3) {
        [orchestra, title] = parts;
      } else if (parts.length === 5) {
        // 4명 이상? — orchestra + vocalists
        orchestra = parts[0];
        vocalist = parts.slice(1, -2).join(' / ');
        title = parts[parts.length - 2];
      } else continue;
    } else continue;

    if (!title || !orchestra) continue;
    songs.push({ title: title.trim(), orchestra: orchestra.trim(), vocalist: vocalist.trim(), year });
  }
  return songs;
}

// 5. 각 round에 곡 정보 채우기
let filled = 0, partialFilled = 0, unmatched = 0;
const stats = { matched: 0, unmatched: 0 };

for (const t of targets) {
  const desc = cache[t.videoId];
  if (!desc) continue;
  const parsed = parseDescription(desc);
  if (parsed.length === 0) continue;

  const round = db.rounds.find(r => r.round_id === t.round_id);
  if (!round) continue;
  if (round.songs && round.songs.length >= 3) continue;

  round.songs = parsed.slice(0, 4).map((p, i) => {
    const song_id = findSongId(p.title, p.orchestra);
    if (song_id) stats.matched++;
    else stats.unmatched++;
    const orchFull = p.vocalist ? `${p.orchestra} con ${p.vocalist}` : p.orchestra;
    return {
      song_id: song_id || `UNMATCHED-${p.title.replace(/\s+/g, '_').toUpperCase()}`,
      title: p.title,
      orchestra: orchFull,
      order: i + 1,
      recording_year: p.year,
    };
  });

  if (round.songs.length >= 3) filled++;
  else partialFilled++;
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log(`\n✅ 완료`);
console.log(`  3곡+ 완비 round:`, filled);
console.log(`  2곡 이하 부분:`, partialFilled);
console.log(`  songs.json 매칭:`, stats.matched);
console.log(`  unmatched (새 곡):`, stats.unmatched);
