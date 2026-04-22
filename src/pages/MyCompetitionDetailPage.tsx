// 내 대회 상세: 영상, 곡, 심사위원, 점수, 리뷰
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useTrainingStore } from '../hooks/useTrainingStore';
import { DEFAULT_JUDGING_CRITERIA } from '../types/tango';
import { VideoUploader } from '../components/VideoUploader';
import type { ScoreEntry, ScoreCriteria } from '../types/tango';
import { Link } from 'react-router-dom';
import roundsData from '../data/competition_rounds.json';

const allRoundsRaw = (roundsData as any).rounds as Array<any>;
const mundialFinals = allRoundsRaw.filter(r => r.competition === 'Mundial' && r.stage === 'final');

// 곡 제목 정규화 (공백/악센트/대소문자 무시)
function normTitle(s: string) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

// Mundial 결승 곡 DB (제목 → {count, champion, years})
const mundialFinalSongsDB = (() => {
  const db = new Map<string, { title: string; orchestra: string; count: number; championCount: number; years: Set<number>; songId?: string }>();
  for (const r of mundialFinals) {
    const isChampion = r.rankings?.some((rk: any) => rk.rank === 1);
    for (const s of r.songs || []) {
      const key = normTitle(s.title);
      if (!key) continue;
      const entry = db.get(key) || { title: s.title, orchestra: s.orchestra || '', count: 0, championCount: 0, years: new Set(), songId: s.song_id };
      entry.count++;
      if (isChampion) entry.championCount++;
      entry.years.add(r.year);
      if (s.song_id) entry.songId = s.song_id;
      db.set(key, entry);
    }
  }
  return db;
})();

const STAGE_OPTIONS = [
  { value: 'qualifying', label: '예선' },
  { value: 'quarterfinal', label: '8강' },
  { value: 'semifinal', label: '준결승' },
  { value: 'final', label: '결승' },
];

const CATEGORY_OPTIONS = [
  { value: 'pista', label: '피스타' },
  { value: 'vals', label: '발스' },
  { value: 'milonga', label: '밀롱가' },
  { value: 'escenario', label: '에세나리오' },
];

