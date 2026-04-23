#!/usr/bin/env node
// KTC 2022 전체 영상 + 2025 Pista Final 추가
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));

const PISTA_2022_JUDGES = ['Miguel', 'Pelin', 'Gustavo', 'Talia', 'Ariel'];
const CH = 'doya doya';

const ADDS = [
  // ===== KTC 2022 Pista 예선 1-8 =====
  { ronda: 1, id: 'oI-3sRhZ6oc', year: 2022, stage: 'qualifying', category: 'pista', title: 'KTC 2022 Korea tango championship 예선 1' },
  { ronda: 2, id: 'Bwy_mVxigPU', year: 2022, stage: 'qualifying', category: 'pista', title: 'KTC 2022 Korea tango championship 예선 2' },
  { ronda: 3, id: 'ASYQs7lGbd8', year: 2022, stage: 'qualifying', category: 'pista', title: 'KTC 2022 Tango de pista 3' },
  { ronda: 4, id: 'aRc9-6SKmP4', year: 2022, stage: 'qualifying', category: 'pista', title: 'KTC 2022 Tango de pista 4' },
  { ronda: 5, id: 'iMvcY10pdOY', year: 2022, stage: 'qualifying', category: 'pista', title: 'KTC 2022 Tango de pista 5' },
  { ronda: 6, id: 'mqdtlhWsyEs', year: 2022, stage: 'qualifying', category: 'pista', title: 'KTC 2022 Tango de pista 6' },
  { ronda: 7, id: 'K_2sVtj8YWI', year: 2022, stage: 'qualifying', category: 'pista', title: 'KTC 2022 Tango de pista 7' },
  { ronda: 8, id: '7BjlhcHPCZ4', year: 2022, stage: 'qualifying', category: 'pista', title: 'KTC 2022 Tango de pista 8' },

  // ===== KTC 2022 Pista 준결승 A-D =====
  { ronda: 1, id: 'VWUpwTWmKzc', year: 2022, stage: 'semifinal', category: 'pista', title: 'KTC 2022 Tango de pista Semi final A', group: 'A' },
  { ronda: 2, id: 'ZO0RhrJ6x-4', year: 2022, stage: 'semifinal', category: 'pista', title: 'KTC 2022 Tango de pista Semi final B', group: 'B' },
  { ronda: 3, id: 'Uk-ofzKbv4E', year: 2022, stage: 'semifinal', category: 'pista', title: 'KTC 2022 Tango de pista Semi final C', group: 'C' },
  { ronda: 4, id: '037h-E5lyx0', year: 2022, stage: 'semifinal', category: 'pista', title: 'KTC 2022 Tango de pista Semi final D', group: 'D' },

  // ===== KTC 2022 Pista 결승 =====
  { ronda: 1, id: 'Ic2OFOJ6FRQ', year: 2022, stage: 'final', category: 'pista', title: 'KTC 2022 Korea tango championship Pista - final' },

  // ===== KTC 2022 Milonga =====
  { ronda: 1, id: 'M4myaNH9t9U', year: 2022, stage: 'qualifying', category: 'milonga', title: 'KTC 2022 Milonga 1' },
  { ronda: 2, id: '9Vpa__8luNA', year: 2022, stage: 'qualifying', category: 'milonga', title: 'KTC 2022 Milonga 2' },
  { ronda: 3, id: 'in1Wp4Sdkpc', year: 2022, stage: 'qualifying', category: 'milonga', title: 'KTC 2022 Milonga 3' },

  // ===== KTC 2022 Vals Final =====
  { ronda: 1, id: 'dC-P1Muqfjk', year: 2022, stage: 'final', category: 'vals', title: 'KTC 2022 Vals - final' },

  // ===== KTC 2022 Jack & Jill =====
  { ronda: 1, id: 'j_p6k1YHcfY', year: 2022, stage: 'semifinal', category: 'pista_singles_jackandjill', title: 'KTC 2022 JACK & JILL Semi final' },
  { ronda: 1, id: '-Kcqwqx92-c', year: 2022, stage: 'final', category: 'pista_singles_jackandjill', title: 'KTC 2022 JACK & JILL - final' },

  // ===== KTC 2022 NewStar =====
  { ronda: 1, id: 'A_ScxHreqf4', year: 2022, stage: 'final', category: 'pista_newstar', title: 'KTC 2022 New star - final' },

  // ===== KTC 2025 Pista Final =====
  { ronda: 1, id: 'jVxSu98c9Jk', year: 2025, stage: 'final', category: 'pista', title: '2025 KTC Pista Final' },
];

let added = 0, existed = 0, merged = 0;

for (const a of ADDS) {
  const catCode = a.category.toUpperCase().replace(/_/g, '-');
  const stageCode = { qualifying: 'Q', semifinal: 'SF', final: 'F', quarterfinal: 'QF' }[a.stage];
  const round_id = `R-KTC${a.year}-${catCode}-${stageCode}${a.ronda}`;

  let round = db.rounds.find(r => r.round_id === round_id);
  if (!round) {
    round = {
      round_id,
      competition: 'KTC',
      competition_id: 'COMP-005',
      year: a.year,
      category: a.category,
      stage: a.stage,
      ronda_number: a.ronda,
      songs: [],
      videos: [],
    };
    if (a.year === 2022 && a.category === 'pista') round.judges = PISTA_2022_JUDGES;
    if (a.group) round.group = a.group;
    db.rounds.push(round);
    added++;
  } else {
    merged++;
  }

  if (!round.videos.some(v => v.video_id === a.id)) {
    round.videos.push({
      video_id: a.id,
      url: `https://www.youtube.com/watch?v=${a.id}`,
      channel: CH,
      title: a.title,
    });
  } else {
    existed++;
  }
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log(`✅ 추가: ${added}개 round (+영상), ${merged}개 round에 영상 추가, ${existed}개 이미 존재`);
