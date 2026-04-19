// 내 대회 출전 기록 목록
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useTrainingStore } from '../hooks/useTrainingStore';

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
          <button
            onClick={handleAdd}
            className="bg-secretary-gold text-secretary-navy px-3 py-2 rounded-lg font-bold text-sm"
          >
            + 추가
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-5 space-y-5">
          <p className="text-sm text-gray-400">출전 대회, 심사위원, 점수, 영상을 기록합니다</p>

          {ownCompetitions.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-secretary-gold/20 rounded-xl p-8 text-center">
              <div className="text-3xl mb-3">🏆</div>
              <p className="text-gray-400 text-sm mb-1">대회 기록이 없습니다</p>
              <p className="text-gray-600 text-xs mb-4">첫 대회 출전을 기록해보세요</p>
              <button
                onClick={handleAdd}
                className="bg-secretary-gold/20 hover:bg-secretary-gold/30 text-secretary-gold px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + 첫 기록 추가
              </button>
            </div>
          ) : (
            years.map(year => (
              <div key={year}>
                <h3 className="text-xs font-semibold text-secretary-gold mb-2">{year}</h3>
                <div className="space-y-2">
                  {byYear.get(year)!.map(c => (
                    <Link
                      key={c.id}
                      to={`/my-competitions/${c.id}`}
                      className="block bg-white/5 hover:bg-white/8 border border-white/10 hover:border-secretary-gold/30 rounded-xl p-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm text-gray-500">{c.date}</span>
                            {c.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secretary-gold/20 text-secretary-gold">
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
                              <span className="text-secretary-gold font-semibold">#{c.result_placement}</span>
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
