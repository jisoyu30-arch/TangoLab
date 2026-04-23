#!/usr/bin/env node
// "Mundial Historic" 가짜 채널명을 실제 채널로 교체
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'competition_rounds.json');
const db = JSON.parse(fs.readFileSync(DATA, 'utf-8'));

// yt-dlp로 확인한 실제 채널 매핑
const REAL_CHANNELS = {
  'T77ZAGA51Yk': '030tango',
  'cMnMw9fawWc': '030tango',
  'CR7DtooCTd8': '030tango',
  '-0u2rpGWzKk': '030tango',
  'QaqYafuw_mA': 'Molinotango Ricardo Rosales',
  'P9qi48vBcmE': 'Jose Paulo Santos',
  'vnnaWjvBRiU': 'Jose Paulo Santos',
  'DKViJpvns6Y': 'Jose Paulo Santos',
  '4yIniZfl6qs': 'Jose Paulo Santos',
  '8M5RQYwDU70': 'Tangotrazo',
  '5MuqBheqezw': 'Tangotrazo',
  'M1lTkYr8_hk': 'Tangotrazo',
  'vlWDSM0K7wk': 'AiresDeMilonga',
  '7uOaTqjMV3Q': 'AiresDeMilonga',
  '2I6Yh8xG5Ao': 'AiresDeMilonga',
  '29jx0yhhu6E': 'AiresDeMilonga',
  '30GJqFfmREw': 'AiresDeMilonga',
  'aTfXAbAbIbA': 'AiresDeMilonga',
  '97la7GiZyX0': 'AiresDeMilonga',
  'TQeJS1q6XlE': 'AiresDeMilonga',
  'KvoQiZSZr9M': 'AiresDeMilonga',
  'Ne8bZ-QI4cU': 'AiresDeMilonga',
  'cQ3Tx6eIfzc': 'AiresDeMilonga',
  'SNRS37r--cU': 'AiresDeMilonga',
  '0mT32f1FrAw': 'puntotango',
  'XxuKPIdKobU': 'puntotango',
  '5FZEkS6Fbao': 'Darcostango',
  'QxuOWjELtjU': '2XTANGO TV',
  'mgRuJvrQ3kY': '2XTANGO TV',
  '7Ue-VUvFYLA': '2XTANGO TV',
  '4pijVQApVvQ': '2XTANGO TV',
  'z5ZvfkcfhqA': '2XTANGO TV',
  'Fgq6n96kgAo': '2XTANGO TV',
};

let fixed = 0;
for (const r of db.rounds) {
  for (const v of (r.videos || [])) {
    if (v.channel === 'Mundial Historic' && REAL_CHANNELS[v.video_id]) {
      v.channel = REAL_CHANNELS[v.video_id];
      fixed++;
    }
  }
}

fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8');
console.log('✓ 채널 교체:', fixed, '개');

// 사용된 실제 채널 목록
const uniqueChannels = new Set(Object.values(REAL_CHANNELS));
console.log('  실제 채널:', [...uniqueChannels].join(', '));
