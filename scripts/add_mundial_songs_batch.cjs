// Mundial 2019/2022/2023/2024/2025 곡 데이터 추가 (스크린샷 + 리서치 기반)
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

function findOrAddSong(title, orch, vocalist) {
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
    source_confidence: 'A',
    evidence_note: 'Mundial/대회 공식 영상 스크린샷 + 리서치',
    competition_popularity_score: 2,
  };
  songs.push(newSong);
  return newSong;
}

function addAppearance(songId, compId, year, category, stage, rondaNum, videoUrl, videoId, orderInRound, confidence = 'A') {
  appearances.push({
    appearance_id: `APP-${String(nextAppId++).padStart(3,'0')}`,
    song_id: songId,
    competition_id: compId,
    year,
    category,
    stage,
    round_label: `R${rondaNum}`,
    song_order_in_round: orderInRound,
    set_order_if_known: null,
    linked_official_result: null,
    status: 'confirmed',
    source_url: videoUrl,
    source_type: 'youtube',
    source_confidence: confidence,
    evidence_note: videoId ? `YouTube ${videoId} 스크린샷 + 리서치 확인` : '공식 세트리스트',
  });
}

function findRound(year, stage, ronda) {
  const stMap = { qualifying: 'Q', quarterfinal: 'QF', semifinal: 'S', final: 'F' };
  const id = `R-Mundial${year}-PISTA-${stMap[stage]}${ronda}`;
  return roundsData.rounds.find(r => r.round_id === id);
}

function addOrUpdateRound(year, stage, ronda, songEntries, videoEntries) {
  const stMap = { qualifying: 'Q', quarterfinal: 'QF', semifinal: 'S', final: 'F' };
  const id = `R-Mundial${year}-PISTA-${stMap[stage]}${ronda}`;
  const existingIdx = roundsData.rounds.findIndex(r => r.round_id === id);
  if (existingIdx >= 0) {
    // 기존 영상은 유지하고 곡만 업데이트
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
      year,
      category: 'tango_de_pista',
      stage,
      ronda_number: ronda,
      songs: songEntries,
      videos: videoEntries,
    });
  }
}

