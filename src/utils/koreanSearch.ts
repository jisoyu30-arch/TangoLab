// 한글 초성 검색 — 'ㄷㅇㄹ' → 'D'Arienzo' 매칭
const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

/** 한글 문자에서 초성 추출 */
export function getChosung(str: string): string {
  let result = '';
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      // 한글 음절: 초성 = (code - 0xAC00) / 588
      const idx = Math.floor((code - 0xAC00) / 588);
      result += CHOSUNG[idx];
    } else {
      result += ch;
    }
  }
  return result;
}

/** 쿼리가 대상 문자열과 매칭되는지 (일반 + 초성) */
export function matchesKoreanChosung(query: string, target: string): boolean {
  if (!query || !target) return false;
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // 일반 매칭
  if (t.includes(q)) return true;

  // 쿼리가 한글 초성만 포함되어 있으면 대상의 초성과 매칭
  const isOnlyChosung = /^[\u3131-\u314E\s]+$/.test(query);
  if (isOnlyChosung) {
    const targetChosung = getChosung(target);
    return targetChosung.includes(query);
  }

  return false;
}
