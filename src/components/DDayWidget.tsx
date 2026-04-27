// 다음 대회 D-day 위젯 — Cover 페이지 상단 노출
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const TARGET_KEY = 'tango_lab_checklist_target';

const PHASE_COLORS: Record<string, string> = {
  'D-30': '#5D7A8E',
  'D-21': '#7A8E6E',
  'D-14': '#9B7B4A',
  'D-7': '#D4AF37',
  'D-3': '#E68F4A',
  'D-1': '#C72C1C',
  'D-day': '#6B1F2E',
  'D+1': '#8B7A4F',
};

function loadTarget(): { name: string; date: string } | null {
  try {
    const raw = localStorage.getItem(TARGET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.date) return null;
    return parsed;
  } catch {
    return null;
  }
}

function daysUntil(dateStr: string): number | null {
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function currentPhase(days: number): string {
  if (days > 21) return 'D-30';
  if (days > 14) return 'D-21';
  if (days > 7) return 'D-14';
  if (days > 3) return 'D-7';
  if (days > 1) return 'D-3';
  if (days === 1) return 'D-1';
  if (days === 0) return 'D-day';
  return 'D+1';
}

export function DDayWidget() {
  const [target, setTarget] = useState<{ name: string; date: string } | null>(null);

  useEffect(() => {
    setTarget(loadTarget());
    // localStorage 변경 감지 (다른 탭에서 수정 시)
    const onStorage = () => setTarget(loadTarget());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!target) {
    // 미설정 시 — 설정 유도 카드
    return (
      <Link
        to="/checklist"
        className="block bg-tango-shadow/40 border border-dashed border-tango-brass/30 rounded-sm p-4 hover:border-tango-brass/60 hover:bg-tango-shadow/60 transition-all text-center"
      >
        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass/70 font-sans mb-1">
          Next Competition
        </div>
        <div className="text-sm text-tango-cream/70 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          다음 대회 날짜 설정 →
        </div>
      </Link>
    );
  }

  const dDay = daysUntil(target.date);
  if (dDay === null) return null;
  const phase = currentPhase(dDay);
  const color = PHASE_COLORS[phase];
  const dDayLabel = dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-day' : `D+${Math.abs(dDay)}`;

  return (
    <Link
      to="/checklist"
      className="block bg-gradient-to-br from-tango-shadow/60 to-tango-ink border-2 rounded-sm p-4 md:p-5 hover:scale-[1.01] transition-all"
      style={{ borderColor: `${color}66` }}
    >
      <div className="flex items-center gap-4">
        <div className="text-center flex-shrink-0">
          <div
            className="font-display text-3xl md:text-4xl font-bold leading-none"
            style={{ color, fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {dDayLabel}
          </div>
          <div className="text-[9px] tracking-[0.25em] uppercase text-tango-cream/50 mt-1 font-sans">
            {phase}
          </div>
        </div>
        <div className="h-12 w-px bg-tango-brass/20" />
        <div className="flex-1 min-w-0">
          <div className="text-[9px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-1">
            Next Competition
          </div>
          <div className="font-serif italic text-base md:text-lg text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            {target.name || '(이름 미설정)'}
          </div>
          <div className="text-[10px] text-tango-cream/50 font-sans">
            {target.date}
          </div>
        </div>
        <span className="text-tango-brass/60 text-lg flex-shrink-0">→</span>
      </div>
    </Link>
  );
}
