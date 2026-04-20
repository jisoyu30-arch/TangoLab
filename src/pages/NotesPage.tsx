// 공유 메모판 — 작가님과 신랑분이 주고받는 탱고 메모
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider, EditorialEmptyState } from '../components/editorial';
import { useSharedNotes } from '../hooks/useSharedNotes';

export function NotesPage() {
  const { notes, addNote, deleteNote, isSignedIn } = useSharedNotes();
  const [input, setInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleAdd = () => {
    if (!input.trim()) return;
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    addNote(input.trim(), tags);
    setInput('');
    setTagInput('');
  };

  return (
    <>
      <PageHeader title="공유 메모판" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-10 space-y-8">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Salon · Shared Notes
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              우리 탱고 <em className="text-tango-brass">메모</em>
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">
              작가님과 신랑분이 함께 쓰는 메모장 — 실시간 동기화
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {!isSignedIn && (
            <div className="bg-tango-burgundy/10 border border-tango-burgundy/30 rounded-sm p-5 text-center">
              <p className="text-sm text-tango-rose font-serif italic">
                로그인하시면 두 분이 실시간으로 메모를 공유할 수 있습니다.
              </p>
            </div>
          )}

          {/* 입력 */}
          <div className="bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-5 space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="오늘 연습에서 발견한 것, 대회 준비 아이디어, 탱고에 대한 생각..."
              rows={4}
              className="w-full bg-transparent border-0 font-serif text-base text-tango-paper placeholder-tango-cream/30 focus:outline-none resize-none"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="태그 (쉼표로 구분): 연습, 대회, 작가님"
                className="flex-1 bg-transparent border-b border-tango-brass/20 focus:border-tango-brass pb-1 text-xs text-tango-cream/80 placeholder-tango-cream/30 focus:outline-none font-sans"
              />
              <button
                onClick={handleAdd}
                disabled={!input.trim()}
                className="px-5 py-2 bg-tango-brass text-tango-ink rounded-sm text-sm font-serif italic disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                남기기
              </button>
            </div>
          </div>

          {/* 목록 */}
          {notes.length === 0 ? (
            <EditorialEmptyState
              icon="🖋"
              title="메모가 없습니다"
              subtitle="첫 메모를 남겨보세요"
            />
          ) : (
            <div className="space-y-px bg-tango-brass/15">
              {notes.map(note => (
                <div key={note.id} className="bg-tango-ink p-5 group">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-tango-burgundy/20 flex items-center justify-center text-tango-rose font-display italic text-lg" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {note.author[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-sm text-tango-paper font-sans">{note.author.split('@')[0]}</span>
                          <span className="text-[10px] text-tango-cream/40 ml-2 font-sans">
                            {new Date(note.created_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-tango-cream/30 hover:text-tango-rose text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          삭제
                        </button>
                      </div>
                      <p className="font-serif text-base text-tango-paper whitespace-pre-wrap leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {note.content}
                      </p>
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {note.tags.map(t => (
                            <span key={t} className="text-[10px] text-tango-brass font-sans">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
