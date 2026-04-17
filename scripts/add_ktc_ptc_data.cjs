// 2023~2025 KTC/PTC/Mundial/TDAC 대회 데이터 추가 스크립트
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
function load(f) { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); }
function save(f, d) { fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2), 'utf8'); }

let songs = load('songs.json');
let appearances = load('appearances.json');
let roundsData = load('competition_rounds.json');
let orchestras = load('orchestras.json');
let competitions = load('competitions.json');

let nextSongId = Math.max(...songs.map(s => parseInt(s.song_id.replace('SONG-','')))) + 1;
let nextAppId = Math.max(...appearances.map(a => parseInt(a.appearance_id.replace('APP-','')))) + 1;
let nextOrchId = Math.max(...orchestras.map(o => parseInt(o.orchestra_id.replace('ORCH-','')))) + 1;

function findOrchId(q) {
  if (!q) return null;
  const ql = q.toLowerCase();
  for (const o of orchestras) {
    if (o.orchestra_name.toLowerCase().includes(ql) ||
        (o.alt_names||[]).some(n => n.toLowerCase().includes(ql))) return o.orchestra_id;
  }
  return null;
}

function addOrchestra(name, altNames, styleTag) {
  const id = `ORCH-${String(nextOrchId++).padStart(3,'0')}`;
  orchestras.push({
    orchestra_id: id,
    orchestra_name: name,
    alt_names: altNames || [],
    country: 'Argentina',
    active_era: 'unknown',
    key_vocalists: [],
    style_tags: styleTag || ['traditional'],
    common_competition_use_notes: '상세 정보 추가 필요',
  });
  return id;
}

function findOrAddSong(title, orchestraName, vocalist) {
  const tl = title.toLowerCase().trim();
  const existing = songs.find(s => {
    if (s.title.toLowerCase().trim() !== tl) return false;
    if (!orchestraName) return true;
    const so = (s.orchestra || '').toLowerCase();
    const qo = orchestraName.toLowerCase();
    const qoFirst = qo.split(' ')[0];
    return so.includes(qoFirst) || qo.includes((s.orchestra||'').split(' ')[0].toLowerCase());
  });
  if (existing) return existing;

  let orchId = null;
  if (orchestraName) {
    const key = orchestraName.toLowerCase();
    if (key.includes('arienzo')) orchId = 'ORCH-001';
    else if (key.includes('di sarli')) orchId = 'ORCH-002';
    else if (key.includes('pugliese')) orchId = 'ORCH-003';
    else if (key.includes('tanturi')) orchId = 'ORCH-004';
    else if (key.includes('troilo')) orchId = 'ORCH-005';
    else if (key.includes('laurenz')) orchId = 'ORCH-006';
    else if (key.includes('calo') || key.includes('caló')) orchId = 'ORCH-007';
    else if (key.includes('agostino')) orchId = 'ORCH-008';
    else if (key.includes('biagi')) orchId = 'ORCH-009';
    else if (key.includes('fresedo')) orchId = 'ORCH-011';
    else if (key.includes('demare')) orchId = 'ORCH-015';
    else if (key.includes('gobbi')) orchId = 'ORCH-016';
    else if (key.includes('vargas')) {
      orchId = findOrchId('Vargas') || addOrchestra('Ángel Vargas', ['Angel Vargas'], ['vocal_focused','lyrical']);
    }
    else if (key.includes('moran') || key.includes('morán')) {
      orchId = findOrchId('Moran') || findOrchId('Morán') || addOrchestra('Alberto Morán', ['Alberto Moran'], ['vocal_focused','dramatic']);
    }
    else if (key.includes('basso')) {
      orchId = findOrchId('Basso') || addOrchestra('José Basso y su Orquesta Típica', ['Jose Basso'], ['traditional','smooth']);
    }
  }

  const newSong = {
    song_id: `SONG-${String(nextSongId++).padStart(3,'0')}`,
    title,
    alt_titles: [],
    genre: 'tango',
    orchestra: orchestraName,
    orchestra_id: orchId,
    vocalist: vocalist,
    recording_date: null,
    composer: null,
    lyricist: null,
    mood_tags: [],
    tempo: 'medium',
    dance_notes: null,
    source_confidence: 'B',
    evidence_note: 'YouTube 자동 음악 인식으로 식별',
    competition_popularity_score: 1,
  };
  songs.push(newSong);
  return newSong;
}

