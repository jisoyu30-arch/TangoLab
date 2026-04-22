#!/usr/bin/env node
// 2025 Mundial Semifinal Ronda 2, 3 추가 (AiresDeMilonga)
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

const ROUNDS = [
  {
    round_id: 'R-MUNDIAL2025-PISTA-SF2',
    ronda: 2,
    video: { id: 'BT6MWQQhFd8', title: '2 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025' },
    songs: [
      { song_id: 'UNMATCHED-SI_SUPIERA_QUE_LA_EXTRANO', title: 'Si supiera que la extraño', orchestra: "Juan D'Arienzo" },
      { song_id: 'SONG-024', title: 'Abandono', orchestra: 'Pedro Laurenz' },
      { song_id: 'SONG-180', title: "Milongueando en el '40", orchestra: 'Aníbal Troilo' },
    ],
  },
  {
    round_id: 'R-MUNDIAL2025-PISTA-SF3',
    ronda: 3,
    video: { id: '2Rwu12kDR3o', title: '3 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025' },
    songs: [
      { song_id: 'SONG-363', title: 'Cartón Junao', orchestra: "Juan D'Arienzo" },
      { song_id: 'SONG-021', title: 'Al Verla Pasar', orchestra: 'Pedro Laurenz con Martín Podestá' },
      { song_id: 'SONG-038', title: 'Comparsa Criolla', orchestra: 'Ricardo Tanturi' },
    ],
  },
];

for (const r of ROUNDS) {
  if (db.rounds.some(x => x.round_id === r.round_id)) {
    console.log('exists:', r.round_id);
    continue;
  }
  db.rounds.push({
    round_id: r.round_id,
    competition: 'Mundial',
    competition_id: 'COMP-001',
    year: 2025,
    category: 'pista',
    stage: 'semifinal',
    ronda_number: r.ronda,
    songs: r.songs.map((s, i) => ({ ...s, order: i + 1 })),
    videos: [{
      video_id: r.video.id,
      url: `https://www.youtube.com/watch?v=${r.video.id}`,
      channel: 'AiresDeMilonga',
      title: r.video.title,
    }],
    judges: SEMI_JUDGES,
  });
  console.log('✓ added', r.round_id);
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log('✅ saved');
