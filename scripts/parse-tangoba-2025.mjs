#!/usr/bin/env node
// Parse tangoba.org PDF text exports into mundial_participants structure
// Usage: node scripts/parse-tangoba-2025.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TXT_DIR = path.join(__dirname, '..', 'data-sources', 'tangoba', 'txt');
const OUT = path.join(__dirname, '..', 'src', 'data', 'mundial_participants_2025.json');

const STAGES = [
  { file: 'Resultados-Pista-Clasificatorias-2025-23_8-A.txt', stage: 'clasificatoria', group: 'A', date: '2025-08-23', judges: 5 },
  { file: 'Resultados-Pista-Clasificatorias-2025-23_8-B.txt', stage: 'clasificatoria', group: 'B', date: '2025-08-23', judges: 5 },
  { file: 'Pista-Clasificatorias-2025-24_8-C-resultados.txt', stage: 'clasificatoria', group: 'C', date: '2025-08-24', judges: 5 },
  { file: 'Pista-Clasificatorias-2025-24_8-D-resultados.txt', stage: 'clasificatoria', group: 'D', date: '2025-08-24', judges: 5 },
  { file: 'Jurados-_-Pista-Cuartos-2025-27_8-A-resultados.txt', stage: 'cuartos', group: 'A', date: '2025-08-27', judges: 5 },
  { file: 'Jurados-_-Pista-Cuartos-2025-27_8-B-resultados.txt', stage: 'cuartos', group: 'B', date: '2025-08-27', judges: 5 },
  { file: 'Pista-Semis-2025-29_8-JURADOS-_-RONDAS-TODAS-29_8-1.txt', stage: 'semifinal', group: null, date: '2025-08-29', judges: 6 },
  { file: 'Pista-FINAL-2025.txt', stage: 'final', group: null, date: '2025-09-01', judges: 7 },
];

function parseStage({ file, stage, group, date, judges }) {
  const fullPath = path.join(TXT_DIR, file);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  const lines = raw.split('\n');

  // 타이틀/헤더/빈줄 스킵하고 데이터 줄만
  const dataLines = lines.filter(line => {
    const t = line.trim();
    if (!t) return false;
    if (/^(JURADO|RONDA|\d+z)/.test(t)) return false;
    if (/^z\s*$/.test(t)) return false;
    if (/^(Rodriguez|Quiroga|Bogado|Castellano|Balmaceda|Hoeffner)/i.test(t)) return false; // header continuation
    return /^\d+[A-Za-z]?\s/.test(t);
  });

  const couples = [];
  const expectedNumbers = judges + 1; // 점수 + promedio
  const floatRe = /\d+\.\d{3}/g;

  for (const line of dataLines) {
    // 오른쪽에서부터 expectedNumbers 개의 float 추출
    const floats = [...line.matchAll(floatRe)];
    if (floats.length < expectedNumbers) continue;
    const scoreMatches = floats.slice(-expectedNumbers);
    const firstScorePos = scoreMatches[0].index;
    const head = line.substring(0, firstScorePos).trim();
    // head = "RONDA PAREJA Leader  Follower"
    // RONDA은 숫자 또는 숫자+문자(예: "1B", "9B")
    const m = head.match(/^(\d+[A-Za-z]?)\s+(\d+)\s+(.+)$/);
    if (!m) continue;
    const rondaStr = m[1];
    const ronda = parseInt(rondaStr.match(/^\d+/)[0]);
    const rondaSuffix = rondaStr.match(/[A-Za-z]$/)?.[0] ?? null;
    const pareja = parseInt(m[2]);
    const names = m[3];

    // Leader / Follower 분리: 가운데 큰 공백 기준 (3+ 스페이스) 또는 탭
    let leader = '', follower = '';
    const splitMatch = names.match(/^(.+?)\s{3,}(.+)$/);
    if (splitMatch) {
      leader = splitMatch[1].trim();
      follower = splitMatch[2].trim();
    } else {
      // fallback: 절반으로 자르기 (드문 케이스)
      const half = Math.floor(names.length / 2);
      leader = names.substring(0, half).trim();
      follower = names.substring(half).trim();
    }

    const scores = scoreMatches.slice(0, judges).map(m => parseFloat(m[0]));
    const promedio = parseFloat(scoreMatches[judges][0]);

    couples.push({ ronda, pareja, leader, follower, scores, promedio });
  }

  // Rank 부여: promedio 내림차순
  const sorted = [...couples].sort((a, b) => b.promedio - a.promedio);
  sorted.forEach((c, i) => { c.rank = i + 1; });

  return { stage, group, date, judges_count: judges, couples };
}

