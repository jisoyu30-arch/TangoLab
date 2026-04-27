// 우리 부부 약점 해부 페이지 — 점수 기반 행동 처방
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import { useTrainingStore } from '../hooks/useTrainingStore';
import ktcData from '../data/ktc_participants.json';

interface WeakPoint {
  judge: string;
  score: number;
  comp: string;
  year: number;
  category: string;
  source: 'ktc' | 'own';
  delta?: number; // 평균 대비 차이
}

interface JudgeProfile {
  name: string;
  avg: number;
  min: number;
  max: number;
  samples: number;
  trend: number; // 최근 - 평균
  diagnosis: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  pista: '피스타',
  milonga: '밀롱가',
  vals: '발스',
  pista_singles_jackandjill: '잭앤질',
  jack: '잭앤질',
};

// 점수대별 진단 문구
function diagnose(avg: number, samples: number, _range: number): string {
  if (samples < 2) return '데이터 부족 — 다음 대회 후 재평가';
  if (avg >= 8.7) return '★ 강점 심사위원 — 이 스타일을 더 강화';
  if (avg >= 8.3) return '안정권 — 현재 라인 유지';
  if (avg >= 8.0) return '경계선 — 결승 진출 변수, 약점 보강 필요';
  if (avg >= 7.7) return '약점 — 이 심사위원 평가 기준에 맞춘 특훈 필수';
  return '핵심 약점 — 다음 대회 대비 최우선 보강 영역';
}

