// Mundial 2026 심사위원 패널 분석 — 스테이지별 성향 · 스테이지 간 일관성
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import panelData from '../data/mundial_2026_panel.json';

interface JudgeStats {
  n: number; mean: number; sd: number; min: number; max: number;
  bias_vs_panel: number; mean_abs_dev: number;
  dropped_as_high_rate: number; dropped_as_low_rate: number;
  spearman_vs_result: number;
}
interface StagePanel {
  stage: string; group: string | null; label: string; date: string | null;
  judges: string[]; total_couples: number;
  judge_stats: Record<string, JudgeStats>;
}
interface Consistency {
  judge: string; from: string; to: string; shared_couples: number;
  own_consistency: number; panel_baseline: number; vs_baseline: number;
  mean_from: number; mean_to: number;
}
interface CuratedJudge {
  name: string; country?: string; aka?: string[]; credentials?: string[];
  lineage?: string; local_crosslinks?: string[];
  documented?: { text: string; context: string; source: { title: string; url: string }; note?: string }[];
  sources?: { title: string; url: string }[];
  stats: JudgeStats;
}

const d = panelData as unknown as {
  competition: { name: string; category: string; semifinal: { date: string; total_couples: number; advancing: number; cutoff_promedio: number } };
  scoring_rule: { judges: number; rule: string; verified: string; implication: string };
  official_criteria: { summary: string; source: { title: string; url: string } };
  judges: CuratedJudge[];
  agreement_matrix: { judges: string[]; spearman: number[][] };
  stage_panels: StagePanel[];
  cross_stage_consistency: Consistency[];
  note: string;
};

/* 발산형(diverging) 한 쌍 — 앱의 브라스(따뜻)와 대비되는 차가운 극.
   dataviz 검증 통과: 어두운 배경에서 밝기대·채도·CVD 분리·대비 6개 검사 PASS */
const WARM = '#B8863F';     // 0보다 큼 (후하다 / 기준선보다 안정적)
const COOL = '#4E9BD8';     // 0보다 작음 (짜다 / 기준선보다 흔들림)
const MID = 'rgba(255,255,255,0.10)';

const STAGE_KO: Record<string, string> = {
  clasificatoria: '예선', cuartos: '8강', semifinal: '준결승', final: '결승',
};
const stageLabel = (p: { stage: string; group: string | null }) =>
  STAGE_KO[p.stage] + (p.group ? ` ${p.group}조` : '');
const labelKo = (label: string) => {
  const [stage, group] = label.split('/');
  return STAGE_KO[stage] + (group ? ` ${group}조` : '');
};

/** 0을 중심으로 좌우로 뻗는 막대. 값은 늘 숫자로도 같이 보여준다. */
function DivergingBar({ value, max, title }: { value: number; max: number; title: string }) {
  const frac = Math.min(Math.abs(value) / max, 1);
  const pos = value >= 0;
  return (
    <span className="inline-flex items-center w-[72px] h-3 shrink-0" title={title} aria-hidden>
      <span className="relative w-full h-[6px]" style={{ background: MID, borderRadius: 3 }}>
        <span
          className="absolute top-0 h-full"
          style={{
            background: pos ? WARM : COOL,
            left: pos ? '50%' : `${50 - frac * 50}%`,
            width: `${frac * 50}%`,
            borderRadius: pos ? '0 3px 3px 0' : '3px 0 0 3px',
          }}
        />
        <span className="absolute top-[-2px] left-1/2 w-px h-[10px] bg-white/30" />
      </span>
    </span>
  );
}

