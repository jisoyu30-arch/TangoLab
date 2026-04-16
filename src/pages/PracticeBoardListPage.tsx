import { usePracticeStore } from '../hooks/usePracticeStore';
import { NavLink } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export function PracticeBoardListPage() {
  const { boards, addBoard } = usePracticeStore();

  return (
    <>
    <PageHeader
      title="내 연습 보드"
      right={
        <button
          onClick={() => addBoard('새 연습 보드', '')}
          className="bg-secretary-gold text-secretary-navy px-3 py-2 rounded-lg font-bold text-sm"
        >
          + 생성
        </button>
      }
    />
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <p className="text-sm text-gray-400">대회, 밀롱가, 수업 등 목적별 연습곡 관리</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boards.length === 0 ? (
          <div className="col-span-full bg-white/5 border border-dashed border-secretary-gold/20 rounded-xl p-8 text-center">
            <div className="text-3xl mb-3">📝</div>
            <p className="text-gray-400 text-sm mb-1">아직 연습 보드가 없습니다</p>
            <p className="text-gray-600 text-xs">위의 "+ 보드 생성" 버튼으로 대회·밀롱가·수업별 연습곡을 관리해보세요</p>
          </div>
        ) : boards.map(board => (
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
    </>
  );
}