export function WeaknessAnalysisPage() {
  const { ownCompetitions } = useTrainingStore();

  // KTC + Own 데이터 통합 → 약점 추출
  const { weakPoints, judgeProfiles, categoryGap } = useMemo(() => {
    const points: WeakPoint[] = [];
    const judgeMap: Record<string, { scores: number[]; comps: string[] }> = {};

    // KTC 공식 데이터
    const ktc = ktcData as any;
    for (const [, ev] of Object.entries(ktc.events)) {
      const e = ev as any;
      for (const c of e.couples || []) {
        if (!(c.is_my_couple || c.is_my_partner)) continue;
        e.judges.forEach((j: string, i: number) => {
          const s = c.scores[i];
          if (s === undefined) return;
          if (!judgeMap[j]) judgeMap[j] = { scores: [], comps: [] };
          judgeMap[j].scores.push(s);
          judgeMap[j].comps.push(`${e.year} ${e.competition}`);
          if (s < 8.3) {
            points.push({
              judge: j,
              score: s,
              comp: `${e.competition} ${e.stage}`,
              year: e.year,
              category: e.category,
              source: 'ktc',
            });
          }
        });
      }
    }

    // 사용자 입력 OwnCompetitions
    for (const rec of ownCompetitions || []) {
      for (const s of rec.scores || []) {
        const sc = s.total ?? 0;
        if (sc <= 0) continue;
        const j = s.judge_name || '심사위원';
        if (!judgeMap[j]) judgeMap[j] = { scores: [], comps: [] };
        judgeMap[j].scores.push(sc);
        judgeMap[j].comps.push(rec.competition_name);
        if (sc < 8.3) {
          points.push({
            judge: j,
            score: sc,
            comp: rec.competition_name,
            year: parseInt(rec.date?.slice(0, 4) || '0'),
            category: rec.category,
            source: 'own',
          });
        }
      }
    }

    // 심사위원 프로필
    const profiles: JudgeProfile[] = Object.entries(judgeMap).map(([name, d]) => {
      const avg = d.scores.reduce((a, b) => a + b, 0) / d.scores.length;
      const min = Math.min(...d.scores);
      const max = Math.max(...d.scores);
      const recent = d.scores.slice(-2).reduce((a, b) => a + b, 0) / Math.min(2, d.scores.length);
      return {
        name,
        avg,
        min,
        max,
        samples: d.scores.length,
        trend: recent - avg,
        diagnosis: diagnose(avg, d.scores.length, max - min),
      };
    }).sort((a, b) => a.avg - b.avg);

    // 점수 평균 대비 delta 계산
    points.forEach(p => {
      const prof = profiles.find(pr => pr.name === p.judge);
      if (prof) p.delta = p.score - prof.avg;
    });
    points.sort((a, b) => a.score - b.score);

    // 부문별 gap 분석
    const catScores: Record<string, number[]> = {};
    for (const [, ev] of Object.entries(ktc.events)) {
      const e = ev as any;
      for (const c of e.couples || []) {
        if (!(c.is_my_couple || c.is_my_partner)) continue;
        const cat = e.category;
        if (!catScores[cat]) catScores[cat] = [];
        catScores[cat].push(c.average);
      }
    }
    const categoryGap = Object.entries(catScores).map(([cat, arr]) => ({
      category: cat,
      avg: arr.reduce((a, b) => a + b, 0) / arr.length,
      samples: arr.length,
    })).sort((a, b) => b.avg - a.avg);

    return { weakPoints: points.slice(0, 10), judgeProfiles: profiles, categoryGap };
  }, [ownCompetitions]);

  const weakestJudges = judgeProfiles.filter(p => p.samples >= 2 && p.avg < 8.3).slice(0, 3);
  const strongestCat = categoryGap[0];
  const weakestCat = categoryGap[categoryGap.length - 1];

  return (
    <>
      <PageHeader title="약점 해부" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-10">

          {/* HERO */}
          <section className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
              Weakness Diagnosis · 약점 해부
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              우리 부부의 <em className="text-tango-brass">약한 고리</em>
            </h1>
            <p className="text-xs md:text-sm text-tango-cream/60 mt-3 font-serif italic px-2">
              심사위원별 점수 데이터를 해부하여 다음 대회 보강 영역을 자동 도출합니다
            </p>
            <OrnamentDivider className="mt-6" />
          </section>

          {/* 핵심 약점 TOP 3 */}
          {weakestJudges.length > 0 && (
            <section>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-rose font-sans mb-3">
                Critical · 최우선 보강 영역
              </div>
              <h2 className="font-display text-2xl md:text-3xl text-tango-paper italic mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                지금 가장 <em className="text-tango-rose">아픈 곳</em>
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {weakestJudges.map((j, i) => (
                  <div key={j.name} className="bg-tango-rose/5 border border-tango-rose/30 rounded-sm p-5">
                    <div className="text-[9px] tracking-widest uppercase text-tango-rose/70 font-sans mb-2">
                      Weak #{i + 1}
                    </div>
                    <div className="font-display text-xl text-tango-paper italic mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {j.name}
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-display text-4xl text-tango-rose font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {j.avg.toFixed(2)}
                      </span>
                      <span className="text-xs text-tango-cream/50">평균 / {j.samples}회</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-tango-cream/60 mb-3">
                      <span>최저 {j.min}</span>
                      <span>·</span>
                      <span>최고 {j.max}</span>
                      {Math.abs(j.trend) > 0.1 && (
                        <>
                          <span>·</span>
                          <span className={j.trend > 0 ? 'text-tango-paper' : 'text-tango-rose'}>
                            추세 {j.trend > 0 ? '+' : ''}{j.trend.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-tango-cream/80 font-serif italic leading-snug" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {j.diagnosis}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 부문별 격차 */}
          {categoryGap.length >= 2 && strongestCat && weakestCat && (
            <section className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-6">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                Category Gap · 부문 격차
              </div>
              <h2 className="font-display text-2xl text-tango-paper italic mb-5" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                강점 부문 vs <em className="text-tango-rose">약점 부문</em>
              </h2>
              <div className="grid md:grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <div className="text-[9px] tracking-widest uppercase text-tango-cream/50 mb-1">강점</div>
                  <div className="font-serif italic text-xl text-tango-paper mb-1" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    {CATEGORY_LABEL[strongestCat.category] || strongestCat.category}
                  </div>
                  <div className="font-display text-3xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {strongestCat.avg.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-display text-5xl text-tango-rose italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    Δ {(strongestCat.avg - weakestCat.avg).toFixed(2)}
                  </div>
                  <div className="text-[9px] tracking-widest uppercase text-tango-cream/50 mt-1">격차</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] tracking-widest uppercase text-tango-cream/50 mb-1">약점</div>
                  <div className="font-serif italic text-xl text-tango-paper mb-1" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    {CATEGORY_LABEL[weakestCat.category] || weakestCat.category}
                  </div>
                  <div className="font-display text-3xl text-tango-rose font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {weakestCat.avg.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="text-center text-xs text-tango-cream/60 mt-5 font-serif italic">
                {strongestCat.avg - weakestCat.avg > 0.3
                  ? `${CATEGORY_LABEL[strongestCat.category]} 부문에 집중하는 게 우승 확률을 높입니다`
                  : '부문 격차 작음 — 모든 부문에서 균형 있게 도전 가능'}
              </div>
            </section>
          )}

          {/* 가장 낮은 점수 TOP 10 */}
          {weakPoints.length > 0 && (
            <section>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                Low Scores · 최저 점수 기록
              </div>
              <h2 className="font-display text-2xl text-tango-paper italic mb-5" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                개별 <em className="text-tango-brass">아픈 점수</em> TOP 10
              </h2>
              <div className="space-y-2">
                {weakPoints.map((p, i) => (
                  <div key={i} className="grid grid-cols-[40px_60px_1fr_auto] gap-4 items-center bg-tango-shadow/30 border border-tango-brass/15 rounded-sm p-3">
                    <span className="font-display text-2xl text-tango-rose/60 italic text-center" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-2xl text-tango-rose font-bold text-right" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {p.score.toFixed(1)}
                    </span>
                    <div>
                      <div className="font-serif italic text-base text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {p.judge}
                      </div>
                      <div className="text-[10px] tracking-wider uppercase text-tango-cream/50">
                        {p.year} · {p.comp} · {CATEGORY_LABEL[p.category] || p.category}
                      </div>
                    </div>
                    {p.delta !== undefined && (
                      <span className="text-xs text-tango-cream/50 font-sans">
                        본인 평균 {p.delta >= 0 ? '+' : ''}{p.delta.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 액션 처방 */}
          <section className="bg-gradient-to-br from-tango-burgundy/10 via-tango-shadow to-tango-ink border border-tango-brass/30 rounded-sm p-6 md:p-8">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Prescription · 다음 액션
            </div>
            <h2 className="font-display text-2xl md:text-3xl text-tango-paper italic mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              지금 해야 할 <em className="text-tango-brass">3가지</em>
            </h2>
            <ul className="space-y-4 text-sm md:text-base text-tango-cream/85 font-serif" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              {weakestJudges[0] && (
                <li className="flex gap-3">
                  <span className="text-tango-brass font-bold">01.</span>
                  <div>
                    <strong className="text-tango-paper">{weakestJudges[0].name} 기준 영상 분석</strong> —
                    이 심사위원이 좋아하는 우승 커플 영상을 찾아 우리와 비교 (
                    <Link to="/collage" className="text-tango-brass hover:underline">영상 콜라주</Link>로 동시 비교)
                  </div>
                </li>
              )}
              {weakestCat && (
                <li className="flex gap-3">
                  <span className="text-tango-brass font-bold">02.</span>
                  <div>
                    <strong className="text-tango-paper">{CATEGORY_LABEL[weakestCat.category]} 부문 출전 빈도 조정</strong> —
                    평균 {weakestCat.avg.toFixed(2)}점. 다음 대회는 강점 부문 우선, 약점 부문은 연습 누적 후 도전
                  </div>
                </li>
              )}
              <li className="flex gap-3">
                <span className="text-tango-brass font-bold">03.</span>
                <div>
                  <strong className="text-tango-paper">D-21 체크리스트에 맞춤 과제 자동 추가됨</strong> —
                  <Link to="/checklist" className="text-tango-brass hover:underline">체크리스트</Link>에서 ★ 맞춤 표시 확인
                </div>
              </li>
            </ul>
          </section>

          {/* 전체 심사위원 프로필 */}
          {judgeProfiles.length > 0 && (
            <section>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                All Judges · 전체 심사위원 프로필
              </div>
              <h2 className="font-display text-2xl text-tango-paper italic mb-5" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                심사위원별 <em className="text-tango-brass">우리 점수</em>
              </h2>
              <div className="space-y-2">
                {judgeProfiles.map(j => (
                  <div key={j.name} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center bg-tango-shadow/30 border border-tango-brass/10 rounded-sm p-3">
                    <div>
                      <div className="font-serif italic text-base text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {j.name}
                      </div>
                      <div className="text-[10px] text-tango-cream/50">
                        {j.diagnosis}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl font-bold" style={{
                        color: j.avg >= 8.7 ? '#D4AF37' : j.avg >= 8.3 ? '#E0D5BC' : j.avg >= 8.0 ? '#B0936F' : '#C72C1C',
                        fontFamily: '"Playfair Display", Georgia, serif',
                      }}>
                        {j.avg.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-tango-cream/40">avg</div>
                    </div>
                    <div className="text-xs text-tango-cream/50 w-20 text-right">
                      {j.min} ~ {j.max}<br />
                      <span className="text-[10px]">{j.samples}회</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <OrnamentDivider className="pt-6" />
        </div>
      </div>
    </>
  );
}
