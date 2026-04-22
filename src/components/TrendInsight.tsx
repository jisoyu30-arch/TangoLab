// Gemini 자동 트렌드 인사이트 — 통계를 읽고 해설 생성
import { useState, useCallback, useEffect } from 'react';
import { askGemini } from '../lib/gemini';

interface Props {
  context: string; // 통계 요약 텍스트
  cacheKey: string;
  title?: string;
}

const CACHE_PREFIX = 'tango_lab_trend_insight_';

export function TrendInsight({ context, cacheKey, title = '트렌드 해설' }: Props) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `${CACHE_PREFIX}${cacheKey}`;

  useEffect(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) setInsight(cached);
    } catch { /* ignore */ }
  }, [storageKey]);

  const generate = useCallback(async () => {
    if (loading || insight) return;
    setLoading(true);
    setError(null);

    const prompt = `당신은 아르헨티나 탱고 대회 분석가입니다. 다음 통계를 읽고 2-3문장으로 **의미있는 해설**을 한국어로 작성하세요. 단순 숫자 반복이 아니라 **패턴·트렌드·의미**를 짚어주세요.

${context}

응답은 단문 해설만. 마크다운·제목 없이 평서문으로.`;

    try {
      const reply = await askGemini(prompt, []);
      setInsight(reply);
      localStorage.setItem(storageKey, reply);
    } catch (e: any) {
      setError(e.message || 'AI 호출 실패');
    } finally {
      setLoading(false);
    }
  }, [loading, insight, context, storageKey]);

  if (insight) {
    return (
      <div className="border-l-2 border-tango-brass/40 pl-4 md:pl-6 py-3 my-6 bg-tango-shadow/30 rounded-r-sm">
        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
          ✦ AI · {title}
        </div>
        <p className="font-serif text-base md:text-lg text-tango-paper leading-relaxed italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
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
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 border border-tango-brass/30 hover:border-tango-brass/60 hover:bg-tango-brass/5 rounded-sm text-xs font-serif italic text-tango-brass transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
      >
        {loading ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-tango-brass border-t-transparent rounded-full animate-spin"></span>
            AI 분석 중…
          </>
        ) : (
          <>✦ AI로 이 데이터 해석하기</>
        )}
      </button>
    </div>
  );
}
