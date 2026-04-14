import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import mundialData from '../data/mundial_results.json';
import roundsData from '../data/competition_rounds.json';

// --- 문디알 타입 ---
interface MundialCouple {
  pareja: number;
  leader: string;
  follower: string;
  scores: Record<string, number>;
  promedio: number;
  rank: number;
  ronda?: number;
}

interface MundialGroup {
  date?: string;
  judges: string[];
  total_couples: number;
  couples: MundialCouple[];
}

interface MundialStageGrouped {
  description?: string;
  groups: Record<string, MundialGroup>;
}

interface MundialStageDirect {
  date?: string;
  judges?: string[];
  total_couples?: number;
  couples: MundialCouple[];
}

interface MundialFinal {
  date?: string;
  judges: string[];
  general: { total_couples: number; couples: MundialCouple[] };
  senior: { total_couples: number; couples: MundialCouple[] };
}

type MundialStage = MundialStageGrouped | MundialStageDirect | MundialFinal;

interface MundialYear {
  competition: string;
  category: string;
  stages: Record<string, MundialStage>;
}

// --- 론다 타입 ---
interface RoundSong {
  song_id: string;
  title: string;
  orchestra: string;
  order: number;
}

interface RoundVideo {
  video_id: string;
  url: string;
  channel: string;
  title: string;
}

interface CompetitionRound {
  round_id: string;
  competition: string;
  competition_id: string;
  year: number;
  category: string;
  stage: string;
  ronda_number: number;
  songs: RoundSong[];
  videos: RoundVideo[];
}

const mundial = mundialData as Record<string, MundialYear>;
const allRounds = (roundsData as { rounds: CompetitionRound[] }).rounds;

const STAGE_LABELS: Record<string, string> = {
  clasificatoria: '예선',
  cuartos: '8강',
  semifinal: '준결승',
  final: '결승',
};

const STAGE_LABELS_FULL: Record<string, string> = {
  clasificatoria: '예선 (Clasificatoria)',
  cuartos: '8강 (Cuartos)',
  semifinal: '준결승 (Semifinal)',
  final: '결승 (Final)',
};

const STAGE_ORDER = ['clasificatoria', 'cuartos', 'semifinal', 'final'];
const STAGE_COLORS: Record<string, string> = {
  clasificatoria: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cuartos: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  semifinal: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  final: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const MEDAL_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];

