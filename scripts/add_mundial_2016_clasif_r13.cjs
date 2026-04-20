// Mundial 2016 Clasificatoria Ronda 13 추가
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
  if (q.includes('sarli')) return 'ORCH-002';
  if (q.includes('pugliese')) return 'ORCH-003';
  if (q.includes('tanturi')) return 'ORCH-004';
  if (q.includes('troilo')) return 'ORCH-005';
  if (q.includes('laurenz')) return 'ORCH-006';
  if (q.includes('calo')) return 'ORCH-007';
  if (q.includes('agostino')) return 'ORCH-008';
  if (q.includes('biagi')) return 'ORCH-009';
  if (q.includes('fresedo')) return 'ORCH-011';
  return null;
}

function findOrAddSong(title, orch, recordingDate, vocalist = null) {
  const tl = title.toLowerCase().trim();
  const existing = songs.find(s => {
    if (s.title.toLowerCase().trim() !== tl) return false;
    if (!orch) return true;
    const so = (s.orchestra || '').toLowerCase();
    return so.includes(orch.toLowerCase().split(' ')[0]);
  });
  if (existing) {
    if (!existing.recording_date && recordingDate) existing.recording_date = recordingDate;
    return existing;
  }

  const newSong = {
    song_id: `SONG-${String(nextSongId++).padStart(3,'0')}`,
    title, alt_titles: [], genre: 'tango',
    orchestra: orch, orchestra_id: findOrchId(orch),
    vocalist, recording_date: recordingDate || null,
    composer: null, lyricist: null,
    mood_tags: [], tempo: 'medium', dance_notes: null,
    source_confidence: 'A',
    evidence_note: 'Mundial 영상 텍스트 오버레이에서 곡명·악단·연도 식별',
    competition_popularity_score: 2,
  };
  songs.push(newSong);
  return newSong;
}

// Mundial 2016 Clasificatoria Ronda 13 — 3곡
const SONGS = [
  ['Tigre Viejo', 'Osvaldo Fresedo y su Orquesta Típica', '1934', null],
  ['Don Pacífico', "Juan D'Arienzo y su Orquesta Típica", '1949', null],
  ['El Monito', 'Osvaldo Pugliese y su Orquesta Típica', '1945', null],
];

// 실제 대회 영상 3파트
const VIDEOS = [
  { video_id: 'N0OfkWaBbNg', title: 'Mundial de Tango 2016, Clasificatoria Pista, Ronda 13, 1/3', channel: 'AiresDeMilonga' },
  { video_id: 'tdiEyMli0XM', title: 'Mundial de Tango 2016, Clasificatoria Pista, Ronda 13, 2/3', channel: 'AiresDeMilonga' },
  { video_id: 'fPPUZWVZ9ew', title: 'Mundial de Tango 2016, Clasificatoria Pista, Ronda 13, 3/3', channel: 'AiresDeMilonga' },
];

const songEntries = [];
for (let i = 0; i < SONGS.length; i++) {
  const [title, orch, recDate, voc] = SONGS[i];
  const song = findOrAddSong(title, orch, recDate, voc);
  songEntries.push({
    song_id: song.song_id,
    title: song.title,
    orchestra: orch,
    order: i + 1,
  });
  for (const v of VIDEOS) {
    appearances.push({
      appearance_id: `APP-${String(nextAppId++).padStart(3,'0')}`,
      song_id: song.song_id,
      competition_id: 'COMP-001',
      year: 2016,
      category: 'tango_de_pista',
      stage: 'qualifying',
      round_label: 'R13',
      song_order_in_round: i + 1,
      set_order_if_known: null,
      linked_official_result: null,
      status: 'confirmed',
      source_url: `https://www.youtube.com/watch?v=${v.video_id}`,
      source_type: 'youtube',
      source_confidence: 'A',
      evidence_note: `Thanh Dang 음악 참고 + ${v.video_id} 대회 영상`,
    });
    break; // 한 곡당 1 appearance만 (대표 영상)
  }
}

// 라운드 추가
const id = `R-MUNDIAL2016-PISTA-Q13`;
const existing = roundsData.rounds.find(r => r.round_id === id);
if (existing) {
  existing.songs = songEntries;
  for (const v of VIDEOS) {
    if (!existing.videos.find((ev) => ev.video_id === v.video_id)) {
      existing.videos.push({
        video_id: v.video_id,
        url: `https://www.youtube.com/watch?v=${v.video_id}`,
        channel: v.channel,
        title: v.title,
      });
    }
  }
} else {
  roundsData.rounds.push({
    round_id: id,
    competition: 'Mundial',
    competition_id: 'COMP-001',
    year: 2016,
    category: 'tango_de_pista',
    stage: 'qualifying',
    ronda_number: 13,
    songs: songEntries,
    videos: VIDEOS.map(v => ({
      video_id: v.video_id,
      url: `https://www.youtube.com/watch?v=${v.video_id}`,
      channel: v.channel,
      title: v.title,
    })),
  });
}

save('songs.json', songs);
save('appearances.json', appearances);
save('competition_rounds.json', roundsData);

console.log('=== Mundial 2016 Clasif R13 ===');
console.log('3곡 + 3개 대회 영상 추가');
console.log('Total songs:', songs.length);
console.log('Total rounds:', roundsData.rounds.length);
