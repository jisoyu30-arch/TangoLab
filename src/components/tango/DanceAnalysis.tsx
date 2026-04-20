import type { DanceGuide } from '../../types/tango';

interface Props {
  guide: DanceGuide | undefined;
}

export function DanceAnalysis({ guide }: Props) {
  if (!guide) {
    return (
      <div className="bg-white/5 rounded-xl p-6 border border-tango-brass/10">
        <h3 className="text-sm font-semibold text-tango-brass mb-2">춤 분석 & 제안</h3>
        <p className="text-gray-500 text-sm">이 곡의 춤 가이드는 아직 준비되지 않았습니다.</p>
        <p className="text-gray-600 text-xs mt-1">빈출곡 TOP 30부터 순차적으로 추가 중입니다.</p>
      </div>
    );
  }

  const energyLabel: Record<string, string> = {
    low: '🟢 낮음',
    medium: '🟡 중간',
    high: '🔴 높음',
    variable: '🔄 가변적',
  };

  return (
    <div className="bg-white/5 rounded-xl border border-tango-brass/10 divide-y divide-tango-brass/10">
      {/* AI 초안 뱃지 */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full">AI 초안</span>
        <span className="text-xs text-gray-500">탱고 일반 지식 기반 생성 — 실전 경험으로 수정하세요</span>
      </div>

      {/* 요약 */}
      <div className="p-5">
        <h3 className="text-sm font-semibold text-tango-brass mb-3">이 곡의 인상</h3>
        <p className="text-gray-200 text-sm leading-relaxed">{guide.summary}</p>
      </div>

      {/* 분위기 & 에너지 */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-1">분위기</h4>
          <p className="text-gray-200 text-sm">{guide.mood}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-1">에너지</h4>
          <p className="text-gray-200 text-sm">{energyLabel[guide.energy] ?? guide.energy}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-1">리듬감</h4>
          <p className="text-gray-200 text-sm">{guide.rhythm_type}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-1">걸음 느낌</h4>
          <p className="text-gray-200 text-sm">{guide.walk_feel}</p>
        </div>
      </div>

      {/* 추천 움직임 */}
      <div className="p-5">
        <h4 className="text-xs font-semibold text-green-400 mb-2">✅ 추천 움직임</h4>
        <ul className="space-y-1">
          {guide.recommended_moves.map((m, i) => (
            <li key={i} className="text-sm text-gray-200 flex gap-2">
              <span className="text-green-400 flex-shrink-0">•</span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 피해야 할 것 */}
      <div className="p-5">
        <h4 className="text-xs font-semibold text-red-400 mb-2">❌ 피해야 할 것</h4>
        <ul className="space-y-1">
          {guide.avoid_moves.map((m, i) => (
            <li key={i} className="text-sm text-gray-200 flex gap-2">
              <span className="text-red-400 flex-shrink-0">•</span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 대회 팁 */}
      <div className="p-5">
        <h4 className="text-xs font-semibold text-tango-brass mb-2">🏆 대회 팁</h4>
        <p className="text-gray-200 text-sm leading-relaxed">{guide.competition_tip}</p>
      </div>

      {/* 음악적 단서 */}
      <div className="p-5">
        <h4 className="text-xs font-semibold text-blue-400 mb-2">🎵 음악적 단서</h4>
        <ul className="space-y-1">
          {guide.musical_cues.map((c, i) => (
            <li key={i} className="text-sm text-gray-200 flex gap-2">
              <span className="text-blue-400 flex-shrink-0">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 파트너 포인트 */}
      <div className="p-5">
        <h4 className="text-xs font-semibold text-purple-400 mb-2">🤝 파트너 포인트</h4>
        <p className="text-gray-200 text-sm leading-relaxed">{guide.partner_advice}</p>
      </div>
    </div>
  );
}
