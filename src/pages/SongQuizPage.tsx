// 곡 퀴즈 — 랜덤 대회곡을 듣고 악단 맞추기
import { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { EditorialButton, OrnamentDivider } from '../components/editorial';
import { extractYouTubeId } from '../utils/tangoHelpers';
import { shortOrchestraName } from '../utils/tandaAnalysis';
import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import type { Song, Appearance } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const songMap = new Map(songs.map(s => [s.song_id, s]));

const MAJOR_ORCHS = [
  "D'Arienzo", 'Di Sarli', 'Pugliese', 'Tanturi',
  'Troilo', 'Caló', 'Laurenz', "D'Agostino",
  'Biagi', 'Fresedo', 'Demare', 'Gobbi',
];

interface QuizItem {
  song: Song;
  videoId: string | null;
  correctOrch: string;
  choices: string[];
}

function pickRandomQuiz(): QuizItem | null {
  // 대회에 많이 나온 곡 위주 + YouTube 영상 있는 것
  const appsBySong = new Map<string, Appearance[]>();
  for (const a of appearances) {
    if (!extractYouTubeId(a.source_url)) continue;
    const song = songMap.get(a.song_id);
    if (!song?.orchestra) continue;
    const list = appsBySong.get(a.song_id) || [];
    list.push(a);
    appsBySong.set(a.song_id, list);
  }

  const eligible = Array.from(appsBySong.entries()).filter(([, apps]) => apps.length >= 1);
  if (eligible.length === 0) return null;

  const [songId, apps] = eligible[Math.floor(Math.random() * eligible.length)];
  const song = songMap.get(songId);
  if (!song) return null;

  const videoId = extractYouTubeId(apps[0].source_url);
  const correctOrch = shortOrchestraName(song.orchestra);

  // 오답 3개 무작위
  const wrongs = MAJOR_ORCHS.filter(o => o !== correctOrch);
  const shuffled = wrongs.sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [...shuffled, correctOrch].sort(() => Math.random() - 0.5);

  return { song, videoId, correctOrch, choices };
}

export function SongQuizPage() {
  const [quiz, setQuiz] = useState<QuizItem | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  // 세션 동안 이미 나온 곡 id
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const newQuiz = () => {
    // 이미 본 곡 제외하고 뽑기 (최대 20회 시도)
    let next: QuizItem | null = null;
    for (let i = 0; i < 20; i++) {
      const candidate = pickRandomQuiz();
      if (!candidate) break;
      if (!seenIds.has(candidate.song.song_id)) {
        next = candidate;
        break;
      }
    }
    // 다 본 경우 세트 초기화
    if (!next) {
      setSeenIds(new Set());
      next = pickRandomQuiz();
    }

    if (next) {
      setSeenIds(prev => new Set([...prev, next!.song.song_id]));
    }
    setQuiz(next);
    setAnswer(null);
    setShowHint(false);
  };

  useEffect(() => { newQuiz(); }, []);

  const handleAnswer = (choice: string) => {
    if (answer || !quiz) return;
    setAnswer(choice);
    setStats(prev => ({
      correct: prev.correct + (choice === quiz.correctOrch ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <>
      <PageHeader title="탱고 곡 퀴즈" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14 space-y-10">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Game · Orchestra Quiz
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-tango-paper italic leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              <em className="text-tango-brass">귀로</em> 맞추는 악단
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">
              영상을 듣고, 어느 악단인지 맞춰보세요
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 점수 */}
          <div className="flex items-center justify-center gap-8 py-6 border-y border-tango-brass/15">
            <div className="text-center">
              <div className="font-display text-3xl text-tango-paper font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {stats.correct}
              </div>
              <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 mt-1">정답</div>
            </div>
            <div className="h-10 w-px bg-tango-brass/30"></div>
            <div className="text-center">
              <div className="font-display text-3xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {accuracy}%
              </div>
              <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 mt-1">정확도</div>
            </div>
            <div className="h-10 w-px bg-tango-brass/30"></div>
            <div className="text-center">
              <div className="font-display text-3xl text-tango-paper font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {stats.total}
              </div>
              <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 mt-1">문항</div>
            </div>
          </div>

          {quiz ? (
            <>
              {/* 영상 */}
              {quiz.videoId && (
                <div className="relative w-full rounded-sm overflow-hidden border border-tango-brass/20" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${quiz.videoId}?autoplay=0`}
                    title="Quiz"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              <div className="text-center">
                <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans">
                  Question
                </div>
                <h2 className="font-serif italic text-2xl md:text-3xl text-tango-paper mt-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  이 곡을 연주한 악단은?
                </h2>
                {showHint && quiz.song.recording_date && (
                  <p className="text-sm text-tango-brass mt-3 font-serif italic">
                    💡 힌트: {quiz.song.recording_date}년 녹음
                  </p>
                )}
              </div>

              {/* 보기 */}
              <div className="grid grid-cols-2 gap-3">
                {quiz.choices.map(choice => {
                  const isCorrect = choice === quiz.correctOrch;
                  const isSelected = answer === choice;
                  const colored = answer !== null;

                  let cls = 'border-tango-brass/20 hover:border-tango-brass/50 text-tango-paper';
                  if (colored) {
                    if (isCorrect) cls = 'border-green-500 bg-green-500/10 text-green-300';
                    else if (isSelected) cls = 'border-red-500 bg-red-500/10 text-red-300';
                    else cls = 'border-tango-brass/10 text-tango-cream/40';
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleAnswer(choice)}
                      disabled={answer !== null}
                      className={`font-serif italic text-lg md:text-xl py-5 px-4 border-2 rounded-sm transition-all ${cls}`}
                      style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {/* 답 공개 */}
              {answer && (
                <div className="text-center bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-6">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass mb-2">
                    {answer === quiz.correctOrch ? 'Correct · 정답!' : 'Incorrect · 오답'}
                  </div>
                  <h3 className="font-display text-3xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {quiz.song.title}
                  </h3>
                  <p className="text-sm text-tango-cream/70 mt-2">
                    {quiz.song.orchestra}
                    {quiz.song.vocalist && <span> · {quiz.song.vocalist}</span>}
                    {quiz.song.recording_date && <span> · {quiz.song.recording_date}</span>}
                  </p>
                </div>
              )}

              {/* 액션 */}
              <div className="flex gap-3 justify-center">
                {!answer && !showHint && (
                  <EditorialButton variant="ghost" onClick={() => setShowHint(true)}>
                    💡 힌트
                  </EditorialButton>
                )}
                <EditorialButton variant="primary" onClick={newQuiz}>
                  {answer ? '다음 문제 →' : '건너뛰기'}
                </EditorialButton>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-tango-cream/60">퀴즈 준비 중...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
