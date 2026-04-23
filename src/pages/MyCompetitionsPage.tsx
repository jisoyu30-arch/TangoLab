// 내 대회 출전 기록 목록
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useTrainingStore } from '../hooks/useTrainingStore';
import ktcData from '../data/ktc_participants.json';

const STAGE_LABELS: Record<string, string> = {
  qualifying: '예선',
  quarterfinal: '8강',
  semifinal: '준결승',
  final: '결승',
};

const CATEGORY_LABELS: Record<string, string> = {
  pista: '피스타',
  vals: '발스',
  milonga: '밀롱가',
  escenario: '에세나리오',
};

export function MyCompetitionsPage() {
  const { ownCompetitions, addOwnCompetition } = useTrainingStore();

  const handleAdd = () => {
    const id = addOwnCompetition({
      competition_name: '새 대회 기록',
    });
    window.location.href = `/my-competitions/${id}`;
  };

  const handleImportKTC = () => {
    const data = ktcData as any;
    const imports: Array<any> = [];
    for (const [, ev] of Object.entries(data.events)) {
      const e = ev as any;
      for (const c of e.couples || []) {
        if (!(c.is_my_couple || c.is_my_partner)) continue;
        // 이미 임포트된 것 확인
        const existing = ownCompetitions.find(own =>
          own.competition_name.includes(String(e.year)) &&
          own.competition_name.toLowerCase().includes(e.category) &&
          own.stage === e.stage
        );
        if (existing) continue;
        const catLabel = { pista: '피스타', milonga: '밀롱가', vals: '발스', pista_singles_jackandjill: '잭앤질' }[e.category as string] ?? e.category;
        const stageLabel = { final: '결승', semifinal: '준결승', qualifying: '예선' }[e.stage as string] ?? e.stage;
        imports.push({
          competition_name: `${e.competition} ${e.year} ${catLabel} ${stageLabel}`,
          date: e.year + (e.stage === 'final' ? '-03-02' : e.stage === 'semifinal' ? '-03-01' : '-02-28'),
          partner: c.is_my_couple ? '석정' : '(단독)',
          category: e.category === 'pista_singles_jackandjill' ? 'pista' : e.category,
          stage: e.stage,
          ronda_number: null,
          bib_number: String(c.pareja),
          result_placement: c.rank,
          advanced_to_next: !!c.advanced,
          songs: [],
          judges: (e.judges || []).map((name: string) => ({ name, credentials: '' })),
          scores: (e.judges || []).map((name: string, idx: number) => ({
            judge_name: name,
            notes: '',
            criteria: {
              basic_technique: c.scores[idx] ?? 0,
              musicality: c.scores[idx] ?? 0,
              abrazo: c.scores[idx] ?? 0,
              walking: c.scores[idx] ?? 0,
              connection: c.scores[idx] ?? 0,
              expressiveness: c.scores[idx] ?? 0,
              overall: c.scores[idx] ?? 0,
            },
          })),
          video_url: null,
          video_note: '',
          overall_notes: `평균 ${c.average} · 총점 ${c.total ?? ''}${c.strategic_analysis?.achievement ? ' · ' + c.strategic_analysis.achievement : ''}`,
          strengths: c.strategic_analysis?.strength ?? '',
          improvements: c.strategic_analysis?.improvement ?? '',
        });
      }
    }
    if (imports.length === 0) {
      alert('이미 모두 임포트되었거나 불러올 기록이 없습니다.');
      return;
    }
    if (!confirm(`KTC 기록 ${imports.length}개 불러오시겠습니까?\n\n(소유&석정 커플 + 석정 단독 포함)`)) return;
    for (const imp of imports) {
      const id = addOwnCompetition(imp);
      void id;
    }
    alert(`${imports.length}개 기록 임포트 완료. 새로고침됩니다.`);
    window.location.reload();
  };

  // 연도별 그룹
  const byYear = new Map<string, typeof ownCompetitions>();
  for (const c of ownCompetitions) {
    const year = c.date.slice(0, 4) || '기타';
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(c);
  }
  const years = Array.from(byYear.keys()).sort().reverse();

  return (
    <>
      <PageHeader
        title="내 대회 기록"
        right={
          <div className="flex gap-2">
            <button
              onClick={handleImportKTC}
              className="bg-tango-brass/20 text-tango-brass border border-tango-brass/40 px-3 py-2 rounded-lg font-bold text-xs hover:bg-tango-brass/30"
              title="ktc_participants.json에서 소유&석정 기록 자동 불러오기"
            >
              📥 KTC 기록 불러오기
            </button>
            <button
              onClick={handleAdd}
              className="bg-tango-brass text-tango-shadow px-3 py-2 rounded-lg font-bold text-sm"
            >
              + 추가
            </button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-5 space-y-5">
          <p className="text-sm text-gray-400">출전 대회, 심사위원, 점수, 영상을 기록합니다</p>

          {ownCompetitions.length === 0 && (
            <div className="bg-tango-brass/5 border border-tango-brass/20 rounded-xl p-4 text-sm">
              <div className="text-tango-brass font-semibold mb-2">💡 자동 불러오기 가능</div>
              <p className="text-tango-cream/80 text-xs leading-relaxed mb-2">
                TangoLab에 저장된 소유 & 석정 커플 KTC 대회 기록 <strong className="text-tango-brass">5건</strong>을 즉시 불러올 수 있습니다:
              </p>
              <ul className="text-xs text-tango-cream/70 space-y-0.5 ml-4 list-disc mb-3">
                <li>2023 KTC Milonga 준결승 9위 · 결승 6위 🏆</li>
                <li>2023 KTC Jack 준결승 (석정 단독)</li>
                <li>2024 KTC Pista 준결승 30위</li>
                <li>2024 KTC Jack 준결승 (석정 단독)</li>
              </ul>
              <button
                onClick={handleImportKTC}
                className="bg-tango-brass/30 hover:bg-tango-brass/50 text-tango-brass border border-tango-brass/60 px-4 py-2 rounded-lg text-xs font-semibold"
              >
                📥 지금 불러오기
              </button>
            </div>
          )}

          {ownCompetitions.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-tango-brass/20 rounded-xl p-8 text-center">
              <div className="text-3xl mb-3">🏆</div>
              <p className="text-gray-400 text-sm mb-1">대회 기록이 없습니다</p>
              <p className="text-gray-600 text-xs mb-4">첫 대회 출전을 기록해보세요</p>
              <button
                onClick={handleAdd}
                className="bg-tango-brass/20 hover:bg-tango-brass/30 text-tango-brass px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + 첫 기록 추가
              </button>
            </div>
          ) : (
            years.map(year => (
              <div key={year}>
                <h3 className="text-xs font-semibold text-tango-brass mb-2">{year}</h3>
                <div className="space-y-2">
                  {byYear.get(year)!.map(c => (
                    <Link
                      key={c.id}
                      to={`/my-competitions/${c.id}`}
                      className="block bg-white/5 hover:bg-white/8 border border-white/10 hover:border-tango-brass/30 rounded-xl p-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm text-gray-500">{c.date}</span>
                            {c.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-tango-brass/20 text-tango-brass">
                                {CATEGORY_LABELS[c.category] || c.category}
                              </span>
                            )}
                            {c.stage && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                c.stage === 'final' ? 'bg-red-500/20 text-red-400' :
                                c.stage === 'semifinal' ? 'bg-orange-500/20 text-orange-400' :
                                c.stage === 'quarterfinal' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {STAGE_LABELS[c.stage] || c.stage}
                              </span>
                            )}
                            {c.video_url && (
                              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">▶</span>
                            )}
                          </div>
                          <h4 className="text-white font-semibold truncate">{c.competition_name}</h4>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {c.partner && <span>with {c.partner}</span>}
                            {c.bib_number && <span> · BIB #{c.bib_number}</span>}
                            {c.ronda_number && <span> · Ronda {c.ronda_number}</span>}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-2">
                            {c.scores.length > 0 && (
                              <span>심사 {c.scores.length}개</span>
                            )}
                            {c.songs.length > 0 && (
                              <span>곡 {c.songs.length}개</span>
                            )}
                            {c.result_placement && (
                              <span className="text-tango-brass font-semibold">#{c.result_placement}</span>
                            )}
                            {c.advanced_to_next && (
                              <span className="text-green-400">✓ 통과</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
