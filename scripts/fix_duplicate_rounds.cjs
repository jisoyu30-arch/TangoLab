// 중복 라운드 병합: 대소문자 불일치로 생긴 중복 ID 정리
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
function load(f) { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); }
function save(f, d) { fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2), 'utf8'); }

let roundsData = load('competition_rounds.json');
let appearances = load('appearances.json');

// 정규화된 round_id 생성
function normalizeId(year, stage, category, ronda, comp = 'Mundial') {
  const stMap = { qualifying: 'Q', quarterfinal: 'QF', semifinal: 'SF', final: 'F' };
  const catMap = {
    'tango_de_pista': 'PISTA',
    'pista': 'PISTA',
    'vals': 'VALS',
    'milonga': 'MILONGA',
    'pista_senior': 'PISTA-SENIOR',
    'pista_newstar': 'PISTA-NEWSTAR',
    'pista_singles_general': 'PISTA-SINGLES',
    'pista_singles_newstar': 'PISTA-SINGLES-NEWSTAR',
    'pista_singles_senior': 'PISTA-SINGLES-SENIOR',
    'vals_senior': 'VALS-SENIOR',
  };
  const compUpper = comp.toUpperCase();
  const cat = catMap[category] || category.toUpperCase();
  return `R-${compUpper}${year}-${cat}-${stMap[stage]}${ronda}`;
}

// 모든 round를 정규화된 ID로 그룹화 → 병합
const mergedMap = new Map(); // normalized_id → merged round
for (const r of roundsData.rounds) {
  const normId = normalizeId(r.year, r.stage, r.category, r.ronda_number, r.competition);

  if (!mergedMap.has(normId)) {
    mergedMap.set(normId, {
      ...r,
      round_id: normId,
    });
  } else {
    // 이미 존재 → 병합 (영상은 중복 제거해서 합치기, 곡은 비어있으면 채우기)
    const existing = mergedMap.get(normId);

    // 영상 합치기 (video_id 기준 중복 제거)
    const videoIds = new Set(existing.videos.map(v => v.video_id));
    for (const v of r.videos) {
      if (!videoIds.has(v.video_id)) {
        existing.videos.push(v);
        videoIds.add(v.video_id);
      }
    }

    // 곡 채우기 (기존에 곡 없으면 새 곡 사용)
    if (existing.songs.length === 0 && r.songs.length > 0) {
      existing.songs = r.songs;
    }
  }
}

// 수정된 rounds 배열
const newRounds = Array.from(mergedMap.values());
const removed = roundsData.rounds.length - newRounds.length;

console.log(`=== 중복 라운드 병합 ===`);
console.log(`기존: ${roundsData.rounds.length} rounds`);
console.log(`병합 후: ${newRounds.length} rounds`);
console.log(`제거: ${removed} 중복 제거`);

roundsData.rounds = newRounds;

save('competition_rounds.json', roundsData);

// === 추가 수정: U-E7EPi31xw는 PTC 2025 Final만 — Mundial 2025 Final에서 제거 ===
const mundial2025F = newRounds.find(r => r.round_id === 'R-MUNDIAL2025-PISTA-F1');
if (mundial2025F) {
  // PTC 영상 제거
  mundial2025F.videos = mundial2025F.videos.filter(v => v.video_id !== 'U-E7EPi31xw');
  console.log('Mundial 2025 Final에서 잘못된 PTC 영상 제거');
}

save('competition_rounds.json', roundsData);
console.log('✅ 완료');
