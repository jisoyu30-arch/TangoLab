#!/usr/bin/env node
// 2025 Mundial Qualifying Ronda 1 (Day 1, 8/23) 추가
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
const round_id = 'R-MUNDIAL2025-PISTA-Q01';
if (!db.rounds.some(r => r.round_id === round_id)) {
  db.rounds.push({
    round_id,
    competition: 'Mundial',
    competition_id: 'COMP-001',
    year: 2025,
    category: 'pista',
    stage: 'qualifying',
    ronda_number: 1,
    songs: [
      { song_id: 'UNMATCHED-AL_COMPAS_DEL_CORAZON', title: 'Al Compás del Corazón', orchestra: 'Miguel Caló', order: 1 },
      { song_id: 'SONG-076', title: 'A Los Amigos', orchestra: 'Osvaldo Pugliese', order: 2 },
      { song_id: 'SONG-077', title: 'Farabute', orchestra: "Juan D'Arienzo", order: 3 },
    ],
    videos: [{
      video_id: 'OuRlzrhtXZY',
      url: 'https://www.youtube.com/watch?v=OuRlzrhtXZY',
      channel: 'AiresDeMilonga',
      title: 'Ronda 1/28 Mundial de tango 2025 08 23 Clasificatoria pista',
    }],
    judges: QUAL_JUDGES_DAY1,
  });
  console.log('✓ added Q01');
} else {
  console.log('exists');
}
fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
