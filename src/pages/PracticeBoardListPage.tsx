import { usePracticeStore } from '../hooks/usePracticeStore';
import { NavLink } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { EditorialEmptyState, EditorialButton, OrnamentDivider } from '../components/editorial';

export function PracticeBoardListPage() {
  const { boards, addBoard } = usePracticeStore();

  return (
    <>
      <PageHeader
        title="내 연습 보드"
        right={
          <EditorialButton variant="primary" onClick={() => addBoard('새 연습 보드', '')}>
            + 생성
          </EditorialButton>
        }
      />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 space-y-8">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Practice · Boards
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              연습 <em className="text-tango-brass">보드</em>
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">
              대회·밀롱가·수업 목적별로 연습곡 모음
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {boards.length === 0 ? (
            <EditorialEmptyState
              icon="📝"
              title="연습 보드가 없습니다"
              subtitle="목적에 맞는 곡 모음을 만들어보세요"
              action={<EditorialButton variant="primary" onClick={() => addBoard('새 연습 보드', '')}>+ 첫 보드 만들기</EditorialButton>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-tango-brass/15 rounded-sm overflow-hidden">
              {boards.map((board, i) => (
                <NavLink
                  key={board.id}
                  to={`/practice/${board.id}`}
                  className="group bg-tango-ink hover:bg-tango-shadow p-5 md:p-6 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-display text-3xl text-tango-brass/60 italic leading-none flex-shrink-0" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display text-2xl text-tango-paper italic group-hover:text-tango-brass transition-colors truncate" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {board.title}
                      </h2>
                      <p className="text-sm text-tango-cream/60 mt-1 font-serif italic line-clamp-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {board.description || '설명 없음'}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-[11px] font-sans">
                        <span className="text-tango-cream/70">곡 <strong className="text-tango-brass">{board.song_ids.length}</strong></span>
                        <span className="text-tango-cream/70">메모 <strong className="text-tango-brass">{board.notes?.length || 0}</strong></span>
                        <span className="ml-auto text-tango-cream/40">
                          {new Date(board.updated_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
