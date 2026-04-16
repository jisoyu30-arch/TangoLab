import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePracticeStore } from '../hooks/usePracticeStore';
import songsData from '../data/songs.json';
import type { Song } from '../types/tango';

const songs = songsData as Song[];

export function PracticeBoardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { boards, removeSongFromBoard, addSongToBoard, addNoteToBoard, deleteBoard } = usePracticeStore();
  const board = boards.find(b => b.id === id);

  const [noteInput, setNoteInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const boardSongs = useMemo(() => {
    if (!board) return [];
    return board.song_ids.map(sid => songs.find(s => s.song_id === sid)).filter(Boolean) as Song[];
  }, [board]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !board) return [];
    const q = searchQuery.toLowerCase();
    return songs
      .filter(s => !board.song_ids.includes(s.song_id))
      .filter(s => s.title.toLowerCase().includes(q) || s.orchestra?.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchQuery, board]);

  if (!board) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">보드를 찾을 수 없습니다.</p>
          <Link to="/practice" className="text-secretary-gold text-sm hover:underline mt-2 inline-block">← 보드 목록</Link>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm(`"${board.title}" 보드를 삭제하시겠습니까?`)) {
      deleteBoard(board.id);
      navigate('/practice');
    }
  };

  return (
    <>
      <header className="h-14 border-b border-secretary-gold/20 flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/practice')}
            className="text-gray-400 hover:text-secretary-gold text-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            ←
          </button>
          <h2 className="text-sm font-semibold text-gray-300 truncate">{board.title}</h2>
        </div>
        <button onClick={handleDelete}
          className="text-xs text-gray-600 hover:text-red-400 px-2 py-1 transition-colors">
          삭제
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-5 space-y-6">

          {/* 곡 추가 검색 */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="곡 검색해서 추가..."
              className="w-full bg-white/5 border border-secretary-gold/20 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-secretary-gold/50"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-secretary-navy border border-secretary-gold/20 rounded-xl overflow-hidden z-20 shadow-xl">
                {searchResults.map(s => (
                  <button
                    key={s.song_id}
                    onClick={() => { addSongToBoard(board.id, s.song_id); setSearchQuery(''); }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between border-b border-white/5 last:border-0"
                  >
                    <div>
                      <div className="text-sm text-white">{s.title}</div>
                      <div className="text-xs text-gray-500">{s.orchestra}</div>
                    </div>
                    <span className="text-xs text-secretary-gold">+ 추가</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 저장된 곡 목록 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              저장된 곡 ({boardSongs.length})
            </h3>
            {boardSongs.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                <p className="text-gray-500 text-sm">아직 곡이 없습니다</p>
                <p className="text-gray-600 text-xs mt-1">위에서 검색하거나, 곡 상세 페이지에서 저장하세요</p>
              </div>
            ) : (
              <div className="space-y-1">
                {boardSongs.map(s => (
                  <div key={s.song_id} className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/8 transition-colors">
                    <Link to={`/song/${s.song_id}`} className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate hover:text-secretary-gold transition-colors">{s.title}</div>
                      <div className="text-xs text-gray-500">{s.orchestra ?? '미확인'} {s.vocalist ? `/ ${s.vocalist}` : ''}</div>
                    </Link>
                    <button
                      onClick={() => removeSongFromBoard(board.id, s.song_id)}
                      className="text-gray-600 hover:text-red-400 text-xs transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 체크포인트 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">체크포인트</h3>
            {board.checkpoints?.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {board.checkpoints.map((cp, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
                    <span className="text-secretary-gold text-sm">•</span>
                    <span className="text-sm text-gray-200 flex-1">{cp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 메모 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">메모</h3>
            <div className="space-y-2 mb-3">
              {board.notes?.length === 0 && (
                <div className="text-xs text-gray-600">아직 메모가 없습니다</div>
              )}
              {board.notes?.map(note => (
                <div key={note.id} className="bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{note.content}</p>
                  <div className="text-[10px] text-gray-600 mt-1.5">
                    {new Date(note.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && noteInput.trim()) {
                    addNoteToBoard(board.id, noteInput.trim());
                    setNoteInput('');
                  }
                }}
                placeholder="메모 남기기..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-secretary-gold/50"
              />
              <button
                onClick={() => { if (noteInput.trim()) { addNoteToBoard(board.id, noteInput.trim()); setNoteInput(''); } }}
                disabled={!noteInput.trim()}
                className="px-4 py-2.5 bg-secretary-gold/20 text-secretary-gold rounded-lg text-sm hover:bg-secretary-gold/30 disabled:opacity-40 transition-colors min-h-[44px]"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
