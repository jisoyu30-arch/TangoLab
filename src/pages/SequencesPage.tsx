// 우리가 익혀야 할 시퀀스 라이브러리 — 좌(레퍼런스) | 우(우리 연습) 2분할 비교
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import { useSequencesStore, extractEmbed, type SequenceItem, type PracticeClip } from '../hooks/useSequencesStore';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  learning:   { label: '익히는 중',  color: '#5D7A8E' },
  practicing: { label: '연습 중',    color: '#D4AF37' },
  mastered:   { label: '몸에 익음',  color: '#7A8E6E' },
};

const MUSIC_LABELS: Record<string, string> = {
  rhythmic: '리드믹', melodic: '멜로디컬', show: '쇼 탱고', traditional: '트래디셔널', '': '미지정',
};

export function SequencesPage() {
  const store = useSequencesStore();
  const [selectedId, setSelectedId] = useState<string | null>(store.sequences[0]?.id || null);
  const [filter, setFilter] = useState<'all' | 'learning' | 'practicing' | 'mastered'>('all');

  const filtered = useMemo(() =>
    filter === 'all' ? store.sequences : store.sequences.filter(s => s.status === filter),
  [store.sequences, filter]);

  const selected = store.sequences.find(s => s.id === selectedId);

  const handleAdd = () => {
    const id = store.addSequence({ title: '새 시퀀스' });
    setSelectedId(id);
  };

  // 🎯 음악 4분류별 시작 시퀀스 4개 자동 생성
  const handleSeedStarters = () => {
    const starters: Array<{ title: string; music_type: 'rhythmic' | 'melodic' | 'show' | 'traditional'; description: string }> = [
      {
        title: '리드믹 시퀀스 1',
        music_type: 'rhythmic',
        description: 'D\'Arienzo / Biagi 같은 마르카토 음악에 꺼낼 짧고 또렷한 시퀀스.\n\n핵심: 비트 위에 정확한 발놀림, traspié·짧은 사카다, sub-pulse(반박자) 활용.',
      },
      {
        title: '멜로디컬 시퀀스 1',
        music_type: 'melodic',
        description: 'Di Sarli / Calo 같은 우아한 음악에 꺼낼 길게 흐르는 시퀀스.\n\n핵심: 음표 따라 길게 끌기, 부드러운 헤다·사카다, 우아한 정지(pausa).',
      },
      {
        title: '쇼 탱고 시퀀스 1',
        music_type: 'show',
        description: '극적 음악(Pugliese 후기/Piazzolla 등)에 꺼낼 큰 라인 시퀀스.\n\n핵심: la línea(긴 신체 라인), 의도적 분리·재연결. ⚠ Pista 출전 시 점프·트레파다 금지.',
      },
      {
        title: '트래디셔널 시퀀스 1',
        music_type: 'traditional',
        description: 'Tango de Salón의 정통 시퀀스. 음악과의 conversation.\n\n핵심: 단순하지만 정확, apilado 아브라소, 음악과 정확히 맞물린 figura.',
      },
    ];
    let firstId = '';
    for (const s of starters) {
      const id = store.addSequence(s);
      if (!firstId) firstId = id;
    }
    setSelectedId(firstId);
  };

  return (
    <>
      <PageHeader title="시퀀스 라이브러리" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-10">

          {/* HERO */}
          <div className="text-center border-b border-tango-brass/15 pb-5 mb-6">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
              Sequence Library · 우리가 익혀야 할 시퀀스
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              레퍼런스 <em className="text-tango-brass">↔</em> 우리 연습
            </h1>
            <p className="text-xs text-tango-cream/60 mt-2 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              좌측에 닮고 싶은 영상, 우측에 우리 연습 영상 — 직접 비교
            </p>
          </div>

          {/* 상단: 필터 + 추가 + 수업 페이지 링크 */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {([
                { v: 'all', l: `전체 (${store.sequences.length})` },
                { v: 'learning', l: '익히는 중' },
                { v: 'practicing', l: '연습 중' },
                { v: 'mastered', l: '몸에 익음' },
              ] as const).map(t => (
                <button
                  key={t.v}
                  onClick={() => setFilter(t.v)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                    filter === t.v ? 'border-tango-brass bg-tango-brass/15 text-tango-brass' : 'border-tango-brass/20 text-tango-cream/60 hover:border-tango-brass/40'
                  }`}
                >
                  {t.l}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Link
                to="/training"
                className="text-xs px-3 py-1.5 rounded-sm border border-tango-brass/20 text-tango-cream/60 hover:bg-tango-brass/5"
              >
                ← 수업
              </Link>
              <button
                onClick={handleAdd}
                className="text-xs px-3 py-1.5 rounded-sm bg-tango-brass/20 hover:bg-tango-brass/30 text-tango-brass border border-tango-brass/40 font-semibold"
              >
                + 새 시퀀스
              </button>
            </div>
          </div>

          {/* 본문 — 좌(목록) + 우(상세) */}
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">

            {/* 시퀀스 목록 */}
            <div className="space-y-1.5 max-h-[80vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-8 px-4 space-y-3">
                  <div className="text-xs text-tango-cream/40 italic">
                    시퀀스가 없습니다.
                  </div>
                  {store.sequences.length === 0 && (
                    <button
                      onClick={handleSeedStarters}
                      className="block w-full px-3 py-3 rounded-sm border border-tango-brass/40 bg-tango-brass/10 text-tango-brass text-xs hover:bg-tango-brass/20 transition-colors"
                    >
                      ◆ 음악 4분류 시작 시퀀스 자동 생성<br />
                      <span className="text-[10px] text-tango-cream/60 mt-1 block">리드믹·멜로디컬·쇼·트래디셔널 각 1개</span>
                    </button>
                  )}
                  <button
                    onClick={handleAdd}
                    className="block w-full px-3 py-2 text-xs text-tango-cream/60 hover:text-tango-brass"
                  >
                    + 빈 시퀀스 직접 추가
                  </button>
                </div>
              ) : filtered.map(s => {
                const isActive = s.id === selectedId;
                const status = STATUS_LABELS[s.status];
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left p-3 rounded-sm border transition-all ${
                      isActive
                        ? 'border-tango-brass bg-tango-brass/10'
                        : 'border-tango-brass/15 bg-tango-shadow/30 hover:bg-tango-shadow/60 hover:border-tango-brass/30'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <div className="font-serif italic text-sm text-tango-paper truncate flex-1" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {s.title}
                      </div>
                      <span
                        className="text-[9px] tracking-widest uppercase font-sans px-1.5 py-0.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: `${status.color}25`, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-tango-cream/50 flex items-center gap-2">
                      <span>{MUSIC_LABELS[s.music_type || '']}</span>
                      <span>·</span>
                      <span>{s.practice_clips.length}개 클립</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 시퀀스 상세 */}
            <div>
              {selected ? (
                <SequenceDetail
                  key={selected.id}
                  seq={selected}
                  onUpdate={(p) => store.updateSequence(selected.id, p)}
                  onDelete={() => {
                    if (confirm(`"${selected.title}" 삭제할까요?`)) {
                      store.deleteSequence(selected.id);
                      setSelectedId(filtered.find(s => s.id !== selected.id)?.id || null);
                    }
                  }}
                  onAddClip={(url, note, date) => store.addPracticeClip(selected.id, url, note, date)}
                  onRemoveClip={(clipId) => store.removePracticeClip(selected.id, clipId)}
                />
              ) : (
                <div className="border border-dashed border-tango-brass/20 rounded-sm p-10 text-center">
                  <p className="text-tango-cream/50 font-serif italic text-sm">
                    시퀀스를 선택하거나 새로 추가하세요
                  </p>
                </div>
              )}
            </div>
          </div>

          <OrnamentDivider className="mt-10" />
        </div>
      </div>
    </>
  );
}

// =============== 시퀀스 상세 ===============
function SequenceDetail({
  seq,
  onUpdate,
  onDelete,
  onAddClip,
  onRemoveClip,
}: {
  seq: SequenceItem;
  onUpdate: (p: Partial<SequenceItem>) => void;
  onDelete: () => void;
  onAddClip: (url: string, note?: string, date?: string) => void;
  onRemoveClip: (clipId: string) => void;
}) {
  const [activeClipId, setActiveClipId] = useState<string | null>(seq.practice_clips[0]?.id || null);
  const [newClipUrl, setNewClipUrl] = useState('');
  const [newClipNote, setNewClipNote] = useState('');
  const [newClipDate, setNewClipDate] = useState(new Date().toISOString().split('T')[0]);
  // 비교 모드 — 좁은 화면에서도 강제 나란히 보기 가능
  const [compareMode, setCompareMode] = useState<'auto' | 'side' | 'stack'>('auto');

  const activeClip = seq.practice_clips.find(c => c.id === activeClipId) || seq.practice_clips[0];
  const refEmbed = extractEmbed(seq.reference_url);
  const ownEmbed = activeClip ? extractEmbed(activeClip.url) : null;

  const handleAddClip = () => {
    if (!newClipUrl.trim()) return;
    onAddClip(newClipUrl, newClipNote, newClipDate);
    setNewClipUrl('');
    setNewClipNote('');
  };

  return (
    <div className="space-y-4">
      {/* 헤더: 제목/상태/음악/삭제 */}
      <div className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-4 space-y-3">
        <div className="flex items-start gap-3">
          <input
            value={seq.title}
            onChange={e => onUpdate({ title: e.target.value })}
            className="flex-1 bg-transparent border-none font-display italic text-2xl md:text-3xl text-tango-paper focus:outline-none"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            placeholder="시퀀스 이름"
          />
          <button
            onClick={onDelete}
            className="text-tango-cream/40 hover:text-tango-rose text-xl flex-shrink-0"
            title="삭제"
          >
            ×
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={seq.status}
            onChange={e => onUpdate({ status: e.target.value as any })}
            className="bg-tango-ink border border-tango-brass/30 rounded-sm px-2 py-1 text-xs text-tango-paper focus:outline-none"
          >
            <option value="learning">익히는 중</option>
            <option value="practicing">연습 중</option>
            <option value="mastered">몸에 익음</option>
          </select>
          <select
            value={seq.music_type || ''}
            onChange={e => onUpdate({ music_type: e.target.value as any })}
            className="bg-tango-ink border border-tango-brass/30 rounded-sm px-2 py-1 text-xs text-tango-paper focus:outline-none"
          >
            <option value="">음악 미지정</option>
            <option value="rhythmic">리드믹</option>
            <option value="melodic">멜로디컬</option>
            <option value="show">쇼 탱고</option>
            <option value="traditional">트래디셔널</option>
          </select>
          <input
            value={seq.tags.join(', ')}
            onChange={e => onUpdate({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
            placeholder="태그 (쉼표 구분)"
            className="flex-1 min-w-[120px] bg-tango-ink border border-tango-brass/30 rounded-sm px-2 py-1 text-xs text-tango-paper focus:outline-none"
          />
        </div>
      </div>

      {/* 비교 모드 토글 (모바일에서 유용) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
          Comparison · 비교 모드
        </span>
        <div className="flex gap-1">
          {([
            { v: 'auto', l: '자동' },
            { v: 'side', l: '🔀 나란히' },
            { v: 'stack', l: '↕ 위아래' },
          ] as const).map(t => (
            <button
              key={t.v}
              onClick={() => setCompareMode(t.v)}
              className={`text-[10px] px-2 py-1 rounded-sm border ${
                compareMode === t.v ? 'border-tango-brass bg-tango-brass/15 text-tango-brass' : 'border-tango-brass/15 text-tango-cream/60 hover:border-tango-brass/40'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* 2분할 영상 비교 — 좌:레퍼런스 / 우:우리 연습 */}
      <div className={`grid gap-3 ${
        compareMode === 'side' ? 'grid-cols-2' :
        compareMode === 'stack' ? 'grid-cols-1' :
        'grid-cols-1 md:grid-cols-2'
      }`}>
        {/* 좌: 레퍼런스 */}
        <div className="bg-tango-shadow/40 border-2 border-tango-brass/30 rounded-sm overflow-hidden">
          <div className="bg-tango-brass/10 px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
              📚 Reference · 레퍼런스
            </span>
            {seq.reference_url && (
              <a
                href={seq.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-tango-brass/70 hover:underline"
              >
                원본 →
              </a>
            )}
          </div>
          <div className="bg-black relative" style={{ aspectRatio: '16 / 9' }}>
            {refEmbed.embedUrl ? (
              <iframe
                src={refEmbed.embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-tango-cream/40 text-xs italic">
                레퍼런스 URL을 입력하세요 ↓
              </div>
            )}
          </div>
          <div className="p-3 space-y-2">
            <input
              value={seq.reference_url}
              onChange={e => onUpdate({ reference_url: e.target.value })}
              placeholder="YouTube / Instagram URL"
              className="w-full bg-tango-ink border border-tango-brass/30 rounded-sm px-2 py-1.5 text-xs text-tango-paper focus:outline-none focus:border-tango-brass"
            />
            <input
              value={seq.reference_label || ''}
              onChange={e => onUpdate({ reference_label: e.target.value })}
              placeholder="라벨 (예: 2024 Mundial 결승 1라운드 0:34)"
              className="w-full bg-tango-ink border border-tango-brass/30 rounded-sm px-2 py-1.5 text-xs text-tango-paper focus:outline-none focus:border-tango-brass"
            />
          </div>
        </div>

        {/* 우: 우리 연습 */}
        <div className="bg-tango-shadow/40 border-2 border-tango-rose/30 rounded-sm overflow-hidden">
          <div className="bg-tango-rose/10 px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] tracking-[0.3em] uppercase text-tango-rose font-sans">
              🎬 Our Practice · 우리 연습
            </span>
            {seq.practice_clips.length > 0 && (
              <span className="text-[10px] text-tango-rose/70">
                {seq.practice_clips.length}개 · {activeClip?.date}
              </span>
            )}
          </div>
          <div className="bg-black relative" style={{ aspectRatio: '16 / 9' }}>
            {ownEmbed?.embedUrl ? (
              <iframe
                src={ownEmbed.embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-tango-cream/40 text-xs italic px-4 text-center">
                연습 영상이 없습니다.<br />아래에서 첫 영상을 추가하세요.
              </div>
            )}
          </div>
          {/* 클립 선택 (여러 개일 때) */}
          {seq.practice_clips.length > 1 && (
            <div className="p-2 border-t border-tango-rose/15 flex gap-1 overflow-x-auto">
              {seq.practice_clips.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveClipId(c.id)}
                  className={`flex-shrink-0 text-[10px] px-2 py-1 rounded-sm border ${
                    c.id === activeClip?.id
                      ? 'border-tango-rose bg-tango-rose/15 text-tango-rose'
                      : 'border-tango-brass/15 text-tango-cream/60 hover:border-tango-rose/40'
                  }`}
                  title={c.note}
                >
                  {c.date}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 설명창 */}
      <div className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-4">
        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
          Description · 설명
        </div>
        <textarea
          value={seq.description}
          onChange={e => onUpdate({ description: e.target.value })}
          placeholder="이 시퀀스의 핵심 포인트, 강사 코멘트, 주의할 부분, 우리에게 적용된 변형…"
          className="w-full bg-tango-ink border border-tango-brass/20 rounded-sm px-3 py-2 text-tango-paper font-serif text-sm focus:outline-none focus:border-tango-brass min-h-[120px]"
          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
        />
      </div>

      {/* 우리 연습 영상 추가 */}
      <div className="bg-tango-shadow/40 border border-tango-rose/30 rounded-sm p-4 space-y-2">
        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-rose font-sans">
          + 우리 연습 영상 추가
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={newClipDate}
            onChange={e => setNewClipDate(e.target.value)}
            className="bg-tango-ink border border-tango-brass/30 rounded-sm px-2 py-1.5 text-xs text-tango-paper focus:outline-none"
          />
          <input
            value={newClipUrl}
            onChange={e => setNewClipUrl(e.target.value)}
            placeholder="YouTube / Instagram URL"
            className="flex-1 min-w-[200px] bg-tango-ink border border-tango-brass/30 rounded-sm px-2 py-1.5 text-xs text-tango-paper focus:outline-none focus:border-tango-brass"
          />
          <input
            value={newClipNote}
            onChange={e => setNewClipNote(e.target.value)}
            placeholder="메모 (선택)"
            className="flex-1 min-w-[150px] bg-tango-ink border border-tango-brass/30 rounded-sm px-2 py-1.5 text-xs text-tango-paper focus:outline-none focus:border-tango-brass"
          />
          <button
            onClick={handleAddClip}
            disabled={!newClipUrl.trim()}
            className="px-3 py-1.5 text-xs rounded-sm bg-tango-rose/20 hover:bg-tango-rose/30 text-tango-rose border border-tango-rose/40 font-semibold disabled:opacity-30"
          >
            추가
          </button>
        </div>
      </div>

      {/* 클립 목록 (관리) */}
      {seq.practice_clips.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] tracking-[0.3em] uppercase text-tango-cream/50 font-sans">
            All Clips · 모든 클립 ({seq.practice_clips.length})
          </div>
          {seq.practice_clips.map(c => (
            <ClipRow key={c.id} clip={c} onRemove={() => confirm('이 클립을 제거할까요?') && onRemoveClip(c.id)} active={c.id === activeClip?.id} onClick={() => setActiveClipId(c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClipRow({ clip, onRemove, active, onClick }: { clip: PracticeClip; onRemove: () => void; active: boolean; onClick: () => void }) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-sm border text-xs ${active ? 'border-tango-rose/40 bg-tango-rose/5' : 'border-tango-brass/15 bg-tango-shadow/20'}`}>
      <button
        onClick={onClick}
        className="font-mono text-tango-rose flex-shrink-0 hover:underline"
      >
        ▶ {clip.date}
      </button>
      <div className="flex-1 min-w-0 font-serif italic text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        {clip.note || <span className="text-tango-cream/40">(메모 없음)</span>}
      </div>
      <a
        href={clip.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-tango-cream/50 hover:text-tango-brass truncate max-w-[120px]"
      >
        🔗
      </a>
      <button
        onClick={onRemove}
        className="text-tango-cream/30 hover:text-tango-rose"
      >
        ×
      </button>
    </div>
  );
}
