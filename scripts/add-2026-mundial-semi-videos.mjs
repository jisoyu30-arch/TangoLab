#!/usr/bin/env node
// Mundial 2026 Pista 준결승(8/29) 론다별 영상 붙이기.
//
// 준결승 라운드(R-MUNDIAL2026-PISTA-SF1..SF17)와 참가자 매칭은
// scripts/add_mundial_2026_semifinal.py 가 이미 만들어 뒀다. 이 스크립트는 영상만 채운다.
//
// 쓰는 법: 아래 VIDEOS 에 론다 번호별로 항목을 추가하고 실행.
//   node scripts/add-2026-mundial-semi-videos.mjs
//
// 한 영상이 여러 론다를 담고 있으면 각 론다에 같은 video_id 를 넣고
// start_sec 로 시작 지점을 다르게 주면 된다 (2025 Jose Valverde 영상과 동일한 방식).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');

// ronda 번호 -> 영상 배열
// 예)
//   5: [{ video_id: 'XXXXXXXXXXX', channel: 'AiresDeMilonga',
//         title: '5 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2026' }],
//   6: [{ video_id: 'YYYYYYYYYYY', channel: 'Jose Valverde',
//         title: 'Semifinal Tango Pista Mundial 2026 - Ronda 6', start_sec: 1234 }],
const VIDEOS = {};

const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
const entries = Object.entries(VIDEOS);

if (entries.length === 0) {
  console.log('VIDEOS 가 비어 있습니다. 파일 상단 주석의 예시대로 론다별 영상을 채운 뒤 다시 실행하세요.');
  console.log('현재 준결승 라운드 상태:');
  for (const r of db.rounds.filter(r => r.round_id?.startsWith('R-MUNDIAL2026-PISTA-SF'))) {
    console.log(`  ronda ${String(r.ronda_number).padStart(2)} · 참가자 ${r.participants.length}쌍 · 영상 ${r.videos.length}개`);
  }
  process.exit(0);
}

let added = 0;
for (const [ronda, vids] of entries) {
  const round = db.rounds.find(r => r.round_id === `R-MUNDIAL2026-PISTA-SF${ronda}`);
  if (!round) {
    console.warn(`✗ ronda ${ronda} 라운드를 찾을 수 없음 — add_mundial_2026_semifinal.py 를 먼저 실행하세요`);
    continue;
  }
  for (const v of vids) {
    const video_id = v.video_id ?? new URL(v.url).searchParams.get('v');
    if (!video_id) {
      console.warn(`✗ ronda ${ronda}: video_id 를 알 수 없음`, v);
      continue;
    }
    if (round.videos.some(x => x.video_id === video_id && x.start_sec === v.start_sec)) {
      console.log(`· ronda ${ronda}: ${video_id} 이미 있음, 건너뜀`);
      continue;
    }
    round.videos.push({
      video_id,
      url: v.url ?? `https://www.youtube.com/watch?v=${video_id}`,
      channel: v.channel,
      title: v.title,
      ...(v.start_sec !== undefined ? { start_sec: v.start_sec } : {}),
    });
    added++;
    console.log(`✓ ronda ${ronda} ← ${v.title}`);
  }
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log(`✅ 영상 ${added}개 추가`);
