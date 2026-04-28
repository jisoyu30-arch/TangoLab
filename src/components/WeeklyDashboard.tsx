// 홈 "이번 주" 미니 대시보드 — 한 화면에 D-day · 연습 시간 · 활성 시퀀스 · 비어있는 매트릭스 셀
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTrainingStore } from '../hooks/useTrainingStore';
import { useSequencesStore } from '../hooks/useSequencesStore';
import { MUSIC_TYPES, DIMENSIONS, cellKey } from '../hooks/useStrategyMatrix';

const TARGET_KEY = 'tango_lab_checklist_target';
const STRATEGY_KEY = 'tango_lab_strategy_matrix';

function loadTarget(): { name: string; date: string } | null {
  try {
    const raw = localStorage.getItem(TARGET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadStrategy(): { cells: Record<string, any> } {
  try {
    const raw = localStorage.getItem(STRATEGY_KEY);
    return raw ? JSON.parse(raw) : { cells: {} };
  } catch {
    return { cells: {} };
  }
}

function daysUntil(dateStr: string): number | null {
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function WeeklyDashboard() {
  const { practices } = useTrainingStore();
  const { sequences } = useSequencesStore();

  const data = useMemo(() => {
    // 이번 주 (월~일) 연습 시간
    const today = new Date();
    const dow = today.getDay() || 7; // 일=0 → 7
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow - 1));
    monday.setHours(0, 0, 0, 0);
    const weekKey = monday.toISOString().split('T')[0];

    const weekMinutes = practices
      .filter(p => p.date >= weekKey)
      .reduce((sum, p) => sum + p.duration_minutes, 0);

    // D-day
    const target = loadTarget();
    const dDay = target?.date ? daysUntil(target.date) : null;

    // 활성 시퀀스 (practicing 상태)
    const activeSequences = sequences.filter(s => s.status === 'practicing').slice(0, 3);
    const learningCount = sequences.filter(s => s.status === 'learning').length;

    // 비어있는 매트릭스 셀
    const strategy = loadStrategy();
    const filled = MUSIC_TYPES.flatMap(m =>
      DIMENSIONS.map(d => {
        const c = strategy.cells[cellKey(m.key, d.key)];
        return c && (c.notes?.trim() || c.reference_videos?.length || c.own_videos?.length);
      })
    ).filter(Boolean).length;
    const totalCells = MUSIC_TYPES.length * DIMENSIONS.length;
    const matrixProgress = totalCells > 0 ? Math.round((filled / totalCells) * 100) : 0;

    // 다음 빈 셀 추천 (매트릭스에서 가장 먼저 빈 것)
    let nextEmptyCell: { music: string; dim: string; musicLabel: string; dimLabel: string } | null = null;
    for (const m of MUSIC_TYPES) {
      for (const d of DIMENSIONS) {
        const c = strategy.cells[cellKey(m.key, d.key)];
        if (!c || (!c.notes?.trim() && !c.reference_videos?.length && !c.own_videos?.length)) {
          nextEmptyCell = { music: m.key, dim: d.key, musicLabel: m.label, dimLabel: d.label };
          break;
        }
      }
      if (nextEmptyCell) break;
    }

    return {
      weekMinutes,
      target,
      dDay,
      activeSequences,
      learningCount,
      filled,
      totalCells,
      matrixProgress,
      nextEmptyCell,
    };
  }, [practices, sequences]);

  const hasAnyData = data.weekMinutes > 0 || data.target || data.activeSequences.length > 0 || data.filled > 0;
  if (!hasAnyData) return null;

  return (
    <section className="bg-tango-shadow/50 border-y border-tango-brass/20">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-5">
        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
          This Week · 이번 주 한눈에
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* D-day */}
          {data.target && data.dDay !== null && (
            <Link to="/checklist" className="bg-tango-ink/50 rounded-sm p-3 hover:bg-tango-ink transition-colors">
              <div className="text-[9px] tracking-widest uppercase text-tango-cream/40 mb-1">D-day</div>
              <div className="font-display text-2xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {data.dDay > 0 ? `D-${data.dDay}` : data.dDay === 0 ? 'D-day' : `D+${Math.abs(data.dDay)}`}
              </div>
              <div className="text-[10px] text-tango-cream/60 truncate font-serif italic">
                {data.target.name || '(이름 없음)'}
              </div>
            </Link>
          )}

          {/* 연습 시간 */}
          <Link to="/training" className="bg-tango-ink/50 rounded-sm p-3 hover:bg-tango-ink transition-colors">
            <div className="text-[9px] tracking-widest uppercase text-tango-cream/40 mb-1">연습 시간</div>
            <div className="font-display text-2xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {Math.round(data.weekMinutes / 60 * 10) / 10}<span className="text-sm">시간</span>
            </div>
            <div className="text-[10px] text-tango-cream/60 font-serif italic">이번 주 누적</div>
          </Link>

          {/* 시퀀스 */}
          <Link to="/training/sequences" className="bg-tango-ink/50 rounded-sm p-3 hover:bg-tango-ink transition-colors">
            <div className="text-[9px] tracking-widest uppercase text-tango-cream/40 mb-1">활성 시퀀스</div>
            <div className="font-display text-2xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {data.activeSequences.length}<span className="text-sm">/{data.learningCount + data.activeSequences.length}</span>
            </div>
            <div className="text-[10px] text-tango-cream/60 truncate font-serif italic">
              {data.activeSequences[0]?.title || '시작하기'}
            </div>
          </Link>

          {/* 매트릭스 진행률 */}
          <Link to="/strategy" className="bg-tango-ink/50 rounded-sm p-3 hover:bg-tango-ink transition-colors">
            <div className="text-[9px] tracking-widest uppercase text-tango-cream/40 mb-1">전략 매트릭스</div>
            <div className="font-display text-2xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {data.matrixProgress}<span className="text-sm">%</span>
            </div>
            <div className="text-[10px] text-tango-cream/60 truncate font-serif italic">
              {data.nextEmptyCell ? `다음: ${data.nextEmptyCell.musicLabel} ${data.nextEmptyCell.dimLabel}` : '20셀 모두 채움'}
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
