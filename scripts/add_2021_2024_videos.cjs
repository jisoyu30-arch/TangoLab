// 2021~2024 Mundial 대회 영상 대량 추가 (영상만, 곡은 추후 보강)
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
function load(f) { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); }
function save(f, d) { fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2), 'utf8'); }

let roundsData = load('competition_rounds.json');

function roundId(year, stage, ronda) {
  const stMap = { qualifying: 'Q', quarterfinal: 'QF', semifinal: 'S', final: 'F' };
  return `R-Mundial${year}-PISTA-${stMap[stage]}${ronda}`;
}

function addVideoToRound(year, stage, ronda, videoId, videoTitle, channel) {
  const id = roundId(year, stage, ronda);
  let round = roundsData.rounds.find(r => r.round_id === id);
  if (!round) {
    round = {
      round_id: id,
      competition: 'Mundial',
      competition_id: 'COMP-001',
      year,
      category: 'tango_de_pista',
      stage,
      ronda_number: ronda,
      songs: [],
      videos: [],
    };
    roundsData.rounds.push(round);
  }
  // 중복 확인
  if (!round.videos.find(v => v.video_id === videoId)) {
    round.videos.push({
      video_id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      channel,
      title: videoTitle,
    });
  }
}

// === 데이터: [year, stage, ronda, videoId, videoTitle, channel] ===
const VIDEOS = [
  // === Mundial 2021 ===
  // Final Pista
  [2021, 'final', 1, 'plabVPh7KgM', 'Mundial de Tango Buenos Aires 2021 - Final - Ronda 1', 'AiresDeMilonga'],
  [2021, 'final', 2, 'umOosKWLhzo', 'Mundial de Tango Buenos Aires 2021 - Final - Ronda 2', 'AiresDeMilonga'],
  [2021, 'final', 3, '3RRrWK9ySBk', 'Mundial de Tango Buenos Aires 2021 - Final - Ronda 3', 'AiresDeMilonga'],
  [2021, 'final', 4, 'ioAbIugDmIw', 'Final Pista, Ronda 4 Mundial de Tango 2021, baile de tango Buenos Aires', 'AiresDeMilonga'],
  [2021, 'final', 5, 'cTvVJG5zKcw', 'Final Pista, Ronda 5 Mundial de Tango 2021, baile de tango', 'AiresDeMilonga'],
  [2021, 'final', 6, 'Qnl58Xb-hwc', 'Final Pista, Ronda 6 Mundial de Tango 2021, baile de tango', 'AiresDeMilonga'],
  // Semifinal Pista
  [2021, 'semifinal', 1, 'zP-TJ_2mDFw', 'Mundial de Tango Buenos Aires 2021 - Semi Final - Ronda 1', 'AiresDeMilonga'],
  [2021, 'semifinal', 2, 'E2l1oUTk-oA', 'Mundial de Tango Buenos Aires 2021 - Semi Final - Ronda 2', 'AiresDeMilonga'],
  [2021, 'semifinal', 3, '_qray5xBidM', 'Mundial de Tango Buenos Aires 2021 - Semi Final - Ronda 3', 'AiresDeMilonga'],
  [2021, 'semifinal', 4, 'nxcc6QrGGLI', 'Mundial de Tango Buenos Aires 2021 - Semi Final - Ronda 4', 'AiresDeMilonga'],
  [2021, 'semifinal', 5, 'X9oqQ1PaBpk', 'Mundial de Tango Buenos Aires 2021 - Semi Final - Ronda 5', 'AiresDeMilonga'],
  [2021, 'semifinal', 6, 'XuG4B8rX5xY', 'Mundial de Tango Buenos Aires 2021 - Semi Final - Ronda 6', 'AiresDeMilonga'],
  [2021, 'semifinal', 7, '0JcNHI7yBv8', 'Mundial de Tango Buenos Aires 2021 - Semi Final - Ronda 7', 'AiresDeMilonga'],
  [2021, 'semifinal', 8, 'F0V_ReJawfI', 'Mundial de Tango Buenos Aires 2021 - Semi Final - Ronda 8', 'AiresDeMilonga'],
  [2021, 'semifinal', 9, 'v187MaXwuEk', 'Mundial de Tango Buenos Aires 2021 - Semi Final - Ronda 9', 'AiresDeMilonga'],

  // === Mundial 2022 ===
  [2022, 'final', 1, 'sqQ1TYFHdSE', 'Mundial de Tango Buenos Aires 2022 - Final - Ronda 1', 'AiresDeMilonga'],
  [2022, 'final', 2, '6mRIbSEZzLg', 'Mundial de Tango Buenos Aires 2022 - Final - Ronda 2', 'AiresDeMilonga'],
  [2022, 'final', 3, 'WNT2zcr3t88', 'Mundial de Tango Buenos Aires 2022 - Final - Ronda 3', 'AiresDeMilonga'],
  [2022, 'final', 4, 'uPyHdQ_fTWs', 'Mundial de Tango Buenos Aires 2022 - Final - Ronda 4', 'AiresDeMilonga'],

  // === Mundial 2023 ===
  [2023, 'final', 1, 'ct732sKIfkA', '2023 Final Ronda 1 - Mundial de Tango Buenos Aires', 'AiresDeMilonga'],
  [2023, 'final', 2, 'YCbVDlJ5C5Q', '2023 Final Ronda 2 - Mundial de Tango Buenos Aires', 'AiresDeMilonga'],
  [2023, 'final', 3, 'QLtHy8suIKg', '2023 Final Ronda 3 - Mundial de Tango Buenos Aires', 'AiresDeMilonga'],
  [2023, 'final', 4, '4yUrYSBYazg', '2023 Final Ronda 4 - Mundial de Tango Buenos Aires', 'AiresDeMilonga'],

  // === Mundial 2024 ===
  // Final Pista (기존 R-MUNDIAL2024-PISTA-F 있지만 songs 없음)
  [2024, 'final', 1, 'tn_1QNxRg7A', 'R1 Final pista Mundial de tango 2024', 'AiresDeMilonga'],
  [2024, 'final', 2, '-tnOyBK2KWY', 'R2 Final pista Mundial de tango 2024', 'AiresDeMilonga'],
  [2024, 'final', 3, 'cCat_GQqvoc', 'R3 Mundial de tango 2024 final Pista', 'AiresDeMilonga'],
  [2024, 'final', 4, 'vfNkamPH9-M', 'R4 Final pista Mundial de tango 2024 final Pista', 'AiresDeMilonga'],
  // Additional Final Pista videos from PLoYWzYClvNovN8Ft9Q4DgY1CtAMf2PnrS
  [2024, 'final', 1, '5FezHVdu8L0', '2024 Final pista Ronda 1 Mundial de Tango Buenos Aires', 'Cachotango'],
  [2024, 'final', 2, 'VSvDvKccObU', '2024 Final pista Ronda 2 Mundial de Tango Buenos Aires', 'Cachotango'],
  [2024, 'final', 3, 'z43BwYxaEiM', '2024 Final pista Ronda 3 Mundial de Tango Buenos Aires', 'Cachotango'],
  [2024, 'final', 4, 'rawH5eJ9Y80', '2024 Final pista Ronda 4 Mundial de Tango Buenos Aires', 'Cachotango'],
  // Semifinal Pista - rondas 10-17 (1-9 이미 있음)
  [2024, 'semifinal', 10, 'XUI_yHilKJY', '2024 Semifinal pista Ronda 10 Mundial de Tango', 'Cachotango'],
  [2024, 'semifinal', 11, 'v_PgkvAVq5w', '2024 Semifinal pista Ronda 11 Mundial de Tango', 'Cachotango'],
  [2024, 'semifinal', 12, 'mA5djzApw7M', '2024 Semifinal pista Ronda 12 Mundial de Tango', 'Cachotango'],
  [2024, 'semifinal', 13, 'DTMO-bBgzHA', '2024 Semifinal pista Ronda 13 Mundial de Tango', 'Cachotango'],
  [2024, 'semifinal', 14, 'RSdTDNg_B1o', '2024 Semifinal pista Ronda 14 Mundial de Tango', 'Cachotango'],
  [2024, 'semifinal', 15, 'Ob1vntqY1s4', '2024 Semifinal pista Ronda 15 Mundial de Tango', 'Cachotango'],
  [2024, 'semifinal', 16, 'JSJXxFxb3LY', '2024 Semifinal pista Ronda 16 Mundial de Tango', 'Cachotango'],
  [2024, 'semifinal', 17, 'q8Qxs4Q88fE', '2024 Semifinal pista Ronda 17 Mundial de Tango', 'Cachotango'],
  // Additional Semifinal videos from AiresDeMilonga (PLoYWzYClvNovN8Ft9Q4DgY1CtAMf2PnrS)
  [2024, 'semifinal', 1, 'rsioqXQswCw', 'mundial de tango 2024 semifinal ronda 1', 'AiresDeMilonga'],
  [2024, 'semifinal', 2, 'dpH8CYEyZxo', 'mundial de tango 2024 semifinal ronda 2', 'AiresDeMilonga'],
  [2024, 'semifinal', 3, 'x8BtHWrYKIk', 'mundial de tango 2024 semifinal ronda 3', 'AiresDeMilonga'],
  [2024, 'semifinal', 4, 'xacwfi8wm0M', 'mundial de tango 2024 semifinal ronda 4', 'AiresDeMilonga'],
  [2024, 'semifinal', 5, 'Pgsm3LFZSOk', 'mundial de tango 2024 semifinal ronda 5', 'AiresDeMilonga'],
  [2024, 'semifinal', 6, 'xy3nRqdZpJg', 'mundial de tango 2024 semifinal ronda 6', 'AiresDeMilonga'],
  [2024, 'semifinal', 7, 'Jm5EOMocJQ8', 'mundial de tango 2024 semifinal ronda 7', 'AiresDeMilonga'],
  [2024, 'semifinal', 8, 'x-rnp4076yw', 'mundial de tango 2024 semifinal ronda 8', 'AiresDeMilonga'],
  [2024, 'semifinal', 9, 'lVkw5KRocZE', 'mundial de tango 2024 semifinal ronda 9', 'AiresDeMilonga'],
  // Qualifying Pista (Clasificatoria)
  [2024, 'qualifying', 4, '-aWhHncs6vM', 'Mundial de tango 2024 clasificatoria día 1 Ronda 4', 'AiresDeMilonga'],
  [2024, 'qualifying', 7, '4DzSl5t8sEA', 'Mundial de tango 2024 clasificatoria día 1 Ronda 7', 'AiresDeMilonga'],
  [2024, 'qualifying', 11, 'ZGb3YPAsJjw', 'Mundial de tango 2024 clasificatoria día 1 Ronda 11', 'AiresDeMilonga'],
  [2024, 'qualifying', 17, 'anTEzfrMJCs', 'Mundial de tango 2024 clasificatoria día 2 Ronda 7', 'AiresDeMilonga'], // day2 R7 = overall ~17
  [2024, 'qualifying', 22, 'pcPaWzy2YRo', 'Mundial de tango 2024 clasificatoria día 2 Ronda 11', 'AiresDeMilonga'],
  [2024, 'qualifying', 23, '8amhu2vDGR0', 'Mundial de tango 2024 clasificatoria día 2 Ronda 12', 'AiresDeMilonga'],
  [2024, 'qualifying', 27, 'GbRgiYfiKM4', 'Mundial de tango 2024 clasificatoria día 2 Ronda 16', 'AiresDeMilonga'],
  [2024, 'qualifying', 28, 'mtNiPpdOGho', 'Mundial de tango 2024 clasificatoria día 2 Ronda 17', 'AiresDeMilonga'],
  [2024, 'qualifying', 29, 'IrQSmEqiCSA', 'Mundial de tango 2024 clasificatoria día 2 Ronda 18', 'AiresDeMilonga'],
  [2024, 'qualifying', 34, '1uH735e9HzI', 'ronda de clasificación N 34 mundial de tango 2024', 'AiresDeMilonga'],
  // Additional 2024 Semifinal videos from AiresDeMilonga main channel (R1-R13)
  [2024, 'semifinal', 1, 'COzZ83KxT-0', 'R1 Mundial de tango 2024 Semifinal Baile Pista Ronda 1', 'AiresDeMilonga'],
  [2024, 'semifinal', 2, '2DnQir5q8Zc', 'R2 Mundial de tango 2024 Semifinal Baile Pista Ronda 2', 'AiresDeMilonga'],
  [2024, 'semifinal', 6, 'E-tb60kR2oo', 'R 6 Mundial de tango 2024 Semifinal Baile Pista Ronda 6', 'AiresDeMilonga'],
  [2024, 'semifinal', 7, 'W_FWYSqZBn0', 'R7 Mundial de tango 2024 Semifinal Baile Pista Ronda 7', 'AiresDeMilonga'],
  [2024, 'semifinal', 13, 'Yh11qFe7py8', 'R13 Mundial de tango 2024 Semifinal Baile Pista Ronda 13', 'AiresDeMilonga'],

  // === Mundial 2025 Final (not yet added) ===
  [2025, 'final', 1, 'U-E7EPi31xw', 'Pista Final - 2025 Pacific Tango Championship (actually Mundial 2025)', '한선우'],
];

let added = 0;
let newRounds = 0;
const seenRounds = new Set(roundsData.rounds.map(r => r.round_id));

for (const [year, stage, ronda, vid, title, channel] of VIDEOS) {
  const id = roundId(year, stage, ronda);
  if (!seenRounds.has(id)) newRounds++;
  seenRounds.add(id);
  addVideoToRound(year, stage, ronda, vid, title, channel);
  added++;
}

save('competition_rounds.json', roundsData);

console.log('=== 2021-2024 Mundial Videos ===');
console.log('Videos processed:', added);
console.log('New rounds created:', newRounds);
console.log('Total rounds:', roundsData.rounds.length);
