import { useParams, useNavigate } from 'react-router-dom';
import { usePracticeStore } from '../hooks/usePracticeStore';

export function PracticeBoardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { boards, deleteBoard } = usePracticeStore();
  const board = boards.find(b => b.id === id);

  if (!board) {
    return <div className="p-4 text-center text-gray-400">보드를 찾을 수 없습니다.</div>;
  }

  const handleDelete = () => {
    if (confirm('보드를 삭제하시겠습니까?')) {
      deleteBoard(board.id);
      navigate('/practice');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <header className="border-b border-secretary-gold/20 pb-4">
        <button onClick={() => navigate('/practice')} className="text-secretary-gold text-sm mb-2">
          ← 목록으로
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{board.title}</h1>
            <p className="text-sm text-gray-400">{board.description}</p>
          </div>
          <button onClick={handleDelete} className="text-red-500 text-sm px-2 py-1 border border-red-500/20 rounded">
            삭제
          </button>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-bold text-secretary-gold mb-3">저장된 곡 ({board.song_ids.length})</h2>
        {board.song_ids.length === 0 ? (
          <div className="bg-white/5 p-4 rounded-xl text-sm text-gray-500">곡 페이지에서 곡을 추가할 수 있습니다.</div>
        ) : (
          <ul className="space-y-2">
            {board.song_ids.map(sid => (
              <li key={sid} className="bg-white/5 p-3 rounded-lg text-sm text-gray-300">
                곡 ID: {sid} (기존 데이터와 매핑 구현 예정)
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-secretary-gold mb-3">메모 노트</h2>
        <div className="bg-white/5 p-4 rounded-xl space-y-3">
          {board.notes?.length === 0 && <div className="text-sm text-gray-500">작성된 메모가 없습니다.</div>}
          {board.notes?.map(note => (
            <div key={note.id} className="border-b border-white/10 pb-2 last:border-0 last:pb-0">
              <p className="text-sm text-white">{note.content}</p>
              <div className="text-xs text-gray-500 mt-1">{new Date(note.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
