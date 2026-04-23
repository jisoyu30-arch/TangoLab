// 소유 & 석정 부부 Command Center — 전략 대시보드
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import ktcData from '../data/ktc_participants.json';

// 데이터 타입
interface MyRecord {
  event_key: string;
  year: number;
  competition: string;
  category: string;
  stage: string;
  rank: number;
  total_participants?: number;
  advanced?: boolean;
  scores: number[];
  judges: string[];
  avg: number;
  total?: number;
  is_solo?: boolean; // Jack은 석정 단독
}

interface JudgeStat {
  name: string;
  samples: Array<{ score: number; event: string; year: number }>;
  avg: number;
  min: number;
  max: number;
}

export function CoupleCommandCenterPage() {
  const myData = useMemo(() => {
    const records: MyRecord[] = [];
    const data = ktcData as any;
    for (const [key, ev] of Object.entries(data.events)) {
      const e = ev as any;
      for (const c of e.couples || []) {
        if (c.is_my_couple || c.is_my_partner) {
          records.push({
            event_key: key,
            year: e.year,
            competition: e.competition,
            category: e.category,
            stage: e.stage,
            rank: c.rank,
            total_participants: e.analysis?.total || e.analysis?.total_participants || e.analysis?.total_semifinalists,
            advanced: c.advanced,
            scores: c.scores,
            judges: e.judges,
            avg: c.average,
            total: c.total,
            is_solo: c.is_my_partner && !c.is_my_couple,
          });
        }
      }
    }
    return records.sort((a, b) => a.year - b.year || a.event_key.localeCompare(b.event_key));
  }, []);

  // 심사위원별 집계
  const judgeStats = useMemo(() => {
    const map: Record<string, JudgeStat> = {};
    for (const r of myData) {
      r.judges.forEach((j, i) => {
        const s = r.scores[i];
        if (s === undefined) return;
        if (!map[j]) map[j] = { name: j, samples: [], avg: 0, min: 10, max: 0 };
        map[j].samples.push({ score: s, event: r.event_key, year: r.year });
      });
    }
    const arr = Object.values(map);
    for (const j of arr) {
      const sum = j.samples.reduce((a, b) => a + b.score, 0);
      j.avg = sum / j.samples.length;
      j.min = Math.min(...j.samples.map(s => s.score));
      j.max = Math.max(...j.samples.map(s => s.score));
    }
    return arr.sort((a, b) => b.avg - a.avg);
  }, [myData]);

  // 부문별 집계
  const categoryStats = useMemo(() => {
    const map: Record<string, { records: MyRecord[]; totalAvg: number; bestRank: number; advanceRate: number }> = {};
    for (const r of myData) {
      const cat = r.category === 'pista_singles_jackandjill' ? 'jack_solo' : r.category;
      if (!map[cat]) map[cat] = { records: [], totalAvg: 0, bestRank: 999, advanceRate: 0 };
      map[cat].records.push(r);
    }
    for (const c of Object.values(map)) {
      c.totalAvg = c.records.reduce((a, b) => a + b.avg, 0) / c.records.length;
      c.bestRank = Math.min(...c.records.map(r => r.rank));
      c.advanceRate = c.records.filter(r => r.advanced).length / c.records.length;
    }
    return map;
  }, [myData]);

  // 전략 인사이트 자동 생성
  const insights = useMemo(() => {
    const out: Array<{ level: 'strength' | 'opportunity' | 'warning'; title: string; detail: string }> = [];

    // 1. 가장 관대한 심사
    if (judgeStats.length > 0) {
      const top = judgeStats[0];
      if (top.samples.length >= 2 && top.avg >= 8.5) {
        out.push({
          level: 'strength',
          title: `${top.name} 심사가 최대 강점`,
          detail: `평균 ${top.avg.toFixed(2)} · ${top.samples.length}회 심사 · 최고 ${top.max}점. 이 심사위원 스타일에 계속 투자.`,
        });
      }
    }

    // 2. 가장 까다로운 심사
    if (judgeStats.length >= 2) {
      const bottom = judgeStats[judgeStats.length - 1];
      if (bottom.samples.length >= 2 && bottom.avg < 8.1) {
        out.push({
          level: 'warning',
          title: `${bottom.name} 기준에서 약점`,
          detail: `평균 ${bottom.avg.toFixed(2)} · ${bottom.samples.length}회. 이 심사위원의 평가 포인트 보강이 다음 대회 핵심 레버리지.`,
        });
      }
    }

    // 3. 강점 부문
    const cats = Object.entries(categoryStats);
    const milongaData = cats.find(([k]) => k === 'milonga');
    const pistaData = cats.find(([k]) => k === 'pista');
    if (milongaData && pistaData) {
      const diff = milongaData[1].totalAvg - pistaData[1].totalAvg;
      if (diff > 0.2) {
        out.push({
          level: 'strength',
          title: `밀롱가가 피스타보다 ${diff.toFixed(2)}점 우위`,
          detail: `밀롱가 평균 ${milongaData[1].totalAvg.toFixed(2)} vs 피스타 ${pistaData[1].totalAvg.toFixed(2)}. 밀롱가 부문에서 우승 도전 현실적.`,
        });
      }
    }

    // 4. 진출률
    const advancedCount = myData.filter(r => r.advanced).length;
    out.push({
      level: advancedCount > 0 ? 'opportunity' : 'warning',
      title: `총 ${myData.length}회 출전 · ${advancedCount}회 결승 진출`,
      detail: advancedCount > 0 ? '결승 경험 있음. 결승 무대에서 Martin 9.94점 등 폭발력 입증.' : '아직 결승 진출 경험 없음. 부문 선택과 집중 필요.',
    });

    // 5. Milonga 특화
    if (milongaData && milongaData[1].bestRank <= 10) {
      out.push({
        level: 'strength',
        title: `밀롱가 전국 ${milongaData[1].bestRank}위 달성`,
        detail: `2023 KTC Milonga Final 6위. 준결승 9위 → 결승 6위 (3단계 상승) — 본 무대 퍼포먼스 강함.`,
      });
    }

    return out;
  }, [judgeStats, categoryStats, myData]);

  const catLabels: Record<string, string> = {
    pista: '피스타', milonga: '밀롱가', vals: '발스',
    jack_solo: '잭앤질 (석정 단독)', pista_singles_jackandjill: '잭앤질 (단독)',
  };

  return (
    <>
      <PageHeader title="소유 & 석정 Command Center" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 space-y-10">

          {/* HERO */}
          <section className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Couple Command Center · Our Strategy Hub
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              석정 <em className="text-tango-brass">&amp;</em> 소유
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              우리 부부의 모든 대회 데이터를 한 화면에 · Mundial 우승까지의 전략
            </p>
            <OrnamentDivider className="mt-6" />
          </section>

          {/* 전략 인사이트 배너 */}
          {insights.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className={`rounded-sm border p-4 ${
                    ins.level === 'strength' ? 'border-tango-brass/40 bg-tango-brass/10' :
                    ins.level === 'warning' ? 'border-orange-500/30 bg-orange-500/5' :
                    'border-tango-brass/20 bg-white/5'
                  }`}
                >
                  <div className={`text-[10px] uppercase tracking-widest font-sans mb-1 ${
                    ins.level === 'strength' ? 'text-tango-brass' :
                    ins.level === 'warning' ? 'text-orange-400' :
                    'text-tango-cream/60'
                  }`}>
                    {ins.level === 'strength' ? '✓ 강점' : ins.level === 'warning' ? '⚠ 개선 필요' : '💡 기회'}
                  </div>
                  <div className="font-display italic text-lg text-tango-paper mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {ins.title}
                  </div>
                  <div className="text-xs text-tango-cream/70 font-serif italic leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    {ins.detail}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* 부문별 성적 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Category Performance
            </div>
            <h2 className="font-display italic text-3xl text-tango-paper mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              부문별 <em className="text-tango-brass">성적</em>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(categoryStats).map(([cat, s]) => {
                const topPercent = s.records.length > 0 && s.records[0].total_participants
                  ? (s.bestRank / s.records[0].total_participants! * 100).toFixed(0) : '-';
                return (
                  <div key={cat} className="bg-tango-shadow/60 border border-tango-brass/20 rounded-sm p-4">
                    <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mb-1">
                      {catLabels[cat] ?? cat}
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="font-display text-3xl font-bold text-tango-brass" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {s.totalAvg.toFixed(2)}
                      </span>
                      <span className="text-xs text-tango-cream/50">평균</span>
                    </div>
                    <div className="text-xs text-tango-paper/80 space-y-0.5 font-sans">
                      <div>최고 순위: <span className="text-tango-brass font-semibold">{s.bestRank}위</span> ({topPercent}%)</div>
                      <div>출전 횟수: {s.records.length}회</div>
                      <div>결승 진출률: {(s.advanceRate * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 심사위원 히트맵 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Judge Heat Map · 심사위원별 점수 패턴
            </div>
            <h2 className="font-display italic text-3xl text-tango-paper mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              우리를 <em className="text-tango-brass">보는 눈</em>
            </h2>
            <p className="text-xs text-tango-cream/60 mb-5 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              과거 받은 스코어 집계 — 평균이 높을수록 이 심사위원 스타일과 맞음
            </p>
            <div className="space-y-2">
              {judgeStats.map(j => {
                const pct = (j.avg / 10) * 100;
                const reliable = j.samples.length >= 2;
                return (
                  <div key={j.name} className="bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-3">
                    <div className="flex items-baseline justify-between mb-2">
                      <div>
                        <span className="font-serif italic text-base text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {j.name}
                        </span>
                        {!reliable && <span className="text-[10px] text-tango-cream/40 ml-2">샘플 1회</span>}
                      </div>
                      <div className="text-right">
                        <span className="font-display text-xl font-bold text-tango-brass" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                          {j.avg.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-tango-cream/50 ml-1">/10</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          j.avg >= 9 ? 'bg-tango-brass' :
                          j.avg >= 8.3 ? 'bg-tango-brass/70' :
                          j.avg >= 7.8 ? 'bg-tango-brass/40' : 'bg-orange-500/50'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 text-[10px] text-tango-cream/50 font-sans">
                      {j.samples.length}회 심사 · 최저 {j.min} ~ 최고 {j.max}
                      {j.samples.map((s, i) => (
                        <span key={i} className="ml-2 inline-block">
                          <span className="text-tango-brass/60">{s.score}</span>
                          <span className="text-tango-cream/30"> ({s.year})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 전체 출전 기록 타임라인 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Full Competition History
            </div>
            <h2 className="font-display italic text-3xl text-tango-paper mb-5" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              대회 <em className="text-tango-brass">출전 기록</em>
            </h2>
            <div className="space-y-3">
              {myData.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-sm border p-4 ${
                    r.advanced ? 'border-tango-brass/40 bg-tango-brass/5' :
                    'border-tango-brass/15 bg-white/3'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="font-display text-2xl font-bold text-tango-brass mr-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {r.year}
                      </span>
                      <span className="font-serif italic text-lg text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {r.competition} {catLabels[r.category] ?? r.category} · {r.stage === 'final' ? '결승' : r.stage === 'semifinal' ? '준결승' : '예선'}
                      </span>
                      {r.is_solo && <span className="text-[10px] text-tango-cream/50 ml-2">(석정 단독)</span>}
                      {r.advanced && <span className="text-[10px] bg-tango-brass/20 text-tango-brass rounded-sm px-2 py-0.5 ml-2">✓ 결승 진출</span>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-tango-cream/50">
                        <span className="font-display text-xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                          {r.rank}
                        </span>
                        {r.total_participants && <span className="text-tango-cream/40">/{r.total_participants}</span>}
                      </div>
                      <div className="text-[10px] text-tango-cream/50">평균 {r.avg.toFixed(3)}</div>
                    </div>
                  </div>
                  {/* 심사별 점수 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {r.judges.map((j, idx) => (
                      <div key={idx} className="bg-white/5 rounded-sm px-2 py-1 flex items-baseline justify-between">
                        <span className="text-[10px] text-tango-cream/60 truncate">{j}</span>
                        <span className="font-mono text-sm text-tango-brass font-semibold">{r.scores[idx]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 다음 대회 액션 */}
          <section className="bg-gradient-to-br from-tango-brass/10 to-transparent border border-tango-brass/30 rounded-sm p-6">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
              Next Competition Strategy
            </div>
            <h3 className="font-display italic text-2xl text-tango-paper mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              다음 대회 <em className="text-tango-brass">준비 포인트</em>
            </h3>
            <div className="space-y-2 text-sm text-tango-paper/90 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              <div>🎯 <strong className="text-tango-brass not-italic">최우선:</strong> 밀롱가 부문 — 이미 6위 도달, 3위권 도전 가능</div>
              <div>🔧 <strong className="text-tango-brass not-italic">기본기 보강:</strong> Martin/Valelia/Juan Carlos 기준 기본기·리듬 정확성</div>
              <div>💎 <strong className="text-tango-brass not-italic">유지:</strong> Oscar/Carolina 감성·표현 기준 (이미 최상위)</div>
              <div>📅 <strong className="text-tango-brass not-italic">타깃 대회:</strong> 2026 KTC (3월) → 2026 PTC → 2026 Mundial Asia 예선</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/tanda-simulator" className="text-xs px-3 py-2 rounded-sm border border-tango-brass/40 text-tango-brass hover:bg-tango-brass/10">
                탄다 시뮬레이터 →
              </Link>
              <Link to="/judges" className="text-xs px-3 py-2 rounded-sm border border-tango-brass/40 text-tango-brass hover:bg-tango-brass/10">
                심사위원 분석 →
              </Link>
              <Link to="/champions" className="text-xs px-3 py-2 rounded-sm border border-tango-brass/40 text-tango-brass hover:bg-tango-brass/10">
                역대 우승자 →
              </Link>
              <Link to="/my-competitions" className="text-xs px-3 py-2 rounded-sm border border-tango-brass/40 text-tango-brass hover:bg-tango-brass/10">
                대회 기록 관리 →
              </Link>
            </div>
          </section>

          <OrnamentDivider className="pt-6" />
        </div>
      </div>
    </>
  );
}
