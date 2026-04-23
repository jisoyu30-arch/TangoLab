#!/usr/bin/env node
// 2023 KTC + PTC 종합 영상·곡·참가자 데이터 대량 추가
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));

function ensureRound({ competition, year, category, stage, ronda, round_id }) {
  let round = db.rounds.find(r => r.round_id === round_id);
  if (!round) {
    round = {
      round_id,
      competition,
      competition_id: competition === 'KTC' ? 'COMP-005' : 'COMP-004',
      year, category, stage,
      ronda_number: ronda,
      songs: [],
      videos: [],
    };
    db.rounds.push(round);
  }
  return round;
}

function addVideo(round, video) {
  if (!round.videos.some(v => v.video_id === video.video_id)) {
    round.videos.push(video);
  }
}

// ==============================================
// 1) KTC 2023 Pista FINAL Rounds (fMXT6r8CQKM)
//    2ronda(00:00) + 1ronda(09:52) 합본 · Abrazo tv
// ==============================================
const FINAL_2023 = {
  video_id: 'fMXT6r8CQKM',
  channel: 'Abrazo tv',
  type: 'performance', // 일반 Abrazo tv와 달리 real footage (override)
  title: '2023 Korea Tango Championship : Tango de pista - Final Rounds',
};

// 2ronda 참가자 (00:00~) with 최종순위
const final_2round_participants = [
  { pareja: 145, final_rank: 7, avg: 9.685, nickname: '연꽃&소똥' },
  { pareja: 142, final_rank: 4, avg: 9.8375, nickname: '베카&아이오닉' },
  { pareja: 141, final_rank: 8, avg: 9.5125, nickname: '리아&빅토르' },
  { pareja: 133, final_rank: 9, avg: 9.5, nickname: '멜리사&라스' },
  { pareja: 132, final_rank: 10, avg: 9.4725, nickname: '라벤더&매우파랗다' },
  { pareja: 119, final_rank: 17, avg: 9.35, nickname: '솔레다드&레오' },
  { pareja: 172, final_rank: 13, avg: 9.435, nickname: '엘린&바질' },
  { pareja: 154, final_rank: 6, avg: 9.685, nickname: '브리즈&미스탕' },
];

// 1ronda 참가자 (09:52~) with 최종순위
const final_1round_participants = [
  { pareja: 178, final_rank: 11, avg: 9.4575, nickname: '알리나&미키' },
  { pareja: 169, final_rank: 1, avg: 9.955, nickname: '지아&버범', winner: true },
  { pareja: 162, final_rank: 2, avg: 9.9125, nickname: '엘리&엘또리또' },
  { pareja: 161, final_rank: 5, avg: 9.7875, nickname: '비키정&에피톤진' },
  { pareja: 137, final_rank: 12, avg: 9.4375, nickname: '니나&미카엘' },
  { pareja: 123, final_rank: 14, avg: 9.4, nickname: '플로라&이리' },
  { pareja: 109, final_rank: 16, avg: 9.3625, nickname: '클라라&피닉스' },
  { pareja: 104, final_rank: 3, avg: 9.86, nickname: '유진&주니' },
  { pareja: 103, final_rank: 15, avg: 9.3975, nickname: '뮤즈&우노' },
];

// Final Ronda 1 (KTC 시스템: 1round = 결승 첫 론다)
{
  const r = ensureRound({ competition: 'KTC', year: 2023, category: 'pista', stage: 'final', ronda: 1, round_id: 'R-KTC2023-PISTA-F1' });
  addVideo(r, {
    video_id: FINAL_2023.video_id,
    url: `https://www.youtube.com/watch?v=${FINAL_2023.video_id}&t=592s`,
    channel: FINAL_2023.channel,
    type: FINAL_2023.type,
    title: FINAL_2023.title + ' - 1round (09:52 start)',
    start_sec: 592,
    song_timestamps: [{ order: 1, sec: 609 }, { order: 2, sec: 751 }, { order: 3, sec: 935 }],
  });
  r.participants = final_1round_participants;
}

// Final Ronda 2 (KTC 시스템: 2round = 결승 두 번째 론다)
{
  const r = ensureRound({ competition: 'KTC', year: 2023, category: 'pista', stage: 'final', ronda: 2, round_id: 'R-KTC2023-PISTA-F2' });
  addVideo(r, {
    video_id: FINAL_2023.video_id,
    url: `https://www.youtube.com/watch?v=${FINAL_2023.video_id}`,
    channel: FINAL_2023.channel,
    type: FINAL_2023.type,
    title: FINAL_2023.title + ' - 2round (00:00 start)',
    start_sec: 0,
    song_timestamps: [{ order: 1, sec: 18 }, { order: 2, sec: 213 }, { order: 3, sec: 390 }],
  });
  r.participants = final_2round_participants;
}

