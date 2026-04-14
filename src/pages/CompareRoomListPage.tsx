import { usePracticeStore } from '../hooks/usePracticeStore';
import { NavLink } from 'react-router-dom';

export function CompareRoomListPage() {
  const { compareSessions, addCompareSession } = usePracticeStore();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <header className="flex justify-between items-center border-b border-secretary-gold/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-secretary-gold">비교 연습실</h1>
          <p className="text-sm text-gray-400 mt-1">레퍼런스 영상과 내 영상을 1:1 비교 분석</p>
        </div>
        <button 
          onClick={() => addCompareSession('새 비교 세션', null, '', '')}
          className="bg-secretary-gold text-secretary-navy px-3 py-2 rounded-lg font-bold text-sm"
        >
          + 비교 생성
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {compareSessions.length === 0 ? (
          <div className="text-sm text-gray-500">생성된 비교 세션이 없습니다.</div>
        ) : compareSessions.map(session => (
          <NavLink
            key={session.id}
            to={`/compare/${session.id}`}
            className="bg-white/5 border border-secretary-gold/20 hover:border-secretary-gold/50 rounded-xl p-4 transition"
          >
            <h2 className="font-bold text-lg text-white">{session.title}</h2>
            <div className="mt-2 text-sm text-gray-400 space-y-1">
              <p>레퍼런스: {session.reference_video_url ? '등록됨' : '없음'}</p>
              <p>내 연습: {session.own_video_url ? '등록됨' : '없음'}</p>
              <p>체크리스트: {session.checklist.filter(c => c.checked).length} / {session.checklist.length} 완료</p>
            </div>
            <div className="mt-4 text-xs text-gray-600">
              최근 업데이트: {new Date(session.updated_at).toLocaleDateString()}
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
