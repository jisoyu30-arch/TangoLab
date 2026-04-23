#!/usr/bin/env node
// 2차 파싱 — 새 대회/부문/타이틀 포맷 복구
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const CH_FILE = path.join(__dirname, '..', 'data-sources', 'playlists', 'korea-tango-cooperative.txt');

const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
const lines = fs.readFileSync(CH_FILE, 'utf-8').split('\n').filter(Boolean);
const existingIds = new Set();
for (const r of db.rounds) for (const v of (r.videos || [])) existingIds.add(v.video_id);

function getComp(title) {
  if (/Seoul Metropolitan Tango Championship|SMTC/i.test(title)) return { code: 'SMTC', id: 'COMP-007' };
  if (/Korea International Tango Championship|KITC/i.test(title)) return { code: 'KITC', id: 'COMP-008' };
  if (/\bKTC\b|Korea Tango Championship/i.test(title)) return { code: 'KTC', id: 'COMP-005' };
  if (/\bPTC\b|Pacific Tango Championship/i.test(title)) return { code: 'PTC', id: 'COMP-004' };
  return null;
}

function getYear(title) {
  // "KTC 20260302" 같은 날짜도 커버 / "K2024" 오타 커버
  let m = title.match(/\b(20\d{2})\b/);
  if (!m) m = title.match(/(20\d{2})\d{4}/); // YYYYMMDD 형식
  if (!m) m = title.match(/K(20\d{2})/); // K2024 오타
  return m ? parseInt(m[1]) : null;
}

function getCategory(title) {
  const t = title.toLowerCase();
  // "Tango de Fista" = Tango de Pista (오타)
  if (/fista|pista/i.test(t) && !/escenario|esenario|fantasia|free ?style|formation|senior only|vals|milonga/i.test(t)) return 'pista';
  if (/free ?style/i.test(t)) return 'freestyle';
  if (/formation/i.test(t)) return 'formation';
  if (/escenario|esenario/i.test(t)) return 'escenario';
  if (/milonga/i.test(t)) return 'milonga';
  if (/\bvals\b/i.test(t)) {
    if (/senior/i.test(t)) return 'vals_senior';
    return 'vals';
  }
  if (/jack\s*(?:&|and|\s)+\s*jill|jack&jill/i.test(t)) return 'pista_singles_jackandjill';
  if (/new\s*star/i.test(t)) return 'pista_newstar';
  if (/senior/i.test(t)) return 'pista_senior';
  if (/singles/i.test(t)) return 'pista_singles_general';
  return 'pista';
}

function getStage(title) {
  const t = title.toLowerCase();
  if (/semi[\s-]*final|semifinal/i.test(t)) return 'semifinal';
  if (/\bfinal\b|final ronda|final stage/i.test(t)) return 'final';
  if (/preliminar|qualif|qualification|clasif/i.test(t)) return 'qualifying';
  if (/cuartos|quarterfinal/i.test(t)) return 'quarterfinal';
  // "1st Round", "2nd Round" 도 예선으로
  if (/round/i.test(t)) return 'qualifying';
  return null;
}

function getRonda(title) {
  // "Tango Formation 2nd Round 3" → ronda=3, round_num=2
  let m = title.match(/ronda\s*#?\s*(\d+)/i);
  if (m) return parseInt(m[1]);
  m = title.match(/\b(?:round|final|semifinal)\s*#?\s*(\d+)/i);
  if (m) return parseInt(m[1]);
  m = title.match(/\(([\d]+)\)/);
  if (m) return parseInt(m[1]);
  m = title.match(/#(\d+)/);
  if (m) return parseInt(m[1]);
  m = title.match(/(\d+)\s*of\s*\d+/i);
  if (m) return parseInt(m[1]);
  m = title.match(/qualification\s*(\d+)/i);
  if (m) return parseInt(m[1]);
  m = title.match(/stage\s*(\d+)/i);
  if (m) return parseInt(m[1]);
  // "Tango de Pista 5 Ronda 2022" 형식
  m = title.match(/(?:Pista|Senior|Jack&Jill)\s+(?:Final)?\s*(\d+)\s*Ronda/i);
  if (m) return parseInt(m[1]);
  return 1;
}

function skipNoise(title) {
  return /anniversary|gala party|award ceremony|awards ceremony|sketch|encore|birth|paso han|roberto herrera|ceremony$|intro\s*to|milonga do|vietnam|do milonga|performance$|performance\s*#|\bworkshop\b|milonga luminoso|do ronda|year-end|Argentine Tango ,|Daegu|grand party performance|champion.*show|all champions show|special performance|announcement of results/i.test(title);
}

// 괄호 포맷 — "milonga(6)"
function getRondaParens(title) {
  const m = title.match(/\(([\d]+)\)/);
  return m ? parseInt(m[1]) : null;
}

// "X Ronda YYYY" 역포맷
function getRondaReverse(title) {
  const m = title.match(/(\d+)\s+Ronda(?:\s*-?\s*\d{4})?/i);
  return m ? parseInt(m[1]) : null;
}

const stats = { added: 0, skipped: 0, noMatch: 0 };
const rescued = [];

for (const line of lines) {
  const parts = line.split('|');
  if (parts.length < 2) continue;
  const [videoId, ...titleParts] = parts;
  const title = titleParts.join('|').trim();
  if (!videoId || !title) continue;
  if (existingIds.has(videoId.trim())) continue; // 이미 DB에 있음
  if (skipNoise(title)) { stats.skipped++; continue; }

  const comp = getComp(title);
  if (!comp) { stats.noMatch++; continue; }
  const year = getYear(title);
  if (!year) { stats.noMatch++; continue; }
  const category = getCategory(title);
  let stage = getStage(title);
  // SMTC/KITC는 보통 괄호 숫자 = 예선 ronda 번호
  if (!stage && (comp.code === 'SMTC' || comp.code === 'KITC') && /\(\d+\)/.test(title)) {
    stage = 'qualifying';
  }
  if (!stage) { stats.noMatch++; continue; }
  const ronda = getRonda(title);

  const catCode = category.toUpperCase().replace(/_/g, '-');
  const stageCode = { qualifying: 'Q', semifinal: 'SF', final: 'F', quarterfinal: 'QF' }[stage];
  const round_id = `R-${comp.code}${year}-${catCode}-${stageCode}${ronda}`;

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
    db.rounds.push(round);
  }
  if (!round.videos.some(v => v.video_id === videoId.trim())) {
    round.videos.push({
      video_id: videoId.trim(),
      url: `https://www.youtube.com/watch?v=${videoId.trim()}`,
      channel: 'Korea Tango Cooperative',
      title,
    });
    stats.added++;
    rescued.push({ videoId: videoId.trim(), round_id, title });
  }
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log(`✓ 복구 ${stats.added}개, 노이즈 skip ${stats.skipped}, still nomatch ${stats.noMatch}`);
console.log('\n새로 추가된 대회 (샘플):');
for (const r of rescued.slice(0, 20)) console.log(' ', r.round_id, '|', r.title.slice(0, 70));
