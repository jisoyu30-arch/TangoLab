import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePracticeStore } from '../hooks/usePracticeStore';
import { extractYouTubeId } from '../utils/tangoHelpers';

export function CompareRoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { compareSessions, updateCompareSession, deleteCompareSession } = usePracticeStore();
  const session = compareSessions.find(s => s.id === id);

  const [refUrl, setRefUrl] = useState(session?.reference_video_url ?? '');
  const [ownUrl, setOwnUrl] = useState(session?.own_video_url ?? '');
  const [notes, setNotes] = useState(session?.notes ?? '');

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">비교 세션을 찾을 수 없습니다.</p>
          <Link to="/compare" className="text-secretary-gold text-sm hover:underline mt-2 inline-block">← 비교 목록</Link>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('비교 세션을 삭제하시겠습니까?')) {
      deleteCompareSession(session.id);
      navigate('/compare');
    }
  };

  const handleSaveRef = () => {
    updateCompareSession(session.id, { reference_video_url: refUrl });
  };

  const handleSaveOwn = () => {
    updateCompareSession(session.id, { own_video_url: ownUrl });
  };

  const handleSaveNotes = () => {
    updateCompareSession(session.id, { notes });
  };

  const handleToggleCheck = (key: string) => {
    const newChecklist = session.checklist.map(c =>
      c.key === key ? { ...c, checked: !c.checked } : c
    );
    updateCompareSession(session.id, { checklist: newChecklist } as any);
  };

  const refVideoId = extractYouTubeId(refUrl || session.reference_video_url);
  const ownVideoId = extractYouTubeId(ownUrl || session.own_video_url);

  return (
    <>
      <header className="h-14 border-b border-secretary-gold/20 flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/compare')}
            className="text-gray-400 hover:text-secretary-gold text-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            ←
          </button>
          <h2 className="text-sm font-semibold text-gray-300 truncate">{session.title}</h2>
        </div>
        <button onClick={handleDelete}
          className="text-xs text-gray-600 hover:text-red-400 px-2 py-1 transition-colors">
          삭제
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-5 space-y-6">

          {/* 영상 비교 (2열 또는 1열) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 레퍼런스 영상 */}
            <div className="bg-white/5 border border-secretary-gold/10 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/10">
                <h3 className="text-xs font-semibold text-secretary-gold">레퍼런스 영상</h3>
              </div>
              {refVideoId ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${refVideoId}`}
                    title="Reference" allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              ) : (
                <div className="aspect-video bg-black/30 flex items-center justify-center text-gray-600 text-sm">
                  URL을 입력하세요
                </div>
              )}
              <div className="p-3 flex gap-2">
                <input
                  type="text"
                  value={refUrl}
                  onChange={e => setRefUrl(e.target.value)}
                  placeholder="유튜브 URL"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-secretary-gold/50"
                />
                <button onClick={handleSaveRef}
                  className="px-3 py-2 bg-secretary-gold/20 text-secretary-gold rounded-lg text-xs hover:bg-secretary-gold/30 transition-colors min-h-[36px]">
                  저장
                </button>
              </div>
            </div>

            {/* 우리 영상 */}
            <div className="bg-white/5 border border-secretary-gold/10 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/10">
                <h3 className="text-xs font-semibold text-secretary-gold">우리 연습 영상</h3>
              </div>
              {ownVideoId ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${ownVideoId}`}
                    title="Our practice" allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              ) : (
                <div className="aspect-video bg-black/30 flex items-center justify-center text-gray-600 text-sm">
                  URL을 입력하세요
                </div>
              )}
              <div className="p-3 flex gap-2">
                <input
                  type="text"
                  value={ownUrl}
                  onChange={e => setOwnUrl(e.target.value)}
                  placeholder="유튜브 URL"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-secretary-gold/50"
                />
                <button onClick={handleSaveOwn}
                  className="px-3 py-2 bg-secretary-gold/20 text-secretary-gold rounded-lg text-xs hover:bg-secretary-gold/30 transition-colors min-h-[36px]">
                  저장
                </button>
              </div>
            </div>
          </div>

          {/* 비교 체크리스트 */}
          <div className="bg-white/5 rounded-xl border border-secretary-gold/10 p-5">
            <h3 className="text-sm font-semibold text-secretary-gold mb-4">비교 체크포인트</h3>
            <div className="space-y-2">
              {session.checklist.map(item => (
                <button
                  key={item.key}
                  onClick={() => handleToggleCheck(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all min-h-[48px] ${
                    item.checked
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-white/5 border border-white/10 hover:bg-white/8'
                  }`}
                >
                  <span className={`text-lg ${item.checked ? 'text-green-400' : 'text-gray-600'}`}>
                    {item.checked ? '✓' : '○'}
                  </span>
                  <span className={`text-sm ${item.checked ? 'text-green-300' : 'text-gray-300'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 분석 메모 */}
          <div className="bg-white/5 rounded-xl border border-secretary-gold/10 p-5">
            <h3 className="text-sm font-semibold text-secretary-gold mb-3">분석 메모</h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white resize-none focus:outline-none focus:border-secretary-gold/50 placeholder-gray-500"
              placeholder="비교 결과, 개선할 점, 다음 연습 포인트..."
            />
            <button
              onClick={handleSaveNotes}
              className="mt-2 px-4 py-2 bg-secretary-gold/20 text-secretary-gold rounded-lg text-xs hover:bg-secretary-gold/30 transition-colors min-h-[36px]"
            >
              저장
            </button>
          </div>

          {/* 연결된 곡 */}
          {session.song_id && (
            <Link
              to={`/song/${session.song_id}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-secretary-gold/10 hover:bg-secretary-gold/20 text-secretary-gold rounded-xl text-sm font-medium transition-colors min-h-[48px]"
            >
              연결된 곡 상세 보기 →
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
