#!/usr/bin/env node
// 2025 추가: Final R5 champions 하이라이트 + Qualifying R8 (Day 1)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));

// 1) Final R5에 champions 하이라이트 영상 추가
const f5 = db.rounds.find(r => r.round_id === 'R-MUNDIAL2025-PISTA-F5');
if (f5 && !f5.videos.some(v => v.video_id === 'pkGFeQeNP3k')) {
  f5.videos.push({
    video_id: 'pkGFeQeNP3k',
    url: 'https://www.youtube.com/watch?v=pkGFeQeNP3k',
    channel: 'AiresDeMilonga',
    title: 'No creerás este baile de la ronda 5 de los campeones Mundiales tango pista 2025 Aldana y Diego',
  });
  console.log('✓ F5: added champions highlight');
}

// 2) Qualifying R8 (Day 1 / 8/23) 신규 추가
const QUAL_JUDGES_DAY1 = [
  'Maria Ines Bogado', 'Monica Matera', 'Ricardo Calvo Bonaventura',
  'Carolina Giorgini', 'Pablo', // Pablo's last name truncated in header
];
const round_id = 'R-MUNDIAL2025-PISTA-Q08';
if (!db.rounds.some(r => r.round_id === round_id)) {
  db.rounds.push({
    round_id,
    competition: 'Mundial',
    competition_id: 'COMP-001',
    year: 2025,
    category: 'pista',
    stage: 'qualifying',
    ronda_number: 8,
    songs: [], // 곡 정보 추후
    videos: [{
      video_id: 'HmKDYkX2SHI',
      url: 'https://www.youtube.com/watch?v=HmKDYkX2SHI',
      channel: 'AiresDeMilonga',
      title: 'Ronda 8 Mundial de tango Clasificatoria pista 2025 08 23 Buenos Aires',
    }],
    judges: QUAL_JUDGES_DAY1,
  });
  console.log('✓ added Q08');
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log('✅ saved');
