// 대회 준비 체크리스트 템플릿 — D-30부터 D-day까지
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider, EditorialButton } from '../components/editorial';

interface ChecklistItem {
  id: string;
  phase: 'D-30' | 'D-21' | 'D-14' | 'D-7' | 'D-3' | 'D-1' | 'D-day' | 'D+1';
  task: string;
  category: 'body' | 'music' | 'technique' | 'gear' | 'mental' | 'admin';
  done: boolean;
}

const DEFAULT_ITEMS: Array<Omit<ChecklistItem, 'done'>> = [
  // D-30: 음악·전략
  { id: '30-1', phase: 'D-30', task: '대회 선곡 패턴 분석 (탱고랩 트렌드 페이지)', category: 'music' },
  { id: '30-2', phase: 'D-30', task: '예상 악단 3곡 조합 5개 구상', category: 'music' },
  { id: '30-3', phase: 'D-30', task: '의상 체크 및 필요시 주문', category: 'gear' },
  { id: '30-4', phase: 'D-30', task: 'PT / 컨디션 관리 루틴 확정', category: 'body' },

  // D-21: 기술 집중
  { id: '21-1', phase: 'D-21', task: '테크닉 약점 3가지 노트화', category: 'technique' },
  { id: '21-2', phase: 'D-21', task: '주당 10시간 연습 시간 확보', category: 'body' },
  { id: '21-3', phase: 'D-21', task: '파트너와 에너지 조율 기준 합의', category: 'mental' },

  // D-14: 실전 리허설
  { id: '14-1', phase: 'D-14', task: '대회 동선 시뮬레이션 (원형 이동)', category: 'technique' },
  { id: '14-2', phase: 'D-14', task: '긴장 상태 연습 (영상 촬영)', category: 'mental' },
  { id: '14-3', phase: 'D-14', task: '플로어크래프트 특훈', category: 'technique' },
  { id: '14-4', phase: 'D-14', task: '참가 신청 및 BIB 번호 확인', category: 'admin' },

  // D-7: 마무리
  { id: '7-1', phase: 'D-7', task: '의상 리허설 (실제 착용)', category: 'gear' },
  { id: '7-2', phase: 'D-7', task: '컨디션 조절 (수면 7시간 이상)', category: 'body' },
  { id: '7-3', phase: 'D-7', task: '고난도 시퀀스는 피하고 기본기 다지기', category: 'technique' },
  { id: '7-4', phase: 'D-7', task: '대회장 이동 경로/시간 확인', category: 'admin' },

  // D-3: 최종 점검
  { id: '3-1', phase: 'D-3', task: '신발 베이킹/길들이기 완료', category: 'gear' },
  { id: '3-2', phase: 'D-3', task: '식이조절 (무거운 음식 피하기)', category: 'body' },
  { id: '3-3', phase: 'D-3', task: '파트너와 긴장 해소 대화', category: 'mental' },

  // D-1: 전날
  { id: '1-1', phase: 'D-1', task: '가방 싸기 (여분 의상, 응급키트, 물, 간식)', category: 'gear' },
  { id: '1-2', phase: 'D-1', task: '가벼운 산책 + 스트레칭', category: 'body' },
  { id: '1-3', phase: 'D-1', task: '일찍 취침 (최소 8시간)', category: 'body' },
  { id: '1-4', phase: 'D-1', task: '대회 규칙 & 음악 3곡 예상 리스트 리뷰', category: 'music' },

  // D-day: 당일
  { id: '0-1', phase: 'D-day', task: '2시간 전 도착 + 웜업', category: 'body' },
  { id: '0-2', phase: 'D-day', task: '음악 체크 (첫 8박 듣고 악단 감 잡기)', category: 'music' },
  { id: '0-3', phase: 'D-day', task: '깊게 호흡 · 파트너 눈 맞추기', category: 'mental' },
  { id: '0-4', phase: 'D-day', task: '끝나면 영상 요청 받기', category: 'admin' },

  // D+1
  { id: 'p1-1', phase: 'D+1', task: '대회 기록 페이지에 점수/심사위원 기록', category: 'admin' },
  { id: 'p1-2', phase: 'D+1', task: '영상 보면서 개선점 3가지 메모', category: 'technique' },
  { id: 'p1-3', phase: 'D+1', task: '파트너와 리뷰 시간 갖기', category: 'mental' },
];

