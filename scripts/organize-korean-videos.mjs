#!/usr/bin/env node
// Korea Tango Cooperative 채널 전체 331개 한국대회 영상 체계적 정리
// 제목 패턴 파싱 → 연도·부문·스테이지·ronda 추출 → competition_rounds.json에 추가
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const CH_FILE = path.join(__dirname, '..', 'data-sources', 'playlists', 'korea-tango-cooperative.txt');

const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
const lines = fs.readFileSync(CH_FILE, 'utf-8').split('\n').filter(Boolean);

// 대회 판별
function getCompetition(title) {
  if (/\bKTC\b|Korea Tango Championship/i.test(title)) return { code: 'KTC', id: 'COMP-005' };
  if (/\bPTC\b|Pacific Tango Championship/i.test(title)) return { code: 'PTC', id: 'COMP-004' };
  return null;
}

// 연도 추출
function getYear(title) {
  const m = title.match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1]) : null;
}

// 부문 (카테고리) 판별
function getCategory(title) {
  const t = title.toLowerCase();
  if (/escenario|esenario/i.test(t)) return 'escenario';
  if (/milonga/i.test(t) && !/tango social/i.test(t)) return 'milonga';
  if (/\bvals\b/i.test(t) && !/tango social/i.test(t)) {
    if (/senior/i.test(t)) return 'vals_senior';
    return 'vals';
  }
  if (/jack\s*(?:&|and|\s)*\s*jill|jack&jill/i.test(t)) return 'pista_singles_jackandjill';
  if (/singles?\s*new\s*star/i.test(t)) return 'pista_singles_newstar';
  if (/singles?\s*senior/i.test(t)) return 'pista_singles_senior';
  if (/singles?\s*general|singles\b/i.test(t)) return 'pista_singles_general';
  if (/new\s*star/i.test(t)) return 'pista_newstar';
  if (/senior.*(tango|pista)|senior\s+(vals|milonga)|senior\s+final/i.test(t)) {
    if (/vals/i.test(t)) return 'vals_senior';
    if (/milonga/i.test(t)) return 'milonga_senior';
    return 'pista_senior';
  }
  if (/fantasia/i.test(t)) return 'fantasia';
  if (/tango social/i.test(t)) {
    if (/senior/i.test(t)) return 'social_senior';
    if (/new\s*star/i.test(t)) return 'social_newstar';
    if (/general/i.test(t)) return 'social_general';
    return 'social';
  }
  if (/pista|tango de pista/i.test(t)) return 'pista';
  if (/gala\s*party|show|special/i.test(t)) return 'gala';
  return null;
}

// 스테이지
function getStage(title) {
  const t = title.toLowerCase();
  if (/semi[\s-]*final|semifinal/i.test(t)) return 'semifinal';
  if (/\bfinal\b/i.test(t)) return 'final';
  if (/preliminar|qualif|clasif|qualification/i.test(t)) return 'qualifying';
  if (/cuartos|quarterfinal/i.test(t)) return 'quarterfinal';
  return null;
}

// Ronda 번호
function getRonda(title) {
  // "Ronda 3", "R3", "#3", "3 of 3"
  let m = title.match(/ronda\s*#?\s*(\d+)/i);
  if (m) return parseInt(m[1]);
  m = title.match(/\b(?:round|semi[\s-]*final|final)\s*(?:ronda|round|r)?\s*#?\s*(\d+)/i);
  if (m) return parseInt(m[1]);
  m = title.match(/#(\d+)/);
  if (m) return parseInt(m[1]);
  m = title.match(/(\d+)\s*of\s*\d+/i);
  if (m) return parseInt(m[1]);
  m = title.match(/qualification\s*(\d+)/i);
  if (m) return parseInt(m[1]);
  return 1; // 기본값
}

// Group (A/B/C/D) 판별
function getGroup(title) {
  // "Semi Final A", "Semifinal K", "Pista A", "Pista de K (Final Ronda 2)"
  const m = title.match(/(?:semi[\s-]*final|preliminaries?|pista|de pista|final)\s+([A-K])\b/i);
  if (m) return m[1].toUpperCase();
  return null;
}

// 타이틀 노이즈 필터
function shouldSkip(title) {
  return /gala party|intro|교육|수업|lesson|class|tutorial|인터뷰|interview|시상|ceremony|Award|준비|대기|Rehearsal|Practice|연습|쇼|Show(?!case)|Social Dancing|파티|Party(?!cipation)|Encore|Celebration/i.test(title);
}

// 파싱 + 추가
const stats = { added: 0, existed: 0, skipped: 0, noMatch: 0 };
const processed = [];

for (const line of lines) {
  const parts = line.split('|');
  if (parts.length < 2) continue;
  const [videoId, ...titleParts] = parts;
  const title = titleParts.join('|').trim();
  if (!videoId || !title) continue;

  const comp = getCompetition(title);
  if (!comp) { stats.noMatch++; continue; }
  if (shouldSkip(title)) { stats.skipped++; continue; }

  const year = getYear(title);
  const category = getCategory(title);
  const stage = getStage(title);
  const ronda = getRonda(title);

  if (!year || !category || !stage) { stats.noMatch++; continue; }

  const catCode = category.toUpperCase().replace(/_/g, '-');
  const stageCode = { qualifying: 'Q', semifinal: 'SF', final: 'F', quarterfinal: 'QF' }[stage];
  const group = getGroup(title);
  const groupSuffix = group ? `-${group}` : '';
  const round_id = `R-${comp.code}${year}-${catCode}-${stageCode}${ronda}${groupSuffix}`;

  let round = db.rounds.find(r => r.round_id === round_id);
  if (!round) {
    round = {
      round_id,
      competition: comp.code,
      competition_id: comp.id,
      year, category, stage,
      ronda_number: ronda,
      songs: [],
      videos: [],
    };
    if (group) round.group = group;
    db.rounds.push(round);
  }

  if (!round.videos.some(v => v.video_id === videoId)) {
    round.videos.push({
      video_id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      channel: 'Korea Tango Cooperative',
      title,
    });
    stats.added++;
    processed.push({ videoId, round_id, title });
  } else {
    stats.existed++;
  }
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log('📊 Korean 대회 영상 체계 정리 결과:');
console.log(`  ✓ 추가: ${stats.added}`);
console.log(`  · 이미 있음: ${stats.existed}`);
console.log(`  ⏭ 노이즈 스킵: ${stats.skipped}`);
console.log(`  ⚠ 파싱 실패: ${stats.noMatch}`);

// 연도별 × 부문 집계
const ktc = db.rounds.filter(r => r.competition === 'KTC');
const ptc = db.rounds.filter(r => r.competition === 'PTC');
console.log('\n📅 대회별 rounds (영상 있는 것만):');
const summary = {};
for (const r of [...ktc, ...ptc]) {
  if (!r.videos || r.videos.length === 0) continue;
  const k = `${r.competition}-${r.year}`;
  if (!summary[k]) summary[k] = {};
  const c = r.category;
  if (!summary[k][c]) summary[k][c] = { q: 0, sf: 0, f: 0 };
  if (r.stage === 'qualifying') summary[k][c].q++;
  else if (r.stage === 'semifinal') summary[k][c].sf++;
  else if (r.stage === 'final') summary[k][c].f++;
}
for (const [k, cats] of Object.entries(summary).sort()) {
  console.log(`  ${k}:`);
  for (const [c, s] of Object.entries(cats)) {
    console.log(`    ${c.padEnd(28)} Q=${s.q} SF=${s.sf} F=${s.f}`);
  }
}
