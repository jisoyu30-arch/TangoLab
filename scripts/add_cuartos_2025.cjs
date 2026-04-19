// Mundial 2025 Cuartos de Final 데이터 추가
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
function load(f) { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); }
function save(f, d) { fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2), 'utf8'); }

let songs = load('songs.json');
let appearances = load('appearances.json');
let roundsData = load('competition_rounds.json');
let orchestras = load('orchestras.json');

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
  // check orchestras
  for (const o of orchestras) {
    if (o.orchestra_name.toLowerCase().includes(q.split(' ')[0])) return o.orchestra_id;
  }
  return null;
}

function findOrAddSong(title, orch, vocalist) {
  const tl = title.toLowerCase().trim();
  const existing = songs.find(s => {
    if (s.title.toLowerCase().trim() !== tl) return false;
    if (!orch) return true;
    const so = (s.orchestra || '').toLowerCase();
    const keys = orch.toLowerCase().split(' ');
    return keys.some(k => k.length > 3 && so.includes(k));
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
    source_confidence: 'B',
    evidence_note: 'Mundial 2025 Cuartos de Final MC 멘트 자동 자막 파싱',
    competition_popularity_score: 1,
  };
  songs.push(newSong);
  return newSong;
}

function addAppearance(songId, year, stage, rondaNum, videoUrl, videoId, orderInRound) {
  appearances.push({
    appearance_id: `APP-${String(nextAppId++).padStart(3,'0')}`,
    song_id: songId,
    competition_id: 'COMP-001',
    year,
    category: 'tango_de_pista',
    stage,
    round_label: `Cuartos R${rondaNum}`,
    song_order_in_round: orderInRound,
    set_order_if_known: null,
    linked_official_result: null,
    status: 'confirmed',
    source_url: videoUrl,
    source_type: 'youtube',
    source_confidence: 'B',
    evidence_note: `YouTube ${videoId} MC 멘트 자동 자막 파싱`,
  });
}

function addOrUpdateRound(year, stage, ronda, songEntries, videoEntries) {
  const stMap = { qualifying: 'Q', quarterfinal: 'QF', semifinal: 'S', final: 'F' };
  const id = `R-Mundial${year}-PISTA-${stMap[stage]}${ronda}`;
  const existingIdx = roundsData.rounds.findIndex(r => r.round_id === id);
  const round = {
    round_id: id,
    competition: 'Mundial',
    competition_id: 'COMP-001',
    year, category: 'tango_de_pista', stage,
    ronda_number: ronda,
    songs: songEntries,
    videos: videoEntries,
  };
  if (existingIdx >= 0) roundsData.rounds[existingIdx] = round;
  else roundsData.rounds.push(round);
}

// === Cuartos de Final 2025 데이터 ===
// MC 파서 + 스크린샷 검증으로 식별한 곡들
const CUARTOS = [
  { ronda: 1, vid: 'RlJ6mv32f_o', songs: [] },
  { ronda: 2, vid: 'OOaANK3dMwg', songs: [
    ['Tristeza Marina', 'Carlos Di Sarli y su Orquesta Típica', 'Roberto Rufino'],
    ['Recuerdo', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['Maipo', "Juan D'Arienzo y su Orquesta Típica", null],
  ]},
  { ronda: 3, vid: 'cL2gyR31VUs', songs: [
    ['Un Tango Y Nada Más', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Pata Ancha', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['El Marne', "Juan D'Arienzo y su Orquesta Típica", null],
  ]},
  { ronda: 4, vid: '35JYhjkkPbM', songs: [] },
  { ronda: 5, vid: 'pMusrMZKlmo', songs: [] },
  { ronda: 6, vid: 'E6UX-ZlsW4Y', songs: [
    ['Verdemar', 'Miguel Caló y su Orquesta Típica', 'Raúl Iriarte'],
    ['Gallo Ciego', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['Olvídame', "Juan D'Arienzo y su Orquesta Típica", 'Alberto Echagüe'],
  ]},
  { ronda: 7, vid: 'RdKRDsCowX0', songs: [] },
  { ronda: 8, vid: 'Jgc1dOHk8dw', songs: [] }, // 파싱 실패 - 부분 데이터만
  { ronda: 9, vid: '937iNiTvGRM', songs: [] },
  { ronda: 10, vid: 'tgbDB_S9VBg', songs: [
    ['Lejos de Buenos Aires', 'Miguel Caló y su Orquesta Típica', 'Raúl Berón'],
    ['La Que Nunca Tuvo Novio', 'Pedro Laurenz y su Orquesta Típica', 'Alberto Podestá'],
    ['9 de Julio', "Juan D'Arienzo y su Orquesta Típica", null],
  ]},
  { ronda: 11, vid: 'qRVgqFvEyYM', songs: [] },
  { ronda: 12, vid: 'Qj6pekKMzvc', songs: [] },
  { ronda: 13, vid: 'OYhVGTHEy84', songs: [] },
  { ronda: 14, vid: 'eXDNAdw9CDk', songs: [] },
  { ronda: 15, vid: 'gvfvvVGhm44', songs: [] },
  { ronda: 16, vid: 'fB01vUx1mLo', songs: [] },
  { ronda: 17, vid: 'Ds4EsMruBpI', songs: [] },
  { ronda: 18, vid: '9jjqimr7-TE', songs: [] },
  { ronda: 19, vid: 'TxJ71ZjjipI', songs: [] },
  { ronda: 20, vid: 'JRxSH7VHLbE', songs: [] },
  { ronda: 21, vid: 'm5Gc5be9v3E', songs: [] },
  { ronda: 22, vid: '7q3m96Av0-c', songs: [] },
  { ronda: 23, vid: 'ezTzPZTPQ8M', songs: [] },
  { ronda: 24, vid: 'dGcj3ncSaCI', songs: [] },
  { ronda: 25, vid: 'ubX2684RbCg', songs: [] },
  { ronda: 26, vid: 'C6CGu28VEX8', songs: [] },
  { ronda: 27, vid: 'OveXhcHS2PQ', songs: [] },
  { ronda: 28, vid: '7TDUt8a7XSI', songs: [] },
  { ronda: 29, vid: 'C27ypflrI5s', songs: [] },
  { ronda: 30, vid: '9gsmAvCHq6k', songs: [] },
];

let addedAppearances = 0;
for (const entry of CUARTOS) {
  const songEntries = [];
  for (let i = 0; i < entry.songs.length; i++) {
    const [title, orch, vocalist] = entry.songs[i];
    const song = findOrAddSong(title, orch, vocalist);
    songEntries.push({
      song_id: song.song_id,
      title: song.title,
      orchestra: orch || '',
      order: i + 1,
    });
    addAppearance(song.song_id, 2025, 'quarterfinal', entry.ronda,
      `https://www.youtube.com/watch?v=${entry.vid}`, entry.vid, i + 1);
    addedAppearances++;
  }
  const videoEntries = [{
    video_id: entry.vid,
    url: `https://www.youtube.com/watch?v=${entry.vid}`,
    channel: 'Jose Valverde',
    title: `Ronda ${String(entry.ronda).padStart(2, '0')} Cuartos de Final Tango Pista 2025`,
  }];
  addOrUpdateRound(2025, 'quarterfinal', entry.ronda, songEntries, videoEntries);
}

save('songs.json', songs);
save('appearances.json', appearances);
save('competition_rounds.json', roundsData);

console.log('=== Mundial 2025 Cuartos de Final ===');
console.log('Rounds added:', CUARTOS.length);
console.log('Appearances added:', addedAppearances);
console.log('Total songs:', songs.length);
console.log('Total appearances:', appearances.length);
console.log('Total rounds:', roundsData.rounds.length);
