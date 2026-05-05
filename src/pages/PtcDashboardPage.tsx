// PTC 전용 대시보드 — 출전 부문·D-day·매트릭스·시퀀스 통합
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import { DailyTask } from '../components/DailyTask';
import { useTrainingStore } from '../hooks/useTrainingStore';
import { useSequencesStore } from '../hooks/useSequencesStore';
import { MUSIC_TYPES, DIMENSIONS, cellKey } from '../hooks/useStrategyMatrix';
import ktcData from '../data/ktc_participants.json';

const TARGET_KEY = 'tango_lab_checklist_target';
const PTC_CONFIG_KEY = 'tango_lab_ptc_config';
const STRATEGY_KEY = 'tango_lab_strategy_matrix';

interface PtcConfig {
  categories: string[]; // ['pista', 'milonga', 'vals', 'jack']
  notes: string;
  stage_mode_pin?: boolean; // D-7부터 활성화되는 단순 모드
}

interface Target { name: string; date: string }

const CATEGORIES = [
  { key: 'pista',    label: '피스타',     emoji: '🎭', desc: '4곡 탄다 / Tango de Pista' },
  { key: 'milonga',  label: '밀롱가',     emoji: '💃', desc: '3곡 탄다 / Milonga' },
  { key: 'vals',     label: '발스',       emoji: '🎵', desc: '3곡 탄다 / Vals' },
  { key: 'jack',     label: '잭앤질',     emoji: '🕺', desc: '솔로 + 즉석 매칭' },
];