function addAppearance(songId, compId, year, category, stage, rondaNum, videoUrl, videoId, orderInRound) {
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
    source_confidence: 'A',
    evidence_note: `YouTube ${videoId} 음악 인식`,
  });
}

function roundIdFor(comp, year, stage, category, ronda) {
  const stMap = { qualifying: 'Q', semifinal: 'S', final: 'F' };
  return `R-${comp}${year}-${category.toUpperCase()}-${stMap[stage]}${ronda}`;
}

function addOrUpdateRound(compShort, compId, year, category, stage, ronda, songEntries, videoEntries) {
  const id = roundIdFor(compShort, year, stage, category, ronda);
  const existingIdx = roundsData.rounds.findIndex(r => r.round_id === id);
  const round = {
    round_id: id,
    competition: compShort,
    competition_id: compId,
    year, category, stage,
    ronda_number: ronda,
    songs: songEntries,
    videos: videoEntries,
  };
  if (existingIdx >= 0) roundsData.rounds[existingIdx] = round;
  else roundsData.rounds.push(round);
}

if (!competitions.find(c => c.competition_id === 'COMP-006')) {
  competitions.push({
    competition_id: 'COMP-006',
    competition_name: 'Tango Dance Asian Championship (TDAC)',
    alt_names: ['TDAC'],
    organizer: 'TDAC Japan',
    country: 'Japan',
    city: 'Tokyo',
    official_status: 'semi-official',
    category_system: {
      tango_de_pista: { music_selection: 'organization', format: 'group_competition' },
    },
    notes: '일본 도쿄 아시안 탱고 챔피언십 - Mundial de tango ciudad 2025 공식 예선',
  });
}

