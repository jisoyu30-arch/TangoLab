// Gemini 배치 메타데이터 enrichment
// 곡들의 tempo, mood_tags, composer 등을 Gemini로 자동 채움
//
// 사용법: GEMINI_API_KEY=xxx node scripts/enrich_song_metadata.cjs [--limit=50] [--dry-run]
//
// 대상 선정:
// - 대회 출현 3회 이상인 곡들
// - tempo 또는 mood_tags가 비어있는 곡
// - 악단과 곡명이 모두 있는 곡

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const CACHE_DIR = path.join(__dirname, '..', '.cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function load(f) { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); }
function save(f, d) { fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2), 'utf8'); }

const argv = process.argv.slice(2);
const LIMIT = parseInt((argv.find(a => a.startsWith('--limit=')) || '').replace('--limit=', '')) || 30;
const DRY_RUN = argv.includes('--dry-run');
const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash';

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY 환경변수 필요');
  process.exit(1);
}

let songs = load('songs.json');
const appearances = load('appearances.json');

// 곡별 출현 카운트
const appCount = new Map();
for (const a of appearances) {
  appCount.set(a.song_id, (appCount.get(a.song_id) || 0) + 1);
}

// 타겟 곡 선정
const targets = songs.filter(s => {
  if (!s.orchestra || !s.title) return false;
  const count = appCount.get(s.song_id) || 0;
  if (count < 2) return false;
  const missingTempo = !s.tempo || s.tempo === 'medium';
  const missingMood = !s.mood_tags || s.mood_tags.length === 0;
  return missingTempo || missingMood;
}).sort((a, b) => (appCount.get(b.song_id) || 0) - (appCount.get(a.song_id) || 0));

console.log(`📊 후보: ${targets.length}곡 (${songs.length}곡 중)`);
console.log(`🎯 처리 대상: 상위 ${Math.min(LIMIT, targets.length)}곡`);

const VALID_TEMPOS = ['slow', 'medium', 'fast', 'variable'];
const VALID_MOODS = [
  'rhythmic', 'marcato', 'energetic', 'fast_tempo', 'elegant', 'melodic',
  'lyrical', 'smooth', 'dramatic', 'intense', 'powerful', 'expressive',
  'vocal_focused', 'emotional', 'romantic', 'playful', 'milonga',
  'cheerful', 'traditional', 'varied', 'nostalgic', 'rubato',
];

async function enrichSong(song) {
  const cacheFile = path.join(CACHE_DIR, `song_${song.song_id}.json`);
  if (fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }

  const prompt = `다음 탱고 곡에 대한 메타데이터를 JSON으로만 응답하세요 (다른 텍스트 금지):
곡명: ${song.title}
악단: ${song.orchestra}
${song.vocalist ? `보컬: ${song.vocalist}` : '(Instrumental)'}
${song.recording_date ? `녹음연도: ${song.recording_date}` : ''}

응답 JSON 형식:
{
  "tempo": "slow" | "medium" | "fast" | "variable",
  "mood_tags": [max 4개, 가능한 값: ${VALID_MOODS.join(', ')}],
  "dance_notes": "짧은 춤 조언 한 줄 (한국어)",
  "composer": "작곡가 이름 (아는 경우만, 모르면 null)"
}`;

  // Rate limit 재시도 (최대 3번)
  let res;
  for (let retry = 0; retry < 3; retry++) {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1200, responseMimeType: 'application/json' },
        }),
      }
    );
    if (res.ok) break;
    if (res.status === 429 || res.status === 503) {
      // Exponential backoff: 5s, 15s, 45s
      const wait = Math.pow(3, retry) * 5000;
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    break;
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err.slice(0, 100)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('empty response');

  // 강력한 JSON 파싱 — 코드펜스/주석/주변 텍스트 제거
  let cleaned = text.trim();
  // ```json ... ``` 제거
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  // 첫 { 부터 마지막 } 까지
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`invalid JSON: ${cleaned.slice(0, 100)}`);
  }

  fs.writeFileSync(cacheFile, JSON.stringify(parsed, null, 2));
  return parsed;
}

(async () => {
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < Math.min(LIMIT, targets.length); i++) {
    const song = targets[i];
    process.stdout.write(`  [${i + 1}/${Math.min(LIMIT, targets.length)}] ${song.title.padEnd(30)} (${song.orchestra?.split(' ')[0] || ''}): `);

    try {
      const meta = await enrichSong(song);

      if (meta.tempo && VALID_TEMPOS.includes(meta.tempo)) {
        song.tempo = meta.tempo;
      }
      if (Array.isArray(meta.mood_tags)) {
        song.mood_tags = meta.mood_tags.filter(t => VALID_MOODS.includes(t)).slice(0, 4);
      }
      if (meta.dance_notes && typeof meta.dance_notes === 'string' && !song.dance_notes) {
        song.dance_notes = meta.dance_notes;
      }
      if (meta.composer && !song.composer && meta.composer !== 'null' && meta.composer !== null) {
        song.composer = meta.composer;
      }

      updated++;
      console.log(`✓ tempo=${song.tempo}, mood=${(song.mood_tags||[]).join(',')}`);
    } catch (e) {
      errors++;
      console.log(`✗ ${e.message.slice(0, 60)}`);
    }

    // rate limit — free tier: 10 RPM 수준
    await new Promise(r => setTimeout(r, 7000));
  }

  if (!DRY_RUN) {
    save('songs.json', songs);
    console.log(`\n✅ 저장 완료: ${updated}곡 업데이트, ${errors}개 실패`);
  } else {
    console.log(`\n🔍 DRY RUN: ${updated}곡이 업데이트됨 (저장 안 함)`);
  }
})();