// ==============================================
// 2) KTC 2023 Pista Preliminary Rondas (brvm1nmjqMM)
//    전체 8 ronda 합본 (8/9 ronda는 녹화 못함)
// ==============================================
const PRELIM_2023 = {
  video_id: 'brvm1nmjqMM',
  channel: 'Abrazo tv',
  type: 'performance',
  title: '2023 Korea Tango Championship : Tango de pista Preliminaries Ronda 1~7',
};

// * 는 세미 진출자 · user-provided
const PRELIMS = [
  {
    group: 'A', ronda: 1, start: 30, song_ts: [147, 319, 524],
    parejas: [
      { pareja: 101, nickname: '카이사르&유진', advanced: true },
      { pareja: 103, nickname: '우노&뮤즈', advanced: true },
      { pareja: 104, nickname: '주니&유진', advanced: true },
      { pareja: 105, nickname: '히로&줄리', advanced: false },
      { pareja: 106, nickname: '지내고&엘로', advanced: false },
      { pareja: 109, nickname: '피닉스&클라라', advanced: true },
      { pareja: 110, nickname: '알마&기쁨', advanced: true },
      { pareja: 112, nickname: '에디&이담', advanced: true },
    ],
  },
  {
    group: 'B', ronda: 2, start: 760, song_ts: [859, 1031, 1198],
    parejas: [
      { pareja: 113, nickname: '저스틴&이유', advanced: false },
      { pareja: 114, nickname: '유월청&벨르', advanced: false },
      { pareja: 115, nickname: '미겔 리&벨라 킴', advanced: false },
      { pareja: 117, nickname: '샹디&팀맥스', advanced: true },
      { pareja: 118, nickname: '오덕곰&칼리', advanced: false },
      { pareja: 119, nickname: '레오&솔레다드', advanced: true },
      { pareja: 121, nickname: '문래&제니', advanced: false },
      { pareja: 123, nickname: '이리&플로라', advanced: true },
    ],
  },
  {
    group: 'C', ronda: 3, start: 1423, song_ts: [1549, 1759, 1949],
    parejas: [
      { pareja: 126, nickname: '연풍&시실리', advanced: false },
      { pareja: 127, nickname: '비토&태라', advanced: false },
      { pareja: 128, nickname: '올라&대즐', advanced: false },
      { pareja: 129, nickname: '데이비드&아미', advanced: true },
      { pareja: 130, nickname: '난다&아난도', advanced: true },
      { pareja: 131, nickname: '산또&차차', advanced: false },
      { pareja: 132, nickname: '매우파랗다&라벤더', advanced: true },
      { pareja: 133, nickname: '라스&멜리사', advanced: true },
    ],
  },
  {
    group: 'F', ronda: 6, start: 2210, song_ts: [2233, 2433, 2589],
    parejas: [
      { pareja: 150, nickname: '블랙체리&유리엘', advanced: false },
      { pareja: 151, nickname: '션&디온', advanced: true },
      { pareja: 152, nickname: '사탕&칼라', advanced: true },
      { pareja: 153, nickname: '아메&아현', advanced: true },
      { pareja: 154, nickname: '브리즈&미스탕', advanced: true },
      { pareja: 155, nickname: '스테파노&조앤', advanced: true },
      { pareja: 156, nickname: '카일&쥬니', advanced: false },
      { pareja: 157, nickname: '자올&줄리', advanced: false },
    ],
  },
  {
    group: 'G', ronda: 7, start: 2820, song_ts: [2910, 3100, 3287],
    parejas: [
      { pareja: 158, nickname: '마테로&비비아나', advanced: false },
      { pareja: 159, nickname: '태리&아브릴', advanced: false },
      { pareja: 160, nickname: '오즈&소피아', advanced: true },
      { pareja: 161, nickname: '에피톤진&비키정', advanced: true },
      { pareja: 162, nickname: '엘또리또&엘리', advanced: true },
      { pareja: 163, nickname: '오하&바비', advanced: true },
      { pareja: 164, nickname: '세바스찬&리지', advanced: false },
      { pareja: 165, nickname: '안태&민새', advanced: false },
    ],
  },
  {
    group: 'H', ronda: 8, start: 3532, song_ts: [],
    parejas: [
      { pareja: 166, nickname: '중리&양양', advanced: false },
      { pareja: 167, nickname: '현이&세레나', advanced: true },
      { pareja: 168, nickname: 'KD&TARA', advanced: false },
      { pareja: 169, nickname: '지아&버범', advanced: true },
      { pareja: 170, nickname: '케이&마리', advanced: false },
      { pareja: 171, nickname: '동혁&포노', advanced: true },
      { pareja: 172, nickname: '아르볼&보스케', advanced: false },
      { pareja: 173, nickname: '바질&엘린', advanced: true },
    ],
    note: 'H(8) ronda는 녹화 일부만 (다음 ronda D로 이어짐)',
  },
  {
    group: 'D', ronda: 4, start: 3650, song_ts: [3745, 3949, 4106],
    parejas: [
      { pareja: 134, nickname: '에단&지아나', advanced: true },
      { pareja: 135, nickname: '에릭&바비', advanced: false },
      { pareja: 136, nickname: '올라&리사', advanced: false },
      { pareja: 137, nickname: '미카엘&니나', advanced: true },
      { pareja: 138, nickname: '카헬&윤비', advanced: true },
      { pareja: 139, nickname: '철환&연주', advanced: true },
      { pareja: 140, nickname: '차이&메텔', advanced: true },
      { pareja: 141, nickname: '빅토르&리아', advanced: true },
    ],
  },
  {
    group: 'E', ronda: 5, start: 4345, song_ts: [4428, 4617, 4814],
    parejas: [
      { pareja: 142, nickname: '아이오닉&베카', advanced: true },
      { pareja: 143, nickname: '이원국&김수아', advanced: true },
      { pareja: 144, nickname: '산드로&리타', advanced: false },
      { pareja: 145, nickname: '소똥&연꽃', advanced: true },
      { pareja: 146, nickname: '우드&사라', advanced: false },
      { pareja: 147, nickname: '바비조&파미', advanced: false },
      { pareja: 148, nickname: '노남기&숀', advanced: true },
      { pareja: 149, nickname: '방랑&끼아라', advanced: false },
    ],
  },
];