// 문디알 대회 영상 (공식 채널 + 유명 채널)
const MUNDIAL_VIDEOS: Record<string, Record<string, { video_id: string; title: string; channel: string }[]>> = {
  '2025': {
    final: [
      { video_id: 'YnYEyMzEfag', title: 'Final Completa - Diego Ortega & Aldana Silveyra campeones', channel: 'Jose Valverde' },
      { video_id: 'aSdv8UksKDk', title: 'Final Ronda 1', channel: 'AiresDeMilonga' },
      { video_id: 'Y8Be_TfRmuo', title: 'Final Ronda 2', channel: 'AiresDeMilonga' },
      { video_id: 'tDzRQZwhBFw', title: 'Final Ronda 3', channel: 'AiresDeMilonga' },
      { video_id: 'HlMIJitndyc', title: 'Final Ronda 4', channel: 'AiresDeMilonga' },
      { video_id: 'pkGFeQeNP3k', title: 'Final Ronda 5 - Campeones', channel: 'AiresDeMilonga' },
    ],
    semifinal: [
      { video_id: 'YK0o6DgB6X8', title: 'Semifinal Ronda 1', channel: 'AiresDeMilonga' },
      { video_id: 'BT6MWQQhFd8', title: 'Semifinal Ronda 2', channel: 'AiresDeMilonga' },
      { video_id: '2Rwu12kDR3o', title: 'Semifinal Ronda 3', channel: 'AiresDeMilonga' },
      { video_id: 'J2aG0o0_T_w', title: 'Semifinal Ronda 4', channel: 'AiresDeMilonga' },
      { video_id: '2YL4PaMDSD0', title: 'Semifinal Ronda 5', channel: 'AiresDeMilonga' },
      { video_id: 'KZ74jdSLkYY', title: 'Semifinal Ronda 6', channel: 'AiresDeMilonga' },
      { video_id: 'EDeYukl46Nk', title: 'Semifinal Ronda 7', channel: 'AiresDeMilonga' },
      { video_id: 'uwLtnWlCU_U', title: 'Semifinal Ronda 8', channel: 'AiresDeMilonga' },
      { video_id: 'sOGN9OZh4do', title: 'Semifinal Ronda 9', channel: 'AiresDeMilonga' },
      { video_id: 'NL65CxSD0_c', title: 'Semifinal Ronda 10', channel: 'AiresDeMilonga' },
      { video_id: 'bcDvXYCSJ_k', title: 'Semifinal Ronda 11', channel: 'AiresDeMilonga' },
      { video_id: 'AbV3n-VkZU0', title: 'Semifinal Ronda 12', channel: 'AiresDeMilonga' },
      { video_id: 'S1HemLlHyzQ', title: 'Semifinal Ronda 13', channel: 'AiresDeMilonga' },
      { video_id: 'VPZa_qgJkoI', title: 'Semifinal Ronda 14', channel: 'AiresDeMilonga' },
      { video_id: 'c0Qgmv5FNU8', title: 'Semifinal Ronda 15', channel: 'AiresDeMilonga' },
      { video_id: 'gmQQPA_qbGs', title: 'Semifinal Ronda 16', channel: 'AiresDeMilonga' },
    ],
    clasificatoria: [
      { video_id: 'z3Ko1P6gosg', title: 'Clasificatoria Ronda 1', channel: 'AiresDeMilonga' },
      { video_id: 'wLqod_WOpWU', title: 'Clasificatoria Ronda 2', channel: 'AiresDeMilonga' },
      { video_id: 'G44JhXuNjVY', title: 'Clasificatoria Ronda 3', channel: 'AiresDeMilonga' },
      { video_id: '1doo7h-f02Y', title: 'Clasificatoria Ronda 4', channel: 'AiresDeMilonga' },
      { video_id: 'Trg6H7AAOmk', title: 'Clasificatoria Ronda 5', channel: 'AiresDeMilonga' },
      { video_id: 'cd6O-i2MQCM', title: 'Clasificatoria Ronda 6', channel: 'AiresDeMilonga' },
      { video_id: 'EG18_3upbuc', title: 'Clasificatoria Ronda 7', channel: 'AiresDeMilonga' },
      { video_id: '8xN478ZMfOU', title: 'Clasificatoria Ronda 8', channel: 'AiresDeMilonga' },
      { video_id: '2HfXNMW7hLg', title: 'Clasificatoria Ronda 9', channel: 'AiresDeMilonga' },
      { video_id: 'EtPAJJAWhyc', title: 'Clasificatoria Ronda 10', channel: 'AiresDeMilonga' },
      { video_id: 'ogb57pxO4U4', title: 'Clasificatoria Ronda 11', channel: 'AiresDeMilonga' },
      { video_id: 'Q2-HETuBtpo', title: 'Clasificatoria Ronda 12', channel: 'AiresDeMilonga' },
      { video_id: 'sfJz3PdDEqA', title: 'Clasificatoria Ronda 13', channel: 'AiresDeMilonga' },
      { video_id: 'epirzaGi72A', title: 'Clasificatoria Ronda 14', channel: 'AiresDeMilonga' },
      { video_id: 'BTVvHz0-gaM', title: 'Clasificatoria Ronda 15', channel: 'AiresDeMilonga' },
      { video_id: '0eOU9vpskHs', title: 'Clasificatoria Ronda 16', channel: 'AiresDeMilonga' },
      { video_id: 'hqQm5P9bClI', title: 'Clasificatoria Ronda 17', channel: 'AiresDeMilonga' },
      { video_id: 'LZJMHtLHwhg', title: 'Clasificatoria Ronda 18', channel: 'AiresDeMilonga' },
      { video_id: 'xVMtRSEFnFw', title: 'Clasificatoria Ronda 19', channel: 'AiresDeMilonga' },
      { video_id: 'XRlxV5iNRa8', title: 'Clasificatoria Ronda 20', channel: 'AiresDeMilonga' },
      { video_id: '4kzoYP-vFps', title: 'Clasificatoria Ronda 21', channel: 'AiresDeMilonga' },
      { video_id: '7wzoCSNbUyM', title: 'Clasificatoria Ronda 22', channel: 'AiresDeMilonga' },
      { video_id: 'vDschfFE2Xo', title: 'Clasificatoria Ronda 23', channel: 'AiresDeMilonga' },
      { video_id: 'jIz8eRc2D24', title: 'Clasificatoria Ronda 24', channel: 'AiresDeMilonga' },
      { video_id: 'Er7zMDuy1Nk', title: 'Clasificatoria Ronda 25', channel: 'AiresDeMilonga' },
      { video_id: 'ibC6EVIZws0', title: 'Clasificatoria Ronda 26', channel: 'AiresDeMilonga' },
      { video_id: '-DchFarDGzc', title: 'Clasificatoria Ronda 27', channel: 'AiresDeMilonga' },
    ],
  },
};

