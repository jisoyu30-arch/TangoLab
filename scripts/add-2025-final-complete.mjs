#!/usr/bin/env node
// 2025 Mundial Pista 결승 전체 영상 + 각 Ronda 곡 + 타임스탬프 추가
// 소스: Jose Valverde 채널 YnYEyMzEfag 전체 방송
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const SONGS = path.join(__dirname, '..', 'src', 'data', 'songs.json');

const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
const songsDb = JSON.parse(fs.readFileSync(SONGS, 'utf-8'));

const FULL_VIDEO = 'YnYEyMzEfag';
const CHANNEL = 'Jose Valverde';

// 각 Ronda별 곡 + 타임스탬프 (sec)
const RONDAS = {
  1: {
    start: 34 * 60 + 38,
    songs: [
      { title: 'Duelo Criollo', orchestra: 'Carlos Di Sarli', vocalist: 'Jorge Durán' },
      { title: 'Bailemos', orchestra: 'Carlos Di Sarli', vocalist: 'Roberto Florio' }, // 실제로는 Floreal Ruiz, but app has Florio
      { title: 'El Marne', orchestra: "Juan D'Arienzo" },
    ],
  },
  2: {
    start: 48 * 60 + 6,
    songs: [
      { title: 'La Abandoné y No Sabía', orchestra: 'Miguel Caló', vocalist: 'Raúl Berón' },
      { title: 'Cantemos Corazón', orchestra: 'Carlos Di Sarli', vocalist: 'Roberto Florio' },
      { title: 'Jueves', orchestra: "Juan D'Arienzo" },
    ],
  },
  3: {
    start: 62 * 60 + 8,
    songs: [
      { title: 'Qué Te Importa Que Te Llore', orchestra: 'Miguel Caló', vocalist: 'Raúl Berón' },
      { title: 'Yunta de Oro', orchestra: 'Osvaldo Pugliese' },
      { title: 'Sentimiento Gaucho', orchestra: "Juan D'Arienzo", vocalist: 'Osvaldo Ramos' },
    ],
  },
  4: {
    start: 76 * 60 + 20,
    songs: [
      { title: 'A las Siete en el Café', orchestra: 'Miguel Caló', vocalist: 'Alberto Podestá' }, // "Ortiz"일 수도
      { title: 'Melancólico', orchestra: 'Aníbal Troilo' },
      { title: 'No Me Extraña', orchestra: 'Pedro Laurenz', vocalist: 'Juan Carlos Casas' },
    ],
  },
  5: {
    start: 91 * 60 + 5,
    songs: [
      { title: 'Café Domínguez', orchestra: "Ángel D'Agostino" },
      { title: 'Esta Noche de Luna', orchestra: 'Osvaldo Pugliese', vocalist: 'Jorge Maciel' },
      { title: 'Suma y Sigue', orchestra: "Juan D'Arienzo", vocalist: 'Alberto Rey' },
    ],
  },
};

// 각 Ronda의 출전 parejas (mundial_participants_2025에서 이미 있음)
const participants2025 = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'mundial_participants_2025.json'), 'utf-8')
);
const finalByRonda = {};
for (const c of participants2025.stages.final.couples) {
  if (!finalByRonda[c.ronda]) finalByRonda[c.ronda] = [];
  finalByRonda[c.ronda].push(c);
}

// 곡 매칭 유틸 (fuzzy)
function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}
function findSongId(title, orchestra) {
  const tNorm = normalize(title);
  const oNorm = normalize(orchestra || '');
  const hits = songsDb.filter(s => normalize(s.title) === tNorm);
  if (hits.length === 0) return null;
  if (hits.length === 1) return hits[0].song_id;
  // 복수 — orchestra로 좁히기
  const byOrch = hits.find(s => normalize(s.orchestra || '').includes(oNorm.slice(0, 6)));
  return byOrch?.song_id ?? hits[0].song_id;
}

let matchStats = { found: 0, missing: [] };

// 각 Ronda 업데이트
for (const [rondaStr, info] of Object.entries(RONDAS)) {
  const ronda = Number(rondaStr);
  const round_id = `R-MUNDIAL2025-PISTA-F${ronda}`;
  const round = db.rounds.find(r => r.round_id === round_id);
  if (!round) {
    console.error('❌ Not found:', round_id);
    continue;
  }

  // 곡 매칭
  const songs = info.songs.map((s, i) => {
    const song_id = findSongId(s.title, s.orchestra);
    if (song_id) matchStats.found++;
    else matchStats.missing.push({ ronda, title: s.title, orchestra: s.orchestra });
    return {
      song_id: song_id || `UNMATCHED-${s.title.replace(/\s+/g, '_').toUpperCase()}`,
      title: s.title,
      orchestra: s.orchestra + (s.vocalist ? ` con ${s.vocalist}` : ''),
      order: i + 1,
    };
  });
  round.songs = songs;

  // 영상 추가 (중복 스킵)
  const videoEntry = {
    video_id: FULL_VIDEO,
    url: `https://www.youtube.com/watch?v=${FULL_VIDEO}&t=${info.start}s`,
    channel: CHANNEL,
    title: `Final Mundial de Tango Pista 2025 - Ronda ${ronda} (전체 영상 타임스탬프)`,
    start_sec: info.start,
  };
  round.videos = round.videos || [];
  if (!round.videos.some(v => v.video_id === FULL_VIDEO)) {
    round.videos.push(videoEntry);
  }

  // 참가자도 추가 (기존에 없으면)
  const parejas = finalByRonda[ronda] || [];
  round.participants = parejas.map(c => ({
    pareja: c.pareja,
    leader: c.leader,
    follower: c.follower,
    rank: c.rank,
    promedio: c.promedio,
  }));

  console.log(`✓ F${ronda}: songs=${songs.length} videos=${round.videos.length} parejas=${round.participants.length}`);
}

// 결승 전체 rankings도 입력 (상위 5명)
const f1 = db.rounds.find(r => r.round_id === 'R-MUNDIAL2025-PISTA-F1');
if (f1) {
  f1.rankings = [
    { rank: 1, leader: 'Diego Ortega', follower: 'Aldana Silveyra', promedio: 9.826 },
    { rank: 2, leader: 'Lucas Gauto', follower: 'Naima Gerasopoulou', promedio: 9.604 },
    { rank: 3, leader: 'Juan David Vargas', follower: 'Ornella Simonetto', promedio: 9.541 },
    { rank: 4, leader: 'Erik Deslarmes', follower: 'Nadia Aguilar', promedio: 9.539 },
    { rank: 5, leader: 'Juan Ignacio Braida', follower: 'Natasha Kaliszuk Lee', promedio: 9.494 },
  ];
  console.log('✓ Rankings (top 5) added to F1');
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log(`\n✅ Matched songs: ${matchStats.found}/15`);
console.log('Missing:', matchStats.missing);
