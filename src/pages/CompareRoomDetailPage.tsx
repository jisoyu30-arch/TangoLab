import { useParams, useNavigate } from 'react-router-dom';
import { usePracticeStore } from '../hooks/usePracticeStore';

export function CompareRoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { compareSessions, deleteCompareSession } = usePracticeStore();
  const session = compareSessions.find(s => s.id === id);

  if (!session) {
    return <div className="p-4 text-center text-gray-400">세션을 찾을 수 없습니다.</div>;
  }

  const handleDelete = () => {
    if (confirm('비교 세션을 삭제하시겠습니까?')) {
      deleteCompareSession(session.id);
      navigate('/compare');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <header className="border-b border-secretary-gold/20 pb-4">
        <button onClick={() => navigate('/compare')} className="text-secretary-gold text-sm mb-2">
          ← 목록으로
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{session.title}</h1>
            <p className="text-sm text-gray-400">영상 비교 및 분석 노트</p>
          </div>
          <button onClick={handleDelete} className="text-red-500 text-sm px-2 py-1 border border-red-500/20 rounded">
            삭제
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-secretary-gold/20 rounded-xl p-4">
          <h2 className="text-sm font-bold text-secretary-gold mb-2">레퍼런스 영상</h2>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-gray-500 text-sm mb-2">
            {session.reference_video_url ? (
              <iframe className="w-full h-full rounded-lg" src={session.reference_video_url.replace('watch?v=', 'embed/')} frameBorder="0" allowFullScreen></iframe>
            ) : 'URL이 없습니다.'}
          </div>
          <input 
            type="text" 
            placeholder="유튜브 URL 입력" 
            className="w-full bg-white/10 border border-white/20 rounded p-2 text-xs text-white"
            defaultValue={session.reference_video_url}
          />
        </div>

        <div className="bg-white/5 border border-secretary-gold/20 rounded-xl p-4">
          <h2 className="text-sm font-bold text-secretary-gold mb-2">내 연습 영상</h2>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-gray-500 text-sm mb-2">
            {session.own_video_url ? (
              <iframe className="w-full h-full rounded-lg" src={session.own_video_url.replace('watch?v=', 'embed/')} frameBorder="0" allowFullScreen></iframe>
            ) : 'URL이 없습니다.'}
          </div>
          <input 
            type="text" 
            placeholder="유튜브 URL 입력" 
            className="w-full bg-white/10 border border-white/20 rounded p-2 text-xs text-white"
            defaultValue={session.own_video_url}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-secretary-gold mb-3">체크포인트</h2>
        <div className="bg-white/5 p-4 rounded-xl space-y-2">
          {session.checklist.map((item, idx) => (
            <label key={item.key || idx} className="flex items-center gap-3 text-sm text-gray-300">
              <input type="checkbox" defaultChecked={item.checked} className="accent-secretary-gold w-4 h-4" />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-secretary-gold mb-3">분석 메모</h2>
        <textarea 
          className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-secretary-gold"
          placeholder="비교 결과 및 향후 계획을 메모하세요..."
          defaultValue={session.notes}
        />
      </section>
    </div>
  );
}
