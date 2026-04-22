#!/usr/bin/env node
// 2025 Mundial Pista Final에 Ronda 2~5를 추가하고 확인된 영상 링크를 연결
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');

const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
const rounds = db.rounds;

// 기존 F1에 rankings 있는지 확인
const existing = rounds.filter(r => r.round_id?.startsWith('R-MUNDIAL2025-PISTA-F'));
console.log('Before:', existing.map(r => r.round_id));

// 결승 7명 심사위원
const FINAL_JUDGES = [
  'Javier Rodriguez', 'Aoniken Quiroga', 'Cristina Sosa',
  'Paola Tacceti', 'Diego Gauna', 'Roxana Suarez', 'Cristian Marquez',
];

// 확인된 영상 (Final Ronda 2)
const VIDEOS_BY_RONDA = {
  2: [{
    video_id: 'aSdv8UksKDk',
    url: 'https://www.youtube.com/watch?v=aSdv8UksKDk',
    channel: '밀롱가',
    title: 'Mira estA increíble RONDA 1 DE FINAL TANGO MUNDIAL PISTA',
  }],
};

// R2~R5 추가
for (const ronda of [2, 3, 4, 5]) {
  const round_id = `R-MUNDIAL2025-PISTA-F${ronda}`;
  if (rounds.some(r => r.round_id === round_id)) {
    console.log('skip existing', round_id);
    continue;
  }
  rounds.push({
    round_id,
    competition: 'Mundial',
    competition_id: 'COMP-001',
    year: 2025,
    category: 'pista',
    stage: 'final',
    ronda_number: ronda,
    songs: [],
    videos: VIDEOS_BY_RONDA[ronda] ?? [],
    rankings: [], // 결승은 종합 순위이고 론다별 순위는 없음
    judges: FINAL_JUDGES,
  });
  console.log('added', round_id, 'videos=' + (VIDEOS_BY_RONDA[ronda]?.length ?? 0));
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log('\n✅ Wrote', DATA);
const after = rounds.filter(r => r.round_id?.startsWith('R-MUNDIAL2025-PISTA-F'));
console.log('After:', after.map(r => `${r.round_id}(v=${r.videos.length})`));