// === 곡 데이터 ===
// [year, stage, ronda, videoId, [[title,orch,vocalist],...]]
const DATA = [
  // Mundial 2019 Final (이미 DB에 있지만 검증 재확인용 - 스크린샷에서 확인됨)
  [2019, 'final', 1, null, [
    ['Verde Mar', 'Carlos Di Sarli y su Orquesta Típica', 'Roberto Rufino'],
    ['Cantor de Barrio', 'Ricardo Tanturi y su Orquesta Típica', 'Enrique Campos'],
    ['Bien Pulenta', "Juan D'Arienzo y su Orquesta Típica", 'Alberto Echagüe'],
  ]],
  [2019, 'final', 2, null, [
    ['A la Gran Muñeca', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Bailongo de los Domingos', 'Ricardo Tanturi y su Orquesta Típica', 'Alberto Castillo'],
    ['Jueves', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  [2019, 'final', 3, null, [
    ['Esta Noche de Luna', 'Carlos Di Sarli y su Orquesta Típica', 'Roberto Rufino'],
    ['Ese Sos Vos', 'Ricardo Tanturi y su Orquesta Típica', 'Alberto Castillo'],
    ['El Simpático', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  [2019, 'final', 4, null, [
    ['Viviani', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Me Llaman Tango', "Ángel D'Agostino y su Orquesta Típica", 'Ángel Vargas'],
    ['El Puntazo', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],

  // Mundial 2022 Final (이전 리서치 결과)
  [2022, 'final', 1, 'sqQ1TYFHdSE', [
    ['Una Fija', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Barrio de Tango', 'Miguel Caló y su Orquesta Típica', null],
    ['El Nene del Abasto', "Juan D'Arienzo y su Orquesta Típica", 'Alberto Echagüe'],
  ]],
  [2022, 'final', 2, '6mRIbSEZzLg', [
    ['Adiós Bardi', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['Qué Bien Te Queda', 'Ricardo Tanturi y su Orquesta Típica', null],
    ['El Simpático', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  [2022, 'final', 3, 'WNT2zcr3t88', [
    ['Esta Noche de Luna', 'Carlos Di Sarli y su Orquesta Típica', 'Roberto Rufino'],
    ['Recuerdo Malevo', 'Ricardo Tanturi y su Orquesta Típica', null],
    ['El Flete', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  [2022, 'final', 4, 'uPyHdQ_fTWs', [
    ['Indio Manso', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Dos Fracasos', 'Miguel Caló y su Orquesta Típica', 'Raúl Iriarte'],
    ['Te Aconsejo Que Me Olvides', 'Aníbal Troilo y su Orquesta Típica', null],
  ]],

  // Mundial 2023 Final (이전 리서치)
  [2023, 'final', 1, 'ct732sKIfkA', [
    ['Jamás Retornarás', 'Miguel Caló y su Orquesta Típica', null],
    ['Café Dominguez', 'Aníbal Troilo y su Orquesta Típica', null],
    ['Yapeyú', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  [2023, 'final', 2, 'YCbVDlJ5C5Q', [
    ['El Adiós', 'Miguel Caló y su Orquesta Típica', null],
    ['Nueve Puntos (1a Versión)', 'Alfredo Gobbi y su Orquesta Típica', null],
    ['Te Aconsejo Que Me Olvides', 'Aníbal Troilo y su Orquesta Típica', 'Francisco Fiorentino'],
  ]],
  [2023, 'final', 3, 'QLtHy8suIKg', [
    ['Una Emoción', 'Lucio Demare y su Orquesta Típica', null],
    ['Recuerdo', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['Comparsa Criolla', 'Ricardo Tanturi y su Orquesta Típica', null],
  ]],
  [2023, 'final', 4, '4yUrYSBYazg', [
    ['La Bordona', 'Aníbal Troilo y su Orquesta Típica', null],
    ['Dos Fracasos', 'Miguel Caló y su Orquesta Típica', null],
    ['El Simpático', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],

  // Mundial 2024 Semifinal R2 (스크린샷에서 식별)
  [2024, 'semifinal', 2, '2DnQir5q8Zc', [
    ['Nido Gaucho', 'Miguel Caló y su Orquesta Típica', 'Alberto Podestá'],
    ['Emancipación', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['El Nene del Abasto', "Juan D'Arienzo y su Orquesta Típica", 'Alberto Echagüe'],
  ]],

  // Mundial 2024 Semifinal R7 (스크린샷에서 식별)
  [2024, 'semifinal', 7, 'W_FWYSqZBn0', [
    ['El Abrojito', 'Osvaldo Pugliese y su Orquesta Típica', 'Alberto Morán'],
    ['Destino de Flor', 'Carlos Di Sarli y su Orquesta Típica', 'Roberto Florio'],
    ['El Flete', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
];

let addedAppearances = 0;
for (const entry of DATA) {
  const [year, stage, ronda, videoId, songList] = entry;
  const songEntries = [];
  for (let i = 0; i < songList.length; i++) {
    const [title, orch, vocalist] = songList[i];
    const song = findOrAddSong(title, orch, vocalist);
    songEntries.push({
      song_id: song.song_id,
      title: song.title,
      orchestra: orch || '',
      order: i + 1,
    });
    if (videoId) {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      addAppearance(song.song_id, 'COMP-001', year, 'tango_de_pista', stage, ronda, videoUrl, videoId, i + 1);
      addedAppearances++;
    } else {
      // No video but known from research
      addAppearance(song.song_id, 'COMP-001', year, 'tango_de_pista', stage, ronda, null, null, i + 1, 'A');
      addedAppearances++;
    }
  }
  addOrUpdateRound(year, stage, ronda, songEntries, []);
}

save('songs.json', songs);
save('appearances.json', appearances);
save('competition_rounds.json', roundsData);

console.log('=== Mundial Songs Batch ===');
console.log('Appearances added:', addedAppearances);
console.log('Total songs:', songs.length);
console.log('Total appearances:', appearances.length);
console.log('Total rounds:', roundsData.rounds.length);