export function PanelPage() {
  const [openJudge, setOpenJudge] = useState<string | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<string>('semifinal');

  const panel = useMemo(
    () => d.stage_panels.find(p => p.label === selectedPanel) ?? d.stage_panels[0],
    [selectedPanel]
  );
  const curated = useMemo(
    () => new Map(d.judges.map(j => [j.name, j])),
    []
  );
  const matrixMax = 1;

  return (
    <>
      <PageHeader title="심사위원 패널 분석" />
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-7">

        {/* 채점 규칙 */}
        <section className="bg-white/5 border border-tango-brass/20 rounded-xl p-4">
          <h1 className="text-lg font-bold text-white">{d.competition.name}</h1>
          <p className="text-tango-brass text-sm">{d.competition.category}</p>
          <div className="mt-3 space-y-1.5 text-sm text-tango-cream/70">
            <p><span className="text-tango-brass">채점 방식</span> — {d.scoring_rule.rule}</p>
            <p className="text-xs text-tango-cream/50">{d.scoring_rule.verified}</p>
            <p className="text-xs text-tango-cream/60 leading-relaxed">{d.scoring_rule.implication}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-tango-cream/60 leading-relaxed">
            <span className="text-tango-brass">공식 심사 기준</span> — {d.official_criteria.summary}
            <a href={d.official_criteria.source.url} target="_blank" rel="noopener noreferrer"
               className="ml-1 text-tango-brass/70 hover:text-tango-brass underline">출처</a>
          </div>
        </section>

        {/* 스테이지별 패널 구성 */}
        <section>
          <h2 className="text-sm font-semibold text-tango-brass mb-2 tracking-wide">
            스테이지별 패널 ({d.stage_panels.length}개 · 심사위원 연인원)
          </h2>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {d.stage_panels.map(p => (
              <button
                key={p.label}
                onClick={() => setSelectedPanel(p.label)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  p.label === selectedPanel
                    ? 'bg-white/20 text-white font-medium'
                    : 'bg-white/5 text-tango-cream/60 hover:bg-white/10'
                }`}
              >
                {stageLabel(p)} · {p.judges.length}인 · {p.total_couples}쌍
              </button>
            ))}
          </div>

          {/* 선택 패널의 심사위원 지표 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-xs text-tango-cream/40 border-b border-white/10">
                  <th className="text-left font-normal py-2 pr-3">심사위원</th>
                  <th className="text-right font-normal py-2 px-2">평균</th>
                  <th className="text-right font-normal py-2 px-2">편차폭</th>
                  <th className="text-left font-normal py-2 px-2" colSpan={2}>패널 대비</th>
                  <th className="text-right font-normal py-2 px-2" title="이 심사위원 점수가 최고값이라 잘려나간 비율">최고로 잘림</th>
                  <th className="text-right font-normal py-2 px-2" title="이 심사위원 점수가 최저값이라 잘려나간 비율">최저로 잘림</th>
                  <th className="text-right font-normal py-2 pl-2" title="이 심사위원의 순위와 최종 결과 순위의 스피어만 상관">결과 상관</th>
                </tr>
              </thead>
              <tbody>
                {panel.judges.map(name => {
                  const s = panel.judge_stats[name];
                  const known = curated.has(name);
                  return (
                    <tr key={name} className="border-b border-white/5">
                      <td className="py-2 pr-3">
                        {known ? (
                          <button
                            onClick={() => setOpenJudge(openJudge === name ? null : name)}
                            className="text-tango-cream hover:text-tango-brass text-left"
                          >
                            {name} <span className="text-tango-brass/60 text-xs">ⓘ</span>
                          </button>
                        ) : (
                          <span className="text-tango-cream/80">{name}</span>
                        )}
                      </td>
                      <td className="text-right px-2 tabular-nums text-tango-cream/80">{s.mean.toFixed(3)}</td>
                      <td className="text-right px-2 tabular-nums text-tango-cream/60">{s.sd.toFixed(3)}</td>
                      <td className="px-2 py-2"><DivergingBar value={s.bias_vs_panel} max={0.35}
                        title={`패널 평균 대비 ${s.bias_vs_panel > 0 ? '+' : ''}${s.bias_vs_panel}`} /></td>
                      <td className="pr-2 tabular-nums text-xs"
                          style={{ color: s.bias_vs_panel >= 0 ? WARM : COOL }}>
                        {s.bias_vs_panel > 0 ? '+' : ''}{s.bias_vs_panel.toFixed(3)}
                      </td>
                      <td className="text-right px-2 tabular-nums text-tango-cream/60">
                        {(s.dropped_as_high_rate * 100).toFixed(0)}%
                      </td>
                      <td className="text-right px-2 tabular-nums text-tango-cream/60">
                        {(s.dropped_as_low_rate * 100).toFixed(0)}%
                      </td>
                      <td className="text-right pl-2 tabular-nums text-tango-cream/80">
                        {s.spearman_vs_result.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-tango-cream/40 mt-2">
            <span style={{ color: WARM }}>■</span> 패널보다 후함 ·
            <span style={{ color: COOL }} className="ml-2">■</span> 패널보다 짬 ·
            {' '}{panel.total_couples}쌍 전원 기준
          </p>

          {/* 심사위원 배경 */}
          {openJudge && curated.get(openJudge) && (
            <div className="mt-3 p-4 rounded-xl bg-white/5 border border-tango-brass/20 text-sm">
              {(() => {
                const j = curated.get(openJudge)!;
                return (
                  <>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-white font-semibold">{j.name}</span>
                      {j.country && <span className="text-xs text-tango-cream/50">{j.country}</span>}
                      {j.aka && j.aka.length > 0 && (
                        <span className="text-xs text-tango-cream/40">= {j.aka.join(' / ')}</span>
                      )}
                    </div>
                    {j.credentials && (
                      <ul className="mt-2 space-y-0.5 text-tango-cream/70 text-xs list-disc list-inside">
                        {j.credentials.map(c => <li key={c}>{c}</li>)}
                      </ul>
                    )}
                    {j.lineage && <p className="mt-2 text-xs text-tango-cream/60 leading-relaxed">{j.lineage}</p>}
                    {j.documented?.map(q => (
                      <blockquote key={q.text} className="mt-2 pl-3 border-l-2 border-tango-brass/40 text-xs text-tango-cream/70">
                        “{q.text}”
                        <div className="text-tango-cream/40 mt-1">
                          {q.context} ·{' '}
                          <a href={q.source.url} target="_blank" rel="noopener noreferrer"
                             className="underline hover:text-tango-brass">{q.source.title}</a>
                        </div>
                        {q.note && <div className="text-tango-cream/35 mt-0.5">※ {q.note}</div>}
                      </blockquote>
                    ))}
                    {j.local_crosslinks && j.local_crosslinks.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-tango-cream/45 list-disc list-inside">
                        {j.local_crosslinks.map(c => <li key={c}>{c}</li>)}
                      </ul>
                    )}
                    {j.sources && (
                      <div className="mt-2 text-xs text-tango-cream/40">
                        출처: {j.sources.map((s, i) => (
                          <span key={s.url}>
                            {i > 0 && ' · '}
                            <a href={s.url} target="_blank" rel="noopener noreferrer"
                               className="underline hover:text-tango-brass">{s.title}</a>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </section>

        {/* 스테이지 간 일관성 */}
        <section>
          <h2 className="text-sm font-semibold text-tango-brass mb-1 tracking-wide">
            스테이지 간 일관성 — 같은 심사위원이 같은 커플을 다시 봤을 때
          </h2>
          <p className="text-xs text-tango-cream/50 mb-3 leading-relaxed">
            준결승 6인은 모두 8강에서도 심사했다. 두 스테이지에 모두 나온 커플만 모아,
            그 심사위원이 매긴 순서가 얼마나 유지됐는지 본다. 단계가 바뀌면 춤 자체가 달라지므로
            낮다고 곧바로 &lsquo;일관성 없음&rsquo;은 아니다 — 같은 커플 집합에서 <em>패널 결과</em>가
            얼마나 움직였는지를 기준선으로 함께 놓고 비교한다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-xs text-tango-cream/40 border-b border-white/10">
                  <th className="text-left font-normal py-2 pr-3">심사위원</th>
                  <th className="text-left font-normal py-2 px-2">구간</th>
                  <th className="text-right font-normal py-2 px-2">공통 커플</th>
                  <th className="text-right font-normal py-2 px-2">본인 순서 유지</th>
                  <th className="text-right font-normal py-2 px-2">패널 기준선</th>
                  <th className="text-left font-normal py-2 px-2" colSpan={2}>기준선 대비</th>
                  <th className="text-right font-normal py-2 pl-2">평균 이동</th>
                </tr>
              </thead>
              <tbody>
                {d.cross_stage_consistency.map(c => (
                  <tr key={`${c.judge}-${c.from}`} className="border-b border-white/5">
                    <td className="py-2 pr-3 text-tango-cream/90">{c.judge}</td>
                    <td className="px-2 text-xs text-tango-cream/50">
                      {labelKo(c.from)} → {labelKo(c.to)}
                    </td>
                    <td className="text-right px-2 tabular-nums text-tango-cream/60">{c.shared_couples}</td>
                    <td className="text-right px-2 tabular-nums text-tango-cream/90">{c.own_consistency.toFixed(3)}</td>
                    <td className="text-right px-2 tabular-nums text-tango-cream/50">{c.panel_baseline.toFixed(3)}</td>
                    <td className="px-2 py-2"><DivergingBar value={c.vs_baseline} max={0.25}
                      title={`기준선 대비 ${c.vs_baseline > 0 ? '+' : ''}${c.vs_baseline}`} /></td>
                    <td className="pr-2 tabular-nums text-xs"
                        style={{ color: c.vs_baseline >= 0 ? WARM : COOL }}>
                      {c.vs_baseline > 0 ? '+' : ''}{c.vs_baseline.toFixed(3)}
                    </td>
                    <td className="text-right pl-2 tabular-nums text-xs text-tango-cream/50">
                      {c.mean_from.toFixed(2)} → {c.mean_to.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-tango-cream/40 mt-2">
            <span style={{ color: WARM }}>■</span> 대회 흐름보다 안정적 ·
            <span style={{ color: COOL }} className="ml-2">■</span> 대회 흐름보다 흔들림
          </p>
        </section>

        {/* 준결승 상호 일치도 */}
        <section>
          <h2 className="text-sm font-semibold text-tango-brass mb-1 tracking-wide">
            준결승 패널 상호 일치도
          </h2>
          <p className="text-xs text-tango-cream/50 mb-3">
            두 심사위원이 매긴 커플 순서의 스피어만 상관. 진할수록 서로 비슷하게 봤다는 뜻.
          </p>
          <div className="overflow-x-auto">
            <table className="text-xs min-w-[560px]">
              <thead>
                <tr>
                  <th />
                  {d.agreement_matrix.judges.map(j => (
                    <th key={j} className="px-1 py-1 font-normal text-tango-cream/40 text-center align-bottom">
                      {j.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.agreement_matrix.judges.map((row, i) => (
                  <tr key={row}>
                    <td className="pr-2 py-1 text-tango-cream/70 whitespace-nowrap">{row}</td>
                    {d.agreement_matrix.spearman[i].map((v, k) => {
                      const self = i === k;
                      return (
                        <td key={k} className="px-1 py-1">
                          <div
                            title={self ? '—' : `${row} ↔ ${d.agreement_matrix.judges[k]} · 상관 ${v.toFixed(2)}`}
                            className="w-full min-w-[46px] h-7 rounded flex items-center justify-center tabular-nums"
                            style={{
                              background: self ? 'rgba(255,255,255,0.03)'
                                : `rgba(184,134,63,${0.10 + (v / matrixMax) * 0.65})`,
                              color: self ? 'rgba(232,223,201,0.25)' : '#F5F1E8',
                            }}
                          >
                            {self ? '—' : v.toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs text-tango-cream/30 leading-relaxed">{d.note}</p>
      </div>
    </>
  );
}
