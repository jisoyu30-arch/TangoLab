// Thanh Dang 채널 전체 (452개) 영상 설명에서 곡 정보 파싱하여 DB에 추가
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
function load(f) { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); }
function save(f, d) { fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2), 'utf8'); }

let songs = load('songs.json');
let appearances = load('appearances.json');
let roundsData = load('competition_rounds.json');

let nextSongId = Math.max(...songs.map(s => parseInt(s.song_id.replace('SONG-','')))) + 1;
let nextAppId = Math.max(...appearances.map(a => parseInt(a.appearance_id.replace('APP-','')))) + 1;

const ORCHMAP = {
  'arienzo': 'ORCH-001', "d'arienzo": 'ORCH-001',
  'sarli': 'ORCH-002', 'di sarli': 'ORCH-002',
  'pugliese': 'ORCH-003',
  'tanturi': 'ORCH-004',
  'troilo': 'ORCH-005',
  'laurenz': 'ORCH-006',
  'cal': 'ORCH-007', 'calo': 'ORCH-007', 'caló': 'ORCH-007',
  'agostino': 'ORCH-008', "d'agostino": 'ORCH-008',
  'biagi': 'ORCH-009',
  'fresedo': 'ORCH-011',
  'demare': 'ORCH-015',
  'gobbi': 'ORCH-016',
  'donato': 'ORCH-014',
  'canaro': 'ORCH-010',
  'rodriguez': 'ORCH-013', 'rodríguez': 'ORCH-013',
};

const ORCH_FULL_NAME = {
  'arienzo': "Juan D'Arienzo y su Orquesta Típica",
  "d'arienzo": "Juan D'Arienzo y su Orquesta Típica",
  'sarli': 'Carlos Di Sarli y su Orquesta Típica',
  'di sarli': 'Carlos Di Sarli y su Orquesta Típica',
  'pugliese': 'Osvaldo Pugliese y su Orquesta Típica',
  'tanturi': 'Ricardo Tanturi y su Orquesta Típica',
  'troilo': 'Aníbal Troilo y su Orquesta Típica',
  'laurenz': 'Pedro Laurenz y su Orquesta Típica',
  'cal': 'Miguel Caló y su Orquesta Típica',
  'calo': 'Miguel Caló y su Orquesta Típica',
  'caló': 'Miguel Caló y su Orquesta Típica',
  'agostino': "Ángel D'Agostino y su Orquesta Típica",
  "d'agostino": "Ángel D'Agostino y su Orquesta Típica",
  'biagi': 'Rodolfo Biagi y su Orquesta Típica',
  'fresedo': 'Osvaldo Fresedo y su Orquesta Típica',
  'demare': 'Lucio Demare y su Orquesta Típica',
  'gobbi': 'Alfredo Gobbi y su Orquesta Típica',
  'donato': 'Edgardo Donato y su Orquesta Típica',
  'canaro': 'Francisco Canaro y su Orquesta Típica',
  'rodriguez': 'Enrique Rodríguez y su Orquesta Típica',
  'rodríguez': 'Enrique Rodríguez y su Orquesta Típica',
};

function findOrchId(query) {
  if (!query) return null;
  const q = query.toLowerCase();
  for (const k of Object.keys(ORCHMAP)) {
    if (q.includes(k)) return ORCHMAP[k];
  }
  return null;
}

function findOrchFullName(query) {
  if (!query) return null;
  const q = query.toLowerCase();
  for (const k of Object.keys(ORCH_FULL_NAME)) {
    if (q.includes(k)) return ORCH_FULL_NAME[k];
  }
  // fallback: capitalize first word
  return query.trim();
}

function findOrAddSong(title, orch, vocalist, recordingDate) {
  const tl = title.toLowerCase().trim();
  const existing = songs.find(s => {
    if (s.title.toLowerCase().trim() !== tl) return false;
    if (!orch) return true;
    const so = (s.orchestra || '').toLowerCase();
    const orchKey = orch.toLowerCase().split(' ')[0];
    return orchKey.length > 2 && so.includes(orchKey);
  });
  if (existing) {
    if (!existing.recording_date && recordingDate) existing.recording_date = recordingDate;
    if (!existing.vocalist && vocalist) existing.vocalist = vocalist;
    return existing;
  }

  const newSong = {
    song_id: `SONG-${String(nextSongId++).padStart(3,'0')}`,
    title, alt_titles: [], genre: 'tango',
    orchestra: findOrchFullName(orch),
    orchestra_id: findOrchId(orch),
    vocalist, recording_date: recordingDate || null,
    composer: null, lyricist: null,
    mood_tags: [], tempo: 'medium', dance_notes: null,
    source_confidence: 'A',
    evidence_note: 'Thanh Dang 영상 설명란 곡 정보',
    competition_popularity_score: 2,
  };
  songs.push(newSong);
  return newSong;
}