// 전체 파싱
const parsed = {};
for (const spec of STAGES) {
  const key = spec.group ? `${spec.stage}_${spec.group}` : spec.stage;
  parsed[key] = parseStage(spec);
  console.log(`✓ ${key}: ${parsed[key].couples.length}커플`);
}

// 진출 체인 매핑: pareja → {clasificatoria, cuartos, semifinal, final}
const parejaIndex = new Map();

function indexStage(stageKey, data) {
  for (const c of data.couples) {
    if (!parejaIndex.has(c.pareja)) {
      parejaIndex.set(c.pareja, { pareja: c.pareja, leader: c.leader, follower: c.follower, stages: {} });
    }
    const entry = parejaIndex.get(c.pareja);
    // 이름 업데이트 (final 데이터가 가장 권위 있음)
    if (stageKey === 'final' || stageKey.startsWith('semifinal')) {
      entry.leader = c.leader;
      entry.follower = c.follower;
    }
    entry.stages[stageKey] = {
      ronda: c.ronda,
      rank: c.rank,
      promedio: c.promedio,
      scores: c.scores,
    };
  }
}

for (const [key, data] of Object.entries(parsed)) indexStage(key, data);

// Ronda별 집계 (Clasificatoria 그룹 A/B/C/D → ronda 1~16)
// group별 ronda 범위 확인
const rondaRange = { A: [], B: [], C: [], D: [] };
for (const group of ['A', 'B', 'C', 'D']) {
  const key = `clasificatoria_${group}`;
  if (!parsed[key]) continue;
  const rondas = new Set(parsed[key].couples.map(c => c.ronda));
  rondaRange[group] = [...rondas].sort((a, b) => a - b);
  console.log(`  ${group} rondas:`, rondaRange[group].join(','));
}

// 최종 구조
const output = {
  year: 2025,
  competition: 'Mundial',
  category: 'pista',
  stages: parsed,
  ronda_ranges: rondaRange,
  // 전체 참가자 인덱스 (진출 체인 포함)
  participants_index: Object.fromEntries(parejaIndex),
  summary: {
    clasificatoria_total: Object.values(parsed).filter((_, i) => i < 4).reduce((sum, s) => sum + s.couples.length, 0),
    cuartos_total: (parsed.cuartos_A?.couples.length ?? 0) + (parsed.cuartos_B?.couples.length ?? 0),
    semifinal_total: parsed.semifinal?.couples.length ?? 0,
    final_total: parsed.final?.couples.length ?? 0,
    parejas_unique: parejaIndex.size,
  },
};

fs.writeFileSync(OUT, JSON.stringify(output, null, 2), 'utf-8');
console.log(`\n✅ Wrote ${OUT}`);
console.log('Summary:', output.summary);

// Sanity check: pareja 116 (known 2025 data)
const p116 = parejaIndex.get(116);
console.log('\nPareja 116 chain:', p116 ? JSON.stringify(p116, null, 2) : 'NOT FOUND');
// Final winner: pareja 530
const p530 = parejaIndex.get(530);
console.log('\nPareja 530 (expected winner) chain:', p530 ? JSON.stringify(p530, null, 2) : 'NOT FOUND');
