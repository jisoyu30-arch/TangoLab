#!/usr/bin/env node
// 마무리 청소: category 정규화 + 2025 Senior Final + 참가자 자동 연결
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const PARTICIPANTS = path.join(__dirname, '..', 'src', 'data', 'mundial_participants_2025.json');

const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
const p2025 = JSON.parse(fs.readFileSync(PARTICIPANTS, 'utf-8'));

// 1. category 정규화: tango_de_pista → pista (통일)
let normalized = 0;
for (const r of db.rounds) {
  if (r.category === 'tango_de_pista') {
    r.category = 'pista';
    normalized++;
  }
}
console.log('1) category 정규화:', normalized, '개 엔트리 pista로 통일');

// 2. 2025 Senior Final Ronda에 영상/곡 추가
const seniorF1 = db.rounds.find(r => r.round_id === 'R-MUNDIAL2025-PISTA-SENIOR-F1');
if (seniorF1) {
  if (!seniorF1.videos.some(v => v.video_id === 'YnYEyMzEfag')) {
    seniorF1.videos.push({
      video_id: 'YnYEyMzEfag',
      url: 'https://www.youtube.com/watch?v=YnYEyMzEfag&t=' + (17 * 60 + 4) + 's',
      channel: 'Jose Valverde',
      title: 'Final Senior Tango Pista 2025 - Ronda única (전체방송 17:04~29:28)',
      start_sec: 17 * 60 + 4,
    });
  }
  if (seniorF1.songs.length === 0) {
    seniorF1.songs = [
      { song_id: 'UNMATCHED-JUNTO_A_TU_CORAZON', title: 'Junto a tu corazón', orchestra: "Juan D'Arienzo con Alberto Podestá", order: 1 },
      { song_id: 'UNMATCHED-EMANCIPACION', title: 'Emancipación', orchestra: 'Osvaldo Pugliese', order: 2 },
      { song_id: 'UNMATCHED-EL_TAURA_DE_ABASTO', title: 'El taura de Abasto', orchestra: "Juan D'Arienzo", order: 3 },
    ];
  }
  seniorF1.judges = [
    'Javier Rodriguez', 'Aoniken Quiroga', 'Cristina Sosa',
    'Paola Tacceti', 'Diego Gauna', 'Roxana Suarez', 'Cristian Marquez',
  ];
  console.log('2) Senior Final Ronda: 영상 + 3곡 + 7명 심사위원 추가');
}

// 3. 각 round에 participants 자동 연결 (2025 Final만 이미 있음, 다른 스테이지도 채우기)
let participantsAdded = 0;
const pIdx = p2025.participants_index;

// 준결승 각 ronda별 파레하
const semiCouples = p2025.stages.semifinal?.couples || [];
const semiByRonda = {};
for (const c of semiCouples) {
  if (!semiByRonda[c.ronda]) semiByRonda[c.ronda] = [];
  semiByRonda[c.ronda].push(c);
}
for (const [ronda, couples] of Object.entries(semiByRonda)) {
  const r = db.rounds.find(x => x.round_id === `R-MUNDIAL2025-PISTA-SF${ronda}`);
  if (r && !r.participants) {
    r.participants = couples.sort((a, b) => (a.rank || 999) - (b.rank || 999)).map(c => {
      const chain = pIdx[String(c.pareja)];
      const advancedTo = chain?.stages?.final ? 'final' : 'semifinal';
      return {
        pareja: c.pareja,
        leader: c.leader,
        follower: c.follower,
        rank: c.rank,
        promedio: c.promedio,
        advancedTo,
      };
    });
    participantsAdded++;
  }
}

// 8강 ronda별 (A/B 그룹 통합)
const cuartosCouples = [
  ...(p2025.stages.cuartos_A?.couples || []).map(c => ({ ...c, group: 'A' })),
  ...(p2025.stages.cuartos_B?.couples || []).map(c => ({ ...c, group: 'B' })),
];
const cuartosByRonda = {};
for (const c of cuartosCouples) {
  if (!cuartosByRonda[c.ronda]) cuartosByRonda[c.ronda] = [];
  cuartosByRonda[c.ronda].push(c);
}
for (const [ronda, couples] of Object.entries(cuartosByRonda)) {
  const r = db.rounds.find(x => x.round_id === `R-MUNDIAL2025-PISTA-QF${ronda}`);
  if (r && !r.participants) {
    r.participants = couples.sort((a, b) => (a.rank || 999) - (b.rank || 999)).map(c => {
      const chain = pIdx[String(c.pareja)];
      const advancedTo = chain?.stages?.final ? 'final'
        : chain?.stages?.semifinal ? 'semifinal' : 'cuartos';
      return {
        pareja: c.pareja,
        leader: c.leader,
        follower: c.follower,
        rank: c.rank,
        promedio: c.promedio,
        advancedTo,
      };
    });
    participantsAdded++;
  }
}

console.log('3) 참가자 자동 연결:', participantsAdded, '개 ronda');

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log('\n✅ cleanup 완료');

// 최종 스탯
const m25 = db.rounds.filter(r => r.year === 2025 && r.competition === 'Mundial' && /pista/.test(r.category));
console.log('\n📊 2025 Mundial 최종:');
for (const stg of ['qualifying', 'quarterfinal', 'semifinal', 'final']) {
  const rs = m25.filter(x => x.stage === stg);
  const withVid = rs.filter(x => x.videos?.length > 0).length;
  const withSongs = rs.filter(x => x.songs?.length >= 3).length;
  const withParticipants = rs.filter(x => x.participants?.length > 0).length;
  console.log(`  ${stg}: ${rs.length}론다 | 영상:${withVid} | 곡:${withSongs} | 참가자:${withParticipants}`);
}