export function MyCompetitionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    ownCompetitions,
    updateOwnCompetition,
    deleteOwnCompetition,
    addJudge, removeJudge,
    addScore, updateScore, removeScore,
  } = useTrainingStore();
  const comp = ownCompetitions.find(c => c.id === id);

  const [draft, setDraft] = useState(comp);
  const [judgeName, setJudgeName] = useState('');
  const [judgeCred, setJudgeCred] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songOrch, setSongOrch] = useState('');

  useEffect(() => {
    if (comp) setDraft(comp);
  }, [comp]);

  if (!comp || !draft) {
    return (
      <>
        <PageHeader title="대회 기록" onBack={() => navigate('/my-competitions')} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">기록을 찾을 수 없습니다.</p>
        </div>
      </>
    );
  }

  const save = (patch: any) => updateOwnCompetition(comp.id, patch);

  const handleDelete = () => {
    if (confirm(`"${comp.competition_name}" 기록을 삭제하시겠습니까?`)) {
      deleteOwnCompetition(comp.id);
      navigate('/my-competitions');
    }
  };

  const handleAddJudge = () => {
    if (!judgeName.trim()) return;
    addJudge(comp.id, { name: judgeName.trim(), credentials: judgeCred.trim() });
    setJudgeName('');
    setJudgeCred('');
  };

  const handleAddSong = () => {
    if (!songTitle.trim()) return;
    save({ songs: [...comp.songs, { title: songTitle.trim(), orchestra: songOrch.trim() }] });
    setSongTitle('');
    setSongOrch('');
  };

  const handleRemoveSong = (i: number) => {
    save({ songs: comp.songs.filter((_, idx) => idx !== i) });
  };

  const avgScore = (s: ScoreEntry): number => {
    const vals = Object.values(s.criteria).filter(v => v > 0);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
  };

  // 🏆 Champion Benchmark — 내 곡을 Mundial 결승 DB와 대조
  const championBenchmark = useMemo(() => {
    if (comp.songs.length === 0) return null;
    const analyzed = comp.songs.map(s => {
      const key = normTitle(s.title);
      const entry = mundialFinalSongsDB.get(key);
      return {
        title: s.title,
        orchestra: s.orchestra,
        songId: entry?.songId,
        finalCount: entry?.count ?? 0,
        championCount: entry?.championCount ?? 0,
        tier: !entry ? 'unknown' : entry.championCount > 0 ? 'gold' : entry.count >= 2 ? 'silver' : 'bronze',
      };
    });
    const championTier = analyzed.filter(a => a.tier === 'gold').length;
    const silverTier = analyzed.filter(a => a.tier === 'silver').length;
    const totalScore = analyzed.reduce((sum, a) => sum + (a.tier === 'gold' ? 3 : a.tier === 'silver' ? 2 : a.tier === 'bronze' ? 1 : 0), 0);
    const maxScore = analyzed.length * 3;
    const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    let verdict = '';
    if (pct >= 80) verdict = '결승급 선곡 조합. Mundial 탑 탄다와 직접 비교 가능.';
    else if (pct >= 55) verdict = '준결승 돌파 수준. 한두 곡만 gold 티어로 교체하면 결승권.';
    else if (pct >= 30) verdict = '예선 통과 수준. 최소 1곡은 결승 단골곡으로 교체 권장.';
    else verdict = '차별화 전략. 익숙하지 않은 곡들이라 심사위원 임팩트 약할 수 있음.';
    return { analyzed, championTier, silverTier, pct, verdict };
  }, [comp.songs]);

  const overallAvg = useMemo(() => {
    if (comp.scores.length === 0) return 0;
    const total = comp.scores.reduce((sum, s) => sum + avgScore(s), 0);
    return Math.round(total / comp.scores.length * 10) / 10;
  }, [comp.scores]);

  return (
    <>
      <PageHeader
        title={comp.competition_name || '대회 기록'}
        onBack={() => navigate('/my-competitions')}
        right={
          <button onClick={handleDelete} className="text-xs text-gray-600 hover:text-red-400 px-2 py-1">삭제</button>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-5 space-y-4 pb-20">

          {/* 기본 정보 */}
          <div className="bg-white/5 border border-tango-brass/10 rounded-xl p-5 space-y-3">
            <input
              type="text"
              value={draft.competition_name}
              onChange={e => setDraft({ ...draft, competition_name: e.target.value })}
              onBlur={() => save({ competition_name: draft.competition_name })}
              placeholder="대회 이름 (예: KTC 2024 Pista)"
              className="w-full bg-transparent text-xl font-bold text-white outline-none border-b border-white/10 pb-2 focus:border-tango-brass/50"
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="날짜">
                <input type="date" value={draft.date}
                  onChange={e => setDraft({ ...draft, date: e.target.value })}
                  onBlur={() => save({ date: draft.date })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </Field>
              <Field label="파트너">
                <input type="text" value={draft.partner}
                  onChange={e => setDraft({ ...draft, partner: e.target.value })}
                  onBlur={() => save({ partner: draft.partner })}
                  placeholder="파트너 이름"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600" />
              </Field>
              <Field label="부문">
                <select value={draft.category}
                  onChange={e => { setDraft({ ...draft, category: e.target.value }); save({ category: e.target.value }); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="스테이지">
                <select value={draft.stage}
                  onChange={e => { setDraft({ ...draft, stage: e.target.value }); save({ stage: e.target.value }); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                  {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="라운드 번호">
                <input type="number" value={draft.ronda_number ?? ''}
                  onChange={e => setDraft({ ...draft, ronda_number: e.target.value ? Number(e.target.value) : null })}
                  onBlur={() => save({ ronda_number: draft.ronda_number })}
                  placeholder="1, 2, 3..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600" />
              </Field>
              <Field label="BIB 번호">
                <input type="text" value={draft.bib_number ?? ''}
                  onChange={e => setDraft({ ...draft, bib_number: e.target.value || null })}
                  onBlur={() => save({ bib_number: draft.bib_number })}
                  placeholder="189"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600" />
              </Field>
              <Field label="순위">
                <input type="number" value={draft.result_placement ?? ''}
                  onChange={e => setDraft({ ...draft, result_placement: e.target.value ? Number(e.target.value) : null })}
                  onBlur={() => save({ result_placement: draft.result_placement })}
                  placeholder="3"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600" />
              </Field>
              <Field label="다음 라운드 진출">
                <button
                  onClick={() => save({ advanced_to_next: !comp.advanced_to_next })}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    comp.advanced_to_next ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  {comp.advanced_to_next ? '✓ 통과' : '미통과'}
                </button>
              </Field>
            </div>
          </div>

          {/* 영상 */}
          <div className="bg-white/5 border border-tango-brass/10 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-tango-brass">🎥 대회 영상</h3>
            <VideoUploader
              videoUrl={comp.video_url}
              onChange={(url) => save({ video_url: url })}
            />
            <textarea
              value={draft.video_note}
              onChange={e => setDraft({ ...draft, video_note: e.target.value })}
              onBlur={() => save({ video_note: draft.video_note })}
              placeholder="영상 메모 (특정 시점, 하이라이트...)"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-500 resize-none"
            />
          </div>

          {/* 연주된 곡 */}
          <div className="bg-white/5 border border-tango-brass/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-tango-brass mb-3">🎵 연주된 곡</h3>
            <div className="space-y-2 mb-3">
              {comp.songs.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-gray-500 text-xs w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{s.title}</div>
                    {s.orchestra && <div className="text-xs text-gray-500">{s.orchestra}</div>}
                  </div>
                  <button onClick={() => handleRemoveSong(i)} className="text-gray-600 hover:text-red-400 text-xs px-2">×</button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={songTitle} onChange={e => setSongTitle(e.target.value)}
                placeholder="곡 제목" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" />
              <input type="text" value={songOrch} onChange={e => setSongOrch(e.target.value)}
                placeholder="악단" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" />
            </div>
            <button onClick={handleAddSong}
              className="w-full mt-2 bg-tango-brass/10 hover:bg-tango-brass/20 text-tango-brass rounded-lg py-2 text-xs font-medium">
              + 곡 추가
            </button>
          </div>

          {/* 🏆 Champion Benchmark — 내 선곡 vs Mundial 결승 DB */}
          {championBenchmark && championBenchmark.analyzed.length > 0 && (
            <div className={`rounded-xl border p-5 ${
              championBenchmark.pct >= 80 ? 'bg-gradient-to-br from-tango-brass/15 via-tango-shadow to-tango-ink border-tango-brass/40' :
              championBenchmark.pct >= 55 ? 'bg-gradient-to-br from-tango-brass/8 via-tango-shadow to-tango-ink border-tango-brass/25' :
              'bg-white/5 border-tango-brass/15'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-1">
                    Champion Benchmark
                  </div>
                  <h3 className="font-display italic text-xl text-tango-paper" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    Mundial 결승 비교
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-tango-brass">{championBenchmark.pct}<span className="text-base">%</span></div>
                  <div className="text-[10px] uppercase tracking-widest text-tango-cream/50">결승 적합도</div>
                </div>
              </div>

              <p className="text-sm text-tango-paper/85 font-serif italic mb-4" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {championBenchmark.verdict}
              </p>

              <div className="space-y-1.5">
                {championBenchmark.analyzed.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                    <span className={`text-lg w-5 text-center ${
                      a.tier === 'gold' ? 'text-tango-brass' :
                      a.tier === 'silver' ? 'text-tango-brass/60' :
                      a.tier === 'bronze' ? 'text-tango-brass/40' : 'text-gray-600'
                    }`}>
                      {a.tier === 'gold' ? '★' : a.tier === 'silver' ? '◆' : a.tier === 'bronze' ? '◇' : '○'}
                    </span>
                    <div className="flex-1 min-w-0">
                      {a.songId ? (
                        <Link to={`/song/${a.songId}`} className="text-sm text-white truncate hover:text-tango-brass transition-colors">
                          {a.title}
                        </Link>
                      ) : (
                        <div className="text-sm text-white truncate">{a.title}</div>
                      )}
                      {a.orchestra && <div className="text-[11px] text-gray-500">{a.orchestra}</div>}
                    </div>
                    <div className="text-right text-[11px]">
                      {a.championCount > 0 && (
                        <div className="text-tango-brass">🏆 {a.championCount}</div>
                      )}
                      {a.finalCount > 0 ? (
                        <div className="text-gray-400">결승 {a.finalCount}회</div>
                      ) : (
                        <div className="text-gray-600">결승 이력 없음</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-tango-brass/15 flex items-center justify-between text-[11px] text-tango-cream/60">
                <span>★ 우승 탄다 포함 · ◆ 결승 2회+ · ◇ 결승 1회 · ○ 결승 이력 없음</span>
                <Link to="/champions" className="text-tango-brass hover:underline">챔피언 전체 →</Link>
              </div>
            </div>
          )}

          {/* 심사위원 */}
          <div className="bg-white/5 border border-tango-brass/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-tango-brass mb-3">👥 심사위원</h3>
            <div className="space-y-2 mb-3">
              {comp.judges.map((j, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{j.name}</div>
                    {j.credentials && <div className="text-xs text-gray-500">{j.credentials}</div>}
                  </div>
                  <button onClick={() => {
                    removeJudge(comp.id, i);
                    // 관련 점수도 삭제
                    const toRemove = comp.scores.findIndex(s => s.judge_name === j.name);
                    if (toRemove >= 0) removeScore(comp.id, toRemove);
                  }} className="text-gray-600 hover:text-red-400 text-xs px-2">×</button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={judgeName} onChange={e => setJudgeName(e.target.value)}
                placeholder="이름" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" />
              <input type="text" value={judgeCred} onChange={e => setJudgeCred(e.target.value)}
                placeholder="경력 (예: 전 Mundial 심판)"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" />
            </div>
            <button onClick={handleAddJudge}
              className="w-full mt-2 bg-tango-brass/10 hover:bg-tango-brass/20 text-tango-brass rounded-lg py-2 text-xs font-medium">
              + 심사위원 추가
            </button>
          </div>

          {/* 심사 점수 */}
          <div className="bg-white/5 border border-tango-brass/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-tango-brass">📊 심사 점수</h3>
              {overallAvg > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-tango-brass">{overallAvg.toFixed(1)}</div>
                  <div className="text-[10px] text-gray-500">전체 평균</div>
                </div>
              )}
            </div>

            {comp.judges.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">먼저 심사위원을 추가하세요</p>
            ) : (
              <>
                <div className="space-y-3 mb-3">
                  {comp.scores.map((s, i) => (
                    <ScoreCard key={i} score={s} avgScore={avgScore(s)}
                      onChange={(patch) => updateScore(comp.id, i, patch)}
                      onRemove={() => removeScore(comp.id, i)} />
                  ))}
                </div>
                <div className="space-y-1">
                  {comp.judges.filter(j => !comp.scores.find(s => s.judge_name === j.name)).map((j, i) => (
                    <button key={i}
                      onClick={() => addScore(comp.id, j.name)}
                      className="w-full bg-tango-brass/10 hover:bg-tango-brass/20 text-tango-brass rounded-lg py-2 text-xs font-medium">
                      + {j.name}의 점수 추가
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 리뷰: 잘한 점 / 개선할 점 / 전체 메모 */}
          <div className="bg-white/5 border border-tango-brass/10 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-green-400 mb-2">✨ 잘한 점</h3>
              <textarea value={draft.strengths}
                onChange={e => setDraft({ ...draft, strengths: e.target.value })}
                onBlur={() => save({ strengths: draft.strengths })}
                placeholder="무엇이 잘 됐나..." rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-orange-400 mb-2">🎯 개선할 점</h3>
              <textarea value={draft.improvements}
                onChange={e => setDraft({ ...draft, improvements: e.target.value })}
                onBlur={() => save({ improvements: draft.improvements })}
                placeholder="다음에 보완할 점..." rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-tango-brass mb-2">📝 전체 메모</h3>
              <textarea value={draft.overall_notes}
                onChange={e => setDraft({ ...draft, overall_notes: e.target.value })}
                onBlur={() => save({ overall_notes: draft.overall_notes })}
                placeholder="대회 전반에 대한 회고..." rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      {children}
    </div>
  );
}

function ScoreCard({ score, avgScore, onChange, onRemove }: {
  score: ScoreEntry; avgScore: number;
  onChange: (patch: Partial<ScoreEntry>) => void;
  onRemove: () => void;
}) {
  const [notesDraft, setNotesDraft] = useState(score.notes);

  useEffect(() => {
    setNotesDraft(score.notes);
  }, [score.notes]);

  const setCriterion = (key: keyof ScoreCriteria, value: number) => {
    onChange({ criteria: { ...score.criteria, [key]: value } });
  };

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-white">{score.judge_name}</div>
          {avgScore > 0 && <div className="text-xs text-tango-brass">평균 {avgScore.toFixed(1)}</div>}
        </div>
        <button onClick={onRemove} className="text-xs text-gray-600 hover:text-red-400">제거</button>
      </div>

      <div className="space-y-2 mb-3">
        {DEFAULT_JUDGING_CRITERIA.map(c => (
          <div key={c.key} className="flex items-center gap-3">
            <label className="text-xs text-gray-400 w-24 flex-shrink-0">{c.label}</label>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={score.criteria[c.key as keyof ScoreCriteria]}
                onChange={e => setCriterion(c.key as keyof ScoreCriteria, Number(e.target.value))}
                className="flex-1 accent-tango-brass"
              />
              <span className="text-sm font-mono text-tango-brass w-10 text-right">
                {score.criteria[c.key as keyof ScoreCriteria].toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <textarea
        value={notesDraft}
        onChange={e => setNotesDraft(e.target.value)}
        onBlur={() => onChange({ notes: notesDraft })}
        placeholder="심사위원 코멘트 / 피드백..."
        rows={2}
        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-500 resize-none"
      />
    </div>
  );
}
