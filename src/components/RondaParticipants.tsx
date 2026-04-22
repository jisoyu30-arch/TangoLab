// 론다 출전자 + 진출 현황 — "이 론다 결승 진출자 X, 준결승 진출자 Y" 형식
import { useMemo, useState } from 'react';
import { getParticipantsByRonda, hasAdvancementData } from '../utils/rondaParticipants';
import type { Participant, AdvancementStage } from '../utils/rondaParticipants';

interface Props {
  year: number;
  rondaNumber: number;
  competition: string;
  stage: string;
  compact?: boolean;
}

const SECTION_ORDER: AdvancementStage[] = ['final', 'semifinal', 'cuartos', 'qualifying'];

const SECTION_META: Record<AdvancementStage, { heading: string; emoji: string; accent: string }> = {
  final: { heading: '결승 진출', emoji: '🏆', accent: 'text-tango-brass border-tango-brass/40 bg-tango-brass/10' },
  semifinal: { heading: '준결승 진출', emoji: '◆', accent: 'text-tango-brass border-tango-brass/30 bg-tango-brass/5' },
  cuartos: { heading: '8강 진출', emoji: '◇', accent: 'text-tango-brass/80 border-tango-brass/20 bg-white/5' },
  qualifying: { heading: '예선 탈락', emoji: '○', accent: 'text-tango-cream/50 border-white/10 bg-white/2' },
  none: { heading: '—', emoji: '—', accent: '' },
};

export function RondaParticipants({ year, rondaNumber, competition, stage, compact = false }: Props) {
  const [showAll, setShowAll] = useState(false);

  // Mundial 이외는 아직 데이터 없음
  const supported = competition === 'Mundial' && hasAdvancementData(year) && stage === 'qualifying';

  const participants = useMemo(
    () => supported ? getParticipantsByRonda(year, rondaNumber) : [],
    [year, rondaNumber, supported]
  );

  const grouped = useMemo(() => {
    const map: Record<AdvancementStage, Participant[]> = {
      final: [], semifinal: [], cuartos: [], qualifying: [], none: [],
    };
    for (const p of participants) map[p.advancedTo].push(p);
    return map;
  }, [participants]);

  if (!supported) {
    return (
      <div className="rounded-sm border border-dashed border-tango-brass/20 bg-white/3 p-3">
        <div className="text-[11px] text-tango-cream/50 font-sans">
          ⓘ 이 대회는 출전자 데이터가 아직 등록되지 않았습니다.
          <br />
          <span className="text-tango-cream/40">
            (현재 자동 연결 지원: 2025년 Mundial 예선 · 다른 연도는 tangoba.org에서 추출 예정)
          </span>
        </div>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-tango-brass/20 bg-white/3 p-3">
        <div className="text-[11px] text-tango-cream/50 font-sans">
          이 ronda의 출전자 기록이 없습니다.
        </div>
      </div>
    );
  }

  const totalCount = participants.length;
  const advancedCount = totalCount - grouped.qualifying.length;

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
            Ronda {rondaNumber} · 출전 커플
          </div>
          <div className="text-xs text-tango-cream/60 font-sans mt-0.5">
            총 <span className="text-tango-paper font-semibold">{totalCount}</span>팀 중{' '}
            <span className="text-tango-brass font-semibold">{advancedCount}</span>팀 다음 라운드 진출
          </div>
        </div>
        {grouped.final.length > 0 && (
          <div className="text-right">
            <div className="text-tango-brass font-display text-lg font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              🏆 {grouped.final.length}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-tango-cream/50">결승 진출</div>
          </div>
        )}
      </div>

      {/* 진출 단계별 그룹 */}
      <div className="space-y-2">
        {SECTION_ORDER.map(stageKey => {
          const list = grouped[stageKey];
          if (list.length === 0) return null;
          const meta = SECTION_META[stageKey];
          const isQualifying = stageKey === 'qualifying';
          const displayList = compact && isQualifying && !showAll ? list.slice(0, 3) : list;

          return (
            <div key={stageKey} className={`rounded-sm border p-3 ${meta.accent}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{meta.emoji}</span>
                <div className="text-[11px] tracking-widest uppercase font-sans font-semibold">
                  {meta.heading}
                </div>
                <span className="text-[11px] opacity-60">· {list.length}팀</span>
              </div>
              <div className="space-y-1">
                {displayList.map(p => (
                  <ParticipantRow key={p.pareja} p={p} highlight={stageKey === 'final' || stageKey === 'semifinal'} />
                ))}
                {compact && isQualifying && !showAll && list.length > 3 && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="text-[11px] text-tango-cream/50 hover:text-tango-brass mt-2 font-sans"
                  >
                    + 나머지 {list.length - 3}팀 펼치기
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 푸터 */}
      <div className="text-[10px] text-tango-cream/40 font-sans text-center pt-1">
        데이터: Mundial {year} 공식 결과 · pareja 번호는 영상에서 확인 가능
      </div>
    </div>
  );
}

function ParticipantRow({ p, highlight }: { p: Participant; highlight?: boolean }) {
  const finalBadge = p.finalRank ? (
    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-tango-brass/30 text-tango-brass ml-auto">
      결승 {p.finalRank}위 · {p.finalPromedio?.toFixed(3)}
    </span>
  ) : p.semifinalRank ? (
    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-tango-brass/15 text-tango-brass/80 ml-auto">
      준결승 {p.semifinalRank}위
    </span>
  ) : p.cuartosRank ? (
    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-tango-brass/10 text-tango-brass/60 ml-auto">
      8강 {p.cuartosRank}위
    </span>
  ) : p.qualifyingRank ? (
    <span className="text-[10px] text-tango-cream/40 ml-auto">
      ronda {p.qualifyingRank}위 · {p.qualifyingPromedio?.toFixed(2)}
    </span>
  ) : null;

  return (
    <div className={`flex items-baseline gap-2 text-xs ${highlight ? 'text-tango-paper' : 'text-tango-cream/80'}`}>
      <span className="font-mono text-[11px] text-tango-brass/70 w-12 flex-shrink-0">
        #{p.pareja}
      </span>
      <span className="font-serif italic truncate flex-1" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        {p.leader} & {p.follower}
      </span>
      {finalBadge}
    </div>
  );
}