function loadTarget(): Target | null {
  try {
    const raw = localStorage.getItem(TARGET_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    return t.date ? t : null;
  } catch { return null; }
}

function loadPtcConfig(): PtcConfig {
  try {
    const raw = localStorage.getItem(PTC_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { categories: [], notes: '' };
  } catch { return { categories: [], notes: '' }; }
}

function loadStrategyCells(): Record<string, any> {
  try {
    const raw = localStorage.getItem(STRATEGY_KEY);
    return raw ? (JSON.parse(raw).cells || {}) : {};
  } catch { return {}; }
}

function daysUntil(dateStr: string): number | null {
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function PtcDashboardPage() {
  const [target, setTarget] = useState<Target | null>(null);
  const [config, setConfig] = useState<PtcConfig>(loadPtcConfig);
  const { ownCompetitions } = useTrainingStore();
  const { sequences } = useSequencesStore();

  useEffect(() => { setTarget(loadTarget()); }, []);

  const dDay = target?.date ? daysUntil(target.date) : null;
  const stageMode = (dDay !== null && dDay <= 7) || config.stage_mode_pin;

  const updateConfig = (next: Partial<PtcConfig>) => {
    const merged = { ...config, ...next };
    setConfig(merged);
    localStorage.setItem(PTC_CONFIG_KEY, JSON.stringify(merged));
  };

  const toggleCategory = (cat: string) => {
    const has = config.categories.includes(cat);
    updateConfig({ categories: has ? config.categories.filter(c => c !== cat) : [...config.categories, cat] });
  };

  // 부문별 우리 점수 트렌드
  const categoryStats = useMemo(() => {
    const stats: Record<string, { records: any[]; avg: number; bestRank: number; advanceCount: number; trend?: number }> = {};
    const ktc = ktcData as any;

    // KTC 기록
    for (const ev of Object.values(ktc.events)) {
      const e = ev as any;
      for (const c of e.couples || []) {
        if (!(c.is_my_couple || c.is_my_partner)) continue;
        const cat = e.category === 'pista_singles_jackandjill' ? 'jack' : e.category;
        if (!stats[cat]) stats[cat] = { records: [], avg: 0, bestRank: 999, advanceCount: 0 };
        stats[cat].records.push({ year: e.year, stage: e.stage, avg: c.average, rank: c.rank, advanced: c.advanced, comp: e.competition });
      }
    }
    // OwnCompetitions 추가
    for (const r of ownCompetitions || []) {
      const cat = r.category === 'pista_singles_jackandjill' ? 'jack' : r.category;
      const allScores = (r.scores || []).map(s => s.total).filter(s => s > 0);
      if (allScores.length === 0) continue;
      const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      if (!stats[cat]) stats[cat] = { records: [], avg: 0, bestRank: 999, advanceCount: 0 };
      stats[cat].records.push({
        year: parseInt(r.date?.slice(0, 4) || '0'),
        stage: r.stage,
        avg,
        rank: r.result_placement,
        advanced: r.advanced_to_next,
        comp: r.competition_name,
      });
    }

    // 통계 계산
    for (const cat of Object.keys(stats)) {
      const recs = stats[cat].records;
      stats[cat].avg = recs.reduce((a, b) => a + b.avg, 0) / recs.length;
      stats[cat].bestRank = Math.min(...recs.map(r => r.rank || 999));
      stats[cat].advanceCount = recs.filter(r => r.advanced).length;
      // 시간순 정렬
      recs.sort((a, b) => a.year - b.year);
      if (recs.length >= 2) {
        stats[cat].trend = recs[recs.length - 1].avg - recs[0].avg;
      }
    }
    return stats;
  }, [ownCompetitions]);

  // 부문별 매트릭스 진행률 (음악 분류와 부문 매핑은 느슨)
  const cells = loadStrategyCells();
  const matrixProgress = useMemo(() => {
    const filled = MUSIC_TYPES.flatMap(m =>
      DIMENSIONS.map(d => {
        const c = cells[cellKey(m.key, d.key)];
        return !!(c && (c.notes?.trim() || c.reference_videos?.length || c.own_videos?.length));
      })
    ).filter(Boolean).length;
    return { filled, total: MUSIC_TYPES.length * DIMENSIONS.length };
  }, [cells]);

  // 부문별 추천 시퀀스 (음악 분류로 매핑)
  const sequenceByMusicType = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of sequences) {
      const k = s.music_type || '';
      if (!k) continue;
      if (!map[k]) map[k] = [];
      map[k].push(s);
    }
    return map;
  }, [sequences]);

  // === Stage Mode (D-7 이내) — 단순 화면 ===
  if (stageMode && target && dDay !== null) {
    const dDayLabel = dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-day' : `D+${Math.abs(dDay)}`;
    return (
      <>
        <PageHeader title={`PTC ${dDayLabel}`} />
        <div className="flex-1 overflow-y-auto bg-tango-ink">
          <div className="max-w-2xl mx-auto px-5 py-12 space-y-8">
            {/* 거대한 D-day */}
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-rose font-sans mb-3">
                STAGE MODE · 대회 임박
              </div>
              <div className="font-display text-7xl md:text-9xl text-tango-rose font-bold leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {dDayLabel}
              </div>
              <div className="font-display text-2xl md:text-3xl text-tango-paper italic mt-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {target.name}
              </div>
              <div className="text-sm text-tango-cream/60 mt-1 font-sans">{target.date}</div>
            </div>

            <DailyTask />

            {/* 출전 부문 (강조) */}
            {config.categories.length > 0 && (
              <div className="bg-tango-shadow/40 border-2 border-tango-brass/40 rounded-sm p-5">
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                  My Categories · 출전 부문
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {config.categories.map(cat => {
                    const meta = CATEGORIES.find(c => c.key === cat);
                    if (!meta) return null;
                    return (
                      <div key={cat} className="bg-tango-ink/60 border border-tango-brass/20 rounded-sm p-3 text-center">
                        <div className="text-3xl mb-1">{meta.emoji}</div>
                        <div className="font-serif italic text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{meta.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 빠른 액션 */}
            <div className="grid grid-cols-2 gap-3">
              <Link to="/checklist" className="bg-tango-brass/15 border border-tango-brass/40 rounded-sm p-4 text-center hover:bg-tango-brass/25">
                <div className="text-2xl mb-1">📋</div>
                <div className="text-xs text-tango-brass">최종 체크리스트</div>
              </Link>
              <Link to="/training/sequences" className="bg-tango-brass/15 border border-tango-brass/40 rounded-sm p-4 text-center hover:bg-tango-brass/25">
                <div className="text-2xl mb-1">◈</div>
                <div className="text-xs text-tango-brass">시퀀스 마지막 확인</div>
              </Link>
            </div>

            {/* Stage Mode 토글 (D-7 이전이면 vol 설정 가능) */}
            <div className="text-center">
              <button
                onClick={() => updateConfig({ stage_mode_pin: false })}
                className="text-xs text-tango-cream/40 hover:text-tango-brass underline"
              >
                ← 전체 대시보드로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // === 일반 대시보드 ===
  return (
    <>
      <PageHeader title="PTC 대시보드" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">

          {/* HERO */}
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
              PTC 2026 · Game Plan
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              PTC <em className="text-tango-brass">대회 준비</em>
            </h1>
            {target && dDay !== null && (
              <div className="mt-4 inline-block bg-tango-brass/10 border border-tango-brass/40 rounded-sm px-6 py-3">
                <div className="text-[10px] tracking-widest uppercase text-tango-brass mb-1">{target.name}</div>
                <div className="font-display text-4xl md:text-5xl text-tango-rose font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-day' : `D+${Math.abs(dDay)}`}
                </div>
                <div className="text-xs text-tango-cream/60 mt-1">{target.date}</div>
              </div>
            )}
            {!target && (
              <div className="mt-4">
                <Link to="/checklist" className="text-sm text-tango-brass hover:underline">
                  → 다음 대회 날짜 설정 (체크리스트)
                </Link>
              </div>
            )}
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 오늘의 추천 */}
          <DailyTask />

          {/* 출전 부문 선택 */}
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
                  My Categories · 출전 부문
                </div>
                <h2 className="font-display text-xl md:text-2xl text-tango-paper italic mt-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  어떤 부문에 출전?
                </h2>
              </div>
              <span className="text-xs text-tango-cream/50">{config.categories.length}/4 선택</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CATEGORIES.map(cat => {
                const selected = config.categories.includes(cat.key);
                return (
                  <button
                    key={cat.key}
                    onClick={() => toggleCategory(cat.key)}
                    className={`p-4 rounded-sm border-2 text-center transition-all ${
                      selected ? 'border-tango-brass bg-tango-brass/15' : 'border-tango-brass/20 bg-tango-shadow/30 hover:border-tango-brass/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{cat.emoji}</div>
                    <div className="font-serif italic text-base text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {cat.label}
                    </div>
                    <div className="text-[10px] text-tango-cream/50 mt-1">{cat.desc}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 부문별 우리 점수 트렌드 */}
          {config.categories.length > 0 && (
            <section>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                Score Trend · 부문별 우리 기록
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {config.categories.map(cat => {
                  const meta = CATEGORIES.find(c => c.key === cat);
                  const stat = categoryStats[cat];
                  if (!meta) return null;
                  return (
                    <div key={cat} className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{meta.emoji}</span>
                          <span className="font-serif italic text-lg text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                            {meta.label}
                          </span>
                        </div>
                        {stat && (
                          <span className="text-xs text-tango-cream/50">{stat.records.length}회</span>
                        )}
                      </div>
                      {stat ? (
                        <>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <div className="font-display text-2xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                                {stat.avg.toFixed(2)}
                              </div>
                              <div className="text-[9px] uppercase tracking-widest text-tango-cream/50">평균</div>
                            </div>
                            <div>
                              <div className="font-display text-2xl text-tango-paper" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                                {stat.bestRank === 999 ? '—' : stat.bestRank}
                              </div>
                              <div className="text-[9px] uppercase tracking-widest text-tango-cream/50">최고 순위</div>
                            </div>
                            <div>
                              <div className="font-display text-2xl text-tango-brass" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                                {stat.advanceCount}
                              </div>
                              <div className="text-[9px] uppercase tracking-widest text-tango-cream/50">결승 진출</div>
                            </div>
                          </div>
                          {stat.trend !== undefined && Math.abs(stat.trend) > 0.05 && (
                            <div className="mt-2 text-xs text-center font-serif italic" style={{ color: stat.trend > 0 ? '#7A9E6E' : '#C72C1C', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                              추세 {stat.trend > 0 ? '+' : ''}{stat.trend.toFixed(2)}점 ({stat.records.length}회 기준)
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-tango-cream/40 italic text-center py-4">
                          이 부문 출전 기록 없음
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 매트릭스 진행률 */}
          <section className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
                  Strategy Matrix · 전략 매트릭스 진행률
                </div>
                <div className="text-xs text-tango-cream/60 mt-1 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  음악 4분류 × 차원 5 = 20셀 중
                </div>
              </div>
              <Link to="/strategy" className="text-xs text-tango-brass hover:underline">
                → 매트릭스
              </Link>
            </div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-display text-4xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {matrixProgress.filled}<span className="text-lg text-tango-cream/40">/{matrixProgress.total}</span>
              </span>
              <span className="text-sm text-tango-cream/60">
                {Math.round((matrixProgress.filled / matrixProgress.total) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-tango-brass/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-tango-brass to-tango-rose transition-all duration-500"
                style={{ width: `${(matrixProgress.filled / matrixProgress.total) * 100}%` }}
              />
            </div>
          </section>

          {/* 시퀀스 라이브러리 — 음악 분류별 */}
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
                Sequences · 부문별 시퀀스
              </div>
              <Link to="/training/sequences" className="text-xs text-tango-brass hover:underline">
                → 라이브러리
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {MUSIC_TYPES.map(m => {
                const seqs = sequenceByMusicType[m.key] || [];
                return (
                  <div key={m.key} className="bg-tango-shadow/40 border rounded-sm p-3" style={{ borderColor: `${m.color}33` }}>
                    <div className="font-serif italic text-base text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {m.label}
                    </div>
                    <div className="text-[10px] tracking-widest uppercase mt-0.5" style={{ color: m.color }}>{m.sub}</div>
                    <div className="font-display text-2xl text-tango-brass font-bold mt-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {seqs.length}<span className="text-xs text-tango-cream/40">개</span>
                    </div>
                    <div className="text-[10px] text-tango-cream/50 mt-1">
                      {seqs.filter(s => s.status === 'mastered').length} 몸에 익음
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 자유 메모 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
              PTC Notes · 자유 메모
            </div>
            <textarea
              value={config.notes}
              onChange={e => updateConfig({ notes: e.target.value })}
              placeholder="PTC 대비 메모 — 신랑과 합의한 약속, 강사 코멘트, 자주 잊는 부분…"
              className="w-full bg-tango-shadow/40 border border-tango-brass/30 rounded-sm px-3 py-3 text-tango-paper font-serif text-sm focus:outline-none focus:border-tango-brass min-h-[120px]"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            />
          </section>

          {/* Stage Mode 수동 활성화 */}
          {dDay !== null && dDay > 7 && (
            <div className="text-center text-xs text-tango-cream/40 italic">
              D-7 이후 자동으로 Stage Mode (단순 화면) 활성화 ·{' '}
              <button onClick={() => updateConfig({ stage_mode_pin: true })} className="text-tango-brass hover:underline">
                지금 미리보기
              </button>
            </div>
          )}

          {/* 빠른 진입 */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-tango-brass/15">
            <Link to="/strategy" className="text-xs text-center px-3 py-3 rounded-sm border border-tango-brass/30 text-tango-cream/80 hover:bg-tango-brass/10">
              ◆ 전략 매트릭스
            </Link>
            <Link to="/checklist" className="text-xs text-center px-3 py-3 rounded-sm border border-tango-brass/30 text-tango-cream/80 hover:bg-tango-brass/10">
              📋 체크리스트
            </Link>
            <Link to="/training/sequences" className="text-xs text-center px-3 py-3 rounded-sm border border-tango-brass/30 text-tango-cream/80 hover:bg-tango-brass/10">
              ◈ 시퀀스
            </Link>
            <Link to="/weakness" className="text-xs text-center px-3 py-3 rounded-sm border border-tango-brass/30 text-tango-cream/80 hover:bg-tango-brass/10">
              ✕ 약점 해부
            </Link>
          </section>

          <OrnamentDivider className="pt-4" />
        </div>
      </div>
    </>
  );
}
