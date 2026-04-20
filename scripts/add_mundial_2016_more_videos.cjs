// Mundial 2016 Clasif 추가 영상 (영상만, 곡은 추후 보강)
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
function load(f) { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); }
function save(f, d) { fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2), 'utf8'); }

let roundsData = load('competition_rounds.json');

function addRoundWithVideo(year, stage, ronda, videoId, title, channel) {
  const stMap = { qualifying: 'Q', quarterfinal: 'QF', semifinal: 'SF', final: 'F' };
  const id = `R-MUNDIAL${year}-PISTA-${stMap[stage]}${ronda}`;
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
  if (!round.videos.find(v => v.video_id === videoId)) {
    round.videos.push({
      video_id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      channel,
      title,
    });
  }
}

const VIDEOS = [
  [2016, 'qualifying', 6, 'B6Sv6i0HrKk', 'Mundial de Tango 2016, Clasificatoria pista Ronda 6', 'AiresDeMilonga'],
  [2016, 'qualifying', 7, 'Yrc9eflpGns', 'Mundial de Tango 2016, Clasificatoria pista Ronda 7', 'AiresDeMilonga'],
  [2016, 'qualifying', 8, 't5KypJq4zws', 'Mundial de Tango 2016, Clasificatoria pista Ronda 8', 'AiresDeMilonga'],
  [2016, 'qualifying', 9, 'vctHaxAxOu4', 'Mundial de Tango 2016, Clasificatoria pista Ronda 9', 'AiresDeMilonga'],
];

for (const [year, stage, ronda, vid, title, channel] of VIDEOS) {
  addRoundWithVideo(year, stage, ronda, vid, title, channel);
}

save('competition_rounds.json', roundsData);

console.log('=== Mundial 2016 Clasif 추가 영상 ===');
console.log('Videos added:', VIDEOS.length);
console.log('Total rounds:', roundsData.rounds.length);