const STORAGE_KEY = 'tango_lab_checklist_state';

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

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  body: { label: '몸·컨디션', icon: '🏃' },
  music: { label: '음악·전략', icon: '🎵' },
  technique: { label: '테크닉', icon: '🩰' },
  gear: { label: '장비·의상', icon: '👗' },
  mental: { label: '마인드', icon: '🧘' },
  admin: { label: '행정', icon: '📋' },
};

function loadState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function ChecklistPage() {
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>(loadState);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const items = DEFAULT_ITEMS.map(it => ({ ...it, done: !!doneMap[it.id] }));
  const filtered = filterCategory === 'all' ? items : items.filter(it => it.category === filterCategory);

  const toggle = (id: string) => {
    const next = { ...doneMap, [id]: !doneMap[id] };
    setDoneMap(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const resetAll = () => {
    if (confirm('모든 체크 기록을 초기화할까요?')) {
      setDoneMap({});
      localStorage.setItem(STORAGE_KEY, '{}');
    }
  };

  const phases = ['D-30', 'D-21', 'D-14', 'D-7', 'D-3', 'D-1', 'D-day', 'D+1'] as const;
  const grouped = phases.map(p => ({
    phase: p,
    items: filtered.filter(it => it.phase === p),
  }));

  const progress = items.filter(it => it.done).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <>
      <PageHeader title="대회 준비 체크리스트" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-10 space-y-8">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Competition Prep · D-30 to D+1
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              대회 <em className="text-tango-brass">준비</em>
            </h1>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 진행률 */}
          <div className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans">Progress</div>
                <div className="font-display text-3xl text-tango-brass font-bold mt-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {progress} / {total}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-4xl text-tango-paper font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {pct}<span className="text-xl">%</span>
                </div>
                <EditorialButton variant="ghost" onClick={resetAll} className="mt-2 text-xs">
                  초기화
                </EditorialButton>
              </div>
            </div>
            <div className="h-1 bg-tango-brass/15 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-tango-brass to-tango-rose rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-0 border-b border-tango-brass/20 overflow-x-auto">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-3 text-sm font-serif italic whitespace-nowrap transition-all border-b-2 ${
                filterCategory === 'all'
                  ? 'text-tango-paper border-tango-brass'
                  : 'text-tango-cream/50 border-transparent hover:text-tango-paper/80'
              }`}
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              전체
            </button>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setFilterCategory(k)}
                className={`px-4 py-3 text-sm font-serif italic whitespace-nowrap transition-all border-b-2 ${
                  filterCategory === k
                    ? 'text-tango-paper border-tango-brass'
                    : 'text-tango-cream/50 border-transparent hover:text-tango-paper/80'
                }`}
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          {/* 단계별 리스트 */}
          {grouped.filter(g => g.items.length > 0).map(({ phase, items: phaseItems }) => (
            <section key={phase}>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="font-display text-3xl font-bold italic"
                  style={{ color: PHASE_COLORS[phase], fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  {phase}
                </span>
                <div className="h-px flex-1 bg-tango-brass/20" />
                <span className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans">
                  {phaseItems.filter(it => it.done).length} / {phaseItems.length}
                </span>
              </div>
              <div className="space-y-px bg-tango-brass/15 rounded-sm overflow-hidden">
                {phaseItems.map(it => {
                  const cat = CATEGORY_LABELS[it.category];
                  return (
                    <button
                      key={it.id}
                      onClick={() => toggle(it.id)}
                      className={`w-full flex items-start gap-3 bg-tango-ink hover:bg-tango-shadow p-4 text-left transition-colors ${
                        it.done ? 'opacity-50' : ''
                      }`}
                    >
                      <span className={`flex-shrink-0 w-5 h-5 rounded-sm border-2 flex items-center justify-center mt-0.5 transition-all ${
                        it.done ? 'bg-tango-brass border-tango-brass' : 'border-tango-brass/40'
                      }`}>
                        {it.done && <span className="text-tango-ink text-sm">✓</span>}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`font-serif text-base ${it.done ? 'line-through text-tango-cream/50' : 'text-tango-paper'}`} style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {it.task}
                        </div>
                        <div className="text-[10px] tracking-widest uppercase text-tango-brass/70 mt-1 font-sans">
                          {cat.icon} {cat.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <OrnamentDivider className="pt-8" />
        </div>
      </div>
    </>
  );
}
