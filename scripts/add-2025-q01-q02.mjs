#!/usr/bin/env node
// 2025 Mundial Qualifying Ronda 1, 2 (Day 1 / 8/23) 추가
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));

const QUAL_JUDGES_DAY1 = [
  'Maria Ines Bogado', 'Monica Matera', 'Ricardo Calvo Bonaventura',
  'Carolina Giorgini', 'Pablo',
];

const RONDAS = [
  {
    ronda: 1,
    video: { id: 'OuRlzrhtXZY', title: 'Ronda 1/28 Mundial de tango 2025 08 23 Clasificatoria pista' },
    songs: [
      { song_id: 'UNMATCHED-AL_COMPAS_DEL_CORAZON', title: 'Al Compás del Corazón', orchestra: 'Miguel Caló' },
      { song_id: 'SONG-076', title: 'A Los Amigos', orchestra: 'Osvaldo Pugliese' },
      { song_id: 'SONG-077', title: 'Farabute', orchestra: "Juan D'Arienzo" },
    ],
  },
  {
    ronda: 2,
    video: { id: 'jdIdEBxoZ4M', title: 'See the Best Tango Dancers in Action! Ronda 2 Mundial de tango 2025 08 23 Clasificatoria pista' },
    songs: [
      { song_id: 'SONG-061', title: 'Cuatro Compases', orchestra: 'Miguel Caló' },
      { song_id: 'SONG-062', title: 'Gente Amiga', orchestra: 'Osvaldo Pugliese' },
      { song_id: 'SONG-063', title: 'Pajaro Ciego', orchestra: 'Aníbal Troilo con Francisco Fiorentino' },
    ],
  },
  {
    ronda: 15,
    video: { id: 'rbraxoQjW7A', title: 'Ronda 15 Mundial de tango 2025 Clasificatoria pista Buenos Aires' },
    songs: [], // 곡 정보 추후
  },
];

for (const r of RONDAS) {
  const round_id = `R-MUNDIAL2025-PISTA-Q${String(r.ronda).padStart(2, '0')}`;
  if (db.rounds.some(x => x.round_id === round_id)) {
    console.log('exists:', round_id);
    continue;
  }
  db.rounds.push({
    round_id,
    competition: 'Mundial',
    competition_id: 'COMP-001',
    year: 2025,
    category: 'pista',
    stage: 'qualifying',
    ronda_number: r.ronda,
    songs: r.songs.map((s, i) => ({ ...s, order: i + 1 })),
    videos: [{
      video_id: r.video.id,
      url: `https://www.youtube.com/watch?v=${r.video.id}`,
      channel: 'AiresDeMilonga',
      title: r.video.title,
    }],
    judges: QUAL_JUDGES_DAY1,
  });
  console.log('✓ added', round_id);
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log('✅ saved');
