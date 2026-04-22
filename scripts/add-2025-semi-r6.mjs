#!/usr/bin/env node
// 2025 Mundial Pista Semifinal Ronda 6 추가
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

const round_id = 'R-MUNDIAL2025-PISTA-SF6';
if (db.rounds.some(r => r.round_id === round_id)) {
  console.log('exists, skip');
} else {
  db.rounds.push({
    round_id,
    competition: 'Mundial',
    competition_id: 'COMP-001',
    year: 2025,
    category: 'pista',
    stage: 'semifinal',
    ronda_number: 6,
    songs: [
      { song_id: 'SONG-026', title: 'Dos Fracasos', orchestra: 'Miguel Caló y su Orquesta Típica con Alberto Podestá', order: 1 },
      { song_id: 'UNMATCHED-NO_ME_HABLEN_DE_ELLA', title: 'No Me Hablen De Ella', orchestra: 'Osvaldo Pugliese y su Orquesta Típica', order: 2 },
      { song_id: 'SONG-025', title: 'El Puntazo', orchestra: "Juan D'Arienzo y su Orquesta Típica", order: 3 },
    ],
    videos: [{
      video_id: 'KZ74jdSLkYY',
      url: 'https://www.youtube.com/watch?v=KZ74jdSLkYY',
      channel: 'AiresDeMilonga',
      title: '6 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025',
    }],
    judges: SEMI_JUDGES,
  });
  console.log('✓ added', round_id);
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log('✅ saved');
