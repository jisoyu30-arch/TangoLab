import { useMemo } from 'react';
import { usePracticeStore } from '../hooks/usePracticeStore';
import { NavLink } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import songsData from '../data/songs.json';
import type { Song } from '../types/tango';

const songs = songsData as Song[];

export function CompareRoomListPage() {
  const { compareSessions, addCompareSession } = usePracticeStore();
  const songMap = useMemo(() => new Map(songs.map(s => [s.song_id, s])), []);

  return (
    <>
    <PageHeader
      title="비교 연습실"
      right={
        <button
          onClick={() => addCompareSession('새 비교 세션', null, '', '')}
          className="bg-tango-brass text-tango-shadow px-3 py-2 rounded-lg font-bold text-sm"
        >
          + 생성
        </button>
      }
    />
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <p className="text-sm text-gray-400">레퍼런스 영상과 내 영상을 1:1 비교 분석</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {compareSessions.length === 0 ? (
          <div className="col-span-full bg-white/5 border border-dashed border-tango-brass/20 rounded-xl p-8 text-center">
            <div className="text-3xl mb-3">👀</div>
            <p className="text-gray-400 text-sm mb-1">비교 세션이 없습니다</p>
            <p className="text-gray-600 text-xs">레퍼런스 영상과 내 영상을 나란히 놓고 비교 분석해보세요</p>
          </div>
        ) : compareSessions.map(session => (
          <NavLink
            key={session.id}
            to={`/compare/${session.id}`}
            className="bg-white/5 border border-tango-brass/20 hover:border-tango-brass/50 rounded-xl p-4 transition"
          >
            <h2 className="font-bold text-lg text-white">{session.title}</h2>
            {session.song_id && songMap.get(session.song_id) && (
              <p className="text-xs text-tango-brass mt-1">
                🎵 {songMap.get(session.song_id)!.title} — {songMap.get(session.song_id)!.orchestra}
              </p>
            )}
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
    </>
  );
}
