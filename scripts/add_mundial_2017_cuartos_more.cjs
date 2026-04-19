// Mundial 2017 Final + Cuartos 추가 파싱 결과 추가
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
function load(f) { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); }
function save(f, d) { fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2), 'utf8'); }

let songs = load('songs.json');
let appearances = load('appearances.json');
let roundsData = load('competition_rounds.json');

let nextSongId = Math.max(...songs.map(s => parseInt(s.song_id.replace('SONG-','')))) + 1;
let nextAppId = Math.max(...appearances.map(a => parseInt(a.appearance_id.replace('APP-','')))) + 1;

function findOrchId(query) {
  if (!query) return null;
  const q = query.toLowerCase();
  if (q.includes('arienzo')) return 'ORCH-001';
  if (q.includes('di sarli') || q.includes('sarli')) return 'ORCH-002';
  if (q.includes('pugliese')) return 'ORCH-003';
  if (q.includes('tanturi')) return 'ORCH-004';
  if (q.includes('troilo')) return 'ORCH-005';
  if (q.includes('laurenz')) return 'ORCH-006';
  if (q.includes('calo') || q.includes('caló')) return 'ORCH-007';
  if (q.includes('agostino')) return 'ORCH-008';
  if (q.includes('biagi')) return 'ORCH-009';
  if (q.includes('fresedo')) return 'ORCH-011';
  if (q.includes('demare')) return 'ORCH-015';
  if (q.includes('gobbi')) return 'ORCH-016';
  return null;
}

function findOrAddSong(title, orch, vocalist, confidence = 'A') {
  const tl = title.toLowerCase().trim();
  const existing = songs.find(s => {
    if (s.title.toLowerCase().trim() !== tl) return false;
    if (!orch) return true;
    const so = (s.orchestra || '').toLowerCase();
    const key = orch.toLowerCase().split(' ')[0];
    return key.length > 2 && so.includes(key);
  });
  if (existing) return existing;

  const newSong = {
    song_id: `SONG-${String(nextSongId++).padStart(3,'0')}`,
    title,
    alt_titles: [],
    genre: 'tango',
    orchestra: orch,
    orchestra_id: findOrchId(orch),
    vocalist,
    recording_date: null,
    composer: null,
    lyricist: null,
    mood_tags: [],
    tempo: 'medium',
    dance_notes: null,
    source_confidence: confidence,
    evidence_note: 'Mundial 영상 description/자막 파싱',
    competition_popularity_score: 2,
  };
  songs.push(newSong);
  return newSong;
}

function addAppearance(songId, year, stage, rondaNum, videoUrl, videoId, orderInRound, confidence = 'A') {
  appearances.push({
    appearance_id: `APP-${String(nextAppId++).padStart(3,'0')}`,
    song_id: songId,
    competition_id: 'COMP-001',
    year,
    category: 'tango_de_pista',
    stage,
    round_label: `R${rondaNum}`,
    song_order_in_round: orderInRound,
    set_order_if_known: null,
    linked_official_result: null,
    status: 'confirmed',
    source_url: videoUrl,
    source_type: 'youtube',
    source_confidence: confidence,
    evidence_note: videoId ? `YouTube ${videoId} 파싱` : 'Research',
  });
}

function addOrUpdateRound(year, stage, ronda, songEntries, videoEntries) {
  const stMap = { qualifying: 'Q', quarterfinal: 'QF', semifinal: 'S', final: 'F' };
  const id = `R-Mundial${year}-PISTA-${stMap[stage]}${ronda}`;
  const existingIdx = roundsData.rounds.findIndex(r => r.round_id === id);
  if (existingIdx >= 0) {
    const existing = roundsData.rounds[existingIdx];
    roundsData.rounds[existingIdx] = {
      ...existing,
      songs: songEntries.length > 0 ? songEntries : existing.songs,
      videos: videoEntries.length > 0 ? [...existing.videos.filter(v => !videoEntries.find(nv => nv.video_id === v.video_id)), ...videoEntries] : existing.videos,
    };
  } else {
    roundsData.rounds.push({
      round_id: id,
      competition: 'Mundial',
      competition_id: 'COMP-001',
      year, category: 'tango_de_pista', stage,
      ronda_number: ronda,
      songs: songEntries,
      videos: videoEntries,
    });
  }
}

