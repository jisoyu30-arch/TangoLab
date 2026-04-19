// MC 멘트 자동 파싱 스크립트
// Mundial de Tango 대회 영상의 자동 자막에서 MC 멘트 "El repertorio ... será [곡1] [악단1] [보컬1] [곡2] [악단2] [곡3] [악단3]" 패턴을 파싱
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TMP_DIR = path.join(os.tmpdir(), 'tango_subs');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// VTT 파일에서 "repertorio... será..." 이후 문장 추출
function extractMCAnnouncement(videoId) {
  const vttPath = path.join(TMP_DIR, `${videoId}.es.vtt`);

  // 자막이 없으면 다운로드
  if (!fs.existsSync(vttPath)) {
    try {
      execSync(
        `yt-dlp --skip-download --write-auto-sub --sub-lang es --sub-format vtt -o "${path.join(TMP_DIR, videoId)}" "https://www.youtube.com/watch?v=${videoId}"`,
        { stdio: 'pipe', timeout: 60000 }
      );
    } catch (e) {
      return null;
    }
  }

  if (!fs.existsSync(vttPath)) return null;

  const content = fs.readFileSync(vttPath, 'utf8');
  // 텍스트 라인만 추출 (타이밍, 태그 제거)
  const lines = [];
  for (const rawLine of content.split('\n')) {
    const l = rawLine.trim();
    if (!l || l.includes('-->') || l.startsWith('WEBVTT') || l.startsWith('Kind:') || l.startsWith('Language:') || l.startsWith('NOTE')) continue;
    const cleaned = l.replace(/<[^>]+>/g, '').replace(/align:\S+/g, '').replace(/position:\S+%/g, '').trim();
    if (cleaned && (lines.length === 0 || lines[lines.length - 1] !== cleaned)) {
      lines.push(cleaned);
    }
  }

  // 전체 텍스트 하나로 합치기
  const fullText = lines.join(' ');

  // "repertorio ... será" 이후 "." 까지의 문장 찾기 (최대 100자)
  const match = fullText.match(/[Ee]l repertorio[^.]*será\s+([^.]{5,200})\./);
  if (match) return match[1].trim();

  return null;
}

// MC 멘트에서 곡 3개 추출 — 패턴: "곡명1 악단1 [보컬1], 곡명2 악단2, 곡명3 악단3"
// 악단 key words
const ORCH_KEYS = {
  'di sarli': "Carlos Di Sarli y su Orquesta Típica",
  'carlos': "Carlos Di Sarli y su Orquesta Típica",
  'sarli': "Carlos Di Sarli y su Orquesta Típica",
  'pugliese': "Osvaldo Pugliese y su Orquesta Típica",
  'osvaldo': "Osvaldo Pugliese y su Orquesta Típica",
  "d'arienzo": "Juan D'Arienzo y su Orquesta Típica",
  'darienzo': "Juan D'Arienzo y su Orquesta Típica",
  'dario': "Juan D'Arienzo y su Orquesta Típica",
  'arienzo': "Juan D'Arienzo y su Orquesta Típica",
  'juan': "Juan D'Arienzo y su Orquesta Típica",
  'tanturi': "Ricardo Tanturi y su Orquesta Típica",
  'ricardo': "Ricardo Tanturi y su Orquesta Típica",
  'troilo': 'Aníbal Troilo y su Orquesta Típica',
  'anibal': 'Aníbal Troilo y su Orquesta Típica',
  'aníbal': 'Aníbal Troilo y su Orquesta Típica',
  'caló': 'Miguel Caló y su Orquesta Típica',
  'calo': 'Miguel Caló y su Orquesta Típica',
  'miguel': 'Miguel Caló y su Orquesta Típica',
  'd\'agostino': 'Ángel D\'Agostino y su Orquesta Típica',
  'agostino': 'Ángel D\'Agostino y su Orquesta Típica',
  'biagi': 'Rodolfo Biagi y su Orquesta Típica',
  'rodolfo': 'Rodolfo Biagi y su Orquesta Típica',
  'demare': 'Lucio Demare y su Orquesta Típica',
  'lucio': 'Lucio Demare y su Orquesta Típica',
  'gobbi': 'Alfredo Gobbi y su Orquesta Típica',
  'alfredo': 'Alfredo Gobbi y su Orquesta Típica',
  'laurenz': 'Pedro Laurenz y su Orquesta Típica',
  'pedro': 'Pedro Laurenz y su Orquesta Típica',
  'fresedo': 'Osvaldo Fresedo y su Orquesta Típica',
  'canaro': 'Francisco Canaro y su Orquesta Típica',
  'francisco': 'Francisco Canaro y su Orquesta Típica',
  'donato': 'Edgardo Donato y su Orquesta Típica',
  'rodríguez': 'Enrique Rodríguez y su Orquesta Típica',
  'rodriguez': 'Enrique Rodríguez y su Orquesta Típica',
  'vargas': 'Ángel Vargas',
  'basso': 'José Basso y su Orquesta Típica',
  'morán': 'Alberto Morán',
  'moran': 'Alberto Morán',
};