// --- 선수 여정 추적 ---
interface JourneyStage {
  stage: string;
  group?: string;
  rank: number;
  totalCouples: number;
  promedio: number;
  scores: Record<string, number>;
  judges: string[];
}

interface CoupleJourney {
  leader: string;
  follower: string;
  pareja: number;
  finalRank: number;
  stages: JourneyStage[];
}

// --- 대회 영상 섹션 (접기/펼치기) ---
function MundialVideoSection({ mundialVideos }: { mundialVideos: Record<string, { video_id: string; title: string; channel: string }[]> }) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const availableStages = STAGE_ORDER.filter(s => mundialVideos[s]);

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <div className="text-xs text-gray-500 mb-2">
        대회 영상 ({availableStages.reduce((sum, s) => sum + mundialVideos[s].length, 0)}개)
      </div>
      <div className="space-y-2">
        {availableStages.map(s => {
          const videos = mundialVideos[s];
          const isExpanded = expandedStage === s;
          return (
            <div key={s}>
              <button
                onClick={() => setExpandedStage(isExpanded ? null : s)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs border transition-colors ${STAGE_COLORS[s]}`}
              >
                <span className="font-medium">{STAGE_LABELS[s]} ({videos.length}개 영상)</span>
                <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {isExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 mt-1.5 pl-2">
                  {videos.map(v => (
                    <a
                      key={v.video_id}
                      href={`https://www.youtube.com/watch?v=${v.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                    >
                      <span className="text-secretary-gold">▶</span>
                      <span className="truncate">{v.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildJourneys(yearData: MundialYear, isSenior: boolean): CoupleJourney[] {
  const final = yearData.stages.final as MundialFinal;
  const finalists = isSenior ? final.senior?.couples ?? [] : final.general?.couples ?? [];

  return finalists.map(finalist => {
    const journey: CoupleJourney = {
      leader: finalist.leader,
      follower: finalist.follower,
      pareja: finalist.pareja,
      finalRank: finalist.rank,
      stages: [],
    };

    // 각 스테이지에서 이 선수 찾기
    for (const stageName of STAGE_ORDER) {
      const stage = yearData.stages[stageName];
      if (!stage) continue;

      if (stageName === 'final') {
        journey.stages.push({
          stage: stageName,
          rank: finalist.rank,
          totalCouples: (isSenior ? final.senior : final.general)?.total_couples ?? 0,
          promedio: finalist.promedio,
          scores: finalist.scores,
          judges: final.judges ?? [],
        });
        continue;
      }

      // 그룹이 있는 스테이지 (예선, 8강)
      if ('groups' in stage && stage.groups) {
        const grouped = stage as MundialStageGrouped;
        for (const [groupName, group] of Object.entries(grouped.groups)) {
          const found = group.couples.find(c => c.pareja === finalist.pareja || c.leader === finalist.leader);
          if (found) {
            journey.stages.push({
              stage: stageName,
              group: groupName,
              rank: found.rank,
              totalCouples: group.total_couples,
              promedio: found.promedio,
              scores: found.scores,
              judges: group.judges ?? [],
            });
            break;
          }
        }
      }
      // 직접 couples (준결승)
      else if ('couples' in stage && Array.isArray((stage as MundialStageDirect).couples)) {
        const direct = stage as MundialStageDirect;
        const found = direct.couples.find(c => c.pareja === finalist.pareja || c.leader === finalist.leader);
        if (found) {
          journey.stages.push({
            stage: stageName,
            rank: found.rank,
            totalCouples: direct.total_couples ?? direct.couples.length,
            promedio: found.promedio,
            scores: found.scores,
            judges: direct.judges ?? [],
          });
        }
      }
    }

    return journey;
  });
}

export function CompetitionResultsPage() {
  const years = useMemo(() => Object.keys(mundial).sort((a, b) => Number(b) - Number(a)), []);
  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [selectedStage, setSelectedStage] = useState('final');
  const [expandedCouple, setExpandedCouple] = useState<number | null>(null);
  const [showSenior, setShowSenior] = useState(false);
  const [topN, setTopN] = useState(20);
  const [viewMode, setViewMode] = useState<'stages' | 'journey'>('journey');

  const yearData = mundial[selectedYear];
  const stages = useMemo(
    () => STAGE_ORDER.filter(s => yearData?.stages[s]),
    [yearData]
  );

  const journeys = useMemo(
    () => yearData ? buildJourneys(yearData, showSenior) : [],
    [yearData, showSenior]
  );

  // KTC
  const ktcYears = useMemo(() => {
    const yrs = new Set(allRounds.map(r => r.year));
    return Array.from(yrs).sort((a, b) => b - a);
  }, []);

  const [selectedTab, setSelectedTab] = useState<'mundial' | 'ktc'>('mundial');
  const [selectedKtcYear, setSelectedKtcYear] = useState(ktcYears[0] || 2026);

  const ktcRounds = useMemo(() => {
    return allRounds
      .filter(r => r.year === selectedKtcYear)
      .sort((a, b) => {
        const stageOrd: Record<string, number> = { final: 0, semifinal: 1, quarterfinal: 2, qualifying: 3 };
        const sa = stageOrd[a.stage] ?? 4;
        const sb = stageOrd[b.stage] ?? 4;
        if (sa !== sb) return sa - sb;
        return a.ronda_number - b.ronda_number;
      });
  }, [selectedKtcYear]);

  const CATEGORY_LABELS: Record<string, string> = {
    pista: '피스타', vals: '발스', milonga: '밀롱가',
    pista_senior: '시니어', pista_newstar: '뉴스타',
    pista_singles_newstar: '싱글즈 뉴스타', pista_singles_general: '싱글즈',
    pista_singles_senior: '싱글즈 시니어',
  };

  const KTC_STAGE_LABELS: Record<string, string> = {
    final: '결승', semifinal: '준결승', quarterfinal: '8강', qualifying: '예선',
  };

  const mundialVideos = MUNDIAL_VIDEOS[selectedYear] ?? {};

  return (
    <>
      <header className="h-14 border-b border-secretary-gold/20 flex items-center px-5 flex-shrink-0">
        <Link to="/tango" className="text-gray-400 hover:text-secretary-gold text-sm mr-3">← 목록</Link>
        <h2 className="text-sm font-semibold text-gray-300">대회 순위</h2>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-5 space-y-5">

          {/* 탭: 문디알 vs KTC */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTab('mundial')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'mundial'
                  ? 'bg-secretary-gold text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Mundial de Tango
            </button>
            <button
              onClick={() => setSelectedTab('ktc')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'ktc'
                  ? 'bg-secretary-gold text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              KTC (Korea Tango Championship)
            </button>
          </div>

          {selectedTab === 'mundial' && yearData && (
            <>
              {/* 헤더 + 영상 */}
              <div className="bg-white/5 rounded-xl border border-secretary-gold/10 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-white mb-1">{yearData.competition}</h1>
                    <p className="text-secretary-gold text-sm">{yearData.category}</p>
                  </div>
                </div>
                {/* 대회 영상 링크 */}
                {Object.keys(mundialVideos).length > 0 && (
                  <MundialVideoSection mundialVideos={mundialVideos} />
                )}
              </div>

              {/* 연도 + 뷰모드 */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex gap-1.5">
                  {years.map(y => (
                    <button
                      key={y}
                      onClick={() => { setSelectedYear(y); setSelectedStage('final'); setExpandedCouple(null); setTopN(20); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedYear === y
                          ? 'bg-secretary-gold text-black'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setViewMode('journey')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      viewMode === 'journey' ? 'bg-secretary-gold/20 text-secretary-gold font-medium' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    선수별 여정
                  </button>
                  <button
                    onClick={() => setViewMode('stages')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      viewMode === 'stages' ? 'bg-secretary-gold/20 text-secretary-gold font-medium' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    스테이지별
                  </button>
                </div>
              </div>

              {/* 일반/시니어 토글 (양쪽 뷰 공통) */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => { setShowSenior(false); setExpandedCouple(null); }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    !showSenior ? 'bg-white/20 text-white font-medium' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  일반
                </button>
                <button
                  onClick={() => { setShowSenior(true); setExpandedCouple(null); }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    showSenior ? 'bg-white/20 text-white font-medium' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  시니어
                </button>
              </div>

              {viewMode === 'journey' ? (
                <JourneyView
                  journeys={journeys}
                  stages={stages}
                  expandedCouple={expandedCouple}
                  setExpandedCouple={setExpandedCouple}
                  topN={topN}
                  setTopN={setTopN}
                  mundialVideos={mundialVideos}
                />
              ) : (
                <>
                  {/* 스테이지 선택 */}
                  <div className="flex gap-1.5 flex-wrap">
                    {stages.map(s => (
                      <button
                        key={s}
                        onClick={() => { setSelectedStage(s); setExpandedCouple(null); setTopN(20); }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedStage === s
                            ? 'bg-white/20 text-white font-medium'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {STAGE_LABELS_FULL[s] ?? s}
                      </button>
                    ))}
                  </div>

                  {/* 해당 스테이지 영상 */}
                  {mundialVideos[selectedStage] && (
                    <div className="flex flex-wrap gap-2">
                      {mundialVideos[selectedStage].map(v => (
                        <a
                          key={v.video_id}
                          href={`https://www.youtube.com/watch?v=${v.video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-secretary-gold/10 hover:bg-secretary-gold/20 text-secretary-gold rounded-lg transition-colors"
                        >
                          ▶ {v.title}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* 스테이지 내용 */}
                  {selectedStage === 'final' ? (
                    <FinalView
                      stage={yearData.stages.final as MundialFinal}
                      showSenior={showSenior}
                      expandedCouple={expandedCouple}
                      setExpandedCouple={setExpandedCouple}
                      topN={topN}
                      setTopN={setTopN}
                    />
                  ) : (
                    <StageView
                      stage={yearData.stages[selectedStage] as MundialStageGrouped | MundialStageDirect}
                      expandedCouple={expandedCouple}
                      setExpandedCouple={setExpandedCouple}
                      topN={topN}
                      setTopN={setTopN}
                    />
                  )}
                </>
              )}
            </>
          )}

          {selectedTab === 'ktc' && (
            <>
              <div className="flex gap-1.5">
                {ktcYears.map(y => (
                  <button
                    key={y}
                    onClick={() => setSelectedKtcYear(y)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedKtcYear === y
                        ? 'bg-secretary-gold text-black'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {ktcRounds.length === 0 && (
                  <p className="text-gray-500 text-sm">이 연도의 라운드 데이터가 없습니다.</p>
                )}
                {ktcRounds.map(round => (
                  <div key={round.round_id} className="bg-white/5 rounded-xl border border-secretary-gold/10 overflow-hidden">
                    <div className="px-4 py-3 flex items-center gap-2 border-b border-white/5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        round.stage === 'final' ? 'bg-red-500/20 text-red-400' :
                        round.stage === 'semifinal' ? 'bg-orange-500/20 text-orange-400' :
                        round.stage === 'quarterfinal' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {KTC_STAGE_LABELS[round.stage] ?? round.stage}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secretary-gold/20 text-secretary-gold">
                        {CATEGORY_LABELS[round.category] ?? round.category}
                      </span>
                      {round.ronda_number > 0 && (
                        <span className="text-xs text-gray-500">Ronda {round.ronda_number}</span>
                      )}
                    </div>

                    <div className="px-4 py-3 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {round.songs.map(s => (
                          <Link
                            key={s.song_id}
                            to={`/song/${s.song_id}`}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                          >
                            <span className="text-secretary-gold font-bold">{s.order}</span>
                            <span>{s.title}</span>
                            <span className="text-gray-500">· {(s.orchestra || '').split(' ').slice(0, 2).join(' ') || '미확인'}</span>
                          </Link>
                        ))}
                      </div>

                      {round.videos.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {round.videos.map(v => (
                            <a
                              key={v.video_id}
                              href={v.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-secretary-gold/10 hover:bg-secretary-gold/20 text-secretary-gold rounded-lg transition-colors"
                            >
                              ▶ {v.channel}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// --- 선수별 여정 뷰 ---
function JourneyView({
  journeys,
  stages,
  expandedCouple,
  setExpandedCouple,
  topN,
  setTopN,
  mundialVideos,
}: {
  journeys: CoupleJourney[];
  stages: string[];
  expandedCouple: number | null;
  setExpandedCouple: (v: number | null) => void;
  topN: number;
  setTopN: (v: number) => void;
  mundialVideos: Record<string, { video_id: string; title: string; channel: string }[]>;
}) {
  const shown = journeys.slice(0, topN);

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500">
        결승 순위 기준 · 클릭하면 각 스테이지별 상세 점수 확인
      </div>

      {shown.map(j => {
        const isExpanded = expandedCouple === j.pareja;
        return (
          <div
            key={j.pareja}
            className="bg-white/5 rounded-xl border border-secretary-gold/10 overflow-hidden"
          >
            {/* 선수 헤더 */}
            <button
              onClick={() => setExpandedCouple(isExpanded ? null : j.pareja)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
            >
              <div className={`w-8 text-center font-bold text-lg flex-shrink-0 ${
                j.finalRank <= 3 ? MEDAL_COLORS[j.finalRank - 1] : 'text-gray-500'
              }`}>
                {j.finalRank <= 3 ? ['🥇', '🥈', '🥉'][j.finalRank - 1] : j.finalRank}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">
                  <span className="text-secretary-gold/60 text-xs font-mono mr-1.5">#{j.pareja}</span>
                  {j.leader}
                </div>
                <div className="text-xs text-gray-400 truncate">& {j.follower}</div>
              </div>

              {/* 미니 여정 바 */}
              <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                {stages.map((s, i) => {
                  const stageData = j.stages.find(st => st.stage === s);
                  return (
                    <div key={s} className="flex items-center gap-1">
                      {i > 0 && <span className="text-gray-600 text-[10px]">→</span>}
                      <div className={`text-[10px] px-1.5 py-0.5 rounded ${
                        stageData
                          ? STAGE_COLORS[s]
                          : 'bg-white/5 text-gray-600'
                      }`}>
                        {stageData ? `${stageData.rank}위` : '-'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <span className={`text-gray-500 text-xs transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* 상세 여정 */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {/* 스테이지 타임라인 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {stages.map(s => {
                    const stageData = j.stages.find(st => st.stage === s);
                    if (!stageData) {
                      return (
                        <div key={s} className="bg-black/20 rounded-lg p-3 opacity-40">
                          <div className="text-xs text-gray-500 mb-1">{STAGE_LABELS[s]}</div>
                          <div className="text-gray-600 text-sm">데이터 없음</div>
                        </div>
                      );
                    }

                    return (
                      <div key={s} className={`rounded-lg p-3 border ${STAGE_COLORS[s]} bg-opacity-50`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">{STAGE_LABELS[s]}</span>
                          {stageData.group && (
                            <span className="text-[10px] opacity-70">그룹 {stageData.group}</span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-2xl font-bold">{stageData.rank}</span>
                          <span className="text-xs opacity-70">/ {stageData.totalCouples}팀</span>
                        </div>
                        <div className="text-sm font-mono">{stageData.promedio.toFixed(3)}</div>

                        {/* 심사위원별 점수 */}
                        <div className="mt-2 pt-2 border-t border-white/10 space-y-0.5">
                          {Object.entries(stageData.scores)
                            .sort((a, b) => b[1] - a[1])
                            .map(([judge, score]) => {
                              const diff = score - stageData.promedio;
                              return (
                                <div key={judge} className="flex items-center justify-between text-[10px]">
                                  <span className="truncate mr-1 opacity-70">{judge.split(' ').slice(-1)[0]}</span>
                                  <span className={`font-mono ${
                                    diff > 0.3 ? 'text-green-400' :
                                    diff < -0.3 ? 'text-red-400' :
                                    'opacity-90'
                                  }`}>
                                    {score.toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                        </div>

                        {/* 영상 링크 */}
                        {mundialVideos[s] && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            {mundialVideos[s].map(v => (
                              <a
                                key={v.video_id}
                                href={`https://www.youtube.com/watch?v=${v.video_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-secretary-gold hover:underline"
                              >
                                ▶ 영상 보기
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 점수 변화 요약 */}
                {j.stages.length >= 2 && (
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">점수 추이</div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {j.stages.map((s, i) => (
                        <div key={s.stage} className="flex items-center gap-1">
                          {i > 0 && (
                            <span className={`text-xs ${
                              s.promedio > j.stages[i - 1].promedio ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {s.promedio > j.stages[i - 1].promedio ? '↑' : '↓'}
                              {Math.abs(s.promedio - j.stages[i - 1].promedio).toFixed(3)}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{STAGE_LABELS[s.stage]}</span>
                          <span className="text-sm font-mono text-white">{s.promedio.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {topN < journeys.length && (
        <button
          onClick={() => setTopN(topN + 20)}
          className="w-full py-2 text-sm text-secretary-gold hover:bg-white/5 rounded-lg transition-colors"
        >
          더 보기 (현재 {topN}팀 / 전체 {journeys.length}팀)
        </button>
      )}
    </div>
  );
}

// --- 결승 뷰 (스테이지별) ---
function FinalView({
  stage,
  showSenior,
  expandedCouple,
  setExpandedCouple,
  topN,
  setTopN,
}: {
  stage: MundialFinal;
  showSenior: boolean;
  expandedCouple: number | null;
  setExpandedCouple: (v: number | null) => void;
  topN: number;
  setTopN: (v: number) => void;
}) {
  const data = showSenior ? stage.senior : stage.general;
  const couples = data?.couples ?? [];
  const totalCouples = data?.total_couples ?? couples.length;
  const judges = stage.judges ?? [];
  const shown = couples.slice(0, topN);

  return (
    <div className="space-y-4">
      {judges.length > 0 && (
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1.5">심사위원 ({judges.length}명)</div>
          <div className="flex flex-wrap gap-2">
            {judges.map(j => (
              <span key={j} className="text-xs px-2 py-1 bg-white/5 rounded-full text-gray-300">{j}</span>
            ))}
          </div>
        </div>
      )}

      <RankingTable
        couples={shown}
        totalCouples={totalCouples}
        expandedCouple={expandedCouple}
        setExpandedCouple={setExpandedCouple}
      />

      {topN < couples.length && (
        <button
          onClick={() => setTopN(topN + 20)}
          className="w-full py-2 text-sm text-secretary-gold hover:bg-white/5 rounded-lg transition-colors"
        >
          더 보기 (현재 {topN}팀 / 전체 {couples.length}팀)
        </button>
      )}
    </div>
  );
}

// --- 예선/8강/준결승 뷰 ---
function StageView({
  stage,
  expandedCouple,
  setExpandedCouple,
  topN,
  setTopN,
}: {
  stage: MundialStageGrouped | MundialStageDirect;
  expandedCouple: number | null;
  setExpandedCouple: (v: number | null) => void;
  topN: number;
  setTopN: (v: number) => void;
}) {
  const isGrouped = 'groups' in stage && stage.groups;
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (isGrouped) {
    const grouped = stage as MundialStageGrouped;
    const groupKeys = Object.keys(grouped.groups).sort();
    const activeGroup = selectedGroup ?? groupKeys[0];
    const group = grouped.groups[activeGroup];
    const couples = group?.couples ?? [];
    const shown = couples.slice(0, topN);

    return (
      <div className="space-y-4">
        {grouped.description && (
          <p className="text-xs text-gray-500">{grouped.description}</p>
        )}
        <div className="flex gap-1.5 flex-wrap">
          {groupKeys.map(g => (
            <button
              key={g}
              onClick={() => { setSelectedGroup(g); setExpandedCouple(null); setTopN(20); }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeGroup === g
                  ? 'bg-white/20 text-white font-medium'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              그룹 {g} ({grouped.groups[g]?.total_couples ?? 0}팀)
            </button>
          ))}
        </div>

        {group && (
          <>
            {group.judges?.length > 0 && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1.5">심사위원 ({group.judges.length}명)</div>
                <div className="flex flex-wrap gap-2">
                  {group.judges.map(j => (
                    <span key={j} className="text-xs px-2 py-1 bg-white/5 rounded-full text-gray-300">{j}</span>
                  ))}
                </div>
              </div>
            )}
            <RankingTable
              couples={shown}
              totalCouples={group.total_couples}
              expandedCouple={expandedCouple}
              setExpandedCouple={setExpandedCouple}
            />
            {topN < couples.length && (
              <button
                onClick={() => setTopN(topN + 20)}
                className="w-full py-2 text-sm text-secretary-gold hover:bg-white/5 rounded-lg transition-colors"
              >
                더 보기 (현재 {topN}팀 / 전체 {couples.length}팀)
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  const direct = stage as MundialStageDirect;
  const couples = direct.couples ?? [];
  const shown = couples.slice(0, topN);
  return (
    <div className="space-y-4">
      {direct.judges && direct.judges.length > 0 && (
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1.5">심사위원 ({direct.judges.length}명)</div>
          <div className="flex flex-wrap gap-2">
            {direct.judges.map(j => (
              <span key={j} className="text-xs px-2 py-1 bg-white/5 rounded-full text-gray-300">{j}</span>
            ))}
          </div>
        </div>
      )}
      <RankingTable
        couples={shown}
        totalCouples={direct.total_couples ?? couples.length}
        expandedCouple={expandedCouple}
        setExpandedCouple={setExpandedCouple}
      />
      {topN < couples.length && (
        <button
          onClick={() => setTopN(topN + 20)}
          className="w-full py-2 text-sm text-secretary-gold hover:bg-white/5 rounded-lg transition-colors"
        >
          더 보기 (현재 {topN}팀 / 전체 {couples.length}팀)
        </button>
      )}
    </div>
  );
}

// --- 순위 테이블 ---
function RankingTable({
  couples,
  totalCouples,
  expandedCouple,
  setExpandedCouple,
}: {
  couples: MundialCouple[];
  totalCouples: number;
  expandedCouple: number | null;
  setExpandedCouple: (v: number | null) => void;
}) {
  return (
    <div className="bg-white/5 rounded-xl border border-secretary-gold/10 overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs text-gray-500">전체 {totalCouples}팀</span>
        <span className="text-xs text-gray-500">클릭하면 심사위원별 점수 확인</span>
      </div>

      <div className="divide-y divide-white/5">
        {couples.map(c => {
          const isExpanded = expandedCouple === c.pareja;
          return (
            <div key={`${c.pareja}-${c.rank}`}>
              <button
                onClick={() => setExpandedCouple(isExpanded ? null : c.pareja)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className={`w-8 text-center font-bold text-lg ${
                  c.rank <= 3 ? MEDAL_COLORS[c.rank - 1] : 'text-gray-500'
                }`}>
                  {c.rank <= 3 ? ['🥇', '🥈', '🥉'][c.rank - 1] : c.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    <span className="text-secretary-gold/60 text-xs font-mono mr-1.5">#{c.pareja}</span>
                    {c.leader}
                  </div>
                  <div className="text-xs text-gray-400 truncate">& {c.follower}</div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-bold tabular-nums ${
                    c.rank <= 3 ? 'text-secretary-gold' : 'text-gray-300'
                  }`}>
                    {c.promedio.toFixed(3)}
                  </div>
                  <div className="text-xs text-gray-500">promedio</div>
                </div>

                <span className={`text-gray-500 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {isExpanded && c.scores && (
                <div className="px-4 pb-3 pt-0">
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-2">심사위원별 점수</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                      {Object.entries(c.scores)
                        .sort((a, b) => b[1] - a[1])
                        .map(([judge, score]) => {
                          const diff = score - c.promedio;
                          return (
                            <div key={judge} className="flex items-center justify-between text-xs py-0.5">
                              <span className="text-gray-400 truncate mr-2">{judge}</span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`font-mono font-medium ${
                                  diff > 0.3 ? 'text-green-400' :
                                  diff < -0.3 ? 'text-red-400' :
                                  'text-gray-300'
                                }`}>
                                  {score.toFixed(2)}
                                </span>
                                <span className={`text-[10px] w-12 text-right ${
                                  diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-600'
                                }`}>
                                  {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    {c.ronda !== undefined && (
                      <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-white/5">
                        Ronda {c.ronda} · Pareja #{c.pareja}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
