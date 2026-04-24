// 태그 영상 플레이어 — 영상 재생 시 곡/참가자/심사위원 메타 정보 패널 동시 표시
// 재사용 가능: Command Center · TandaLab · SongDetail 등
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState<'songs' | 'participants' | 'judges'>(
    songs.length > 0 ? 'songs' : participants.length > 0 ? 'participants' : 'judges'
  );

  const videoUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('rel', '0');
    params.set('modestbranding', '1');
    if (autoPlay) params.set('autoplay', '1');
    if (video.start_sec) params.set('start', String(video.start_sec));
    return `https://www.youtube.com/embed/${video.video_id}?${params.toString()}`;
  }, [video.video_id, video.start_sec, autoPlay]);

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
          </div>

          {/* 탭 내용 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeTab === 'songs' && (
              <SongsList songs={songs} />
            )}
            {activeTab === 'participants' && (
              <ParticipantsList participants={sortedParticipants} advanceBadge={advanceBadge} />
            )}
            {activeTab === 'judges' && (
              <JudgesList judges={judges} myScores={myJudgeScores} />
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

function SongsList({ songs }: { songs: VideoSong[] }) {
  return (
    <div className="space-y-1.5">
      {songs.map((s, i) => (
        <div key={i} className="bg-white/5 rounded-sm p-2 text-xs">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-sm text-tango-brass/60 font-bold flex-shrink-0" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {s.order ?? i + 1}
            </span>
            <div className="flex-1 min-w-0">
              {s.song_id && !s.song_id.startsWith('UNMATCHED') ? (
                <Link to={`/song/${s.song_id}`} className="font-serif italic text-tango-paper hover:text-tango-brass truncate block" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  {s.title}
                </Link>
              ) : (
                <div className="font-serif italic text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  {s.title}
                </div>
              )}
              {s.orchestra && (
                <div className="text-[10px] text-tango-cream/50 truncate">
                  {s.orchestra}{s.vocalist ? ` · ${s.vocalist}` : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
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
