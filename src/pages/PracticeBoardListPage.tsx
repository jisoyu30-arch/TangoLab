import { usePracticeStore } from '../hooks/usePracticeStore';
import { NavLink } from 'react-router-dom';

export function PracticeBoardListPage() {
  const { boards, addBoard } = usePracticeStore();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <header className="flex justify-between items-center border-b border-secretary-gold/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-secretary-gold">내 연습 보드</h1>
          <p className="text-sm text-gray-400 mt-1">대회, 밀롱가, 수업 등 목적별 연습곡 관리</p>
        </div>
        <button 
          onClick={() => addBoard('새 연습 보드', '')}
          className="bg-secretary-gold text-secretary-navy px-3 py-2 rounded-lg font-bold text-sm"
        >
          + 보드 생성
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boards.map(board => (
          <NavLink
            key={board.id}
            to={`/practice/${board.id}`}
            className="bg-white/5 border border-secretary-gold/20 hover:border-secretary-gold/50 rounded-xl p-4 transition"
          >
            <h2 className="font-bold text-lg text-white">{board.title}</h2>
            <p className="text-sm text-gray-400 mt-1">{board.description || '설명 없음'}</p>
            <div className="flex gap-4 mt-4 text-sm text-gray-500">
              <span>저장된 곡: <strong className="text-secretary-gold">{board.song_ids.length}</strong></span>
              <span>메모: <strong className="text-secretary-gold">{board.notes?.length || 0}</strong></span>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              최근 업데이트: {new Date(board.updated_at).toLocaleDateString()}
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
