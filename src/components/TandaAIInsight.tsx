// 탄다 AI 자동 해설 — Gemini가 3곡 조합의 음악적 논리 설명
import { useState, useCallback, useEffect } from 'react';
import { askGemini } from '../lib/gemini';

interface TandaSong {
  title: string;
  orchestra: string;
  order: number;
}

interface Props {
  competition: string;
  year: number;
  stage: string;
  ronda: number;
  songs: TandaSong[];
  cacheKey: string;
}

const CACHE_PREFIX = 'tango_lab_ai_insight_';

export function TandaAIInsight({ competition, year, stage, ronda, songs, cacheKey }: Props) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheStorageKey = `${CACHE_PREFIX}${cacheKey}`;

  // 캐시 로드
  useEffect(() => {
    try {
      const cached = localStorage.getItem(cacheStorageKey);
      if (cached) setInsight(cached);
    } catch { /* ignore */ }
  }, [cacheStorageKey]);

  const generate = useCallback(async () => {
    if (loading || insight) return;

    setLoading(true);
    setError(null);

    const stageLabel = stage === 'final' ? '결승' : stage === 'semifinal' ? '준결승' : stage === 'quarterfinal' ? '8강' : '예선';
    const songList = songs.map(s => `${s.order}. ${s.title} (${s.orchestra || '미상'})`).join('\n');

    const prompt = `${competition} ${year} ${stageLabel} Ronda ${ronda}에서 다음 3곡이 하나의 탄다로 묶였습니다:

${songList}

이 조합이 왜 "통하는지" 음악적·춤적 관점에서 3-4문장으로 분석해주세요:
- 에너지 흐름 (느림↔빠름, 감정 아크)
- 악단 조합의 음악적 대비 또는 통일성
- 춤추는 사람 입장에서의 경험
- 대회 심사에서 어떻게 읽힐지

너무 학술적이지 않게, 실전 탱고인 감각으로 써주세요. 한 문단으로.`;

    try {
      const reply = await askGemini(prompt, []);
      setInsight(reply);
      localStorage.setItem(cacheStorageKey, reply);
    } catch (e: any) {
      setError(e.message || 'AI 호출 실패');
    } finally {
      setLoading(false);
    }
  }, [loading, insight, competition, year, stage, ronda, songs, cacheStorageKey]);

  if (insight) {
    return (
      <div className="border-l-2 border-tango-brass/40 pl-4 py-2 my-4">
        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
          ✦ AI 해설
        </div>
        <p className="font-serif text-base text-tango-paper leading-relaxed italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          {insight}
        </p>
      </div>
    );
  }

  return (
    <div className="my-4">
      {error && (
        <div className="text-xs text-red-400 mb-2">⚠ {error}</div>
      )}
      <button
        onClick={generate}
        disabled={loading || songs.length < 2}
        className="inline-flex items-center gap-2 px-4 py-2 border border-tango-brass/30 hover:border-tango-brass/60 hover:bg-tango-brass/5 rounded-sm text-xs font-serif italic text-tango-brass transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
      >
        {loading ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-tango-brass border-t-transparent rounded-full animate-spin"></span>
            AI 분석 중…
          </>
        ) : (
          <>✦ AI로 이 탄다 분석하기</>
        )}
      </button>
    </div>
  );
}
