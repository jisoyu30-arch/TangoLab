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
//
// 2026 준결승은 통영상이 아니라 론다별 개별 영상으로 올라왔다.
// 대부분 Carlos Roberto Ayala 채널, 론다 1만 다른 채널.
//
// 출처 표시:
//   [링크확인] 사용자가 제목과 함께 URL을 직접 확인해 준 영상
//   [사용자제공] 사용자가 URL을 직접 보내준 영상 (론다 번호는 조사 결과)
//   [미검증]   조사 결과로만 얻은 video_id — 이 환경에서는 YouTube 접근이
//              막혀 있어 확인하지 못했다. 재생 안 되면 여기부터 의심할 것.
//
// 아직 못 찾은 론다: 2, 11, 12, 13, 14, 17
const AYALA = 'Carlos Roberto Ayala';
const ayala = (n, id) => ({
  video_id: id,
  channel: AYALA,
  title: `Semifinal Mundial de tango Ronda ${n} - Usina del arte 29 Agosto 2026`,
});

const VIDEOS = {
  1: [{ video_id: 'VT6xM-YjgUY', channel: 'TDJ Cristian Águilar aguilar',
        title: 'Ronda 1 Semifinal tango pista 2026' }],            // [사용자제공]
  3: [ayala(3, 'yywQOiYSvrE')],                                    // [미검증]
  4: [ayala(4, 'tgp-RAJFHds')],                                    // [미검증]
  5: [{ ...ayala(5, 'KKUYuvT6TRY') }],                             // [사용자제공]
  6: [ayala(6, 'FnQ_1djYhxE')],                                    // [미검증]
  7: [ayala(7, '94tvdIIIppw')],                                    // [미검증]
  8: [ayala(8, 'E_HilvRKOEE')],                                    // [미검증]
  9: [{ ...ayala(9, '4x5WrmSvnL8'),
        title: 'Semifinal Mundial de tango Ronda 9 - Usina del arte 29 agosto 2026' }], // [링크확인]
  10: [ayala(10, 'VBXpN_y3AWc')],                                  // [링크확인]
  15: [ayala(15, 'zlF-4gtn6Yc')],                                  // [링크확인]
  16: [ayala(16, 'qrIBZCwYsWw')],                                  // [링크확인]
};

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