// === Mundial 2017 Final (Tango Master 채널 description에서 추출) ===
const M2017 = [
  { ronda: 1, songs: [
    ['Indio Manso', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Malvón', 'Ricardo Tanturi y su Orquesta Típica', 'Enrique Campos'],
    ['El Flete', "Juan D'Arienzo y su Orquesta Típica", null],
  ]},
  { ronda: 2, songs: [
    ['El Amanecer', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Mala Estampa', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['El Puntazo', "Juan D'Arienzo y su Orquesta Típica", null],
  ]},
  { ronda: 3, songs: [
    ['Comme Il Faut', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Más Solo Que Nunca', "Ángel D'Agostino y su Orquesta Típica", 'Ángel Vargas'],
    ['Pof Pof', "Juan D'Arienzo y su Orquesta Típica", null],
  ]},
  { ronda: 4, songs: [
    ['A La Gran Muñeca', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Bailongo De Los Domingos', 'Ricardo Tanturi y su Orquesta Típica', 'Alberto Castillo'],
    ['El Resero', "Juan D'Arienzo y su Orquesta Típica", null],
  ]},
];

let added = 0;
for (const r of M2017) {
  const songEntries = [];
  for (let i = 0; i < r.songs.length; i++) {
    const [title, orch, vocalist] = r.songs[i];
    const song = findOrAddSong(title, orch, vocalist);
    songEntries.push({
      song_id: song.song_id,
      title: song.title,
      orchestra: orch || '',
      order: i + 1,
    });
    const videoUrl = 'https://www.youtube.com/watch?v=xe0cwxFxdUg';
    addAppearance(song.song_id, 2017, 'final', r.ronda, videoUrl, 'xe0cwxFxdUg', i + 1);
    added++;
  }
  const videoEntries = [{
    video_id: 'xe0cwxFxdUg',
    url: 'https://www.youtube.com/watch?v=xe0cwxFxdUg',
    channel: 'Tango Master',
    title: '2017 탱고피스타 결승 / Tango Music of Mundial 2017, Final Tango Pista',
  }];
  addOrUpdateRound(2017, 'final', r.ronda, songEntries, videoEntries);
}

// === Mundial 2025 Cuartos Ronda 14 (MC 자막 - 부분 확실) ===
// "el trompito Ángel Agostino, Ángel Vargas" — 확실한 부분만
const C_R14 = {
  ronda: 14,
  vid: 'eXDNAdw9CDk',
  songs: [
    ['El Trompito', "Ángel D'Agostino y su Orquesta Típica", 'Ángel Vargas'],
  ],
};
for (let i = 0; i < C_R14.songs.length; i++) {
  const [title, orch, vocalist] = C_R14.songs[i];
  const song = findOrAddSong(title, orch, vocalist, 'B');
  addAppearance(song.song_id, 2025, 'quarterfinal', C_R14.ronda,
    `https://www.youtube.com/watch?v=${C_R14.vid}`, C_R14.vid, i + 1, 'B');
  added++;
}
// Don't overwrite videos here — just add song (partial data)
const r14 = roundsData.rounds.find(r => r.round_id === `R-Mundial2025-PISTA-QF14`);
if (r14 && r14.songs.length === 0) {
  r14.songs = C_R14.songs.map((s, i) => ({
    song_id: songs.find(sg => sg.title === s[0])?.song_id || '',
    title: s[0],
    orchestra: s[1],
    order: i + 1,
  }));
}

// === Mundial 2025 Cuartos Ronda 17 ===
// "Buscándote Osvaldo Fresedo, Ricardo Ruiz" — 확실한 부분만
const C_R17 = {
  ronda: 17,
  vid: 'Ds4EsMruBpI',
  songs: [
    ['Buscándote', 'Osvaldo Fresedo y su Orquesta Típica', 'Ricardo Ruiz'],
  ],
};
for (let i = 0; i < C_R17.songs.length; i++) {
  const [title, orch, vocalist] = C_R17.songs[i];
  const song = findOrAddSong(title, orch, vocalist, 'B');
  addAppearance(song.song_id, 2025, 'quarterfinal', C_R17.ronda,
    `https://www.youtube.com/watch?v=${C_R17.vid}`, C_R17.vid, i + 1, 'B');
  added++;
}
const r17 = roundsData.rounds.find(r => r.round_id === `R-Mundial2025-PISTA-QF17`);
if (r17 && r17.songs.length === 0) {
  r17.songs = C_R17.songs.map((s, i) => ({
    song_id: songs.find(sg => sg.title === s[0])?.song_id || '',
    title: s[0],
    orchestra: s[1],
    order: i + 1,
  }));
}

save('songs.json', songs);
save('appearances.json', appearances);
save('competition_rounds.json', roundsData);

console.log('=== Mundial 2017 Final + 2025 Cuartos 부분 ===');
console.log('Appearances added:', added);
console.log('Total songs:', songs.length);
console.log('Total appearances:', appearances.length);
console.log('Total rounds:', roundsData.rounds.length);
