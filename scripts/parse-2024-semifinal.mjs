#!/usr/bin/env node
// 2024 Mundial Pista Semifinal 스코어 데이터 파싱
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TXT = path.join(__dirname, '..', 'data-sources', 'tangoba', 'txt', 'Resultados-semifinal-pista-2024.txt');
const OUT = path.join(__dirname, '..', 'src', 'data', 'mundial_participants_2024.json');

const raw = fs.readFileSync(TXT, 'utf-8');
const lines = raw.split('\n');

const dataLines = lines.filter(line => {
  const t = line.trim();
  if (!t) return false;
  if (/^(PAREJA|Puntajes|País|Nombre|Olga|Cristina|Javier|Ricardo|Adrian|Ines)/i.test(t)) return false;
  return /^\d+\s/.test(t);
});

const judges = 6;
const expectedNumbers = judges + 1;
const floatRe = /\d+\.\d{2,}/g;

const couples = [];
for (const line of dataLines) {
  const floats = [...line.matchAll(floatRe)];
  if (floats.length < expectedNumbers) continue;
  const scoreMatches = floats.slice(-expectedNumbers);
  const firstScorePos = scoreMatches[0].index;
  const head = line.substring(0, firstScorePos).trim();

  // PAREJA + name1 + name2 + country
  const m = head.match(/^(\d+)\s+(.+)$/);
  if (!m) continue;
  const pareja = parseInt(m[1]);
  const rest = m[2];

  // 오른쪽부터 country 추출 (주로 단어 1~3개)
  // Names 분리: 큰 공백 기준
  const parts = rest.split(/\s{2,}/).filter(x => x.trim());
  let leader = '', follower = '', country = '';
  if (parts.length >= 3) {
    leader = parts[0];
    follower = parts[1];
    country = parts.slice(2).join(' ').trim();
  } else if (parts.length === 2) {
    leader = parts[0];
    follower = parts[1];
  }

  const scores = scoreMatches.slice(0, judges).map(m => parseFloat(m[0]));
  const promedio = parseFloat(scoreMatches[judges][0]);

  couples.push({ pareja, leader, follower, country, scores, promedio });
}

// Rank
couples.sort((a, b) => b.promedio - a.promedio);
couples.forEach((c, i) => { c.rank = i + 1; });

const output = {
  year: 2024,
  competition: 'Mundial',
  category: 'pista',
  stages: {
    semifinal: {
      stage: 'semifinal',
      group: null,
      date: '2024-08-25',
      judges_count: 6,
      judges: ['Olga Besio', 'Cristina Sosa', 'Javier Rodriguez', 'Ricardo Barrios', 'Adrian Veredice', 'Ines Muzzopappa'],
      couples,
    },
  },
  summary: {
    semifinal_total: couples.length,
  },
};

fs.writeFileSync(OUT, JSON.stringify(output, null, 2), 'utf-8');
console.log('✅ Parsed 2024 Semifinal:', couples.length, 'couples');
console.log('Top 10:');
for (const c of couples.slice(0, 10)) {
  console.log('  #' + String(c.pareja).padStart(3), c.rank + '위', (c.leader + ' & ' + c.follower).padEnd(50), c.promedio.toFixed(3), '| ' + (c.country || '?'));
}
