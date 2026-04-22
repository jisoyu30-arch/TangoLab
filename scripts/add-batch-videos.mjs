#!/usr/bin/env node
// Batch add videos from user-shared URLs
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

const ADDS = [
  // 2025 Final R3 (밀롱가/AiresDeMilonga)
  { round_id: 'R-MUNDIAL2025-PISTA-F3', video: { id: 'tDzRQZwhBFw', channel: 'AiresDeMilonga', title: '¡Descubre cómo bailan los campeones en el escenario! RONDA 3 MUNDIAL PISTA FINAL' } },
  // 2025 Final R4
  { round_id: 'R-MUNDIAL2025-PISTA-F4', video: { id: 'HlMIJitndyc', channel: 'AiresDeMilonga', title: 'Momentos IMPACTANTES en la pista de TANGO FINAL MUNDIAL Ronda 4' } },

  // 2023 Semifinal rondas (Masha Step)
  { create: true, round_id: 'R-MUNDIAL2023-PISTA-SF10', year: 2023, stage: 'semifinal', ronda: 10, video: { id: 'AHesh9ntjW8', channel: 'Masha Step', title: 'Mundial de Tango 2023 Tango pista. Semifinales. Ronda 10' } },
  { create: true, round_id: 'R-MUNDIAL2023-PISTA-SF11', year: 2023, stage: 'semifinal', ronda: 11, video: { id: 'dyNdIsjTsbA', channel: 'Masha Step', title: 'Mundial de Tango 2023 Tango pista. Semifinales. Ronda 11' } },
  { create: true, round_id: 'R-MUNDIAL2023-PISTA-SF12', year: 2023, stage: 'semifinal', ronda: 12, video: { id: '04HbigE8SzA', channel: 'Masha Step', title: 'Mundial de Tango 2023 Tango pista. Semifinales. Ronda 12' } },
  { create: true, round_id: 'R-MUNDIAL2023-PISTA-SF13', year: 2023, stage: 'semifinal', ronda: 13, video: { id: '2-uQt5i3Ozo', channel: 'Masha Step', title: 'Mundial de Tango 2023 Tango pista. Semifinales. Ronda 13' } },
  { create: true, round_id: 'R-MUNDIAL2023-PISTA-SF14', year: 2023, stage: 'semifinal', ronda: 14, video: { id: 'pKEdRuHE6ek', channel: 'Masha Step', title: 'Mundial de Tango 2023 Tango pista. Semifinales. Ronda 14' } },
  { create: true, round_id: 'R-MUNDIAL2023-PISTA-SF15', year: 2023, stage: 'semifinal', ronda: 15, video: { id: 'Rnz_Qf6PKkg', channel: 'Masha Step', title: 'Mundial de Tango 2023 Tango pista. Semifinales. Ronda 15' } },
  { create: true, round_id: 'R-MUNDIAL2023-PISTA-SF16', year: 2023, stage: 'semifinal', ronda: 16, video: { id: 'UrtMVUfev5g', channel: 'Masha Step', title: 'Mundial de Tango 2023 Tango pista. Semifinales. Ronda 16' } },
  { create: true, round_id: 'R-MUNDIAL2023-PISTA-SF17', year: 2023, stage: 'semifinal', ronda: 17, video: { id: 'dZwjxX-WOMc', channel: 'Masha Step', title: 'Mundial de Tango 2023 Tango pista. Semifinales. Ronda 17' } },
];

let addedVideos = 0, createdRounds = 0, existed = 0;

for (const a of ADDS) {
  let round = db.rounds.find(r => r.round_id === a.round_id);
  if (!round && a.create) {
    round = {
      round_id: a.round_id,
      competition: 'Mundial',
      competition_id: 'COMP-001',
      year: a.year,
      category: 'pista',
      stage: a.stage,
      ronda_number: a.ronda,
      songs: [],
      videos: [],
      judges: a.stage === 'semifinal' ? SEMI_JUDGES : [],
    };
    db.rounds.push(round);
    createdRounds++;
  } else if (!round) {
    console.warn('⚠ not found, not creating:', a.round_id);
    continue;
  }

  if (!round.videos.some(v => v.video_id === a.video.id)) {
    round.videos.push({
      video_id: a.video.id,
      url: `https://www.youtube.com/watch?v=${a.video.id}`,
      channel: a.video.channel,
      title: a.video.title,
    });
    addedVideos++;
  } else {
    existed++;
  }
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log(`✅ created=${createdRounds} videos+${addedVideos} existed=${existed}`);