// === 데이터 정의 ===
// [compShort, compId, year, stage, category, ronda, videoId, videoTitle, channel, [[title,orch,vocalist],...]]
const DATA = [
  ['PTC', 'COMP-004', 2023, 'semifinal', 'tango_de_pista', 1, 'BItM4JJQjAE', '2023 Pacific Tango Championship - Tango de Pista . Semi Final 1', 'Korea Tango Cooperative', [
    ['Lilián', "Juan D'Arienzo y su Orquesta Típica", null],
    ['Pata Ancha', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['El pollo Ricardo', 'Carlos Di Sarli y su Orquesta Típica', null],
  ]],
  ['PTC', 'COMP-004', 2025, 'qualifying', 'tango_de_pista', 2, 'ZMxqWVXhDTw', 'PTC 2025 Tango de Pista Qualification Ronda 2', 'TangoCafe', [
    ['Siete Palabras', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Cascabelito', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['Si la llegaran a ver', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  ['PTC', 'COMP-004', 2025, 'qualifying', 'tango_de_pista', 3, 'rdVCmMfKOXw', 'PTC 2025 Tango de Pista Qualification Ronda 3', 'TangoCafe', [
    ['Nueve Puntos', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Maleza', 'Alberto Morán', null],
    ['Humillación', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  ['PTC', 'COMP-004', 2025, 'final', 'tango_de_pista', 1, 'U-E7EPi31xw', 'Pista Final - 2025 Pacific Tango Championship', '한선우', []],
  ['TDAC', 'COMP-006', 2024, 'final', 'tango_de_pista', 1, null, 'Tango Dance Asian Championship 2024 Pista Final', 'TangoCafe', [
    ['Marrón y Azul', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['Bailongo de los Domingos', 'Ricardo Tanturi y su Orquesta Típica', null],
    ['Paciencia', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  ['TDAC', 'COMP-006', 2025, 'semifinal', 'tango_de_pista', 2, '0gWmi4kcG34', '2025 TANGO DANCE ASIAN CHAMPIONSHIP PISTA SEMI FINAL GROUP B', 'TANGLE', []],
  ['KTC', 'COMP-005', 2025, 'qualifying', 'tango_de_pista', 1, 'eadGQvhVfcg', '2025 KTC Pista International preliminary No.1', 'Epitone Jin', [
    ['Que No Sepan las Estrellas', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Derecho Viejo', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['Nada Mas', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  ['KTC', 'COMP-005', 2025, 'qualifying', 'tango_de_pista', 2, '0foXHSle3H4', '2025 KTC Pista International preliminary No.2', 'Epitone Jin', [
    ['Una Emoción', 'Lucio Demare y su Orquesta Típica', null],
    ['Madame Ivonne', 'Ricardo Tanturi y su Orquesta Típica', null],
    ['Ahora No Me Conoces', 'Rodolfo Biagi y su Orquesta Típica', 'Jorge Ortiz'],
  ]],
  ['KTC', 'COMP-005', 2025, 'qualifying', 'tango_de_pista', 4, 'dh1RJUGUOes', '2025 KTC Pista International preliminary No.4', 'Epitone Jin', [
    ['La Morocha', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Flor De Tango', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['Ya Lo Ves', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  ['KTC', 'COMP-005', 2023, 'semifinal', 'tango_de_pista', 3, 'lN_T5E1AYtE', '2023 Korea Tango Championship : Tango de pista C (Semifinal Ronda 3)', 'Korea Tango Cooperative', [
    ['Corazón No Le Digas a Nadie', 'Lucio Demare y su Orquesta Típica', null],
    ['El Rodeo', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['Por qué razón', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  ['KTC', 'COMP-005', 2023, 'semifinal', 'tango_de_pista', 4, 'nuxo3E9PMrQ', '2023 Korea Tango Championship : Tango de pista D (Semifinal Ronda 4)', 'Korea Tango Cooperative', [
    ['A las Siete en el Café', 'Miguel Caló y su Orquesta Típica', null],
    ['No Te Apures Cara Blanca', 'Aníbal Troilo y su Orquesta Típica', null],
    ['Una noche de garufa', 'Ricardo Tanturi y su Orquesta Típica', null],
  ]],
  ['KTC', 'COMP-005', 2023, 'qualifying', 'tango_de_pista', 2, '9q_Tvz0MM1w', '2023 Korea Tango Championship : Tango de pista B (Preliminaries Ronda 2)', 'Korea Tango Cooperative', [
    ['Don Jose Maria', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Patético', 'Osvaldo Pugliese y su Orquesta Típica', null],
    ['Comparsa Criolla', 'Ricardo Tanturi y su Orquesta Típica', null],
  ]],
  ['Mundial', 'COMP-001', 2025, 'semifinal', 'tango_de_pista', 1, 'YK0o6DgB6X8', '1 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025', 'AiresDeMilonga', [
    ['La madrugada', "Juan D'Arienzo y su Orquesta Típica", null],
    ['Nueve Puntos', 'Alfredo Gobbi y su Orquesta Típica', null],
    ['Te Aconsejo Que Me Olvides', 'Aníbal Troilo y su Orquesta Típica', null],
  ]],
  ['Mundial', 'COMP-001', 2025, 'semifinal', 'tango_de_pista', 4, 'J2aG0o0_T_w', '4 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025', 'AiresDeMilonga', [
    ['Siete Palabras', 'Carlos Di Sarli y su Orquesta Típica', null],
    ['Remembranzas', 'Osvaldo Pugliese y su Orquesta Típica', 'Jorge Maciel'],
    ['El Olivo', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  ['Mundial', 'COMP-001', 2025, 'semifinal', 'tango_de_pista', 5, '2YL4PaMDSD0', '5 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025', 'AiresDeMilonga', [
    ['Tres Esquinas', 'Ángel Vargas', null],
    ['Por la vuelta', 'José Basso y su Orquesta Típica', 'Floreal Ruiz'],
    ['Yapeyú', "Juan D'Arienzo y su Orquesta Típica", null],
  ]],
  // Mundial 2025 Semifinal - video only
  ['Mundial', 'COMP-001', 2025, 'semifinal', 'tango_de_pista', 9, 'sOGN9OZh4do', '9 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'semifinal', 'tango_de_pista', 11, 'bcDvXYCSJ_k', '11 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'semifinal', 'tango_de_pista', 12, 'AbV3n-VkZU0', '12 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'semifinal', 'tango_de_pista', 13, 'S1HemLlHyzQ', '13 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'semifinal', 'tango_de_pista', 14, 'VPZa_qgJkoI', '14 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'semifinal', 'tango_de_pista', 15, 'c0Qgmv5FNU8', '15 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'semifinal', 'tango_de_pista', 16, 'gmQQPA_qbGs', '16 TANGO BAILE PISTA semifinal MUNDIAL DE TANGO 2025', 'AiresDeMilonga', []],
  // Mundial 2025 Qualifying - videos only
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 3, 'G44JhXuNjVY', '03 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 4, '1doo7h-f02Y', '04 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 5, 'Trg6H7AAOmk', '05 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 6, 'cd6O-i2MQCM', '06 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 7, 'EG18_3upbuc', '07 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 9, '2HfXNMW7hLg', '09 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 10, 'EtPAJJAWhyc', '10 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 11, 'ogb57pxO4U4', '11 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 12, 'Q2-HETuBtpo', '12 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 13, 'sfJz3PdDEqA', '13 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 14, 'epirzaGi72A', '14 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 19, 'xVMtRSEFnFw', '19 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 20, 'XRlxV5iNRa8', '20 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 21, '4kzoYP-vFps', '21 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 22, '7wzoCSNbUyM', '22 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 23, 'vDschfFE2Xo', '23 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 25, 'Er7zMDuy1Nk', '25 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 26, 'ibC6EVIZws0', '26 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
  ['Mundial', 'COMP-001', 2025, 'qualifying', 'tango_de_pista', 27, '-DchFarDGzc', '27 Ronda tango pista Mundial de Tango 2025', 'AiresDeMilonga', []],
];

let addedAppearances = 0;
for (const entry of DATA) {
  const [compShort, compId, year, stage, category, ronda, videoId, videoTitle, channel, songList] = entry;

  const songEntries = [];
  for (let i = 0; i < songList.length; i++) {
    const [title, orchName, vocalist] = songList[i];
    const song = findOrAddSong(title, orchName, vocalist);
    songEntries.push({
      song_id: song.song_id,
      title: song.title,
      orchestra: orchName || '',
      order: i + 1,
    });
    if (videoId) {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      addAppearance(song.song_id, compId, year, category, stage, ronda, videoUrl, videoId, i + 1);
      addedAppearances++;
    }
  }

  const videoEntries = videoId ? [{
    video_id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    channel,
    title: videoTitle,
  }] : [];

  addOrUpdateRound(compShort, compId, year, category, stage, ronda, songEntries, videoEntries);
}

save('songs.json', songs);
save('appearances.json', appearances);
save('competition_rounds.json', roundsData);
save('orchestras.json', orchestras);
save('competitions.json', competitions);

console.log('=== Summary ===');
console.log('Songs total:', songs.length);
console.log('Appearances total:', appearances.length);
console.log('Rounds total:', roundsData.rounds.length);
console.log('Orchestras total:', orchestras.length);
console.log('Competitions total:', competitions.length);
console.log('Appearances added this run:', addedAppearances);
