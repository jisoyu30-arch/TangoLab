import { useNavigate } from 'react-router-dom';
import type { SongRanking } from '../../types/tango';
import { STATUS_LABELS } from '../../utils/tangoHelpers';
import { loadAllTrainingStates } from '../../utils/tangoHelpers';

interface Props {
  rankings: SongRanking[];
}

export function SongList({ rankings }: Props) {
  const navigate = useNavigate();
  const trainingStates = loadAllTrainingStates();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-secretary-gold/10">
            <th className="py-2 px-2 w-12">#</th>
            <th className="py-2 px-2">곡명</th>
            <th className="py-2 px-2 hidden md:table-cell">오케스트라</th>
            <th className="py-2 px-2 w-16 text-center">출현</th>
            <th className="py-2 px-2 w-16 text-center hidden sm:table-cell">가중</th>
            <th className="py-2 px-2 w-20 text-center hidden lg:table-cell">결/준/예</th>
            <th className="py-2 px-2 w-16 text-center">상태</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((r, i) => {
            const ts = trainingStates[r.song_id];
            const statusInfo = ts ? STATUS_LABELS[ts.status] : STATUS_LABELS.none;
            return (
              <tr
                key={r.song_id}
                onClick={() => navigate(`/song/${r.song_id}`)}
                className="border-b border-white/5 hover:bg-secretary-gold/5 cursor-pointer transition-colors"
              >
                <td className="py-2.5 px-2 text-gray-500">{i + 1}</td>
                <td className="py-2.5 px-2">
                  <div className="text-white font-medium">{r.title}</div>
                  <div className="text-xs text-gray-500 md:hidden">{r.orchestra ?? '-'}</div>
                </td>
                <td className="py-2.5 px-2 text-gray-400 hidden md:table-cell truncate max-w-[200px]">
                  {r.orchestra ?? '-'}
                </td>
                <td className="py-2.5 px-2 text-center text-secretary-gold font-semibold">{r.total_appearances}</td>
                <td className="py-2.5 px-2 text-center text-gray-300 hidden sm:table-cell">{r.weighted_score}</td>
                <td className="py-2.5 px-2 text-center text-xs text-gray-400 hidden lg:table-cell">
                  {r.final_count}/{r.semifinal_count}/{r.qualifying_count}
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span title={statusInfo.label}>{statusInfo.emoji}</span>
                  {ts?.favorite && <span className="ml-1" title="즐겨찾기">⭐</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rankings.length === 0 && (
        <div className="text-center text-gray-500 py-10">검색 결과가 없습니다.</div>
      )}
    </div>
  );
}
