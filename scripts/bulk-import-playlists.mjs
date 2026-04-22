#!/usr/bin/env node
// 기존 재생목록(2017, 2018, 2019, 2021, finals-2010-2024)에서
// Ronda 영상들을 competition_rounds.json에 bulk 추가
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const PLAYLISTS = path.join(__dirname, '..', 'data-sources', 'playlists');
const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));

/** Ronda 번호 + stage 파싱 */
function parseEntry(title) {
  const t = title.toLowerCase();

  // 스테이지 판별
  let stage = null;
  if (/semifinal/.test(t)) stage = 'semifinal';
  else if (/cuartos|quarterfinal/.test(t)) stage = 'quarterfinal';
  else if (/clasificatoria|eliminatoria|preliminar|qualifying/.test(t)) stage = 'qualifying';
  else if (/\bfinal\b|campe(o|ó)n/.test(t)) stage = 'final';
  else return null;

  // 연도
  const yearMatch = title.match(/\b(20\d{2})\b/);
  if (!yearMatch) return null;
  const year = parseInt(yearMatch[1]);

  // Ronda 번호 (다양한 형식)
  let ronda = null;
  const m1 = title.match(/ronda\s*(\d+)/i);
  const m2 = title.match(/round\s*(\d+)/i);
  const m3 = title.match(/\b(primera|segunda|tercera|cuarta|quinta)\b/i);
  const m4 = title.match(/^(\d+)\s+tango|^(\d+)\s+mundial/i);
  const m5 = title.match(/final\s+(\d+)/i);
  const wordMap = { primera: 1, segunda: 2, tercera: 3, 'tercer': 3, cuarta: 4, quinta: 5 };
  if (m1) ronda = parseInt(m1[1]);
  else if (m2) ronda = parseInt(m2[1]);
  else if (m3) ronda = wordMap[m3[1].toLowerCase()];
  else if (m4) ronda = parseInt(m4[1] || m4[2]);
  else if (m5) ronda = parseInt(m5[1]);

  // 노이즈 필터: 챔피언/프리미엄/인터뷰 등
  const noise = /campeones|campeon|premio|premio|entrevista|interview|highlight|top\s*\d|homenaje|show|apertura|cierre|fashion|moda|reflejo|bailaron|baile.*inclu/i;
  if (!ronda && noise.test(title)) return null;

  // day 판별 (clasificatoria 전용) — día 1 / día 2
  let day = null;
  const dayMatch = title.match(/d(?:ía|a|\u00ed?a)\s*(\d)/i);
  if (dayMatch) day = parseInt(dayMatch[1]);

  return { year, stage, ronda, day };
}

function roundIdFor(year, stage, ronda, category = 'pista') {
  const stageCode = { qualifying: 'Q', quarterfinal: 'QF', semifinal: 'SF', final: 'F' }[stage];
  return `R-MUNDIAL${year}-PISTA-${stageCode}${String(ronda).padStart(stage === 'qualifying' ? 2 : 1, '0')}`;
}

function ensureRound(year, stage, ronda, video) {
  const round_id = roundIdFor(year, stage, ronda);
  let round = db.rounds.find(r => r.round_id === round_id);
  if (!round) {
    round = {
      round_id,
      competition: 'Mundial',
      competition_id: 'COMP-001',
      year,
      category: 'pista',
      stage,
      ronda_number: ronda,
      songs: [],
      videos: [],
    };
    db.rounds.push(round);
  }
  if (!round.videos.some(v => v.video_id === video.id)) {
    round.videos.push({
      video_id: video.id,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      channel: video.channel || 'AiresDeMilonga',
      title: video.title,
    });
    return 'added-video';
  }
  return 'exists';
}

const playlistFiles = [
  { file: '2017-mundial.txt', channel: 'AiresDeMilonga' },
  { file: '2018-mundial.txt', channel: 'AiresDeMilonga' },
  { file: '2019-mundial.txt', channel: 'AiresDeMilonga' },
  { file: '2021-mundial.txt', channel: 'AiresDeMilonga' },
  { file: 'finals-2010-2024.txt', channel: 'Mundial Historic' },
  { file: '2024-mundial-curated.txt', channel: 'AiresDeMilonga' },
  { file: '2024-martin-iarussi-curated.txt', channel: 'Martín Iarussi' },
  { file: 'martin-iarussi.txt', channel: 'Martín Iarussi' },
];

const stats = { added: 0, exists: 0, skipped: 0, parsed: 0 };
const skippedSamples = [];

for (const pl of playlistFiles) {
  const fullPath = path.join(PLAYLISTS, pl.file);
  if (!fs.existsSync(fullPath)) continue;
  const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');

  for (const line of lines) {
    if (!line.trim() || line.startsWith('WARNING')) continue;
    const parts = line.split('|');
    if (parts.length < 3) continue;
    const [, videoId, ...titleParts] = parts;
    const title = titleParts.join('|').trim();
    if (!videoId || !title || title === 'NA' || title === '[Private video]') continue;

    const entry = parseEntry(title);
    if (!entry) {
      stats.skipped++;
      if (skippedSamples.length < 8) skippedSamples.push(title);
      continue;
    }
    if (entry.ronda === null || entry.ronda === undefined) {
      stats.skipped++;
      continue;
    }
    stats.parsed++;

    const result = ensureRound(entry.year, entry.stage, entry.ronda, {
      id: videoId.trim(),
      channel: pl.channel,
      title,
    });
    if (result === 'added-video') stats.added++;
    else stats.exists++;
  }
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');

console.log('📊 Bulk import stats:');
console.log('  parsed:', stats.parsed);
console.log('  videos added:', stats.added);
console.log('  already existed:', stats.exists);
console.log('  skipped (non-ronda):', stats.skipped);
console.log('\nSkipped samples:');
for (const s of skippedSamples) console.log('  -', s.slice(0, 80));

// Per-year summary
const byYearStage = {};
for (const r of db.rounds) {
  if (r.competition !== 'Mundial') continue;
  const k = r.year;
  if (!byYearStage[k]) byYearStage[k] = { qualifying: 0, quarterfinal: 0, semifinal: 0, final: 0 };
  byYearStage[k][r.stage] = (byYearStage[k][r.stage] || 0) + 1;
}
console.log('\n📅 Per-year Mundial ronda counts:');
for (const y of Object.keys(byYearStage).sort()) {
  const s = byYearStage[y];
  console.log(`  ${y}: Q=${s.qualifying||0} | QF=${s.quarterfinal||0} | SF=${s.semifinal||0} | F=${s.final||0}`);
}