const VOCALIST_KEYS = [
  'Rufino', 'Roberto Rufino', 'Fiorentino', 'Marino', 'Durán', 'Duran', 'Echague', 'Echagüe',
  'Campos', 'Castillo', 'Vargas', 'Maciel', 'Ortiz', 'Jorge Ortiz', 'Podestá', 'Podesta',
  'Casal', 'Jorge Casal', 'Morán', 'Moran', 'Amor',  'Rivero', 'Berón', 'Beron',
  'Galán', 'Galan', 'Lamarque', 'Marambio'
];

// 멘트 문자열에서 곡 3개 추출
function parseMCAnnouncement(mcText) {
  // 정리: 쉼표 + "Y" 구분자
  // 예: "tristeza Marina, Carlos Roberto Rufino, recuerdo Osvaldo y Maipo Juan Dario"
  if (!mcText) return null;

  // 첫번째: "X y Y" 를 " , " 로 바꿔서 3개로 분할
  const cleaned = mcText.replace(/\s+y\s+/gi, ', ');
  const parts = cleaned.split(/,\s*/).map(s => s.trim()).filter(Boolean);

  // 각 part에서 곡명/악단/보컬 추출
  // 일반적인 패턴: "SongName OrchestraName [VocalistName]"
  const songs = [];
  let buffer = '';

  for (const part of parts) {
    // Try to find known orchestra keyword
    const lower = part.toLowerCase();
    let matchedOrch = null;
    let matchedKey = null;
    for (const key of Object.keys(ORCH_KEYS)) {
      if (lower.includes(key)) {
        if (!matchedOrch || key.length > matchedKey.length) {
          matchedOrch = ORCH_KEYS[key];
          matchedKey = key;
        }
      }
    }

    if (matchedOrch) {
      // 곡명은 악단 키워드 이전
      const idx = lower.indexOf(matchedKey);
      let songPart = part.substring(0, idx).trim();
      let rest = part.substring(idx + matchedKey.length).trim();

      // rest 안에 보컬리스트 이름?
      let vocalist = null;
      for (const voc of VOCALIST_KEYS) {
        if (rest.toLowerCase().includes(voc.toLowerCase())) {
          vocalist = voc;
          break;
        }
      }

      // buffer에 이전 part 이어붙이기 (쉼표로 잘린 곡명 복원)
      if (buffer) {
        songPart = buffer + ' ' + songPart;
        buffer = '';
      }

      if (songPart) {
        songs.push({
          title: capitalize(songPart),
          orchestra: matchedOrch,
          vocalist,
        });
      }
    } else {
      // 악단 키워드 없으면 다음 part 로 이월 (쉼표 사이의 보컬/곡명일 수 있음)
      // 일단 buffer에 저장
      if (part.length < 30) { // 짧으면 보컬리스트일 가능성
        // check
        let isVocalist = false;
        for (const voc of VOCALIST_KEYS) {
          if (part.toLowerCase().includes(voc.toLowerCase())) {
            isVocalist = true;
            break;
          }
        }
        if (isVocalist && songs.length > 0) {
          songs[songs.length - 1].vocalist = part;
        } else {
          buffer = part;
        }
      } else {
        buffer = part;
      }
    }
  }

  return songs;
}

function capitalize(s) {
  return s.split(/\s+/).map(w => w[0]?.toUpperCase() + w.slice(1).toLowerCase()).join(' ').trim();
}

// CLI 테스트
if (require.main === module) {
  const testVideos = process.argv.slice(2);
  if (testVideos.length === 0) {
    console.error('Usage: node extract_songs_from_subs.cjs <videoId> [videoId2] ...');
    process.exit(1);
  }
  for (const vid of testVideos) {
    console.log(`\n=== ${vid} ===`);
    const mc = extractMCAnnouncement(vid);
    console.log('MC:', mc);
    if (mc) {
      const songs = parseMCAnnouncement(mc);
      console.log('Parsed songs:');
      for (const s of songs) console.log(' -', s);
    }
  }
}

module.exports = { extractMCAnnouncement, parseMCAnnouncement };
