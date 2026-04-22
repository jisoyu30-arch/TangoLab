#!/usr/bin/env node
// 2025 Mundial Pista Semifinal 완전체
// - R7, R8, R10 신규 추가 + R2 중복 제거
// - 전체 방송 0PSZ6_vSKto (Jose Valverde, 3h)를 16개 론다 모두에 타임스탬프로 연결
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));

const SEMI_JUDGES = [
  'Moira Castellano', 'Stella Baez', 'Daniel Naccuchio',
  'Dante Sanchez', 'Facundo de la Cruz', 'Jimena Hoeffner',
];

const FULL_BROADCAST = {
  video_id: '0PSZ6_vSKto',
  channel: 'Jose Valverde',
  title_prefix: 'Semifinal Tango Pista Mundial 2025',
};

// 각 ronda → 시작 초
const TIMESTAMPS = {
  1: 0, 2: 770, 3: 1551, 4: 2390, 5: 3226, 6: 4046, 7: 4825, 8: 5661,
  9: 6479, 10: 7300, 11: 8118, 12: 8907, 13: 9652, 14: 10472, 15: 11187, 16: 11911,
};

// 누락된 R7, R8 신규 — AiresDeMilonga 개별 영상 + 곡 정보
const NEW_RONDAS = [
  {
    ronda: 7,
    video: { id: 'EDeYukl46Nk', title: '7 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025' },
    songs: [
      { song_id: 'UNMATCHED-GIME_EL_VIENTO', title: 'Gime el Viento', orchestra: 'Raul Iriarte' },
      { song_id: 'SONG-367', title: 'Mensaje', orchestra: 'Aníbal Troilo' },
      { song_id: 'SONG-004', title: 'Loca', orchestra: "Juan D'Arienzo" },
    ],
  },
  {
    ronda: 8,
    video: { id: 'uwLtnWlCU_U', title: '8 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025' },
    songs: [
      { song_id: 'UNMATCHED-LLUVIA_DE_ABRIL', title: 'Lluvia De Abril', orchestra: 'Miguel Caló' },
      { song_id: 'SONG-395', title: 'La Mentirosa', orchestra: 'Osvaldo Pugliese con Alberto Morán' },
      { song_id: 'SONG-003', title: 'El Flete', orchestra: "Juan D'Arienzo" },
    ],
  },
  {
    ronda: 10,
    video: { id: 'NL65CxSD0_c', title: '10 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025' },
    songs: [], // 곡 정보 추후
  },
];

// Step 1. R2 중복 제거
const r2Dupes = db.rounds.filter(r => r.round_id === 'R-MUNDIAL2025-PISTA-SF2');
if (r2Dupes.length > 1) {
  // 첫 번째만 유지
  const firstIdx = db.rounds.findIndex(r => r.round_id === 'R-MUNDIAL2025-PISTA-SF2');
  db.rounds = db.rounds.filter((r, i) => i === firstIdx || r.round_id !== 'R-MUNDIAL2025-PISTA-SF2');
  console.log('🧹 Dedup SF2:', r2Dupes.length, '→ 1');
}

// Step 2. 신규 Ronda 추가
for (const n of NEW_RONDAS) {
  const round_id = `R-MUNDIAL2025-PISTA-SF${n.ronda}`;
  if (db.rounds.some(r => r.round_id === round_id)) {
    console.log('exists:', round_id);
    continue;
  }
  const videos = [];
  if (n.video) {
    videos.push({
      video_id: n.video.id,
      url: `https://www.youtube.com/watch?v=${n.video.id}`,
      channel: 'AiresDeMilonga',
      title: n.video.title,
    });
  }
  db.rounds.push({
    round_id,
    competition: 'Mundial',
    competition_id: 'COMP-001',
    year: 2025,
    category: 'pista',
    stage: 'semifinal',
    ronda_number: n.ronda,
    songs: n.songs.map((s, i) => ({ ...s, order: i + 1 })),
    videos,
    judges: SEMI_JUDGES,
  });
  console.log('✓ added', round_id);
}

// Step 3. 전체 방송을 모든 16 론다에 타임스탬프 URL로 연결
for (let ronda = 1; ronda <= 16; ronda++) {
  const round_id = `R-MUNDIAL2025-PISTA-SF${ronda}`;
  const round = db.rounds.find(r => r.round_id === round_id);
  if (!round) {
    console.warn('⚠ missing round:', round_id);
    continue;
  }
  round.videos = round.videos || [];
  const start = TIMESTAMPS[ronda];
  if (!round.videos.some(v => v.video_id === FULL_BROADCAST.video_id)) {
    round.videos.push({
      video_id: FULL_BROADCAST.video_id,
      url: `https://www.youtube.com/watch?v=${FULL_BROADCAST.video_id}&t=${start}s`,
      channel: FULL_BROADCAST.channel,
      title: `${FULL_BROADCAST.title_prefix} - Ronda ${ronda} (${Math.floor(start/3600)}:${String(Math.floor(start/60)%60).padStart(2,'0')}:${String(start%60).padStart(2,'0')})`,
      start_sec: start,
    });
    round.judges = round.judges || SEMI_JUDGES;
    console.log(`  +full broadcast → SF${ronda} (@${start}s)`);
  }
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log('✅ saved');

// Sanity
const after = db.rounds.filter(r => r.year===2025 && r.stage==='semifinal').sort((a,b)=>a.ronda_number-b.ronda_number);
console.log('\nFinal semifinal list:', after.map(r => `R${r.ronda_number}(v=${r.videos.length})`).join(' '));