function addAppearance(songId, year, stage, rondaNum, videoUrl, videoId, orderInRound) {
  // 중복 체크
  const dup = appearances.find(a =>
    a.song_id === songId &&
    a.year === year &&
    a.stage === stage &&
    a.round_label === `R${rondaNum}` &&
    a.song_order_in_round === orderInRound
  );
  if (dup) return false;

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
    source_confidence: 'A',
    evidence_note: `Thanh Dang ${videoId}`,
  });
  return true;
}

function roundIdFor(year, stage, ronda) {
  const stMap = { qualifying: 'Q', quarterfinal: 'QF', semifinal: 'SF', final: 'F' };
  return `R-MUNDIAL${year}-PISTA-${stMap[stage]}${ronda}`;
}

function addOrUpdateRound(year, stage, ronda, songEntries, videoEntry) {
  const id = roundIdFor(year, stage, ronda);
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

  // 곡은 비어있을 때만 채움
  if (round.songs.length === 0 && songEntries.length > 0) {
    round.songs = songEntries;
  }

  if (videoEntry && !round.videos.find(v => v.video_id === videoEntry.video_id)) {
    round.videos.push(videoEntry);
  }

  return round;
}

// === 파싱 ===
// 제목 예: "Mundial de Tango Buenos Aires 2016 - Clasificatoria - Ronda 13"
//         "2025 Clasificatoria Pista Ronda 10   Mundial de Tango Buenos Aires"
function parseTitle(title) {
  const t = title.replace(/\s+/g, ' ').trim();

  // 연도
  const yearMatch = t.match(/\b(20\d{2}|201\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // 스테이지
  let stage = null;
  if (/final/i.test(t) && !/semifinal|semi\s*final/i.test(t)) stage = 'final';
  else if (/semi\s*final/i.test(t)) stage = 'semifinal';
  else if (/clasificatoria/i.test(t) || /qualifying/i.test(t)) stage = 'qualifying';
  else if (/cuartos/i.test(t)) stage = 'quarterfinal';

  // Ronda 번호
  const rondaMatch = t.match(/[Rr]onda\s*[:\-]?\s*(\d+)/);
  const ronda = rondaMatch ? parseInt(rondaMatch[1]) : null;

  return { year, stage, ronda };
}

// 설명에서 3곡 추출
// 포맷: "[악단] - [보컬 or Instrumental] - [곡명] - [연도]"
function parseDescription(desc) {
  const lines = desc.split('\n').map(l => l.trim()).filter(Boolean);
  const songs = [];
  for (const line of lines) {
    // " - " 구분으로 4부분
    // 형식: "Pugliese - Instrumental - El Monito - 1945"
    // 또는:  "Cal - Beron - Un Crimen - 1942"
    const parts = line.split(/\s+-\s+/).map(p => p.trim());
    if (parts.length < 3) continue;

    const [orch, vocOrInstr, titleRaw, yearRaw] = parts;
    if (!orch || !titleRaw) continue;

    // 필터: Source, Facebook, http 등 제외
    if (/source|channel|facebook|youtube|docs|spreadsheet|bestsong|hug|thank/i.test(line)) continue;

    // 악단명 검증: 알려진 키워드 포함
    const orchLower = orch.toLowerCase();
    const isValidOrch = Object.keys(ORCHMAP).some(k => orchLower.includes(k))
      || /malerba|caló|piazzolla|lomuto|de angelis/i.test(orchLower);
    if (!isValidOrch) continue;

    const vocalist = (!vocOrInstr || /^instrumental$/i.test(vocOrInstr))
      ? null
      : vocOrInstr;

    const year = yearRaw && /^\d{4}$/.test(yearRaw) ? yearRaw : null;

    songs.push({
      orch,
      vocalist,
      title: titleRaw,
      recordingDate: year,
    });

    if (songs.length === 3) break;
  }
  return songs;
}

// === 영상 목록 로드 ===
const rawList = fs.readFileSync(path.join(os.tmpdir(), 'thanhdang.txt'), 'utf8');
const videoList = rawList.split('\n').filter(Boolean).map(line => {
  const [id, ...rest] = line.split('|');
  return { id: id.trim(), title: rest.join('|').trim() };
});
console.log(`[1/2] ${videoList.length}개 영상 발견`);

// === 배치 설명 다운로드 ===
const CACHE_FILE = path.join(os.tmpdir(), 'thanhdang_descriptions.json');
let descCache = {};
if (fs.existsSync(CACHE_FILE)) {
  descCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  console.log(`[1.5/2] 캐시 ${Object.keys(descCache).length}개 로드`);
}

let cacheMisses = 0;
const missingIds = videoList.filter(v => !descCache[v.id]);
console.log(`[2/2] ${missingIds.length}개 영상 설명 다운로드 중...`);

if (missingIds.length > 0) {
  // yt-dlp 일괄 다운로드 (--no-check-certificate --sleep-interval 1 etc로 부하 조절)
  const BATCH_SIZE = 25;
  for (let i = 0; i < missingIds.length; i += BATCH_SIZE) {
    const batch = missingIds.slice(i, i + BATCH_SIZE);
    const ids = batch.map(v => `https://www.youtube.com/watch?v=${v.id}`).join(' ');
    try {
      const output = execSync(
        `yt-dlp --skip-download --print "===VID:%(id)s===TITLE:%(title)s===DESC:" --print "%(description)s" --print "===END===" ${ids}`,
        { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024 }
      );

      // 파싱
      const parts = output.split(/===VID:([^=]+)===TITLE:([^=]*)===DESC:\n/);
      for (let j = 1; j < parts.length; j += 3) {
        const vidId = parts[j].trim();
        const titleText = parts[j + 1].trim();
        const afterDesc = parts[j + 2] || '';
        const descText = afterDesc.split('===END===')[0].trim();
        descCache[vidId] = { title: titleText, description: descText };
      }

      fs.writeFileSync(CACHE_FILE, JSON.stringify(descCache, null, 2));
      cacheMisses += batch.length;
      console.log(`  배치 ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length}개 완료 (누적 ${cacheMisses})`);
    } catch (e) {
      console.warn(`  배치 실패 (건너뜀): ${e.message.slice(0, 100)}`);
    }
  }
}

// === 파싱 & DB 추가 ===
let addedRounds = 0;
let addedSongs = 0;
let addedAppearances = 0;

for (const v of videoList) {
  const cached = descCache[v.id];
  if (!cached) continue;

  const { year, stage, ronda } = parseTitle(cached.title || v.title);
  if (!year || !stage || !ronda) continue;
  if (year < 2012) continue; // 너무 옛날 데이터 제외

  const parsedSongs = parseDescription(cached.description);
  if (parsedSongs.length < 3) continue;

  const songEntries = [];
  for (let i = 0; i < parsedSongs.length; i++) {
    const ps = parsedSongs[i];
    const songBefore = songs.length;
    const song = findOrAddSong(ps.title, ps.orch, ps.vocalist, ps.recordingDate);
    if (songs.length > songBefore) addedSongs++;

    songEntries.push({
      song_id: song.song_id,
      title: song.title,
      orchestra: findOrchFullName(ps.orch) || ps.orch,
      order: i + 1,
    });

    if (addAppearance(song.song_id, year, stage, ronda,
        `https://www.youtube.com/watch?v=${v.id}`, v.id, i + 1)) {
      addedAppearances++;
    }
  }

  const videoEntry = {
    video_id: v.id,
    url: `https://www.youtube.com/watch?v=${v.id}`,
    channel: 'Thanh Dang',
    title: cached.title || v.title,
  };

  const roundBefore = roundsData.rounds.length;
  addOrUpdateRound(year, stage, ronda, songEntries, videoEntry);
  if (roundsData.rounds.length > roundBefore) addedRounds++;
}

save('songs.json', songs);
save('appearances.json', appearances);
save('competition_rounds.json', roundsData);

console.log('\n=== 최종 결과 ===');
console.log('신규 곡:', addedSongs);
console.log('신규 appearance:', addedAppearances);
console.log('신규 라운드:', addedRounds);
console.log('총 곡:', songs.length);
console.log('총 appearance:', appearances.length);
console.log('총 라운드:', roundsData.rounds.length);
