#!/usr/bin/env node
// PTC 전체 부문 영상 추가 (Pista / Escenario / Vals / Milonga / Singles)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const TC = path.join(__dirname, '..', 'data-sources', 'playlists', 'tangocafe.txt');
const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));

const lines = fs.readFileSync(TC, 'utf-8').split('\n').filter(l => l.includes('PTC'));

function parseCategory(title) {
  const t = title.toLowerCase();
  if (/escenario/.test(t)) return 'escenario';
  if (/\bvals\b/.test(t)) return 'vals';
  if (/milonga/.test(t)) return 'milonga';
  if (/singles/.test(t)) return 'pista_singles_general';
  if (/pista/.test(t)) return 'pista';
  return 'pista';
}

function parseStage(title) {
  const t = title.toLowerCase();
  if (/semifinal/.test(t)) return 'semifinal';
  if (/\bfinal\b(?!.*semi)/.test(t)) return 'final';
  if (/quarterfinal|cuartos/.test(t)) return 'quarterfinal';
  if (/qualif|qualification|qualifier|clasif|eliminatoria/.test(t)) return 'qualifying';
  return null;
}

function parseRonda(title) {
  const m = title.match(/ronda\s*(\d+)|ronta\s*(\d+)/i);
  if (m) return parseInt(m[1] || m[2]);
  // 단일 final 등 ronda 없는 경우 1로 간주
  return 1;
}

function parseYear(title) {
  const m = title.match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1]) : 2025;
}

let added = 0, existed = 0;

for (const line of lines) {
  const parts = line.split('|');
  if (parts.length < 2) continue;
  const videoId = parts[0].trim();
  const title = parts.slice(1).join('|').trim();
  if (!videoId) continue;

  const category = parseCategory(title);
  const stage = parseStage(title);
  if (!stage) continue;
  const ronda = parseRonda(title);
  const year = parseYear(title);

  const catCode = category.toUpperCase().replace(/_/g, '-');
  const stageCode = { qualifying: 'Q', semifinal: 'SF', final: 'F', quarterfinal: 'QF' }[stage];
  const round_id = `R-PTC${year}-${catCode}-${stageCode}${String(ronda).padStart(stage === 'qualifying' ? 2 : 1, '0')}`;

  let round = db.rounds.find(r => r.round_id === round_id);
  if (!round) {
    round = {
      round_id,
      competition: 'PTC',
      competition_id: 'COMP-004',
      year,
      category,
      stage,
      ronda_number: ronda,
      songs: [],
      videos: [],
    };
    db.rounds.push(round);
  }
  if (!round.videos.some(v => v.video_id === videoId)) {
    round.videos.push({
      video_id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      channel: 'TangoCafe',
      title,
    });
    added++;
  } else {
    existed++;
  }
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log(`✓ PTC videos added: ${added}, existed: ${existed}`);

// Summary
const ptc = db.rounds.filter(r => r.competition === 'PTC');
const byCat = {};
for (const r of ptc) {
  const k = r.category + '/' + r.stage;
  byCat[k] = (byCat[k] || 0) + 1;
}
console.log('\nPTC 분포:');
for (const [k, v] of Object.entries(byCat).sort()) console.log('  ', k, ':', v);
