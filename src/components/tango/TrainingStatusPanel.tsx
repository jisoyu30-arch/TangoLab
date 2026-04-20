import type { TrainingStatus } from '../../types/tango';
import { STATUS_LABELS } from '../../utils/tangoHelpers';
import { useTrainingState } from '../../hooks/useTrainingState';

interface Props {
  songId: string;
}

const STATUSES: TrainingStatus[] = ['none', 'needs_practice', 'both_unstable', 'confident', 'ready'];

export function TrainingStatusPanel({ songId }: Props) {
  const { state, updateStatus, toggleFavorite, updateNotes } = useTrainingState(songId);

  return (
    <div className="bg-white/5 rounded-xl border border-tango-brass/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-tango-brass">훈련 상태</h3>
        <button
          onClick={toggleFavorite}
          className="text-xl hover:scale-110 transition-transform"
          title={state.favorite ? '즐겨찾기 해제' : '즐겨찾기'}
        >
          {state.favorite ? '⭐' : '☆'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => {
          const info = STATUS_LABELS[s];
          const isActive = state.status === s;
          return (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                isActive
                  ? 'bg-tango-brass/20 border-tango-brass/50 text-tango-brass'
                  : 'border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              {info.emoji} {info.label}
            </button>
          );
        })}
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">개인 메모</label>
        <textarea
          value={state.notes}
          onChange={e => updateNotes(e.target.value)}
          placeholder="이 곡에 대한 메모... (예: 2번째 프레이즈에서 항상 박자를 놓침)"
          rows={3}
          className="w-full bg-white/5 border border-tango-brass/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-tango-brass/50 resize-none"
        />
      </div>
    </div>
  );
}