for (const p of PRELIMS) {
  const round_id = `R-KTC2023-PISTA-Q${p.ronda}`;
  const r = ensureRound({ competition: 'KTC', year: 2023, category: 'pista', stage: 'qualifying', ronda: p.ronda, round_id });
  addVideo(r, {
    video_id: PRELIM_2023.video_id,
    url: `https://www.youtube.com/watch?v=${PRELIM_2023.video_id}&t=${p.start}s`,
    channel: PRELIM_2023.channel,
    type: PRELIM_2023.type,
    title: `${PRELIM_2023.title} - Group ${p.group} Ronda ${p.ronda}`,
    start_sec: p.start,
    song_timestamps: p.song_ts.map((sec, i) => ({ order: i + 1, sec })),
  });
  r.group = p.group;
  r.participants = p.parejas;
  if (p.note) r.note = p.note;
}

// ==============================================
// 3) PTC 2023 Vals Final #2 (oceRdk26B8k)
// ==============================================
{
  const r = ensureRound({ competition: 'PTC', year: 2023, category: 'vals', stage: 'final', ronda: 2, round_id: 'R-PTC2023-VALS-F2' });
  addVideo(r, {
    video_id: 'oceRdk26B8k',
    url: 'https://www.youtube.com/watch?v=oceRdk26B8k',
    channel: 'Abrazo tv',
    type: 'performance',
    title: '2023 Pacific Tango Championship - Vals - Final Rounds - #2 (23.05.28)',
    song_timestamps: [
      { order: 1, sec: 46, title: 'No Te Olvides de Mi Corazón', orchestra: 'Miguel Calo' },
      { order: 2, sec: 210, title: 'El Viejo Vals', orchestra: 'Francisco Rotundo' },
      { order: 3, sec: 393, title: 'Violetas', orchestra: 'Alberto Castillo' },
    ],
  });
  r.songs = [
    { song_id: 'UNMATCHED-NO_TE_OLVIDES_DE_MI_CORAZON', title: 'No Te Olvides de Mi Corazón', orchestra: 'Miguel Calo', order: 1 },
    { song_id: 'UNMATCHED-EL_VIEJO_VALS', title: 'El Viejo Vals', orchestra: 'Francisco Rotundo', order: 2 },
    { song_id: 'UNMATCHED-VIOLETAS', title: 'Violetas', orchestra: 'Alberto Castillo', order: 3 },
  ];
}

// ==============================================
// 4) PTC 2023 Milonga Final (okJgel2eY9A)
// ==============================================
{
  const r = ensureRound({ competition: 'PTC', year: 2023, category: 'milonga', stage: 'final', ronda: 1, round_id: 'R-PTC2023-MILONGA-F1' });
  addVideo(r, {
    video_id: 'okJgel2eY9A',
    url: 'https://www.youtube.com/watch?v=okJgel2eY9A',
    channel: 'Abrazo tv',
    type: 'performance',
    title: '2023 Pacific Tango Championship - Milonga - Final Round (23.05.28)',
    song_timestamps: [
      { order: 1, sec: 0, title: 'Milonga Que Peina Canas', orchestra: 'Miguel Calo' },
      { order: 2, sec: 129, title: 'La Milonga de Buenos Aires', orchestra: 'Francisco Canaro' },
    ],
  });
  r.songs = [
    { song_id: 'UNMATCHED-MILONGA_QUE_PEINA_CANAS', title: 'Milonga Que Peina Canas', orchestra: 'Miguel Calo', order: 1 },
    { song_id: 'UNMATCHED-LA_MILONGA_DE_BUENOS_AIRES', title: 'La Milonga de Buenos Aires', orchestra: 'Francisco Canaro', order: 2 },
  ];
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log('✅ 2023 KTC + PTC 데이터 대량 추가 완료');
