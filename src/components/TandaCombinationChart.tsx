// 선곡 패턴 자동 감지 — 결승 라운드에서 자주 등장하는 악단 3곡 조합 (탄다)
import { useMemo } from 'react';
import roundsData from '../data/competition_rounds.json';
import { shortOrchestraName } from '../utils/tandaAnalysis';

interface CompRound {
  round_id: string;
  competition: string;
  year: number;
  category: string;
  stage: string;
  songs: Array<{ song_id: string; orchestra: string; order: number }>;
}

const allRounds = (roundsData as { rounds: CompRound[] }).rounds;

interface TandaPattern {
  signature: string; // 'D'Arienzo|Pugliese|Calo' (sorted)
  display: string[]; // ['D'Arienzo', 'Pugliese', 'Caló']
  count: number;
  finalCount: number;
  semifinalCount: number;
  examples: Array<{ year: number; competition: string; stage: string }>;
  finalRatio: number;
}

// 악단 조합 정규화: 정렬된 시그니처로
function normalize(orchestras: string[]): { signature: string; display: string[] } {
  const cleaned = orchestras
    .map(o => shortOrchestraName(o))
    .filter(o => o && o !== '?')
    .map(o => o.split(' ').slice(-1)[0]); // 마지막 성씨만
  const unique = [...new Set(cleaned)].sort();
  return { signature: unique.join('|'), display: unique };
}

export function TandaCombinationChart({ stageFilter = 'final' }: { stageFilter?: 'final' | 'semifinal' | 'all' }) {
  const patterns = useMemo<TandaPattern[]>(() => {
    const map: Record<string, TandaPattern> = {};

    for (const r of allRounds) {
      if (!r.songs || r.songs.length < 3) continue;
      if (stageFilter !== 'all' && r.stage !== stageFilter) continue;

      const orchs = r.songs.map(s => s.orchestra);
      const { signature, display } = normalize(orchs);
      if (signature.split('|').length < 2) continue; // 최소 2개 다른 악단

      if (!map[signature]) {
        map[signature] = {
          signature,
          display,
          count: 0,
          finalCount: 0,
          semifinalCount: 0,
          examples: [],
          finalRatio: 0,
        };
      }
      map[signature].count++;
      if (r.stage === 'final') map[signature].finalCount++;
      else if (r.stage === 'semifinal') map[signature].semifinalCount++;
      if (map[signature].examples.length < 3) {
        map[signature].examples.push({
          year: r.year,
          competition: r.competition,
          stage: r.stage,
        });
      }
    }

    const arr = Object.values(map);
    for (const p of arr) {
      p.finalRatio = p.count > 0 ? p.finalCount / p.count : 0;
    }

    return arr
      .filter(p => p.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [stageFilter]);

  if (patterns.length === 0) {
    return (
      <div className="text-center py-8 text-tango-cream/50 font-serif italic">
        선곡 패턴을 감지할 데이터가 부족합니다.
      </div>
    );
  }

  const maxCount = patterns[0].count;

  return (
    <div className="space-y-3">
      <div className="text-[11px] text-tango-cream/60 mb-4 font-serif italic">
        {stageFilter === 'final' ? '결승' : stageFilter === 'semifinal' ? '준결승' : '전체'} 라운드에서 자주 등장하는 악단 조합 — 같은 악단군이 반복되면 우승 전략의 단서.
      </div>

      {patterns.map((p, i) => (
        <div key={p.signature} className="bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-3 md:p-4">
          <div className="flex items-start gap-3">
            <span className="font-display text-2xl md:text-3xl text-tango-brass/60 italic font-bold flex-shrink-0 w-8 text-right" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              {/* 악단 조합 표시 */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {p.display.map((o, oi) => (
                  <span key={oi} className="inline-flex items-center gap-1.5">
                    <span className="font-serif italic text-base md:text-lg text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {o}
                    </span>
                    {oi < p.display.length - 1 && (
                      <span className="text-tango-brass/50 text-xs">+</span>
                    )}
                  </span>
                ))}
              </div>

              {/* 빈도 막대 */}
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex-1 h-1.5 bg-tango-brass/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-tango-brass/60 to-tango-brass"
                    style={{ width: `${(p.count / maxCount) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-tango-cream/60 flex-shrink-0">
                  <span className="font-mono text-tango-brass font-bold">{p.count}회</span>
                  {p.finalCount > 0 && (
                    <span className="text-tango-brass/80">· 결승 {p.finalCount}</span>
                  )}
                </div>
              </div>

              {/* 예시 */}
              <div className="text-[10px] text-tango-cream/40 mt-1.5 font-sans">
                예: {p.examples.map(e => `${e.year} ${e.competition.substring(0, 8)}`).join(' · ')}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
