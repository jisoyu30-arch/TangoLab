import { useMemo } from 'react';
import { usePracticeStore } from '../hooks/usePracticeStore';
import { NavLink } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { EditorialEmptyState, EditorialButton, OrnamentDivider } from '../components/editorial';
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
          <EditorialButton variant="primary" onClick={() => addCompareSession('새 비교 세션', null, '', '')}>
            + 생성
          </EditorialButton>
        }
      />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 space-y-8">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Compare · Reference vs Ours
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              비교 <em className="text-tango-brass">연습실</em>
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">
              레퍼런스 영상과 내 영상을 나란히 분석
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {compareSessions.length === 0 ? (
            <EditorialEmptyState
              icon="👀"
              title="비교 세션이 없습니다"
              subtitle="레퍼런스와 우리 영상을 1:1로 분석해보세요"
              action={<EditorialButton variant="primary" onClick={() => addCompareSession('새 비교 세션', null, '', '')}>+ 첫 세션 만들기</EditorialButton>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-tango-brass/15 rounded-sm overflow-hidden">
              {compareSessions.map((session, i) => {
                const song = session.song_id ? songMap.get(session.song_id) : null;
                const done = session.checklist.filter(c => c.checked).length;
                return (
                  <NavLink
                    key={session.id}
                    to={`/compare/${session.id}`}
                    className="group bg-tango-ink hover:bg-tango-shadow p-5 md:p-6 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <span className="font-display text-3xl text-tango-brass/60 italic leading-none flex-shrink-0" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-display text-xl md:text-2xl text-tango-paper italic group-hover:text-tango-brass transition-colors truncate" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                          {session.title}
                        </h2>
                        {song && (
                          <p className="text-[11px] tracking-wider uppercase text-tango-rose mt-1 font-sans truncate">
                            ♪ {song.title} · {song.orchestra?.split(' ')[0]}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-3 text-[11px] font-sans">
                          <span className={session.reference_video_url ? 'text-tango-brass' : 'text-tango-cream/40'}>
                            {session.reference_video_url ? '✓' : '○'} 레퍼런스
                          </span>
                          <span className={session.own_video_url ? 'text-tango-brass' : 'text-tango-cream/40'}>
                            {session.own_video_url ? '✓' : '○'} 우리 영상
                          </span>
                          <span className="ml-auto text-tango-cream/50">
                            체크 {done}/{session.checklist.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
