// 태그 영상 플레이어 — 영상 재생 시 곡/참가자/심사위원 메타 정보 패널 동시 표시
// 재사용 가능: Command Center · TandaLab · SongDetail 등
// + 곡 타임스탬프 클릭 시 해당 시점으로 점프 (postMessage API)
import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

// === 영상 주석(메모) 저장 ===
interface VideoAnnotation {
  id: string;
  sec: number;
  text: string;
  created_at: string;
}

const ANNOTATION_KEY = 'tango_lab_video_annotations';

function loadAnnotations(videoId: string): VideoAnnotation[] {
  try {
    const raw = localStorage.getItem(ANNOTATION_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);
    return (all[videoId] || []).sort((a: VideoAnnotation, b: VideoAnnotation) => a.sec - b.sec);
  } catch {
    return [];
  }
}

function saveAnnotations(videoId: string, list: VideoAnnotation[]) {
  try {
    const raw = localStorage.getItem(ANNOTATION_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[videoId] = list;
    localStorage.setItem(ANNOTATION_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export interface VideoSong {
  song_id?: string;
  title: string;
  orchestra?: string;
  order?: number;
  vocalist?: string;
}

export interface VideoParticipant {
  pareja: number;
  leader: string;
  follower: string;
  rank?: number;
  advancedTo?: 'final' | 'semifinal' | 'cuartos' | 'qualifying' | 'none';
  isMyCouple?: boolean;
}

export interface VideoMeta {
  video_id: string;
  title?: string;
  channel?: string;
  start_sec?: number;
  song_timestamps?: Array<{ order: number; sec: number; title?: string; orchestra?: string }>;
}

export interface TaggedVideoPlayerProps {
  video: VideoMeta;
  songs?: VideoSong[];
  participants?: VideoParticipant[];
  judges?: string[];
  myJudgeScores?: Record<string, number>; // 심사위원별 우리가 받은 점수 (있으면)
  roundInfo?: {
    competition?: string;
    year?: number;
    stage?: string;
    ronda?: number;
    group?: string;
  };
  autoPlay?: boolean;
  highlight?: string; // '🏆 소유&석정 6위' 같은 강조 배지
}

export function TaggedVideoPlayer({
  video,
  songs = [],
  participants = [],
  judges = [],
  myJudgeScores = {},
  roundInfo,
  autoPlay = false,
  highlight,
}: TaggedVideoPlayerProps) {
  const [activeTab, setActiveTab] = useState<'songs' | 'participants' | 'judges' | 'notes'>(
    songs.length > 0 ? 'songs' : participants.length > 0 ? 'participants' : judges.length > 0 ? 'judges' : 'notes'
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>(() => loadAnnotations(video.video_id));

  // video_id 바뀌면 주석 다시 로드
  useEffect(() => {
    setAnnotations(loadAnnotations(video.video_id));
  }, [video.video_id]);

  const addAnnotation = (sec: number, text: string) => {
    const next = [...annotations, {
      id: `ann-${Date.now()}`,
      sec: Math.floor(sec),
      text: text.trim(),
      created_at: new Date().toISOString(),
    }].sort((a, b) => a.sec - b.sec);
    setAnnotations(next);
    saveAnnotations(video.video_id, next);
  };

  const deleteAnnotation = (id: string) => {
    const next = annotations.filter(a => a.id !== id);
    setAnnotations(next);
    saveAnnotations(video.video_id, next);
  };

  const videoUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('rel', '0');
    params.set('modestbranding', '1');
    params.set('enablejsapi', '1'); // postMessage 지원
    if (autoPlay) params.set('autoplay', '1');
    if (video.start_sec) params.set('start', String(video.start_sec));
    return `https://www.youtube.com/embed/${video.video_id}?${params.toString()}`;
  }, [video.video_id, video.start_sec, autoPlay]);

  // 특정 시점으로 점프 (YouTube postMessage API)
  const seekTo = (seconds: number) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
      '*'
    );
    // 자동으로 재생도 시작
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
      '*'
    );
  };

  // 곡 타임스탬프 매핑 (order 기준)
  const songTimestampByOrder = useMemo(() => {
    const map = new Map<number, number>();
    (video.song_timestamps || []).forEach(ts => {
      map.set(ts.order, ts.sec);
    });
    return map;
  }, [video.song_timestamps]);

  // 최종 진출 단계별 정렬
  const sortedParticipants = useMemo(() => {
    const stageOrder: Record<string, number> = { final: 0, semifinal: 1, cuartos: 2, qualifying: 3, none: 4 };
    return [...participants].sort((a, b) => {
      if (a.isMyCouple && !b.isMyCouple) return -1;
      if (!a.isMyCouple && b.isMyCouple) return 1;
      const sA = stageOrder[a.advancedTo ?? 'none'] ?? 5;
      const sB = stageOrder[b.advancedTo ?? 'none'] ?? 5;
      if (sA !== sB) return sA - sB;
      return (a.rank ?? 999) - (b.rank ?? 999);
    });
  }, [participants]);

  const advanceBadge: Record<string, string> = {
    final: '🏆',
    semifinal: '◆',
    cuartos: '◇',
    qualifying: '○',
    none: '—',
  };

  return (
    <div className="bg-tango-shadow/60 border border-tango-brass/25 rounded-sm overflow-hidden">
      {/* 헤더 */}
      {(roundInfo || highlight) && (
        <div className="bg-tango-brass/10 border-b border-tango-brass/20 px-3 py-2 flex flex-wrap items-center gap-2">
          {roundInfo && (
            <>
              {roundInfo.year && (
                <span className="font-display text-lg text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {roundInfo.year}
                </span>
              )}
              <span className="text-xs text-tango-paper font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {roundInfo.competition} · {roundInfo.stage === 'final' ? '결승' : roundInfo.stage === 'semifinal' ? '준결승' : '예선'}
                {roundInfo.ronda ? ` · R${roundInfo.ronda}` : ''}
                {roundInfo.group ? ` · ${roundInfo.group}조` : ''}
              </span>
            </>
          )}
          {highlight && (
            <span className="ml-auto text-[11px] bg-tango-rose/20 text-tango-rose rounded-sm px-2 py-0.5 font-semibold">
              {highlight}
            </span>
          )}
        </div>
      )}

      {/* 영상 + 메타 레이아웃: 데스크톱 가로, 모바일 세로 */}
      <div className="flex flex-col lg:flex-row">
        {/* 영상 (2/3) */}
        <div className="lg:w-2/3 relative bg-black" style={{ aspectRatio: '16 / 9' }}>
          <iframe
            ref={iframeRef}
            className="absolute inset-0 w-full h-full"
            src={videoUrl}
            title={video.title || 'Tagged video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* 메타 정보 패널 (1/3) */}
        <div className="lg:w-1/3 flex flex-col max-h-[360px] lg:max-h-none">
          {/* 탭 */}
          <div className="flex border-b border-tango-brass/20 bg-tango-ink/50">
            {songs.length > 0 && (
              <TabButton active={activeTab === 'songs'} onClick={() => setActiveTab('songs')}>
                🎵 곡 <span className="text-[10px] opacity-60 ml-1">{songs.length}</span>
              </TabButton>
            )}
            {participants.length > 0 && (
              <TabButton active={activeTab === 'participants'} onClick={() => setActiveTab('participants')}>
                👥 참가자 <span className="text-[10px] opacity-60 ml-1">{participants.length}</span>
              </TabButton>
            )}
            {judges.length > 0 && (
              <TabButton active={activeTab === 'judges'} onClick={() => setActiveTab('judges')}>
                ⚖ 심사 <span className="text-[10px] opacity-60 ml-1">{judges.length}</span>
              </TabButton>
            )}
            <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')}>
              📝 메모 {annotations.length > 0 && <span className="text-[10px] opacity-60 ml-1">{annotations.length}</span>}
            </TabButton>
          </div>

          {/* 탭 내용 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeTab === 'songs' && (
              <SongsList songs={songs} onSeek={seekTo} timestamps={songTimestampByOrder} />
            )}
            {activeTab === 'participants' && (
              <ParticipantsList participants={sortedParticipants} advanceBadge={advanceBadge} />
            )}
            {activeTab === 'judges' && (
              <JudgesList judges={judges} myScores={myJudgeScores} />
            )}
            {activeTab === 'notes' && (
              <NotesPanel
                annotations={annotations}
                onSeek={seekTo}
                onAdd={addAnnotation}
                onDelete={deleteAnnotation}
              />
            )}
          </div>
        </div>
      </div>

      {/* 푸터: 채널 정보 */}
      {video.channel && (
        <div className="px-3 py-1.5 border-t border-tango-brass/15 text-[10px] text-tango-cream/50 flex items-center justify-between">
          <span>📺 {video.channel}</span>
          <a
            href={`https://www.youtube.com/watch?v=${video.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-tango-brass hover:underline"
          >
            YouTube 에서 열기 →
          </a>
        </div>
      )}
    </div>
  );
}

function TabButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-2 py-2 text-[11px] font-sans transition-colors ${
        active ? 'text-tango-brass border-b-2 border-tango-brass bg-tango-brass/5' : 'text-tango-cream/60 hover:text-tango-cream'
      }`}
    >
      {children}
    </button>
  );
}

function SongsList({ songs, onSeek, timestamps }: { songs: VideoSong[]; onSeek?: (sec: number) => void; timestamps?: Map<number, number> }) {
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };
  return (
    <div className="space-y-1.5">
      {songs.map((s, i) => {
        const order = s.order ?? i + 1;
        const ts = timestamps?.get(order);
        return (
          <div key={i} className="bg-white/5 rounded-sm p-2 text-xs">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-sm text-tango-brass/60 font-bold flex-shrink-0" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {order}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  {s.song_id && !s.song_id.startsWith('UNMATCHED') ? (
                    <Link to={`/song/${s.song_id}`} className="font-serif italic text-tango-paper hover:text-tango-brass truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {s.title}
                    </Link>
                  ) : (
                    <div className="font-serif italic text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {s.title}
                    </div>
                  )}
                  {ts !== undefined && onSeek && (
                    <button
                      onClick={() => onSeek(ts)}
                      className="ml-auto flex-shrink-0 text-[10px] bg-tango-brass/20 hover:bg-tango-brass/40 text-tango-brass rounded-sm px-1.5 py-0.5 font-mono"
                      title={`${formatTime(ts)} 지점으로 점프`}
                    >
                      ▶ {formatTime(ts)}
                    </button>
                  )}
                </div>
                {s.orchestra && (
                  <div className="text-[10px] text-tango-cream/50 truncate">
                    {s.orchestra}{s.vocalist ? ` · ${s.vocalist}` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ParticipantsList({ participants, advanceBadge }: { participants: VideoParticipant[]; advanceBadge: Record<string, string> }) {
  return (
    <div className="space-y-1">
      {participants.map(p => (
        <div
          key={p.pareja}
          className={`rounded-sm p-2 text-[11px] ${
            p.isMyCouple ? 'bg-tango-brass/20 border border-tango-brass/50' : 'bg-white/5'
          }`}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] opacity-60">{advanceBadge[p.advancedTo ?? 'none']}</span>
            <span className="font-mono text-tango-brass font-bold w-10 flex-shrink-0">#{p.pareja}</span>
            <span className={`font-serif italic truncate flex-1 ${p.isMyCouple ? 'text-tango-paper font-semibold' : 'text-tango-cream/80'}`} style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              {p.leader} & {p.follower}
              {p.isMyCouple && <span className="ml-1 text-tango-brass">(우리)</span>}
            </span>
            {p.rank && (
              <span className="text-[10px] text-tango-brass/80 flex-shrink-0">{p.rank}위</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesPanel({
  annotations,
  onSeek,
  onAdd,
  onDelete,
}: {
  annotations: VideoAnnotation[];
  onSeek: (sec: number) => void;
  onAdd: (sec: number, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState('');
  const [secInput, setSecInput] = useState('');

  const parseSec = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.includes(':')) {
      const [m, s] = trimmed.split(':').map(Number);
      if (isNaN(m) || isNaN(s)) return null;
      return m * 60 + s;
    }
    const n = Number(trimmed);
    return isNaN(n) ? null : n;
  };

  const handleAdd = () => {
    const sec = parseSec(secInput);
    if (sec === null || !text.trim()) return;
    onAdd(sec, text);
    setText('');
    setSecInput('');
  };

  return (
    <div className="space-y-2">
      {/* 입력 폼 */}
      <div className="bg-tango-brass/10 border border-tango-brass/25 rounded-sm p-2 space-y-1.5">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={secInput}
            onChange={e => setSecInput(e.target.value)}
            placeholder="0:34"
            className="w-16 bg-tango-ink border border-tango-brass/30 rounded-sm px-2 py-1 text-tango-paper text-xs font-mono focus:outline-none focus:border-tango-brass"
          />
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="메모 (예: 발 위치 좋음)"
            className="flex-1 min-w-0 bg-tango-ink border border-tango-brass/30 rounded-sm px-2 py-1 text-tango-paper text-xs focus:outline-none focus:border-tango-brass"
          />
          <button
            onClick={handleAdd}
            disabled={!text.trim() || parseSec(secInput) === null}
            className="px-2 py-1 text-[10px] bg-tango-brass/30 hover:bg-tango-brass/50 disabled:opacity-30 text-tango-brass rounded-sm font-sans"
          >
            추가
          </button>
        </div>
        <div className="text-[9px] text-tango-cream/40">
          타임스탬프 형식: <code className="text-tango-brass">0:34</code> 또는 <code className="text-tango-brass">34</code> (초)
        </div>
      </div>

      {/* 주석 목록 */}
      {annotations.length === 0 ? (
        <div className="text-center text-[11px] text-tango-cream/40 py-6 font-serif italic">
          이 영상에 메모가 없습니다.<br />위에서 첫 메모를 추가해보세요.
        </div>
      ) : (
        annotations.map(a => (
          <div key={a.id} className="bg-white/5 rounded-sm p-2 text-xs flex items-start gap-2">
            <button
              onClick={() => onSeek(a.sec)}
              className="flex-shrink-0 text-[10px] bg-tango-brass/20 hover:bg-tango-brass/40 text-tango-brass rounded-sm px-1.5 py-0.5 font-mono"
              title={`${fmtTime(a.sec)} 지점으로 점프`}
            >
              ▶ {fmtTime(a.sec)}
            </button>
            <div className="flex-1 min-w-0 font-serif italic text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              {a.text}
            </div>
            <button
              onClick={() => onDelete(a.id)}
              className="flex-shrink-0 text-tango-cream/30 hover:text-tango-rose text-[14px] leading-none"
              title="삭제"
            >
              ×
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function JudgesList({ judges, myScores }: { judges: string[]; myScores: Record<string, number> }) {
  return (
    <div className="space-y-1">
      {judges.map((j, i) => {
        const myScore = myScores[j];
        return (
          <div key={i} className="bg-white/5 rounded-sm p-2 text-xs flex items-baseline justify-between gap-2">
            <span className="font-serif italic text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              {j}
            </span>
            {myScore !== undefined && (
              <span className="font-mono text-sm text-tango-brass font-bold flex-shrink-0">
                {myScore.toFixed(1)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
